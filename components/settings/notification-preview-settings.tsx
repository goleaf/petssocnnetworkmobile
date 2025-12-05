"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Lock, Info } from "lucide-react"
import type { NotificationSettings } from "@/lib/types/settings"

interface NotificationPreviewSettingsProps {
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>
}

export function NotificationPreviewSettings({ settings, onUpdate }: NotificationPreviewSettingsProps) {
  const [saving, setSaving] = useState<string | null>(null)
  
  const previewSettings = settings.previewSettings
  
  const handleShowPreviewsToggle = async (showPreviews: boolean) => {
    setSaving('previews')
    try {
      await onUpdate({
        previewSettings: {
          ...previewSettings,
          showPreviews
        }
      })
    } finally {
      setSaving(null)
    }
  }
  
  const handleShowOnLockScreenToggle = async (showOnLockScreen: boolean) => {
    setSaving('lockscreen')
    try {
      await onUpdate({
        previewSettings: {
          ...previewSettings,
          showOnLockScreen
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
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600" />
          </div>
          Notification Previews
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Control what information is shown in notification previews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="show-previews" className="text-sm font-medium">
                Show notification previews
              </Label>
              <p className="text-xs text-muted-foreground">
                Display message content and sender information in notifications
              </p>
            </div>
            <Switch
              id="show-previews"
              checked={previewSettings.showPreviews}
              onCheckedChange={handleShowPreviewsToggle}
              disabled={saving === 'previews'}
            />
          </div>
          
          {!previewSettings.showPreviews && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                When disabled, notifications will show generic text like "New message" instead of the actual content. 
                You'll need to open the app to see the full message.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="show-lockscreen" className="text-sm font-medium flex items-center gap-2">
                  Show on lock screen
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display notifications when your device is locked
                </p>
              </div>
              <Switch
                id="show-lockscreen"
                checked={previewSettings.showOnLockScreen}
                onCheckedChange={handleShowOnLockScreenToggle}
                disabled={saving === 'lockscreen' || !previewSettings.showPreviews}
              />
            </div>
            
            {!previewSettings.showOnLockScreen && previewSettings.showPreviews && (
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Notifications will still be delivered, but content will only be visible after unlocking your device.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <Alert variant="default" className="mt-4 border-amber-500/50 bg-amber-500/10">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-900 dark:text-amber-100">
            <strong>Privacy Note:</strong> Disabling previews helps protect sensitive information from being visible 
            to others who might see your notifications. This is especially important for messages, financial notifications, 
            or any content you want to keep private.
          </AlertDescription>
        </Alert>
        
        <div className="pt-2 space-y-2">
          <h4 className="text-sm font-medium">Preview Examples</h4>
          <div className="space-y-2 text-xs">
            <div className="border rounded-lg p-3 bg-muted/50">
              <div className="font-medium mb-1">With previews enabled:</div>
              <div className="text-muted-foreground">
                "John Doe: Hey, are you free for lunch tomorrow?"
              </div>
            </div>
            <div className="border rounded-lg p-3 bg-muted/50">
              <div className="font-medium mb-1">With previews disabled:</div>
              <div className="text-muted-foreground">
                "New message from John Doe"
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
