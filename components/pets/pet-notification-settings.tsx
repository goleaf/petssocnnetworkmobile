"use client"

import { useEffect, useState } from "react"
import type { Pet, PetNotificationSettings } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { savePetNotificationSettings, getPetNotificationSettings } from "@/lib/pet-notifications"

interface PetNotificationSettingsProps {
  pet: Pet
}

export function PetNotificationSettingsCard({ pet }: PetNotificationSettingsProps) {
  const [settings, setSettings] = useState<PetNotificationSettings | null>(null)

  useEffect(() => {
    setSettings(getPetNotificationSettings(pet.id))
  }, [pet.id])

  const update = (patch: Partial<PetNotificationSettings>) => {
    setSettings((prev) => {
      const merged = { ...(prev ?? getPetNotificationSettings(pet.id)), ...patch }
      savePetNotificationSettings(pet.id, merged)
      return merged
    })
  }

  if (!settings) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Control reminders for {pet.name}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="health-reminders">Get health reminders for {pet.name}</Label>
            <p className="text-xs text-muted-foreground">Vaccinations, medications, appointments</p>
          </div>
          <Switch id="health-reminders" checked={settings.healthRemindersEnabled} onCheckedChange={(v) => update({ healthRemindersEnabled: Boolean(v) })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="vacc-reminders">Vaccination reminders</Label>
            <Switch id="vacc-reminders" checked={settings.vaccinationReminders} onCheckedChange={(v) => update({ vaccinationReminders: Boolean(v) })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="med-reminders">Medication reminders</Label>
            <Switch id="med-reminders" checked={settings.medicationReminders} onCheckedChange={(v) => update({ medicationReminders: Boolean(v) })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="appt-reminders">Appointment reminders</Label>
            <Switch id="appt-reminders" checked={settings.appointmentReminders} onCheckedChange={(v) => update({ appointmentReminders: Boolean(v) })} />
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="bday-reminders">Birthday reminders</Label>
            <Switch id="bday-reminders" checked={settings.birthdayReminders} onCheckedChange={(v) => update({ birthdayReminders: Boolean(v) })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="weight-reminders">Monthly weight tracking</Label>
            <Switch id="weight-reminders" checked={settings.weightTrackingReminders} onCheckedChange={(v) => update({ weightTrackingReminders: Boolean(v) })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="activity-reminders">Activity reminders</Label>
            <Switch id="activity-reminders" checked={settings.activityReminders} onCheckedChange={(v) => update({ activityReminders: Boolean(v) })} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

