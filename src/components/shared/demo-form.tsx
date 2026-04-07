'use client'

import { useState } from 'react'

const COUNTRY_CODES = [
  { code: '+52', flag: '🇲🇽' },
  { code: '+1', flag: '🇺🇸' },
  { code: '+57', flag: '🇨🇴' },
  { code: '+51', flag: '🇵🇪' },
  { code: '+56', flag: '🇨🇱' },
  { code: '+54', flag: '🇦🇷' },
]

export function DemoForm() {
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('+52')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log({ name, phone: `${countryCode}${phone.replace(/\D/g, '')}`, email })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/10">
          <svg className="h-6 w-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-base font-medium text-[#E2E8F0]">¡Listo! Te contactaremos pronto.</p>
        <p className="text-sm text-[#94A3B8] mt-1">Revisa tu WhatsApp o correo.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</label>
        <input
          type="text"
          placeholder="Tu nombre o el de tu empresa"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full h-10 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] focus:outline-none focus:border-[#0891B2] transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Teléfono</label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="h-10 w-[88px] rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-2 text-sm text-[#E2E8F0] focus:outline-none focus:border-[#0891B2] transition-colors"
          >
            {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <input
            type="tel"
            placeholder="55 1234 5678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="flex-1 h-10 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] focus:outline-none focus:border-[#0891B2] transition-colors"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Correo electrónico</label>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full h-10 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 text-sm text-[#E2E8F0] placeholder:text-[#475569] focus:outline-none focus:border-[#0891B2] transition-colors"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-[8px] bg-[#00B8E6] py-3 text-sm font-medium text-[#060608] transition-all duration-300 hover:bg-gradient-to-r hover:from-[#00B8E6] hover:to-[#06D6A0] active:scale-[0.97]"
      >
        Solicitar demo
      </button>
    </form>
  )
}
