'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DURATION_OPTIONS } from '@/lib/constants'
import { Plus, Trash2 } from 'lucide-react'

interface ServiceForm {
  name: string
  duration_minutes: number
  price: string
  category: string
}

interface Props {
  onNext: (services: Array<{ id: string; name: string }>) => void
  onBack: () => void
}

const emptyService = (): ServiceForm => ({
  name: '',
  duration_minutes: 30,
  price: '',
  category: '',
})

export function StepServices({ onNext, onBack }: Props) {
  const [services, setServices] = useState<ServiceForm[]>([emptyService()])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateService(index: number, field: keyof ServiceForm, value: string | number) {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function addService() {
    setServices((prev) => [...prev, emptyService()])
  }

  function removeService(index: number) {
    if (services.length <= 1) return
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const valid = services.filter((s) => s.name.trim())
    if (!valid.length) { setError('Agrega al menos un servicio'); return }

    setLoading(true)

    const res = await fetch('/api/onboarding/step2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        services: valid.map((s) => ({
          name: s.name.trim(),
          duration_minutes: s.duration_minutes,
          price: parseFloat(s.price) || 0,
          category: s.category.trim() || undefined,
        })),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Error al crear servicios')
      setLoading(false)
      return
    }

    onNext(data.data.services)
  }

  return (
    <Card className="border-[0.5px] border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
          Tus servicios
        </CardTitle>
        <CardDescription className="text-sm text-[#475569]">
          Agrega los servicios que ofrece tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {services.map((service, i) => (
            <div key={i} className="rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">
                  Servicio {i + 1}
                </span>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors duration-150"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
                <Input
                  placeholder="Ej: Consulta general"
                  value={service.name}
                  onChange={(e) => updateService(i, 'name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Duración</Label>
                  <select
                    value={service.duration_minutes}
                    onChange={(e) => updateService(i, 'duration_minutes', parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Precio</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={service.price}
                    onChange={(e) => updateService(i, 'price', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                  Categoría <span className="normal-case tracking-normal text-[#94A3B8]">(opcional)</span>
                </Label>
                <Input
                  placeholder="Ej: Consultas"
                  value={service.category}
                  onChange={(e) => updateService(i, 'category', e.target.value)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addService}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#E2E8F0] py-3 text-sm text-[#94A3B8] transition-colors duration-150 hover:border-[#00B8E6] hover:text-[#0891B2]"
          >
            <Plus className="h-4 w-4" />
            Agregar otro servicio
          </button>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
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
