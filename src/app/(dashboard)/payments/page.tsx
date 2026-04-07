'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-[#F59E0B]/[0.06] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.06] text-[#10B981]',
  failed: 'bg-[#EF4444]/[0.06] text-[#EF4444]',
  refunded: 'bg-[#94A3B8]/[0.06] text-[#94A3B8]',
}

interface Payment {
  id: string; amount: number; currency: string; status: string
  stripe_session_id: string | null; stripe_payment_intent_id: string | null
  paid_at: string | null; created_at: string
  appointments: { id: string; start_time: string; services: { name: string } | null; clients: { name: string } | null } | null
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/payments').then(r => r.json()).then(d => {
      setPayments(d.data?.payments || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount)

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Pagos</h1>
      <p className="mt-1 text-sm text-[#475569]">{payments.length} pagos registrados</p>

      <div className="mt-6 rounded-[10px] border border-[#E2E8F0] bg-white overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-12">No hay pagos aún</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Fecha</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Cliente</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Servicio</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Monto</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Estado</th>
                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Stripe ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-[#E2E8F0] last:border-0">
                  <td className="px-4 py-3 text-[#0F172A]">
                    {format(new Date(p.created_at), "d MMM, HH:mm", { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{String(p.appointments?.clients?.name || '—')}</td>
                  <td className="px-4 py-3 text-[#475569]">{String(p.appointments?.services?.name || '—')}</td>
                  <td className="px-4 py-3 text-[#0F172A] font-medium">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-[4px] px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-[#94A3B8]">
                    {p.stripe_session_id?.slice(0, 20) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
