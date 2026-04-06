'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

interface ProfessionalForm {
  name: string
  email: string
  service_ids: string[]
}

interface Props {
  services: Array<{ id: string; name: string }>
  onNext: (professionals: Array<{ id: string; name: string }>) => void
  onBack: () => void
}

const emptyProfessional = (): ProfessionalForm => ({
  name: '',
  email: '',
  service_ids: [],
})

export function StepProfessionals({ services, onNext, onBack }: Props) {
  const [professionals, setProfessionals] = useState<ProfessionalForm[]>([emptyProfessional()])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateProfessional(index: number, field: keyof ProfessionalForm, value: unknown) {
    setProfessionals((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  function toggleService(profIndex: number, serviceId: string) {
    setProfessionals((prev) =>
      prev.map((p, i) => {
        if (i !== profIndex) return p
        const ids = p.service_ids.includes(serviceId)
          ? p.service_ids.filter((id) => id !== serviceId)
          : [...p.service_ids, serviceId]
        return { ...p, service_ids: ids }
      })
    )
  }

  function addProfessional() {
    setProfessionals((prev) => [...prev, emptyProfessional()])
  }

  function removeProfessional(index: number) {
    if (professionals.length <= 1) return
    setProfessionals((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const valid = professionals.filter((p) => p.name.trim())
    if (!valid.length) { setError('Agrega al menos un profesional'); return }

    const noServices = valid.some((p) => p.service_ids.length === 0)
    if (noServices) { setError('Cada profesional debe tener al menos un servicio asignado'); return }

    setLoading(true)

    const res = await fetch('/api/onboarding/step3', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professionals: valid.map((p) => ({
          name: p.name.trim(),
          email: p.email.trim() || undefined,
          service_ids: p.service_ids,
        })),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Error al crear profesionales')
      setLoading(false)
      return
    }

    onNext(data.data.professionals)
  }

  return (
    <Card className="border-[0.5px] border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
          Tu equipo
        </CardTitle>
        <CardDescription className="text-sm text-[#475569]">
          Agrega los profesionales que atenderán las citas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {professionals.map((prof, i) => (
            <div key={i} className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">
                  Profesional {i + 1}
                </span>
                {professionals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProfessional(i)}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors duration-150"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
                  <Input
                    placeholder="Nombre completo"
                    value={prof.name}
                    onChange={(e) => updateProfessional(i, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                    Email <span className="normal-case tracking-normal">(opcional)</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={prof.email}
                    onChange={(e) => updateProfessional(i, 'email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                  Servicios que ofrece
                </Label>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc) => {
                    const selected = prof.service_ids.includes(svc.id)
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleService(i, svc.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors duration-150"
                        style={{
                          borderColor: selected ? '#0891B2' : '#E2E8F0',
                          background: selected ? 'rgba(8,145,178,0.06)' : 'transparent',
                          color: selected ? '#0891B2' : '#475569',
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: selected ? '#00B8E6' : '#CBD5E1' }}
                        />
                        {svc.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addProfessional}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#E2E8F0] py-3 text-sm text-[#94A3B8] transition-colors duration-150 hover:border-[#00B8E6] hover:text-[#0891B2]"
          >
            <Plus className="h-4 w-4" />
            Agregar otro profesional
          </button>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Anterior
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Siguiente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
