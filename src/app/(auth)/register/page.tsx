'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setErrorType(null)
    setLoading(true)

    // Step 1: Create user via API (admin auto-confirms, checks duplicates)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message || 'Error al crear la cuenta')
      setErrorType(data.error === 'USER_EXISTS' ? 'exists' : null)
      setLoading(false)
      return
    }

    // Step 2: Auto-login with the credentials just created
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError('Cuenta creada, pero hubo un error al iniciar sesión. Intenta desde login.')
      setErrorType('login_failed')
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <Card className="w-full max-w-[400px] border-[0.5px] border-[#E2E8F0]">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-[#00B8E6] flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-[#060608]" />
            </div>
            <span className="text-lg font-medium tracking-[0.5px] text-[#0F172A]">cupo</span>
          </div>
          <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
            Crear cuenta
          </CardTitle>
          <CardDescription className="text-sm text-[#475569]">
            Comienza a gestionar tus citas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                Nombre
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-[#EF4444]">
                {error}
                {(errorType === 'exists' || errorType === 'login_failed') && (
                  <>
                    {' '}
                    <Link href="/login" className="underline text-[#00B8E6]">
                      Ir a login
                    </Link>
                  </>
                )}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-[#475569]">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#00B8E6] hover:opacity-80 transition-opacity duration-150">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
