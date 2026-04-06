import { SupabaseClient } from '@supabase/supabase-js'
import {
  addMinutes,
  addHours,
  addDays,
  getDay,
  isBefore,
  startOfDay,
  endOfDay,
  parse,
  format,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// ============================================================
// Types
// ============================================================

export interface AvailableSlot {
  start: string       // ISO 8601 TIMESTAMPTZ
  end: string         // ISO 8601 TIMESTAMPTZ
  professional_id: string
  professional_name: string
}

export interface GetAvailableSlotsParams {
  organizationId: string
  serviceId: string
  professionalId?: string
  date: string          // YYYY-MM-DD
  timezone: string      // IANA timezone
}

export interface GetAvailableSlotsForRangeParams {
  organizationId: string
  serviceId: string
  professionalId?: string
  startDate: string     // YYYY-MM-DD
  endDate: string       // YYYY-MM-DD
  timezone: string
}

interface TimeRange {
  start: string  // HH:mm
  end: string    // HH:mm
}

// ============================================================
// getAvailableSlots — Single day
// ============================================================

export async function getAvailableSlots(
  supabase: SupabaseClient,
  params: GetAvailableSlotsParams
): Promise<AvailableSlot[]> {
  const { organizationId, serviceId, professionalId, date, timezone } = params

  // STEP 1: Config
  const { data: org } = await supabase
    .from('organizations')
    .select('id, slot_granularity_minutes')
    .eq('id', organizationId)
    .single()

  const { data: service } = await supabase
    .from('services')
    .select('id, duration_minutes, buffer_after_minutes')
    .eq('id', serviceId)
    .eq('organization_id', organizationId)
    .single()

  if (!org || !service) return []

  const { data: bookingConfig } = await supabase
    .from('booking_page_config')
    .select('min_advance_hours, max_advance_days')
    .eq('organization_id', organizationId)
    .single()

  const slotDuration = service.duration_minutes
  const bufferMinutes = service.buffer_after_minutes
  const granularity = org.slot_granularity_minutes || 15
  const minAdvanceHours = bookingConfig?.min_advance_hours ?? 2
  const maxAdvanceDays = bookingConfig?.max_advance_days ?? 30

  // STEP 2: Eligible professionals
  const professionals = await getEligibleProfessionals(
    supabase, organizationId, serviceId, professionalId
  )
  if (!professionals.length) return []

  const profIds = professionals.map(p => p.id)

  // Date info
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date())
  const dayOfWeek = getDay(parsedDate) // 0=Sunday

  // STEP 3: Schedules + exceptions for this day
  const { data: schedules } = await supabase
    .from('professional_schedules')
    .select('professional_id, day_of_week, start_time, end_time')
    .in('professional_id', profIds)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  const { data: exceptions } = await supabase
    .from('professional_schedule_exceptions')
    .select('professional_id, exception_date, is_available, start_time, end_time')
    .in('professional_id', profIds)
    .eq('exception_date', date)

  // STEP 5: Existing appointments for this day (fetch as UTC)
  const dayStartUTC = fromZonedTime(startOfDay(parsedDate), timezone).toISOString()
  const dayEndUTC = fromZonedTime(endOfDay(parsedDate), timezone).toISOString()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('professional_id, start_time, end_time, status')
    .in('professional_id', profIds)
    .gte('start_time', dayStartUTC)
    .lt('start_time', dayEndUTC)
    .not('status', 'in', '("cancelled","expired")')

  // STEP 6: Business rules — "now" in org timezone
  const nowInTz = toZonedTime(new Date(), timezone)
  const earliestStart = addHours(nowInTz, minAdvanceHours)
  const latestDate = addDays(startOfDay(nowInTz), maxAdvanceDays)

  // Process per professional
  const allSlots: AvailableSlot[] = []

  for (const prof of professionals) {
    // 3a: Get schedule ranges for this day
    const profSchedules = (schedules || []).filter(s => s.professional_id === prof.id)
    if (!profSchedules.length) continue

    let ranges: TimeRange[] = profSchedules.map(s => ({
      start: s.start_time.slice(0, 5), // HH:mm
      end: s.end_time.slice(0, 5),
    }))

    // 3b: Apply exceptions
    const profExceptions = (exceptions || []).filter(e => e.professional_id === prof.id)
    for (const exc of profExceptions) {
      if (!exc.is_available && !exc.start_time) {
        // Full day blocked
        ranges = []
        break
      }
      if (!exc.is_available && exc.start_time && exc.end_time) {
        // Partial block — split ranges
        ranges = applyPartialException(ranges, {
          start: exc.start_time.slice(0, 5),
          end: exc.end_time.slice(0, 5),
        })
      }
    }

    if (!ranges.length) continue

    // STEP 4: Generate possible slots
    const profAppts = (appointments || []).filter(a => a.professional_id === prof.id)

    for (const range of ranges) {
      const rangeStart = timeToMinutes(range.start)
      const rangeEnd = timeToMinutes(range.end)

      let cursor = rangeStart
      while (cursor + slotDuration <= rangeEnd) {
        const slotStartTime = minutesToTime(cursor)
        const slotEndTime = minutesToTime(cursor + slotDuration)

        // Convert to actual TIMESTAMPTZ
        const slotStartDate = fromZonedTime(
          parse(`${date} ${slotStartTime}`, 'yyyy-MM-dd HH:mm', new Date()),
          timezone
        )
        const slotEndDate = fromZonedTime(
          parse(`${date} ${slotEndTime}`, 'yyyy-MM-dd HH:mm', new Date()),
          timezone
        )

        // STEP 5: Check conflicts with existing appointments
        const hasConflict = profAppts.some(appt => {
          const apptStart = new Date(appt.start_time)
          const apptEndWithBuffer = addMinutes(new Date(appt.end_time), bufferMinutes)
          return isBefore(slotStartDate, apptEndWithBuffer) && isBefore(apptStart, slotEndDate)
        })

        if (!hasConflict) {
          // STEP 6: Business rules
          const slotStartInTz = toZonedTime(slotStartDate, timezone)
          const inFuture = isBefore(earliestStart, slotStartInTz)
          const withinRange = isBefore(slotStartInTz, latestDate)

          if (inFuture && withinRange) {
            allSlots.push({
              start: slotStartDate.toISOString(),
              end: slotEndDate.toISOString(),
              professional_id: prof.id,
              professional_name: prof.display_name,
            })
          }
        }

        cursor += granularity // Advance by granularity, not duration
      }
    }
  }

  // STEP 7: Sort by start_time
  allSlots.sort((a, b) => a.start.localeCompare(b.start))
  return allSlots
}

// ============================================================
// getAvailableSlotsForRange — Optimized multi-day (4 queries)
// ============================================================

export async function getAvailableSlotsForRange(
  supabase: SupabaseClient,
  params: GetAvailableSlotsForRangeParams
): Promise<Record<string, AvailableSlot[]>> {
  const { organizationId, serviceId, professionalId, startDate, endDate, timezone } = params

  // CONFIG (1 combined fetch)
  const [orgResult, serviceResult, configResult] = await Promise.all([
    supabase.from('organizations').select('id, slot_granularity_minutes').eq('id', organizationId).single(),
    supabase.from('services').select('id, duration_minutes, buffer_after_minutes').eq('id', serviceId).eq('organization_id', organizationId).single(),
    supabase.from('booking_page_config').select('min_advance_hours, max_advance_days').eq('organization_id', organizationId).single(),
  ])

  const org = orgResult.data
  const service = serviceResult.data
  const bookingConfig = configResult.data
  if (!org || !service) return {}

  const slotDuration = service.duration_minutes
  const bufferMinutes = service.buffer_after_minutes
  const granularity = org.slot_granularity_minutes || 15
  const minAdvanceHours = bookingConfig?.min_advance_hours ?? 2
  const maxAdvanceDays = bookingConfig?.max_advance_days ?? 30

  // QUERY 1: Eligible professionals
  const professionals = await getEligibleProfessionals(supabase, organizationId, serviceId, professionalId)
  if (!professionals.length) return {}
  const profIds = professionals.map(p => p.id)

  // QUERY 2: All schedules for these professionals (all days)
  const { data: allSchedules } = await supabase
    .from('professional_schedules')
    .select('professional_id, day_of_week, start_time, end_time')
    .in('professional_id', profIds)
    .eq('is_active', true)

  // QUERY 3: All exceptions in range
  const { data: allExceptions } = await supabase
    .from('professional_schedule_exceptions')
    .select('professional_id, exception_date, is_available, start_time, end_time')
    .in('professional_id', profIds)
    .gte('exception_date', startDate)
    .lte('exception_date', endDate)

  // QUERY 4: All appointments in range
  const rangeStartUTC = fromZonedTime(
    startOfDay(parse(startDate, 'yyyy-MM-dd', new Date())),
    timezone
  ).toISOString()
  const rangeEndUTC = fromZonedTime(
    endOfDay(parse(endDate, 'yyyy-MM-dd', new Date())),
    timezone
  ).toISOString()

  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('professional_id, start_time, end_time, status')
    .in('professional_id', profIds)
    .gte('start_time', rangeStartUTC)
    .lt('start_time', rangeEndUTC)
    .not('status', 'in', '("cancelled","expired")')

  // IN-MEMORY: Calculate per day
  const nowInTz = toZonedTime(new Date(), timezone)
  const earliestStart = addHours(nowInTz, minAdvanceHours)
  const latestDate = addDays(startOfDay(nowInTz), maxAdvanceDays)

  const result: Record<string, AvailableSlot[]> = {}
  let currentDate = parse(startDate, 'yyyy-MM-dd', new Date())
  const end = parse(endDate, 'yyyy-MM-dd', new Date())

  while (!isBefore(end, currentDate)) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dayOfWeek = getDay(currentDate)
    const daySlots: AvailableSlot[] = []

    for (const prof of professionals) {
      // Schedules for this day
      const profSchedules = (allSchedules || []).filter(
        s => s.professional_id === prof.id && s.day_of_week === dayOfWeek
      )
      if (!profSchedules.length) continue

      let ranges: TimeRange[] = profSchedules.map(s => ({
        start: s.start_time.slice(0, 5),
        end: s.end_time.slice(0, 5),
      }))

      // Exceptions
      const profExceptions = (allExceptions || []).filter(
        e => e.professional_id === prof.id && e.exception_date === dateStr
      )
      for (const exc of profExceptions) {
        if (!exc.is_available && !exc.start_time) { ranges = []; break }
        if (!exc.is_available && exc.start_time && exc.end_time) {
          ranges = applyPartialException(ranges, {
            start: exc.start_time.slice(0, 5),
            end: exc.end_time.slice(0, 5),
          })
        }
      }
      if (!ranges.length) continue

      // Appointments for this professional on this day
      const dayStartUTC = fromZonedTime(startOfDay(currentDate), timezone)
      const dayEndUTC = fromZonedTime(endOfDay(currentDate), timezone)
      const profAppts = (allAppointments || []).filter(a => {
        if (a.professional_id !== prof.id) return false
        const apptStart = new Date(a.start_time)
        return apptStart >= dayStartUTC && apptStart < dayEndUTC
      })

      // Generate slots
      for (const range of ranges) {
        const rangeStart = timeToMinutes(range.start)
        const rangeEnd = timeToMinutes(range.end)
        let cursor = rangeStart

        while (cursor + slotDuration <= rangeEnd) {
          const slotStartTime = minutesToTime(cursor)
          const slotEndTime = minutesToTime(cursor + slotDuration)

          const slotStartDate = fromZonedTime(
            parse(`${dateStr} ${slotStartTime}`, 'yyyy-MM-dd HH:mm', new Date()),
            timezone
          )
          const slotEndDate = fromZonedTime(
            parse(`${dateStr} ${slotEndTime}`, 'yyyy-MM-dd HH:mm', new Date()),
            timezone
          )

          const hasConflict = profAppts.some(appt => {
            const apptStart = new Date(appt.start_time)
            const apptEndWithBuffer = addMinutes(new Date(appt.end_time), bufferMinutes)
            return isBefore(slotStartDate, apptEndWithBuffer) && isBefore(apptStart, slotEndDate)
          })

          if (!hasConflict) {
            const slotStartInTz = toZonedTime(slotStartDate, timezone)
            if (isBefore(earliestStart, slotStartInTz) && isBefore(slotStartInTz, latestDate)) {
              daySlots.push({
                start: slotStartDate.toISOString(),
                end: slotEndDate.toISOString(),
                professional_id: prof.id,
                professional_name: prof.display_name,
              })
            }
          }

          cursor += granularity
        }
      }
    }

    daySlots.sort((a, b) => a.start.localeCompare(b.start))
    if (daySlots.length > 0) {
      result[dateStr] = daySlots
    }

    currentDate = addDays(currentDate, 1)
  }

  return result
}

// ============================================================
// Helpers
// ============================================================

async function getEligibleProfessionals(
  supabase: SupabaseClient,
  organizationId: string,
  serviceId: string,
  professionalId?: string
): Promise<Array<{ id: string; display_name: string }>> {
  if (professionalId) {
    // Validate specific professional offers this service
    const { data: prof } = await supabase
      .from('professionals')
      .select('id, display_name')
      .eq('id', professionalId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (!prof) return []

    const { data: link } = await supabase
      .from('professional_services')
      .select('id')
      .eq('professional_id', professionalId)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .single()

    return link ? [prof] : []
  }

  // All active professionals offering this service
  const { data: links } = await supabase
    .from('professional_services')
    .select('professional_id')
    .eq('organization_id', organizationId)
    .eq('service_id', serviceId)
    .eq('is_active', true)

  if (!links?.length) return []

  const { data: profs } = await supabase
    .from('professionals')
    .select('id, display_name')
    .in('id', links.map(l => l.professional_id))
    .eq('is_active', true)

  return profs || []
}

/**
 * Apply a partial exception (block) to schedule ranges.
 * Splits ranges around the blocked period.
 */
export function applyPartialException(
  ranges: TimeRange[],
  block: TimeRange
): TimeRange[] {
  const blockStart = timeToMinutes(block.start)
  const blockEnd = timeToMinutes(block.end)
  const result: TimeRange[] = []

  for (const range of ranges) {
    const rangeStart = timeToMinutes(range.start)
    const rangeEnd = timeToMinutes(range.end)

    // No overlap
    if (blockEnd <= rangeStart || blockStart >= rangeEnd) {
      result.push(range)
      continue
    }

    // Block covers entire range
    if (blockStart <= rangeStart && blockEnd >= rangeEnd) {
      continue
    }

    // Block is inside range — split into up to 2 parts
    if (blockStart > rangeStart) {
      result.push({ start: range.start, end: block.start })
    }
    if (blockEnd < rangeEnd) {
      result.push({ start: block.end, end: range.end })
    }
  }

  return result
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
