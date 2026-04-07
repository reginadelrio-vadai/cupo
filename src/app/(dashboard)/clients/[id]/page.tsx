'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Phone, Mail, Loader2 } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.06] text-[#0891B2]',
  completed: 'bg-[#10B981]/[0.06] text-[#10B981]',
  cancelled: 'bg-[#94A3B8]/[0.06] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.06] text-[#EF4444]',
  pending_payment: 'bg-[#F59E0B]/[0.06] text-[#D97706]',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/clients/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d.data)
        setNotes((d.data?.client as Record<string, unknown>)?.notes as string || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const saveNotes = useCallback(async (value: string) => {
    await fetch(`/api/dashboard/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: value }),
    })
  }, [id])

  // Debounced notes save
  useEffect(() => {
    if (!data) return
    const timer = setTimeout(() => saveNotes(notes), 1000)
    return () => clearTimeout(timer)
  }, [notes, data, saveNotes])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
  if (!data) return <p className="text-[#94A3B8] text-center py-20">Cliente no encontrado</p>

  const client = data.client as Record<string, unknown>
  const appointments = data.appointments as Array<Record<string, unknown>> || []
  const stats = data.stats as Record<string, number>

  return (
    <div>
      <button onClick={() => router.push('/clients')} className="flex items-center gap-1 text-sm text-[#475569] mb-4 hover:text-[#0F172A]">
        <ChevronLeft className="h-4 w-4" /> Clientes
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">{String(client.name)}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-[#475569]">
            {client.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {String(client.phone)}</span> : null}
            {client.email ? <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {String(client.email)}</span> : null}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Total citas</p>
          <p className="mt-1 text-[26px] font-medium tracking-[-1px] text-[#0F172A]">{stats.total_appointments}</p>
        </div>
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Completadas</p>
          <p className="mt-1 text-[26px] font-medium tracking-[-1px] text-[#10B981]">{stats.completed}</p>
        </div>
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">No-shows</p>
          <p className="mt-1 text-[26px] font-medium tracking-[-1px] text-[#EF4444]">{stats.no_shows}</p>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 rounded-[10px] border border-[#E2E8F0] bg-white p-4">
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-2">Notas</p>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Agregar notas sobre este cliente..."
          rows={3}
        />
      </div>

      {/* Appointment history */}
      <div className="mt-6 rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0]">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Historial de citas</p>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-8">Sin citas aún</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {appointments.map((appt) => {
                const svc = appt.services as Record<string, unknown> | null
                const prof = appt.professionals as Record<string, unknown> | null
                return (
                  <tr key={String(appt.id)} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 text-[#0F172A]">
                      {format(new Date(String(appt.start_time)), "d MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{String(svc?.name || '')}</td>
                    <td className="px-4 py-3 text-[#475569]">{String(prof?.display_name || '')}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[String(appt.status)] || ''}`}>
                        {String(appt.status)}
                      </span>
                    </td>
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
