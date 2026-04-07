'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
  notes: string | null
  created_at: string
  appointments: { id: string; services: { name: string } | null; clients: { name: string } | null } | null
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada', pending_payment: 'Pago pendiente', completed: 'Completada',
  cancelled: 'Cancelada', no_show: 'No-show', expired: 'Expirada',
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.08] text-[#0891B2]',
  pending_payment: 'bg-[#F59E0B]/[0.08] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.08] text-[#10B981]',
  cancelled: 'bg-[#94A3B8]/[0.08] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.08] text-[#EF4444]',
}

const STATUS_DOT_COLOR: Record<string, string> = {
  confirmed: '#0891B2', pending_payment: '#F59E0B', completed: '#10B981',
  cancelled: '#94A3B8', no_show: '#EF4444', expired: '#CBD5E1',
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-[#94A3B8]" />
      </div>
    )
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)

  const statCards = [
    { label: 'Citas este mes', value: String(stats?.appointments.value ?? 0), change: stats?.appointments.change, icon: Calendar, color: '#0891B2' },
    { label: 'Ingresos', value: formatCurrency(stats?.revenue.value ?? 0), change: stats?.revenue.change, icon: DollarSign, color: '#10B981' },
    { label: 'Tasa no-show', value: `${stats?.noShowRate.value ?? 0}%`, change: stats?.noShowRate.change, icon: UserX, color: '#F59E0B', invertChange: true },
    { label: 'Clientes nuevos', value: String(stats?.newClients.value ?? 0), change: stats?.newClients.change, icon: Users, color: '#06D6A0' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const isPositive = card.invertChange ? (card.change ?? 0) < 0 : (card.change ?? 0) > 0
          return (
            <div
              key={card.label}
              className="group rounded-xl border-[0.5px] p-5 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] uppercase tracking-[1px] font-normal" style={{ color: 'var(--dash-text-muted)' }}>{card.label}</p>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-200" style={{ background: `${card.color}10` }}>
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-[28px] font-medium tracking-[-1px]" style={{ color: 'var(--dash-text)' }}>{card.value}</p>
              {card.change !== null && card.change !== undefined && (
                <div className="mt-2 flex items-center gap-1.5">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-[#10B981]" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-[#EF4444]" />
                  )}
                  <span className={`text-[11px] font-normal ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {card.change > 0 ? '+' : ''}{card.change}%
                  </span>
                  <span className="text-[11px] text-[#CBD5E1]">vs mes anterior</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Chart ── */}
      <div className="rounded-xl border-[0.5px] p-5" style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}>
        <p className="text-[12px] uppercase tracking-[1px] font-normal mb-5" style={{ color: 'var(--dash-text-muted)' }}>Citas por dia — ultimos 30 dias</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barSize={10} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickFormatter={(v: string) => format(new Date(v + 'T12:00:00'), 'd MMM', { locale: es })}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '0.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                labelFormatter={(v: string) => format(new Date(v + 'T12:00:00'), "d 'de' MMMM", { locale: es })}
                cursor={{ fill: 'rgba(0,184,230,0.04)' }}
              />
              <Bar dataKey="completed" name="Completadas" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="confirmed" name="Confirmadas" stackId="a" fill="#00B8E6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="no_show" name="No-show" stackId="a" fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[13px] text-[#94A3B8] text-center py-10">Sin datos aún</p>
        )}
      </div>

      {/* ── Today + Activity ── */}
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        {/* Today's appointments — timeline */}
        <div className="rounded-xl border-[0.5px] p-5" style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}>
          <p className="text-[12px] uppercase tracking-[1px] font-normal mb-5" style={{ color: 'var(--dash-text-muted)' }}>Citas de hoy</p>
          {todayAppts.length > 0 ? (
            <div className="space-y-0">
              {todayAppts.map((appt, i) => {
                const isNow = new Date(appt.start_time) <= new Date() && new Date(appt.end_time) > new Date()
                const dotColor = STATUS_DOT_COLOR[appt.status] || '#94A3B8'
                return (
                  <div key={appt.id} className={`flex gap-3 ${isNow ? 'bg-[rgba(0,184,230,0.03)] -mx-2 px-2 rounded-lg' : ''}`}>
                    {/* Time */}
                    <div className="w-11 text-right pt-3 flex-shrink-0">
                      <span className="text-[13px] font-medium tabular-nums" style={{ color: 'var(--dash-text)' }}>{format(new Date(appt.start_time), 'HH:mm')}</span>
                    </div>
                    {/* Timeline */}
                    <div className="flex flex-col items-center flex-shrink-0 w-3">
                      {isNow ? (
                        <div className="h-[6px] w-[6px] rounded-full bg-[#00B8E6] shadow-[0_0_8px_rgba(0,184,230,0.6)] mt-[14px]" />
                      ) : (
                        <div className="h-[7px] w-[7px] rounded-full mt-[14px] border-[1.5px]" style={{ borderColor: dotColor }} />
                      )}
                      {i < todayAppts.length - 1 && (
                        <div className="w-[1px] flex-1 min-h-[28px]" style={{ backgroundColor: 'var(--dash-border)' }} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 py-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] truncate font-medium" style={{ color: 'var(--dash-text)' }}>{String(appt.clients?.name || 'Cliente')}</p>
                        {isNow && (
                          <span className="text-[9px] uppercase tracking-[1px] text-[#00B8E6] font-medium bg-[#00B8E6]/[0.08] px-1.5 py-0.5 rounded">Ahora</span>
                        )}
                      </div>
                      <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
                        {String(appt.services?.name || 'Servicio')} · {String(appt.professionals?.display_name || '')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`rounded-[4px] px-1.5 py-[1px] text-[10px] font-medium ${STATUS_BADGE[appt.status] || ''}`}>
                          {STATUS_LABELS[appt.status] || appt.status}
                        </span>
                        <span className="text-[10px] text-[#CBD5E1]">
                          {appt.source === 'whatsapp' ? 'WhatsApp' : appt.source === 'booking_page' ? 'Booking' : appt.source}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[13px] text-[#94A3B8] text-center py-8">No hay citas para hoy</p>
          )}
        </div>

        {/* Activity */}
        <div className="rounded-xl border-[0.5px] p-5" style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}>
          <p className="text-[12px] uppercase tracking-[1px] font-normal mb-5" style={{ color: 'var(--dash-text-muted)' }}>Actividad reciente</p>
          {activity.length > 0 ? (
            <div className="space-y-0 max-h-[320px] overflow-y-auto">
              {activity.map((entry, i) => {
                const appt = entry.appointments as ActivityEntry['appointments']
                const actionColor = STATUS_DOT_COLOR[entry.new_status] || '#94A3B8'
                return (
                  <div key={entry.id} className="flex items-start gap-3 py-2.5" style={i < activity.length - 1 ? { borderBottom: '0.5px solid var(--dash-border)' } : undefined}>
                    <div className="h-[6px] w-[6px] rounded-full mt-[5px] flex-shrink-0" style={{ background: actionColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate" style={{ color: 'var(--dash-text)' }}>
                        {String(appt?.services?.name || 'Cita')} — {String(appt?.clients?.name || 'Cliente')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`rounded-[3px] px-1.5 py-[1px] text-[9px] font-medium ${STATUS_BADGE[entry.new_status] || 'bg-[#94A3B8]/[0.08] text-[#94A3B8]'}`}>
                          {entry.previous_status === entry.new_status
                            ? 'Reagendada'
                            : STATUS_LABELS[entry.new_status] || entry.new_status}
                        </span>
                        <span className="text-[10px] text-[#CBD5E1]">
                          {entry.change_source} · {format(new Date(entry.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[13px] text-[#94A3B8] text-center py-8">Sin actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  )
}
