"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Moon, Info } from "lucide-react"
import type { NotificationSettings, QuietHoursSettings } from "@/lib/types/settings"

interface QuietHoursSettingsProps {
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  const ampm = i < 12 ? 'AM' : 'PM'
  const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i
  return {
    value: `${hour}:00`,
    label: `${displayHour}:00 ${ampm}`
  }
})

const DAYS = [
  { value: 0, label: "Sun", fullLabel: "Sunday" },
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" }
]

export function QuietHoursSettings({ settings, onUpdate }: QuietHoursSettingsProps) {
  const [saving, setSaving] = useState(false)
  
  const quietHours = settings.quietHours
  
  const handleToggle = async (enabled: boolean) => {
    setSaving(true)
    try {
      await onUpdate({
        quietHours: {
          ...quietHours,
          enabled
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleStartTimeChange = async (startTime: string) => {
    setSaving(true)
    try {
      await onUpdate({
        quietHours: {
          ...quietHours,
          startTime
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleEndTimeChange = async (endTime: string) => {
    setSaving(true)
    try {
      await onUpdate({
        quietHours: {
          ...quietHours,
          endTime
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleDayToggle = async (day: number, checked: boolean) => {
    setSaving(true)
    try {
      const newDays = checked
        ? [...quietHours.days, day].sort((a, b) => a - b)
        : quietHours.days.filter(d => d !== day)
      
      await onUpdate({
        quietHours: {
          ...quietHours,
          days: newDays
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleAllowCriticalToggle = async (allowCritical: boolean) => {
    setSaving(true)
    try {
      await onUpdate({
        quietHours: {
          ...quietHours,
          allowCritical
        }
      })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
          </div>
          Quiet Hours
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Silence push notifications during specific times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enable Quiet Hours</Label>
            <p className="text-xs text-muted-foreground">
              Suppress push notifications during selected times
            </p>
          </div>
          <Switch
            checked={quietHours.enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>
        
        {quietHours.enabled && (
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm">
                  Start Time
                </Label>
                <Select
                  value={quietHours.startTime}
                  onValueChange={handleStartTimeChange}
                  disabled={saving}
                >
                  <SelectTrigger id="start-time" className="h-9">
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm">
                  End Time
                </Label>
                <Select
                  value={quietHours.endTime}
                  onValueChange={handleEndTimeChange}
                  disabled={saving}
                >
                  <SelectTrigger id="end-time" className="h-9">
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
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Active Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isChecked = quietHours.days.includes(day.value)
                  return (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                        disabled={saving}
                      />
                      <Label
                        htmlFor={`day-${day.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {day.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Select which days quiet hours should be active
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="allow-critical"
                checked={quietHours.allowCritical}
                onCheckedChange={handleAllowCriticalToggle}
                disabled={saving}
              />
              <Label
                htmlFor="allow-critical"
                className="text-sm font-normal cursor-pointer"
              >
                Allow critical notifications during quiet hours
              </Label>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>How it works:</strong> During quiet hours, push notifications will be silenced. 
                In-app notifications will still appear, and email notifications will be queued for delivery 
                after quiet hours end. {quietHours.allowCritical && "Critical notifications like security alerts will still be delivered immediately."}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
