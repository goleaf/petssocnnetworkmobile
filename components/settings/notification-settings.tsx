"use client"

import { useState, useEffect } from "react"
import { NotificationCategories } from "./notification-categories"
import { NotificationChannels } from "./notification-channels"
import { EmailDigestSettings } from "./email-digest-settings"
import { QuietHoursSettings } from "./quiet-hours-settings"
import { NotificationPreviewSettings } from "./notification-preview-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle } from "lucide-react"
import type { NotificationSettings } from "@/lib/types/settings"
import { getNotificationSettingsAction, updateNotificationSettingsAction } from "@/lib/actions/account"

interface NotificationSettingsProps {
  userId: string
}

export function NotificationSettingsSection({ userId }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [userId])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const result = await getNotificationSettingsAction()
      if (result.success && result.settings) {
        setSettings(result.settings)
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updates: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      const updatedSettings = {
        ...settings,
        ...updates,
        channelPreferences: {
          ...settings.channelPreferences,
          ...(updates.channelPreferences || {})
        },
        quietHours: {
          ...settings.quietHours,
          ...(updates.quietHours || {})
        },
        previewSettings: {
          ...settings.previewSettings,
          ...(updates.previewSettings || {})
        }
      }

      const result = await updateNotificationSettingsAction(updatedSettings)
      
      if (result.success) {
        setSettings(updatedSettings)
        setMessage({ type: "success", text: "Notification settings updated successfully" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update settings" })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error) {
      console.error("Failed to update notification settings:", error)
      setMessage({ type: "error", text: "An error occurred while updating settings" })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading notification settings...
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load notification settings. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "success" ? "default" : "destructive"}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <NotificationCategories settings={settings} onUpdate={handleUpdate} />
      <NotificationChannels settings={settings} onUpdate={handleUpdate} />
      <EmailDigestSettings settings={settings} onUpdate={handleUpdate} />
      <QuietHoursSettings settings={settings} onUpdate={handleUpdate} />
      <NotificationPreviewSettings settings={settings} onUpdate={handleUpdate} />
    </div>
  )
}
