'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { StepBusiness } from './steps/step-business'
import { StepServices } from './steps/step-services'
import { StepProfessionals } from './steps/step-professionals'
import { StepSchedules } from './steps/step-schedules'
import { StepBooking } from './steps/step-booking'
import { StepComplete } from './steps/step-complete'

export interface OnboardingData {
  organizationId: string | null
  services: Array<{ id: string; name: string }>
  professionals: Array<{ id: string; name: string }>
  slug: string | null
}

const STEP_LABELS = ['Negocio', 'Servicios', 'Profesionales', 'Horarios', 'Booking page']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    organizationId: null,
    services: [],
    professionals: [],
    slug: null,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function handleNext() {
    setStep((s) => Math.min(s + 1, 6))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleFinish() {
    await supabase.auth.refreshSession()
    router.push('/dashboard')
    router.refresh()
  }

  // Step 6 = complete screen
  if (step === 6) {
    return <StepComplete slug={data.slug!} onFinish={handleFinish} />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 pt-6">
        <div className="h-7 w-7 rounded-lg bg-[#00B8E6] flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#060608]" />
        </div>
        <span className="text-base font-medium tracking-[0.5px] text-[#0F172A]">cupo</span>
      </div>

      {/* Progress */}
      <div className="mx-auto mt-8 w-full max-w-[640px] px-6">
        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="h-[3px] w-full rounded-full transition-colors duration-200"
                style={{
                  background: i + 1 <= step ? '#00B8E6' : '#E2E8F0',
                }}
              />
              <span
                className="text-[10px] uppercase tracking-[1px]"
                style={{
                  color: i + 1 <= step ? '#0891B2' : '#94A3B8',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto mt-8 w-full max-w-[640px] px-6 pb-12">
        {step === 1 && (
          <StepBusiness
            onNext={(orgId) => {
              setData((d) => ({ ...d, organizationId: orgId }))
              handleNext()
            }}
          />
        )}
        {step === 2 && (
          <StepServices
            onNext={(services) => {
              setData((d) => ({ ...d, services }))
              handleNext()
            }}
            onBack={handleBack}
          />
        )}
        {step === 3 && (
          <StepProfessionals
            services={data.services}
            onNext={(professionals) => {
              setData((d) => ({ ...d, professionals }))
              handleNext()
            }}
            onBack={handleBack}
          />
        )}
        {step === 4 && (
          <StepSchedules
            professionals={data.professionals}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step === 5 && (
          <StepBooking
            onNext={(slug) => {
              setData((d) => ({ ...d, slug }))
              handleNext()
            }}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
