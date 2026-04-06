'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DAYS_OF_WEEK } from '@/lib/constants'
import { Plus, Trash2 } from 'lucide-react'

interface TimeRange {
  start: string
  end: string
}

interface DaySchedule {
  active: boolean
  ranges: TimeRange[]
}

type ProfessionalSchedule = Record<number, DaySchedule>

interface Props {
  professionals: Array<{ id: string; name: string }>
  onNext: () => void
  onBack: () => void
}

function defaultSchedule(): ProfessionalSchedule {
  const sched: ProfessionalSchedule = {}
  for (const day of DAYS_OF_WEEK) {
    sched[day.value] = {
      active: day.value >= 1 && day.value <= 5, // Mon-Fri active
      ranges: [{ start: '09:00', end: '18:00' }],
    }
  }
  return sched
}

export function StepSchedules({ professionals, onNext, onBack }: Props) {
  const [schedules, setSchedules] = useState<Record<string, ProfessionalSchedule>>(() => {
    const init: Record<string, ProfessionalSchedule> = {}
    professionals.forEach((p) => { init[p.id] = defaultSchedule() })
    return init
  })
  const [activeProfessional, setActiveProfessional] = useState(professionals[0]?.id || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function toggleDay(profId: string, day: number) {
    setSchedules((prev) => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        [day]: {
          ...prev[profId][day],
          active: !prev[profId][day].active,
        },
      },
    }))
  }

  function updateRange(profId: string, day: number, rangeIndex: number, field: 'start' | 'end', value: string) {
    setSchedules((prev) => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        [day]: {
          ...prev[profId][day],
          ranges: prev[profId][day].ranges.map((r, ri) =>
            ri === rangeIndex ? { ...r, [field]: value } : r
          ),
        },
      },
    }))
  }

  function addRange(profId: string, day: number) {
    setSchedules((prev) => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        [day]: {
          ...prev[profId][day],
          ranges: [...prev[profId][day].ranges, { start: '14:00', end: '18:00' }],
        },
      },
    }))
  }

  function removeRange(profId: string, day: number, rangeIndex: number) {
    setSchedules((prev) => ({
      ...prev,
      [profId]: {
        ...prev[profId],
        [day]: {
          ...prev[profId][day],
          ranges: prev[profId][day].ranges.filter((_, ri) => ri !== rangeIndex),
        },
      },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = Object.entries(schedules).map(([profId, dayMap]) => ({
      professional_id: profId,
      slots: Object.entries(dayMap)
        .filter(([, ds]) => ds.active && ds.ranges.length > 0)
        .flatMap(([day, ds]) =>
          ds.ranges.map((r) => ({
            day_of_week: parseInt(day),
            start_time: r.start,
            end_time: r.end,
          }))
        ),
    })).filter((p) => p.slots.length > 0)

    if (!payload.length) {
      setError('Configura al menos un horario')
      setLoading(false)
      return
    }

    const res = await fetch('/api/onboarding/step4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules: payload }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.message || 'Error al guardar horarios')
      setLoading(false)
      return
    }

    onNext()
  }

  const currentSchedule = schedules[activeProfessional] || {}

  return (
    <Card className="border-[0.5px] border-[#E2E8F0]">
      <CardHeader>
        <CardTitle className="text-[22px] font-medium tracking-[-0.5px] text-[#0F172A]">
          Horarios
        </CardTitle>
        <CardDescription className="text-sm text-[#475569]">
          Configura los horarios de atención de cada profesional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Professional tabs */}
          {professionals.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {professionals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProfessional(p.id)}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors duration-150"
                  style={{
                    background: activeProfessional === p.id ? 'rgba(8,145,178,0.06)' : 'transparent',
                    color: activeProfessional === p.id ? '#0891B2' : '#475569',
                    border: `1px solid ${activeProfessional === p.id ? '#0891B2' : '#E2E8F0'}`,
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Day grid */}
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => {
              const ds = currentSchedule[day.value]
              if (!ds) return null
              return (
                <div key={day.value} className="rounded-lg border border-[#E2E8F0] p-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(activeProfessional, day.value)}
                      className="flex h-5 w-9 items-center rounded-full transition-colors duration-150"
                      style={{
                        background: ds.active ? '#00B8E6' : '#E2E8F0',
                        justifyContent: ds.active ? 'flex-end' : 'flex-start',
                        padding: '2px',
                      }}
                    >
                      <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                    </button>
                    <span className="text-sm font-medium text-[#0F172A] w-20">{day.label}</span>

                    {ds.active && (
                      <div className="flex flex-1 flex-col gap-2">
                        {ds.ranges.map((range, ri) => (
                          <div key={ri} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={range.start}
                              onChange={(e) => updateRange(activeProfessional, day.value, ri, 'start', e.target.value)}
                              className="h-8 w-28 text-sm"
                            />
                            <span className="text-[#94A3B8] text-xs">a</span>
                            <Input
                              type="time"
                              value={range.end}
                              onChange={(e) => updateRange(activeProfessional, day.value, ri, 'end', e.target.value)}
                              className="h-8 w-28 text-sm"
                            />
                            {ri > 0 && (
                              <button
                                type="button"
                                onClick={() => removeRange(activeProfessional, day.value, ri)}
                                className="text-[#94A3B8] hover:text-[#EF4444] transition-colors duration-150"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {ri === ds.ranges.length - 1 && ds.ranges.length < 3 && (
                              <button
                                type="button"
                                onClick={() => addRange(activeProfessional, day.value)}
                                className="text-[#94A3B8] hover:text-[#0891B2] transition-colors duration-150"
                                title="Agregar horario partido"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {!ds.active && (
                      <span className="text-sm text-[#94A3B8]">Cerrado</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

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
