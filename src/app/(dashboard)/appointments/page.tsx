'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.06] text-[#0891B2]',
  pending_payment: 'bg-[#F59E0B]/[0.06] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.06] text-[#10B981]',
  cancelled: 'bg-[#94A3B8]/[0.06] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.06] text-[#EF4444]',
  expired: 'bg-[#CBD5E1]/[0.06] text-[#475569]',
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

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Citas</h1>
      <p className="mt-1 text-sm text-[#475569]">{appointments.length} citas</p>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-9 text-sm" />
        <span className="text-[#94A3B8] text-xs">a</span>
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-9 text-sm" />
      </div>

      <div className="mt-4 rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-12">No hay citas</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Fecha/Hora</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Cliente</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Servicio</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Profesional</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Estado</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Fuente</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const svc = appt.services as Record<string, unknown> | null
                const prof = appt.professionals as Record<string, unknown> | null
                const client = appt.clients as Record<string, unknown> | null
                return (
                  <tr key={String(appt.id)} onClick={() => router.push(`/appointments/${appt.id}`)}
                    className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-[#0F172A]">
                      {format(new Date(String(appt.start_time)), "d MMM, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{String(client?.name || '—')}</td>
                    <td className="px-4 py-3 text-[#475569]">{String(svc?.name || '—')}</td>
                    <td className="px-4 py-3 text-[#475569]">{String(prof?.display_name || '—')}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[String(appt.status)] || ''}`}>
                        {STATUS_LABELS[String(appt.status)] || String(appt.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-[#94A3B8]">{String(appt.source)}</td>
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
