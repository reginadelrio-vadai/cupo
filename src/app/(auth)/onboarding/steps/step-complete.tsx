'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface Props {
  slug: string
  onFinish: () => void
}

export function StepComplete({ slug, onFinish }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const bookingUrl = `${appUrl}/book/${slug}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-6">
      <Card className="w-full max-w-[480px] border-[0.5px] border-[#E2E8F0] text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10">
            <Check className="h-8 w-8 text-[#10B981]" />
          </div>

          <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">
            ¡Todo listo!
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Tu booking page está activa en:
          </p>

          <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#00B8E6] hover:underline break-all"
            >
              {bookingUrl}
            </a>
          </div>

          <Button
            onClick={onFinish}
            className="mt-8 w-full bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
          >
            Ir al dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
