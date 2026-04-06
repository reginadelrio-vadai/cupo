'use client'

import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, Check, Clock, User, Calendar as CalendarIcon, Loader2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number
  currency: string
  is_virtual: boolean
  service_categories: { name: string } | { name: string }[] | null
}

interface Professional {
  id: string
  display_name: string
  avatar_url: string | null
}

interface Slot {
  start: string
  end: string
  professional_id: string
  professional_name: string
}

interface Props {
  slug: string
  services: Service[]
  primaryColor: string
  timezone: string
}

type Step = 'service' | 'professional' | 'datetime' | 'client' | 'confirm' | 'success'

export function BookingFlow({ slug, services, primaryColor }: Props) {
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appointmentResult, setAppointmentResult] = useState<Record<string, unknown> | null>(null)

  const api = `/api/booking/${slug}`

  // Step 1 → 2: Select service, load professionals
  async function selectService(service: Service) {
    setSelectedService(service)
    setLoading(true)
    const res = await fetch(`${api}/professionals?service_id=${service.id}`)
    const data = await res.json()
    setProfessionals(data.data?.professionals || [])
    setLoading(false)

    if (data.data?.professionals?.length === 1) {
      // Auto-select if only one professional
      selectProfessional(data.data.professionals[0], service)
    } else {
      setStep('professional')
    }
  }

  // Step 2 → 3: Select professional, load availability
  async function selectProfessional(prof: Professional, svc?: Service) {
    setSelectedProfessional(prof)
    const service = svc || selectedService
    setStep('datetime')
    await loadSlots(selectedDate, service!.id, prof.id)
  }

  async function loadSlots(date: string, serviceId: string, professionalId: string) {
    setLoading(true)
    setSlots([])
    const res = await fetch(`${api}/availability?date=${date}&service_id=${serviceId}&professional_id=${professionalId}`)
    const data = await res.json()
    setSlots(data.data?.slots || [])
    setLoading(false)
  }

  async function changeDate(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (selectedService && selectedProfessional) {
      await loadSlots(date, selectedService.id, selectedProfessional.id)
    }
  }

  // Step 4: Submit booking
  async function handleBook() {
    setError(null)
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Nombre y teléfono son requeridos')
      return
    }
    setLoading(true)

    const res = await fetch(`${api}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: selectedService!.id,
        professional_id: selectedProfessional!.id,
        start_time: selectedSlot!.start,
        client: {
          full_name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim() || undefined,
        },
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.message || 'Error al reservar')
      return
    }

    setAppointmentResult(data.data)
    setStep('success')
  }

  function goBack() {
    if (step === 'professional') setStep('service')
    else if (step === 'datetime') setStep('professional')
    else if (step === 'client') setStep('datetime')
    else if (step === 'confirm') setStep('client')
  }

  // Generate next 7 days for date picker
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d', { locale: es }) }
  })

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return format(d, 'HH:mm')
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(price)
  }

  // ============================================================
  // RENDER
  // ============================================================

  // Back button
  const BackButton = step !== 'service' && step !== 'success' ? (
    <button
      onClick={goBack}
      className="flex items-center gap-1 text-sm text-[#475569] mb-4 hover:text-[#0F172A] transition-colors"
    >
      <ChevronLeft className="h-4 w-4" /> Atrás
    </button>
  ) : null

  // STEP: Service selection
  if (step === 'service') {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-medium text-[#0F172A]">Selecciona un servicio</h2>
        {services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => selectService(svc)}
            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left transition-colors hover:border-[#CBD5E1]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{svc.name}</p>
                {svc.description && (
                  <p className="mt-0.5 text-xs text-[#94A3B8]">{svc.description}</p>
                )}
                <div className="mt-1.5 flex items-center gap-2 text-xs text-[#94A3B8]">
                  <Clock className="h-3 w-3" />
                  <span>{svc.duration_minutes} min</span>
                  {svc.is_virtual && (
                    <span className="rounded-full bg-[#0891B2]/10 px-2 py-0.5 text-[#0891B2]">Virtual</span>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium" style={{ color: primaryColor }}>
                {svc.price > 0 ? formatPrice(svc.price, svc.currency) : 'Gratis'}
              </span>
            </div>
          </button>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-[#94A3B8] text-center py-8">No hay servicios disponibles</p>
        )}
      </div>
    )
  }

  // STEP: Professional selection
  if (step === 'professional') {
    return (
      <div className="space-y-3">
        {BackButton}
        <h2 className="text-base font-medium text-[#0F172A]">Selecciona un profesional</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : (
          professionals.map((prof) => (
            <button
              key={prof.id}
              onClick={() => selectProfessional(prof)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left transition-colors hover:border-[#CBD5E1]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[7px] text-xs font-medium text-white"
                  style={{ background: `linear-gradient(135deg, #0891B2, #06D6A0)` }}
                >
                  {prof.display_name[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[#0F172A]">{prof.display_name}</span>
              </div>
            </button>
          ))
        )}
      </div>
    )
  }

  // STEP: Date & time selection
  if (step === 'datetime') {
    return (
      <div className="space-y-4">
        {BackButton}
        <h2 className="text-base font-medium text-[#0F172A]">Elige fecha y hora</h2>

        {/* Date scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => changeDate(d.value)}
              className="flex-shrink-0 rounded-lg border px-3 py-2 text-center text-xs transition-colors"
              style={{
                borderColor: selectedDate === d.value ? primaryColor : '#E2E8F0',
                background: selectedDate === d.value ? `${primaryColor}10` : 'transparent',
                color: selectedDate === d.value ? primaryColor : '#475569',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Time slots */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.start}
                onClick={() => { setSelectedSlot(slot); setStep('client') }}
                className="rounded-lg border py-2.5 text-center text-sm transition-colors"
                style={{
                  borderColor: selectedSlot?.start === slot.start ? primaryColor : '#E2E8F0',
                  background: selectedSlot?.start === slot.start ? `${primaryColor}10` : 'transparent',
                  color: selectedSlot?.start === slot.start ? primaryColor : '#0F172A',
                }}
              >
                {formatTime(slot.start)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#94A3B8] text-center py-8">
            No hay horarios disponibles para esta fecha
          </p>
        )}
      </div>
    )
  }

  // STEP: Client info
  if (step === 'client') {
    return (
      <div className="space-y-4">
        {BackButton}
        <h2 className="text-base font-medium text-[#0F172A]">Tus datos</h2>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre completo</Label>
            <Input
              placeholder="Tu nombre"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Teléfono</Label>
            <Input
              type="tel"
              placeholder="+52 55 1234 5678"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">
              Email <span className="normal-case tracking-normal">(opcional)</span>
            </Label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-[#EF4444]">{error}</p>}

        <Button
          onClick={() => {
            if (!clientName.trim() || !clientPhone.trim()) {
              setError('Nombre y teléfono son requeridos')
              return
            }
            setError(null)
            setStep('confirm')
          }}
          className="w-full text-white"
          style={{ background: primaryColor }}
        >
          Revisar reserva
        </Button>
      </div>
    )
  }

  // STEP: Confirmation
  if (step === 'confirm') {
    const slotDate = selectedSlot ? new Date(selectedSlot.start) : new Date()

    return (
      <div className="space-y-4">
        {BackButton}
        <h2 className="text-base font-medium text-[#0F172A]">Confirmar reserva</h2>

        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-[#94A3B8]" />
            <span className="text-[#0F172A]">
              {format(slotDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[#94A3B8]" />
            <span className="text-[#0F172A]">{selectedService?.name} — {selectedService?.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-[#94A3B8]" />
            <span className="text-[#0F172A]">{selectedProfessional?.display_name}</span>
          </div>
          {selectedService && selectedService.price > 0 && (
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Total</span>
              <span className="text-sm font-medium" style={{ color: primaryColor }}>
                {formatPrice(selectedService.price, selectedService.currency)}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-1">
          <p className="text-sm font-medium text-[#0F172A]">{clientName}</p>
          <p className="text-xs text-[#94A3B8]">{clientPhone}</p>
          {clientEmail && <p className="text-xs text-[#94A3B8]">{clientEmail}</p>}
        </div>

        {error && <p className="text-sm text-[#EF4444]">{error}</p>}

        <Button
          onClick={handleBook}
          disabled={loading}
          className="w-full text-white"
          style={{ background: primaryColor }}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Reservando...</>
          ) : (
            'Confirmar reserva'
          )}
        </Button>
      </div>
    )
  }

  // STEP: Success
  if (step === 'success') {
    const appt = appointmentResult?.appointment as Record<string, unknown> | undefined
    const startDate = appt?.start_time ? new Date(appt.start_time as string) : new Date()

    return (
      <div className="text-center space-y-4 py-8">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: `${primaryColor}15` }}
        >
          <Check className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-xl font-medium text-[#0F172A]">¡Reserva confirmada!</h2>
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-left space-y-2">
          <p className="text-sm text-[#0F172A]">
            <strong>{selectedService?.name}</strong> con {selectedProfessional?.display_name}
          </p>
          <p className="text-sm text-[#475569]">
            {format(startDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })} hrs
          </p>
        </div>
        <p className="text-xs text-[#94A3B8]">
          Recibirás una confirmación por WhatsApp y/o email.
        </p>
      </div>
    )
  }

  return null
}
