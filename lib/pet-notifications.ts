import type { Pet, PetNotificationSettings } from "@/lib/types"
import { getPetsByOwnerId, getPetById, updatePet } from "@/lib/storage"
import { createNotification } from "@/lib/notifications"

const SETTINGS_PREFIX = "pet_social_pet_notifications_"
const REMINDER_STATE_KEY = "pet_social_pet_reminder_state"

type ReminderState = {
  // Track keys we've sent recently to avoid duplicates
  sentKeys: Record<string, string> // key -> iso timestamp
}

function nowIso() {
  return new Date().toISOString()
}

function getReminderState(): ReminderState {
  if (typeof window === "undefined") return { sentKeys: {} }
  try {
    const raw = localStorage.getItem(REMINDER_STATE_KEY)
    if (!raw) return { sentKeys: {} }
    const parsed = JSON.parse(raw) as ReminderState
    return { sentKeys: parsed.sentKeys ?? {} }
  } catch {
    return { sentKeys: {} }
  }
}

function setReminderState(state: ReminderState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(state))
  } catch {}
}

export function getDefaultPetNotificationSettings(): PetNotificationSettings {
  return {
    healthRemindersEnabled: true,
    vaccinationReminders: true,
    medicationReminders: true,
    appointmentReminders: true,
    birthdayReminders: true,
    weightTrackingReminders: true,
    activityReminders: true,
    updatedAt: nowIso(),
  }
}

export function getPetNotificationSettings(petId: string): PetNotificationSettings {
  if (typeof window === "undefined") return getDefaultPetNotificationSettings()
  try {
    const raw = localStorage.getItem(`${SETTINGS_PREFIX}${petId}`)
    if (!raw) return getDefaultPetNotificationSettings()
    const parsed = JSON.parse(raw) as PetNotificationSettings
    return {
      ...getDefaultPetNotificationSettings(),
      ...parsed,
    }
  } catch {
    return getDefaultPetNotificationSettings()
  }
}

export function savePetNotificationSettings(petId: string, settings: PetNotificationSettings) {
  if (typeof window === "undefined") return
  const normalized: PetNotificationSettings = {
    ...getDefaultPetNotificationSettings(),
    ...settings,
    updatedAt: nowIso(),
  }
  try {
    localStorage.setItem(`${SETTINGS_PREFIX}${petId}`, JSON.stringify(normalized))
  } catch {}
}

function toKey(parts: Array<string | number>): string {
  return parts.join(":")
}

function markSent(key: string) {
  const state = getReminderState()
  state.sentKeys[key] = nowIso()
  setReminderState(state)
}

function wasSentRecently(key: string): boolean {
  const state = getReminderState()
  const iso = state.sentKeys[key]
  if (!iso) return false
  // treat as sent if within 1 day to reduce spam, except for specific countdown steps
  const ts = new Date(iso).getTime()
  return Date.now() - ts < 24 * 60 * 60 * 1000
}

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso)
  const now = new Date()
  // Normalize to midnight
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
}

function nextBirthdayIso(birthdayIso: string): string | null {
  try {
    const b = new Date(birthdayIso)
    const now = new Date()
    const next = new Date(now.getFullYear(), b.getMonth(), b.getDate())
    if (next.getTime() < now.getTime()) {
      next.setFullYear(now.getFullYear() + 1)
    }
    return next.toISOString()
  } catch {
    return null
  }
}

export function runPetHealthReminderSweep(userId: string) {
  if (typeof window === "undefined") return
  const pets = getPetsByOwnerId(userId)
  const now = Date.now()

  for (const pet of pets) {
    const prefs = getPetNotificationSettings(pet.id)
    const petName = pet.name
    const avatar = pet.avatar

    // Vaccination reminders
    if (prefs.healthRemindersEnabled && prefs.vaccinationReminders && pet.vaccinations) {
      for (const v of pet.vaccinations) {
        if (!v.nextDue) continue
        const d = daysUntil(v.nextDue)
        const atSteps = [30, 14, 7, 1, 0]
        if (atSteps.includes(d)) {
          const key = toKey(["vacc", pet.id, v.name, v.nextDue, d])
          if (!wasSentRecently(key)) {
            createNotification({
              userId,
              type: "watch_update",
              targetId: pet.id,
              targetType: "pet",
              message: `⚠️ ${petName}'s ${v.name} vaccination is due in ${d} day${d===1?"":"s"}.`,
              priority: d <= 7 ? "high" : "normal",
              category: "reminders",
              channels: ["in_app", "push", d <= 7 ? "email" : "in_app"],
              metadata: { petId: pet.id, petName, petAvatar: avatar, dueDate: v.nextDue, vaccine: v.name },
            })
            markSent(key)
          }
        }
      }
    }

    // Medication daily reminder
    if (prefs.healthRemindersEnabled && prefs.medicationReminders && pet.medications) {
      const active = pet.medications.filter((m) => {
        const start = new Date(m.startDate).getTime()
        const end = m.endDate ? new Date(m.endDate).getTime() : Number.POSITIVE_INFINITY
        return start <= now && now <= end
      })
      if (active.length > 0) {
        for (const m of active) {
          const key = toKey(["med", pet.id, m.id, new Date().toDateString()])
          if (!wasSentRecently(key)) {
            createNotification({
              userId,
              type: "watch_update",
              targetId: pet.id,
              targetType: "pet",
              message: `⏰ Time to give ${petName} their ${m.name}.`,
              priority: "high",
              category: "reminders",
              channels: ["in_app", "push"],
              metadata: { petId: pet.id, petName, petAvatar: avatar, medicationId: m.id, medication: m.name },
              actions: [
                { id: 'med_mark_given', label: 'Mark as Given', action: 'custom', metadata: { petId: pet.id, medicationId: m.id } },
              ],
            })
            markSent(key)
          }
        }
      }
    }

    // Birthday reminders: 7 days before and day of
    if (prefs.birthdayReminders && pet.birthday) {
      const nextB = nextBirthdayIso(pet.birthday)
      if (nextB) {
        const d = daysUntil(nextB)
        if (d === 7 || d === 0) {
          const key = toKey(["bday", pet.id, nextB, d])
          if (!wasSentRecently(key)) {
            createNotification({
              userId,
              type: "watch_update",
              targetId: pet.id,
              targetType: "pet",
              message: d === 0 ? `🎉 It's ${petName}'s birthday today!` : `🎂 ${petName}'s birthday is in 7 days.`,
              priority: "normal",
              category: "reminders",
              channels: ["in_app", "push"],
              metadata: { petId: pet.id, petName, petAvatar: avatar, birthday: nextB },
            })
            markSent(key)
          }
        }
      }
    }

    // Weight tracking monthly prompt (1st of the month)
    if (prefs.weightTrackingReminders) {
      const today = new Date()
      if (today.getDate() === 1) {
        const key = toKey(["weight", pet.id, today.getFullYear(), today.getMonth() + 1])
        if (!wasSentRecently(key)) {
          createNotification({
            userId,
            type: "watch_update",
            targetId: pet.id,
            targetType: "pet",
            message: `⚖️ Log ${petName}'s weight for this month to track progress.`,
            priority: "normal",
            category: "reminders",
            channels: ["in_app", "push"],
            metadata: { petId: pet.id, petName, petAvatar: avatar },
          })
          markSent(key)
        }
      }
    }

    // Activity nudge once a week (Monday)
    if (prefs.activityReminders) {
      const today = new Date()
      const isMonday = today.getDay() === 1
      if (isMonday) {
        const key = toKey(["activity", pet.id, today.getFullYear(), today.getMonth() + 1, today.getDate()])
        if (!wasSentRecently(key)) {
          createNotification({
            userId,
            type: "watch_update",
            targetId: pet.id,
            targetType: "pet",
            message: `📸 Share an update about ${petName} this week!`,
            priority: "low",
            category: "reminders",
            channels: ["in_app"],
            metadata: { petId: pet.id, petName, petAvatar: avatar },
          })
          markSent(key)
        }
      }
    }
  }
}
