import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const now = new Date()
    const monthStart = startOfMonth(now).toISOString()
    const monthEnd = endOfMonth(now).toISOString()
    const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
    const prevMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()
    const thirtyDaysAgo = subDays(now, 30).toISOString()

    // Run all queries in parallel
    const [
      apptThisMonth,
      apptPrevMonth,
      revenueThisMonth,
      revenuePrevMonth,
      noShowThisMonth,
      noShowPrevMonth,
      newClientsThisMonth,
      newClientsPrevMonth,
      apptsByDay,
      todayAppts,
      recentActivity,
    ] = await Promise.all([
      // Appointments this month (non-cancelled/expired)
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('start_time', monthStart)
        .lt('start_time', monthEnd)
        .not('status', 'in', '("cancelled","expired")'),

      // Appointments prev month
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('start_time', prevMonthStart)
        .lt('start_time', prevMonthEnd)
        .not('status', 'in', '("cancelled","expired")'),

      // Revenue this month
      supabase
        .from('payments')
        .select('amount')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd),

      // Revenue prev month
      supabase
        .from('payments')
        .select('amount')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte('created_at', prevMonthStart)
        .lt('created_at', prevMonthEnd),

      // No-show this month
      supabase
        .from('appointments')
        .select('status')
        .eq('organization_id', orgId)
        .gte('start_time', monthStart)
        .lt('start_time', monthEnd)
        .in('status', ['completed', 'no_show']),

      // No-show prev month
      supabase
        .from('appointments')
        .select('status')
        .eq('organization_id', orgId)
        .gte('start_time', prevMonthStart)
        .lt('start_time', prevMonthEnd)
        .in('status', ['completed', 'no_show']),

      // New clients this month
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd),

      // New clients prev month
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', prevMonthStart)
        .lt('created_at', prevMonthEnd),

      // Appointments by day (last 30 days)
      supabase
        .from('appointments')
        .select('start_time, status')
        .eq('organization_id', orgId)
        .gte('start_time', thirtyDaysAgo)
        .not('status', 'in', '("expired")'),

      // Today's appointments
      supabase
        .from('appointments')
        .select('id, start_time, end_time, status, source, services(name), professionals(display_name), clients(name, phone)')
        .eq('organization_id', orgId)
        .gte('start_time', format(now, 'yyyy-MM-dd') + 'T00:00:00')
        .lt('start_time', format(now, 'yyyy-MM-dd') + 'T23:59:59')
        .not('status', 'in', '("cancelled","expired")')
        .order('start_time'),

      // Recent activity (last 10 status changes)
      supabase
        .from('appointment_status_log')
        .select('id, previous_status, new_status, change_source, notes, created_at, appointments(id, services(name), clients(name))')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Calculate stats
    const revenueThisMonthTotal = (revenueThisMonth.data || []).reduce((sum, p) => sum + (p.amount || 0), 0)
    const revenuePrevMonthTotal = (revenuePrevMonth.data || []).reduce((sum, p) => sum + (p.amount || 0), 0)

    const noShowData = noShowThisMonth.data || []
    const noShowCount = noShowData.filter(a => a.status === 'no_show').length
    const noShowTotal = noShowData.length
    const noShowRate = noShowTotal > 0 ? Math.round((noShowCount / noShowTotal) * 100) : 0

    const noShowPrevData = noShowPrevMonth.data || []
    const noShowPrevCount = noShowPrevData.filter(a => a.status === 'no_show').length
    const noShowPrevTotal = noShowPrevData.length
    const noShowPrevRate = noShowPrevTotal > 0 ? Math.round((noShowPrevCount / noShowPrevTotal) * 100) : 0

    // Aggregate appointments by day
    const dayMap: Record<string, Record<string, number>> = {}
    for (const appt of apptsByDay.data || []) {
      const day = format(new Date(appt.start_time), 'yyyy-MM-dd')
      if (!dayMap[day]) dayMap[day] = {}
      dayMap[day][appt.status] = (dayMap[day][appt.status] || 0) + 1
    }
    const appointmentsByDay = Object.entries(dayMap)
      .map(([date, statuses]) => ({ date, ...statuses }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const calcChange = (current: number, previous: number): number | null => {
      if (previous === 0) return current > 0 ? 100 : null
      return Math.round(((current - previous) / previous) * 100)
    }

    return NextResponse.json({
      data: {
        stats: {
          appointments: { value: apptThisMonth.count || 0, change: calcChange(apptThisMonth.count || 0, apptPrevMonth.count || 0) },
          revenue: { value: revenueThisMonthTotal, change: calcChange(revenueThisMonthTotal, revenuePrevMonthTotal) },
          noShowRate: { value: noShowRate, change: noShowPrevRate > 0 ? noShowRate - noShowPrevRate : null },
          newClients: { value: newClientsThisMonth.count || 0, change: calcChange(newClientsThisMonth.count || 0, newClientsPrevMonth.count || 0) },
        },
        appointmentsByDay,
        todayAppointments: todayAppts.data || [],
        recentActivity: recentActivity.data || [],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
