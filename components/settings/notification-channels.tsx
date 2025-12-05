"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bell, 
  Smartphone, 
  Mail, 
  LayoutGrid,
  AlertTriangle
} from "lucide-react"
import type { NotificationSettings, NotificationChannel, NotificationFrequency } from "@/lib/types/settings"

interface NotificationChannelsProps {
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>
}

const CHANNEL_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}> = {
  in_app: {
    label: "In-App",
    icon: Bell,
    description: "Notifications while using the app",
    color: "blue"
  },
  push: {
    label: "Push",
    icon: Smartphone,
    description: "Native device notifications",
    color: "purple"
  },
  email: {
    label: "Email",
    icon: Mail,
    description: "Email notifications",
    color: "green"
  },
  sms: {
    label: "SMS",
    icon: Smartphone,
    description: "Text message notifications",
    color: "orange"
  }
}

const FREQUENCY_OPTIONS: { value: NotificationFrequency; label: string }[] = [
  { value: "real-time", label: "Instant" },
  { value: "hourly", label: "Hourly Digest" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Digest" }
]

export function NotificationChannels({ settings, onUpdate }: NotificationChannelsProps) {
  const [saving, setSaving] = useState<NotificationChannel | null>(null)
  
  const handleChannelToggle = async (channel: NotificationChannel, enabled: boolean) => {
    setSaving(channel)
    try {
      await onUpdate({
        channelPreferences: {
          ...settings.channelPreferences,
          [channel]: {
            ...settings.channelPreferences[channel],
            enabled
          }
        }
      })
    } finally {
      setSaving(null)
    }
  }
  
  const handleFrequencyChange = async (channel: NotificationChannel, frequency: NotificationFrequency) => {
    setSaving(channel)
    try {
      await onUpdate({
        channelPreferences: {
          ...settings.channelPreferences,
          [channel]: {
            ...settings.channelPreferences[channel],
            frequency
          }
        }
      })
    } finally {
      setSaving(null)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
          </div>
          Notification Channels
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Choose how you want to receive notifications for each channel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.keys(CHANNEL_CONFIG) as Array<keyof typeof CHANNEL_CONFIG>).map((channel) => {
          const config = CHANNEL_CONFIG[channel]
          const channelKey = channel as NotificationChannel
          const Icon = config.icon
          const pref = settings.channelPreferences[channelKey]
          const isSaving = saving === channelKey
          const showSmsWarning = channelKey === 'sms' && pref.enabled
          
          return (
            <div key={channelKey} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-8 w-8 rounded-lg bg-${config.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 text-${config.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={(checked) => handleChannelToggle(channelKey, checked)}
                  disabled={isSaving}
                />
              </div>
              
              {pref.enabled && (
                <div className="pt-3 border-t space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${channelKey}-frequency`} className="text-xs">
                      Delivery Frequency
                    </Label>
                    <Select
                      value={pref.frequency}
                      onValueChange={(value) => handleFrequencyChange(channelKey, value as NotificationFrequency)}
                      disabled={isSaving}
                    >
                      <SelectTrigger id={`${channelKey}-frequency`} className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {channelKey === 'email' && pref.frequency !== 'real-time' && (
                      <p className="text-xs text-muted-foreground">
                        Notifications will be grouped and sent {pref.frequency === 'hourly' ? 'every hour' : pref.frequency === 'daily' ? 'once per day' : 'once per week'}
                      </p>
                    )}
                  </div>
                  
                  {showSmsWarning && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        SMS notifications may incur carrier charges. Standard messaging rates apply.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )
        })}
        
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Security alerts and critical notifications are always sent immediately via email, regardless of your digest settings.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
