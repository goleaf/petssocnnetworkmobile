import type { GroupEvent } from "@/lib/types"

/**
 * Convert a date string to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatDateToICS(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escape special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
}

/**
 * Generate a unique ID for the event
 */
function generateEventUID(eventId: string, groupId: string): string {
  const domain = typeof window !== "undefined" ? window.location.hostname : "petssocnnetwork.local"
  return `${eventId}@${groupId}.${domain}`
}

/**
 * Generate ICS file content for a single event
 */
export function generateICSFile(
  event: GroupEvent,
  groupSlug: string,
  groupName?: string
): string {
  const uid = generateEventUID(event.id, event.groupId)
  const dtstart = formatDateToICS(event.startDate)
  const dtend = event.endDate
    ? formatDateToICS(event.endDate)
    : formatDateToICS(
        new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString()
      ) // Default 1 hour duration

  const summary = escapeICSText(event.title)
  const description = escapeICSText(
    `${event.description}\n\n${groupName ? `Group: ${groupName}\n` : ""}${
      event.rsvpRequired ? "RSVP Required\n" : ""
    }${event.maxAttendees ? `Max Attendees: ${event.maxAttendees}\n` : ""}${
      typeof window !== "undefined"
        ? `View Event: ${window.location.origin}/groups/${groupSlug}/events/${event.id}`
        : ""
    }`
  )

  const location = event.location ? escapeICSText(event.location) : ""
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/groups/${groupSlug}/events/${event.id}`
      : ""

  // Get current timestamp for DTSTAMP
  const dtstamp = formatDateToICS(new Date().toISOString())

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pet Social Network//Group Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    ...(location ? [`LOCATION:${location}`] : []),
    ...(url ? [`URL:${url}`] : []),
    `STATUS:${event.isCancelled ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  return lines.join("\r\n")
}

/**
 * Generate ICS file content for multiple events
 */
export function generateICSFileForMultipleEvents(
  events: GroupEvent[],
  groupSlug: string,
  groupName?: string
): string {
  const dtstamp = formatDateToICS(new Date().toISOString())

  const vEvents = events.map((event) => {
    const uid = generateEventUID(event.id, event.groupId)
    const dtstart = formatDateToICS(event.startDate)
    const dtend = event.endDate
      ? formatDateToICS(event.endDate)
      : formatDateToICS(
          new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString()
        )

    const summary = escapeICSText(event.title)
    const description = escapeICSText(
      `${event.description}\n\n${groupName ? `Group: ${groupName}\n` : ""}${
        event.rsvpRequired ? "RSVP Required\n" : ""
      }${event.maxAttendees ? `Max Attendees: ${event.maxAttendees}\n` : ""}${
        typeof window !== "undefined"
          ? `View Event: ${window.location.origin}/groups/${groupSlug}/events/${event.id}`
          : ""
      }`
    )

    const location = event.location ? escapeICSText(event.location) : ""
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/groups/${groupSlug}/events/${event.id}`
        : ""

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      ...(location ? [`LOCATION:${location}`] : []),
      ...(url ? [`URL:${url}`] : []),
      `STATUS:${event.isCancelled ? "CANCELLED" : "CONFIRMED"}`,
      "END:VEVENT",
    ].join("\r\n")
  })

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pet Social Network//Group Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vEvents,
    "END:VCALENDAR",
  ]

  return lines.join("\r\n")
}

/**
 * Download ICS file
 */
export function downloadICSFile(icsContent: string, filename: string): void {
  if (typeof window === "undefined") return

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

