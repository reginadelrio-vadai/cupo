'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SLUG_REGEX } from '@/lib/constants'
import { Check, X, Loader2 } from 'lucide-react'

interface Props {
  onNext: (slug: string) => void
  onBack: () => void
}

export function StepBooking({ onNext, onBack }: Props) {
  const [slug, setSlug] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#00B8E6')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checkSlug = useCallback(async (value: string) => {
    if (!value || !SLUG_REGEX.test(value)) {
      setSlugStatus('idle')
      return
    }

    setSlugStatus('checking')
    setSuggestion(null)

    const res = await fetch('/api/onboarding/check-slug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: value }),
    })

    const data = await res.json()
    if (data.data?.available) {
      setSlugStatus('available')
    } else {
      setSlugStatus('taken')
      setSuggestion(data.data?.suggestion || null)
    }
  }, [])

  function handleSlugChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(cleaned)
    setSlugStatus('idle')

    // Debounce check
    const timer = setTimeout(() => checkSlug(cleaned), 500)
    return () => clearTimeout(timer)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!slug || !SLUG_REGEX.test(slug)) {
      setError('URL inválida. Usa solo letras minúsculas, números y guiones.')
      return
    }

    if (slugStatus === 'taken') {
      setError('Esta URL ya está en uso. Elige otra.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/onboarding/step5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        primary_color: primaryColor,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Error al configurar booking page')
      setLoading(false)
      return
    }

    onNext(slug)
  }

  return (
    <Card className="border-[0.5px] border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
          Booking page
        </CardTitle>
        <CardDescription className="text-sm text-[#475569]">
          Configura tu página de reservas pública
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              URL de tu página
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-[#94A3B8] whitespace-nowrap">cupo.app/book/</span>
              <div className="relative flex-1">
                <Input
                  placeholder="mi-negocio"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="pr-8"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-[#94A3B8]" />}
                  {slugStatus === 'available' && <Check className="h-4 w-4 text-[#10B981]" />}
                  {slugStatus === 'taken' && <X className="h-4 w-4 text-[#EF4444]" />}
                </div>
              </div>
            </div>
            {slugStatus === 'taken' && suggestion && (
              <p className="text-xs text-[#94A3B8]">
                Sugerencia:{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSlug(suggestion)
                    checkSlug(suggestion)
                  }}
                  className="text-[#00B8E6] underline"
                >
                  {suggestion}
                </button>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              Color principal
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-[#E2E8F0] p-0.5"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-28 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              Vista previa
            </Label>
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ background: primaryColor }}
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <span className="text-base font-medium text-[#0F172A]">Tu negocio</span>
              </div>
              <div className="space-y-2">
                <div className="h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center px-3">
                  <span className="text-sm text-[#475569]">Consulta general</span>
                  <span className="ml-auto text-sm font-medium" style={{ color: primaryColor }}>
                    $500
                  </span>
                </div>
                <div className="h-10 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center px-3">
                  <span className="text-sm text-[#475569]">Seguimiento</span>
                  <span className="ml-auto text-sm font-medium" style={{ color: primaryColor }}>
                    $300
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
                style={{ background: primaryColor }}
              >
                Reservar cita
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Anterior
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
              disabled={loading || slugStatus === 'checking'}
            >
              {loading ? 'Guardando...' : 'Finalizar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
