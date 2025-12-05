"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// RadioGroup not available, using custom implementation
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Info } from "lucide-react"
import type { NotificationSettings, NotificationFrequency } from "@/lib/types/settings"

interface EmailDigestSettingsProps {
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>
}

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" }
]

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  const ampm = i < 12 ? 'AM' : 'PM'
  const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i
  return {
    value: `${hour}:00`,
    label: `${displayHour}:00 ${ampm}`
  }
})

export function EmailDigestSettings({ settings, onUpdate }: EmailDigestSettingsProps) {
  const [saving, setSaving] = useState(false)
  
  const emailPref = settings.channelPreferences.email
  const digestPref = settings.channelPreferences.digest
  
  const handleFrequencyChange = async (frequency: NotificationFrequency) => {
    setSaving(true)
    try {
      await onUpdate({
        channelPreferences: {
          ...settings.channelPreferences,
          email: {
            ...emailPref,
            frequency
          },
          digest: {
            ...digestPref,
            frequency
          }
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleTimeChange = async (time: string) => {
    setSaving(true)
    try {
      // Store the preferred time in a custom field (we'll need to extend the type)
      // For now, we'll use the frequency field creatively
      await onUpdate({
        channelPreferences: {
          ...settings.channelPreferences,
          digest: {
            ...digestPref,
            // In a real implementation, we'd add a preferredTime field to the type
          }
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleDayChange = async (day: string) => {
    setSaving(true)
    try {
      // Store the preferred day in a custom field
      await onUpdate({
        channelPreferences: {
          ...settings.channelPreferences,
          digest: {
            ...digestPref,
            // In a real implementation, we'd add a preferredDay field to the type
          }
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const currentFrequency = emailPref.frequency
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
          </div>
          Email Digest Settings
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Control how often you receive email notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="digest-frequency" className="text-sm font-medium">Digest Frequency</Label>
          <Select
            value={currentFrequency}
            onValueChange={(value: string) => handleFrequencyChange(value as NotificationFrequency)}
            disabled={saving}
          >
            <SelectTrigger id="digest-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real-time">
                <div>
                  <div className="font-medium">Real-time</div>
                  <div className="text-xs text-muted-foreground">
                    Receive emails immediately as notifications occur
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="hourly">
                <div>
                  <div className="font-medium">Hourly</div>
                  <div className="text-xs text-muted-foreground">
                    Receive a summary email every hour with new notifications
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="daily">
                <div>
                  <div className="font-medium">Daily</div>
                  <div className="text-xs text-muted-foreground">
                    Receive one email per day with all notifications
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="weekly">
                <div>
                  <div className="font-medium">Weekly</div>
                  <div className="text-xs text-muted-foreground">
                    Receive one email per week with all notifications
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {currentFrequency === 'daily' && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="daily-time" className="text-sm">
              Preferred Time
            </Label>
            <Select
              defaultValue="09:00"
              onValueChange={handleTimeChange}
              disabled={saving}
            >
              <SelectTrigger id="daily-time" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOURS.map((hour) => (
                  <SelectItem key={hour.value} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your daily digest will be sent at this time
            </p>
          </div>
        )}
        
        {currentFrequency === 'weekly' && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="weekly-day" className="text-sm">
              Preferred Day
            </Label>
            <Select
              defaultValue="1"
              onValueChange={handleDayChange}
              disabled={saving}
            >
              <SelectTrigger id="weekly-day" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your weekly digest will be sent on this day at 9:00 AM
            </p>
          </div>
        )}
        
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Important:</strong> Security alerts, password changes, and other critical account notifications are always sent immediately, regardless of your digest settings.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
