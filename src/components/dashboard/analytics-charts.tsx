'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Calendar, DollarSign, UserX, Users, Loader2 } from 'lucide-react'

interface Stats {
  appointments: { value: number; change: number | null }
  revenue: { value: number; change: number | null }
  noShowRate: { value: number; change: number | null }
  newClients: { value: number; change: number | null }
}

interface DayData {
  date: string
  confirmed?: number
  completed?: number
  no_show?: number
  cancelled?: number
  pending_payment?: number
}

interface TodayAppointment {
  id: string
  start_time: string
  end_time: string
  status: string
  source: string
  services: { name: string } | null
  professionals: { display_name: string } | null
  clients: { name: string; phone: string } | null
}

interface ActivityEntry {
  id: string
  previous_status: string | null
  new_status: string
  change_source: string
  created_at: string
  appointments: { id: string; services: { name: string } | null; clients: { name: string } | null } | null
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending_payment: 'Pago pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No-show',
  expired: 'Expirada',
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.06] text-[#0891B2]',
  pending_payment: 'bg-[#F59E0B]/[0.06] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.06] text-[#10B981]',
  cancelled: 'bg-[#94A3B8]/[0.06] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.06] text-[#EF4444]',
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<DayData[]>([])
  const [todayAppts, setTodayAppts] = useState<TodayAppointment[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setStats(data.data.stats)
          setChartData(data.data.appointmentsByDay)
          setTodayAppts(data.data.todayAppointments)
          setActivity(data.data.recentActivity)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" />
      </div>
    )
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)

  const statCards = [
    { label: 'Citas este mes', value: String(stats?.appointments.value ?? 0), change: stats?.appointments.change, icon: Calendar, color: '#0891B2' },
    { label: 'Ingresos', value: formatCurrency(stats?.revenue.value ?? 0), change: stats?.revenue.change, icon: DollarSign, color: '#10B981' },
    { label: 'Tasa no-show', value: `${stats?.noShowRate.value ?? 0}%`, change: stats?.noShowRate.change, icon: UserX, color: '#EF4444', invertChange: true },
    { label: 'Clientes nuevos', value: String(stats?.newClients.value ?? 0), change: stats?.newClients.change, icon: Users, color: '#06D6A0' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          const isPositive = card.invertChange ? (card.change ?? 0) < 0 : (card.change ?? 0) > 0
          return (
            <div
              key={card.label}
              className="rounded-[10px] border border-[#E2E8F0] bg-white p-5"
              style={i === 0 ? { background: `linear-gradient(to bottom, white, rgba(0,184,230,0.02))` } : undefined}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">{card.label}</p>
                <Icon className="h-4 w-4" style={{ color: card.color }} />
              </div>
              <p className="mt-2 text-[28px] font-medium tracking-[-1px] text-[#0F172A]">{card.value}</p>
              {card.change !== null && card.change !== undefined && (
                <div className="mt-1 flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-[#10B981]" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-[#EF4444]" />
                  )}
                  <span className={`text-[11px] ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {card.change > 0 ? '+' : ''}{card.change}% vs mes anterior
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Chart: Appointments by day */}
      <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-4">Citas por dia — ultimos 30 dias</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(v: string) => format(new Date(v + 'T12:00:00'), 'd MMM', { locale: es })}
              />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                labelFormatter={(v: string) => format(new Date(v + 'T12:00:00'), "d 'de' MMMM", { locale: es })}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="completed" name="Completadas" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="confirmed" name="Confirmadas" stackId="a" fill="#0891B2" radius={[0, 0, 0, 0]} />
              <Bar dataKey="no_show" name="No-show" stackId="a" fill="#EF4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[#94A3B8] text-center py-8">Sin datos aún</p>
        )}
      </div>

      {/* Today's appointments + Recent activity side by side */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        {/* Today's appointments */}
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-4">Citas de hoy</p>
          {todayAppts.length > 0 ? (
            <div className="space-y-2">
              {todayAppts.map((appt) => (
                <div key={appt.id} className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] px-3 py-2.5">
                  <span className="text-sm font-medium text-[#0F172A] w-12">
                    {format(new Date(appt.start_time), 'HH:mm')}
                  </span>
                  <div className="h-[14px] w-[1px] bg-[#E2E8F0]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0F172A] truncate">{String(appt.clients?.name || 'Cliente')}</p>
                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {String(appt.services?.name || 'Servicio')} · {String(appt.professionals?.display_name || '')}
                    </p>
                  </div>
                  <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[appt.status] || ''}`}>
                    {STATUS_LABELS[appt.status] || appt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8] text-center py-6">No hay citas para hoy</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-4">Actividad reciente</p>
          {activity.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activity.map((entry) => {
                const appt = entry.appointments as ActivityEntry['appointments']
                return (
                  <div key={entry.id} className="flex items-start gap-2 text-xs">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0891B2] flex-shrink-0" />
                    <div>
                      <p className="text-[#0F172A]">
                        {String(appt?.services?.name || 'Cita')} — {String(appt?.clients?.name || 'Cliente')}
                      </p>
                      <p className="text-[#94A3B8]">
                        {entry.previous_status ? `${STATUS_LABELS[entry.previous_status] || entry.previous_status} → ` : ''}
                        {STATUS_LABELS[entry.new_status] || entry.new_status}
                        {' · '}
                        {entry.change_source}
                        {' · '}
                        {format(new Date(entry.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8] text-center py-6">Sin actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  )
}
