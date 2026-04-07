'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, ClipboardList } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.08] text-[#0891B2]',
  pending_payment: 'bg-[#F59E0B]/[0.08] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.08] text-[#10B981]',
  cancelled: 'bg-[#94A3B8]/[0.08] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.08] text-[#EF4444]',
  expired: 'bg-[#CBD5E1]/[0.08] text-[#64748B]',
}

const STATUS_DOT: Record<string, string> = {
  confirmed: '#0891B2', pending_payment: '#F59E0B', completed: '#10B981',
  cancelled: '#94A3B8', no_show: '#EF4444', expired: '#CBD5E1',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada', pending_payment: 'Pago pendiente', completed: 'Completada',
  cancelled: 'Cancelada', no_show: 'No-show', expired: 'Expirada',
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const now = new Date()
    const start = dateFrom || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const end = dateTo || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()
    const params = new URLSearchParams({ start, end })

    fetch(`/api/dashboard/appointments?${params}`)
      .then(r => r.json())
      .then(data => {
        let appts = data.data?.appointments || []
        if (statusFilter) appts = appts.filter((a: Record<string, unknown>) => a.status === statusFilter)
        setAppointments(appts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, dateFrom, dateTo])

  const selectStyle = { backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px]" style={{ color: 'var(--dash-text)' }}>Citas</h1>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--dash-text-muted)' }}>{appointments.length} citas</p>

      <div className="mt-6 flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-xl border-[0.5px] px-3 text-sm focus:outline-none" style={selectStyle}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-36 rounded-xl border-[0.5px] px-3 text-sm focus:outline-none" style={selectStyle} />
        <span className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>a</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 w-36 rounded-xl border-[0.5px] px-3 text-sm focus:outline-none" style={selectStyle} />
      </div>

      <div className="mt-4 rounded-xl border-[0.5px] overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--dash-text-muted)' }} /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--dash-text-muted)' }} />
            <p className="text-[13px]" style={{ color: 'var(--dash-text-muted)' }}>No hay citas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--dash-border)' }}>
                {['Fecha/Hora', 'Cliente', 'Servicio', 'Profesional', 'Estado', 'Fuente'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-[1px] font-normal" style={{ color: 'var(--dash-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const svc = appt.services as Record<string, unknown> | null
                const prof = appt.professionals as Record<string, unknown> | null
                const client = appt.clients as Record<string, unknown> | null
                const status = String(appt.status)
                return (
                  <tr key={String(appt.id)} onClick={() => router.push(`/appointments/${appt.id}`)}
                    className="cursor-pointer transition-colors duration-150"
                    style={{ borderBottom: '0.5px solid var(--dash-border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dash-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--dash-text)' }}>
                      {format(new Date(String(appt.start_time)), "d MMM, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{String(client?.name || '—')}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{String(svc?.name || '—')}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{String(prof?.display_name || '—')}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: STATUS_DOT[status] }} />
                        <span className={`rounded-[4px] px-1.5 py-[1px] text-[10px] font-medium ${STATUS_BADGE[status] || ''}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px]" style={{ color: 'var(--dash-text-muted)' }}>{String(appt.source)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
