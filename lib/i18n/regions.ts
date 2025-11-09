"use client"

/**
 * Country/Region and Timezone helpers
 * - Provides country codes and localized names using Intl.DisplayNames
 * - Provides IANA timezones with computed GMT offsets
 */

export interface CountryOption {
  code: string
  name: string
}

export interface TimezoneOption {
  id: string
  label: string
  offsetMinutes: number
  offsetLabel: string
}

// ISO 3166-1 alpha-2 region codes
// Kept minimal in data (codes only); names are generated per-locale
const REGION_CODES: string[] = [
  "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU","AW","AX","AZ",
  "BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ",
  "CA","CC","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CU","CV","CW","CX","CY","CZ",
  "DE","DJ","DK","DM","DO","DZ",
  "EC","EE","EG","EH","ER","ES","ET",
  "FI","FJ","FK","FM","FO","FR",
  "GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY",
  "HK","HM","HN","HR","HT","HU",
  "ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT",
  "JE","JM","JO","JP",
  "KE","KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ",
  "LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY",
  "MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
  "NA","NC","NE","NF","NG","NI","NL","NO","NP","NR","NU","NZ",
  "OM",
  "PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PW","PY",
  "QA",
  "RE","RO","RS","RU","RW",
  "SA","SB","SC","SD","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ",
  "TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","UM","US","UY","UZ",
  "VA","VC","VE","VG","VI","VN","VU",
  "WF","WS",
  "YE","YT",
  "ZA","ZM","ZW"
]

export function getAllCountries(locale: string = 'en-US'): CountryOption[] {
  const dn = typeof Intl !== 'undefined' && (Intl as any).DisplayNames
    ? new Intl.DisplayNames([locale], { type: 'region' })
    : null
  const items = REGION_CODES.map((code) => ({
    code,
    name: dn ? (dn.of(code) || code) : code,
  }))
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function computeOffsetMinutes(tz: string, ref: Date = new Date()): { minutes: number; label: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }).formatToParts(ref)
    const zone = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0'
    const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(zone) || /UTC([+-])(\d{1,2})(?::?(\d{2}))?/.exec(zone)
    if (m) {
      const sign = m[1] === '-' ? -1 : 1
      const h = parseInt(m[2] || '0', 10)
      const mm = parseInt(m[3] || '0', 10)
      const minutes = sign * (h * 60 + mm)
      const label = `GMT${sign === -1 ? '-' : '+'}${String(h).padStart(1, '0')}${mm ? ':' + String(mm).padStart(2, '0') : ''}`
      return { minutes, label }
    }
  } catch {}
  return { minutes: 0, label: 'GMT+0' }
}

export function getAllTimezonesWithOffsets(locale: string = 'en-US'): TimezoneOption[] {
  const zones: string[] = (() => {
    const anyIntl: any = Intl as any
    if (anyIntl && typeof anyIntl.supportedValuesOf === 'function') {
      try {
        return anyIntl.supportedValuesOf('timeZone') as string[]
      } catch {
        // fallthrough
      }
    }
    return [
      'UTC','Etc/UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Sao_Paulo',
      'Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid','Europe/Rome','Europe/Moscow',
      'Africa/Johannesburg','Africa/Cairo','Asia/Dubai','Asia/Jerusalem','Asia/Kolkata','Asia/Bangkok','Asia/Shanghai','Asia/Tokyo','Asia/Seoul',
      'Australia/Sydney','Pacific/Auckland'
    ]
  })()

  const items: TimezoneOption[] = zones.map((id) => {
    const { minutes, label } = computeOffsetMinutes(id)
    return {
      id,
      label: `(${label}) ${id}`,
      offsetMinutes: minutes,
      offsetLabel: label,
    }
  })

  items.sort((a, b) => (a.offsetMinutes - b.offsetMinutes) || a.id.localeCompare(b.id))
  return items
}

export function guessUserCountry(): string | null {
  try {
    const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || ''
    const m = /-(\w{2})/.exec(navLang)
    return m ? m[1].toUpperCase() : null
  } catch {
    return null
  }
}

