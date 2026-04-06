'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SLUG_REGEX } from '@/lib/constants'

export default function OnboardingPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50)
  }

  async function handleOnboarding(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!SLUG_REGEX.test(slug)) {
      setError('El slug solo puede contener letras minúsculas, números y guiones')
      return
    }

    setLoading(true)

    // Call API to create organization
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: businessName, slug }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message || 'Error al crear la organización')
      setLoading(false)
      return
    }

    // Refresh session to pick up new app_metadata
    await supabase.auth.refreshSession()

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <Card className="w-full max-w-[480px] border-[0.5px] border-[#E2E8F0]">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-[#00B8E6] flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-[#060608]" />
            </div>
            <span className="text-lg font-medium tracking-[0.5px] text-[#0F172A]">cupo</span>
          </div>
          <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
            Configura tu negocio
          </CardTitle>
          <CardDescription className="text-sm text-[#475569]">
            Solo necesitamos algunos datos para empezar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOnboarding} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                Nombre del negocio
              </Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Mi Negocio"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value)
                  setSlug(generateSlug(e.target.value))
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                URL de tu página de reservas
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#94A3B8] whitespace-nowrap">cupo.app/book/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="mi-negocio"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  required
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-[#EF4444]">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
