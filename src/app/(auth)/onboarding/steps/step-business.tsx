'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { INDUSTRIES, VALID_TIMEZONES } from '@/lib/constants'

interface Props {
  onNext: (organizationId: string) => void
}

export function StepBusiness({ onNext }: Props) {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [timezone, setTimezone] = useState('America/Mexico_City')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('El nombre es requerido'); return }

    setLoading(true)

    const res = await fetch('/api/onboarding/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), industry, timezone }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Error al crear el negocio')
      setLoading(false)
      return
    }

    onNext(data.data.organizationId)
  }

  return (
    <Card className="border-[0.5px] border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
          Tu negocio
        </CardTitle>
        <CardDescription className="text-sm text-[#475569]">
          Cuéntanos sobre tu negocio para configurar tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              Nombre del negocio
            </Label>
            <Input
              placeholder="Mi Negocio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              Industria
            </Label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Selecciona una industria</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>{ind.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              Zona horaria
            </Label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {VALID_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Siguiente'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
