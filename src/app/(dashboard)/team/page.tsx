'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Plus, X, ChevronRight } from 'lucide-react'
import { DAYS_OF_WEEK } from '@/lib/constants'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface Professional {
  id: string; display_name: string; email: string | null; is_active: boolean
  google_connected: boolean
  professional_services: Array<{ service_id: string; services: { id: string; name: string } | null }>
}
interface Service { id: string; name: string }

export default function TeamPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Professional | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState<string | null>(null)

  const fetchData = () => {
    Promise.all([
      fetch('/api/dashboard/team').then(r => r.json()),
      fetch('/api/dashboard/services').then(r => r.json()),
    ]).then(([teamData, svcData]) => {
      setProfessionals(teamData.data?.professionals || [])
      setServices((svcData.data?.services || []).filter((s: { is_active: boolean }) => s.is_active))
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  const toggleActive = async (prof: Professional) => {
    await fetch(`/api/dashboard/team/${prof.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !prof.is_active }),
    })
    fetchData()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Equipo</h1>
          <p className="mt-1 text-sm text-[#475569]">{professionals.filter(p => p.is_active).length} profesionales activos</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowModal(true) }} className="bg-[#00B8E6] text-[#060608] hover:opacity-80">
          <Plus className="h-4 w-4 mr-1" /> Agregar profesional
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : professionals.map((prof) => (
          <div key={prof.id} className="flex items-center gap-4 rounded-[10px] border border-[#E2E8F0] bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[7px] text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}>
              {prof.display_name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => { setEditing(prof); setShowModal(true) }}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[#0F172A]">{prof.display_name}</p>
                {!prof.is_active && <span className="text-[10px] text-[#94A3B8] bg-[#F8FAFC] px-2 py-0.5 rounded">Inactivo</span>}
                {prof.google_connected && <span className="text-[10px] text-[#10B981] bg-[#10B981]/[0.06] px-2 py-0.5 rounded">Google Cal</span>}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {prof.professional_services?.map(ps => String(ps.services?.name || '')).filter(Boolean).join(', ') || 'Sin servicios'}
              </p>
            </div>
            <button onClick={() => setShowScheduleModal(prof.id)} className="text-xs text-[#0891B2] flex items-center gap-0.5 hover:underline">
              Horarios <ChevronRight className="h-3 w-3" />
            </button>
            <Switch checked={prof.is_active} onCheckedChange={() => toggleActive(prof)} />
          </div>
        ))}
      </div>

      {showModal && (
        <ProfessionalModal
          professional={editing}
          services={services}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchData() }}
        />
      )}

      {showScheduleModal && (
        <ScheduleModal
          professionalId={showScheduleModal}
          onClose={() => setShowScheduleModal(null)}
        />
      )}

      <Toaster position="bottom-right" />
    </div>
  )
}

function ProfessionalModal({ professional, services, onClose, onSaved }: {
  professional: Professional | null; services: Service[]; onClose: () => void; onSaved: () => void
}) {
  const [name, setName] = useState(professional?.display_name || '')
  const [email, setEmail] = useState(professional?.email || '')
  const [selectedServices, setSelectedServices] = useState<string[]>(
    professional?.professional_services?.map(ps => ps.service_id) || []
  )
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    const body = { display_name: name.trim(), email: email.trim() || null, service_ids: selectedServices }
    const url = professional ? `/api/dashboard/team/${professional.id}` : '/api/dashboard/team'
    const method = professional ? 'PATCH' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) { toast.success(professional ? 'Profesional actualizado' : 'Profesional creado'); onSaved() }
    else { const d = await res.json(); toast.error(d.message || 'Error') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">{professional ? 'Editar profesional' : 'Nuevo profesional'}</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Email (opcional)</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Servicios</Label>
            <div className="flex flex-wrap gap-2">
              {services.map(svc => {
                const sel = selectedServices.includes(svc.id)
                return (
                  <button key={svc.id} type="button" onClick={() => toggle(svc.id)}
                    className="rounded-md border px-3 py-1.5 text-sm transition-colors"
                    style={{ borderColor: sel ? '#0891B2' : '#E2E8F0', background: sel ? 'rgba(8,145,178,0.06)' : 'transparent', color: sel ? '#0891B2' : '#475569' }}>
                    {svc.name}
                  </button>
                )
              })}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80">
            {saving ? 'Guardando...' : professional ? 'Guardar cambios' : 'Crear profesional'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScheduleModal({ professionalId, onClose }: { professionalId: string; onClose: () => void }) {
  const [schedules, setSchedules] = useState<Record<number, Array<{ start: string; end: string }>>>({})
  const [activeDays, setActiveDays] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/dashboard/team/${professionalId}`)
      .then(r => r.json())
      .then(data => {
        const sched: Record<number, Array<{ start: string; end: string }>> = {}
        const active: Record<number, boolean> = {}
        DAYS_OF_WEEK.forEach(d => { sched[d.value] = []; active[d.value] = false })

        for (const s of data.data?.schedules || []) {
          const day = s.day_of_week
          active[day] = true
          if (!sched[day]) sched[day] = []
          sched[day].push({ start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5) })
        }

        // Default ranges for active days without ranges
        DAYS_OF_WEEK.forEach(d => {
          if (active[d.value] && sched[d.value].length === 0) {
            sched[d.value] = [{ start: '09:00', end: '18:00' }]
          }
        })

        setSchedules(sched)
        setActiveDays(active)
        setLoading(false)
      })
  }, [professionalId])

  const toggleDay = (day: number) => {
    setActiveDays(prev => {
      const newActive = { ...prev, [day]: !prev[day] }
      if (newActive[day] && (!schedules[day] || schedules[day].length === 0)) {
        setSchedules(prev => ({ ...prev, [day]: [{ start: '09:00', end: '18:00' }] }))
      }
      return newActive
    })
  }

  const updateRange = (day: number, idx: number, field: 'start' | 'end', value: string) => {
    setSchedules(prev => ({
      ...prev,
      [day]: prev[day].map((r, i) => i === idx ? { ...r, [field]: value } : r),
    }))
  }

  const addRange = (day: number) => {
    setSchedules(prev => ({ ...prev, [day]: [...(prev[day] || []), { start: '14:00', end: '18:00' }] }))
  }

  const removeRange = (day: number, idx: number) => {
    setSchedules(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }))
  }

  const handleSave = async () => {
    setSaving(true)
    const rows: Array<{ day_of_week: number; start_time: string; end_time: string }> = []
    for (const day of DAYS_OF_WEEK) {
      if (activeDays[day.value] && schedules[day.value]) {
        for (const range of schedules[day.value]) {
          rows.push({ day_of_week: day.value, start_time: range.start, end_time: range.end })
        }
      }
    }

    const res = await fetch(`/api/dashboard/team/${professionalId}/schedules`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules: rows }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Horarios guardados'); onClose() }
    else toast.error('Error al guardar')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-[520px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">Horarios</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
          ) : (
            DAYS_OF_WEEK.map(day => (
              <div key={day.value} className="rounded-lg border border-[#E2E8F0] p-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleDay(day.value)}
                    className="flex h-5 w-9 items-center rounded-full transition-colors"
                    style={{ background: activeDays[day.value] ? '#00B8E6' : '#E2E8F0', justifyContent: activeDays[day.value] ? 'flex-end' : 'flex-start', padding: '2px' }}>
                    <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </button>
                  <span className="text-sm font-medium text-[#0F172A] w-20">{day.label}</span>
                  {activeDays[day.value] ? (
                    <div className="flex flex-1 flex-col gap-1.5">
                      {(schedules[day.value] || []).map((range, ri) => (
                        <div key={ri} className="flex items-center gap-2">
                          <input type="time" value={range.start} onChange={e => updateRange(day.value, ri, 'start', e.target.value)} className="h-8 w-24 rounded border border-[#E2E8F0] px-2 text-sm" />
                          <span className="text-xs text-[#94A3B8]">a</span>
                          <input type="time" value={range.end} onChange={e => updateRange(day.value, ri, 'end', e.target.value)} className="h-8 w-24 rounded border border-[#E2E8F0] px-2 text-sm" />
                          {ri > 0 && <button onClick={() => removeRange(day.value, ri)} className="text-[#94A3B8] hover:text-[#EF4444] text-xs">x</button>}
                          {ri === (schedules[day.value]?.length || 0) - 1 && <button onClick={() => addRange(day.value)} className="text-[10px] text-[#0891B2]">+ Partido</button>}
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-sm text-[#94A3B8]">Cerrado</span>}
                </div>
              </div>
            ))
          )}
          <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-[#00B8E6] text-[#060608] hover:opacity-80">
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
