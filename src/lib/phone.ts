import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Normalize phone to E.164 format.
 * Returns null if invalid.
 */
export function normalizePhone(phone: string, defaultCountry: string = 'CO'): string | null {
  const parsed = parsePhoneNumberFromString(phone, defaultCountry as never)
  if (!parsed || !parsed.isValid()) return null
  return parsed.format('E.164')
}

/**
 * Format phone for display.
 */
export function formatPhone(phone: string, defaultCountry: string = 'CO'): string {
  const parsed = parsePhoneNumberFromString(phone, defaultCountry as never)
  if (!parsed) return phone
  return parsed.formatInternational()
}
