'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Check, XIcon, ExternalLink } from 'lucide-react'

interface Professional { id: string; display_name: string; google_connected: boolean }

export default function IntegrationsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    fetch('/api/dashboard/team').then(r => r.json()).then(d => {
      setProfessionals(d.data?.professionals || [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  const connectGoogle = (profId: string) => {
    window.location.href = `/api/google/auth?professional_id=${profId}`
  }

  const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Integraciones</h1>
      <p className="mt-1 text-sm text-[#475569] mb-6">Conecta servicios externos</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
      ) : (
        <div className="space-y-4">
          {/* Google Calendar */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-lg">
                G
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Google Calendar</p>
                <p className="text-[11px] text-[#94A3B8]">Sync bidireccional + Google Meet para servicios virtuales</p>
              </div>
            </div>
            <div className="space-y-2">
              {professionals.map(prof => (
                <div key={prof.id} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[6px] text-xs font-medium text-white"
                      style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}>
                      {prof.display_name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-[#0F172A]">{prof.display_name}</span>
                  </div>
                  {prof.google_connected ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-[#10B981]"><Check className="h-3 w-3" /> Conectado</span>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => connectGoogle(prof.id)} className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" /> Conectar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stripe */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-sm font-medium text-[#635BFF]">S</div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Stripe</p>
                  <p className="text-[11px] text-[#94A3B8]">Pagos online para servicios que lo requieran</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs ${hasStripe ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                {hasStripe ? <><Check className="h-3 w-3" /> Configurado</> : <><XIcon className="h-3 w-3" /> No configurado</>}
              </span>
            </div>
          </div>

          {/* Resend */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#F8FAFC] flex items-center justify-center text-sm font-medium text-[#0F172A]">R</div>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">Resend</p>
                  <p className="text-[11px] text-[#94A3B8]">Emails de confirmación y recordatorios</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-[#94A3B8]">
                Configurar en .env
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
