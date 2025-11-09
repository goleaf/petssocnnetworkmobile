"use client"

import { useEffect, useState } from "react"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { useAuth } from "@/components/auth/auth-provider"
import type {
  MediaSettings,
  AutoPlayVideosPreference,
  CellularDataUsage,
  CaptionLanguagePreference,
} from "@/lib/types"
import { getMediaSettings, saveMediaSettings } from "@/lib/media-settings"
import {
  getDataRetentionSettings,
  saveDataRetentionSettings,
  type DataRetentionSettings,
} from "@/lib/data-retention"
import { runDataRetentionForUser } from "@/lib/data-retention"
import { clearCache } from "@/lib/offline-cache"

export default function DataStorageSettingsPage(): JSX.Element {
  const { user } = useAuth()
  const [settings, setSettings] = useState<MediaSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [retention, setRetention] = useState<DataRetentionSettings | null>(null)
  const [clearing, setClearing] = useState(false)
  const [runningCleanup, setRunningCleanup] = useState(false)
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setSettings(getMediaSettings(user.id))
      setRetention(getDataRetentionSettings(user.id))
    } else {
      setSettings(null)
      setRetention(null)
    }
  }, [user])

  const handleSave = () => {
    if (!user || !settings) return
    setSaving(true)
    try {
      saveMediaSettings({ ...settings, userId: user.id })
    } finally {
      setSaving(false)
    }
  }

  const updateRetention = <K extends keyof Omit<DataRetentionSettings, "userId" | "updatedAt" | "lastApplied">>(
    field: K,
    value: DataRetentionSettings[K],
  ) => {
    if (!user?.id || !retention) return
    const next: DataRetentionSettings = { ...retention, [field]: value }
    setRetention(next)
    saveDataRetentionSettings(next)
  }

  const handleClearCacheNow = async () => {
    setClearing(true)
    try {
      await clearCache()
    } finally {
      setClearing(false)
    }
  }

  const handleRunCleanupNow = async () => {
    if (!user?.id) return
    setRunningCleanup(true)
    setCleanupMsg(null)
    try {
      await runDataRetentionForUser(user.id)
      setCleanupMsg("Cleanup completed successfully")
    } catch (e: any) {
      setCleanupMsg(e?.message || "Failed to run cleanup")
    } finally {
      setRunningCleanup(false)
      setTimeout(() => setCleanupMsg(null), 4000)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHeader description="Manage cache, media storage, and data usage preferences." />

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Automatically delete old data</CardTitle>
          <CardDescription>
            Configure automatic cleanup to manage privacy and storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dm-retention">Delete direct messages older than</Label>
            <Select
              value={retention?.deleteDMsOlderThan ?? "never"}
              onValueChange={(v) => updateRetention("deleteDMsOlderThan", v as any)}
              disabled={!retention}
            >
              <SelectTrigger id="dm-retention" className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="drafts-retention">Delete drafts older than</Label>
            <Select
              value={retention?.deleteDraftsOlderThan ?? "never"}
              onValueChange={(v) => updateRetention("deleteDraftsOlderThan", v as any)}
              disabled={!retention}
            >
              <SelectTrigger id="drafts-retention" className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="search-history">Clear search history</Label>
            <Select
              value={retention?.clearSearchHistory ?? "manual"}
              onValueChange={(v) => updateRetention("clearSearchHistory", v as any)}
              disabled={!retention}
            >
              <SelectTrigger id="search-history" className="w-full">
                <SelectValue placeholder="Choose when to clear" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">After each session</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="manual">Manually only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-interval">Clear cache every</Label>
            <Select
              value={retention?.clearCacheEvery ?? "never"}
              onValueChange={(v) => updateRetention("clearCacheEvery", v as any)}
              disabled={!retention}
            >
              <SelectTrigger id="cache-interval" className="w-full">
                <SelectValue placeholder="Choose interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {cleanupMsg ? cleanupMsg : "Run your cleanup policies on demand."}
            </div>
            <Button variant="secondary" onClick={handleRunCleanupNow} disabled={runningCleanup || !user}>
              {runningCleanup ? "Running…" : "Run cleanup now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>Review and clear cached media to free up space.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Cached media: approx. 120 MB</div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearCacheNow} disabled={clearing}>
              {clearing ? "Clearing…" : "Clear cache"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Play & Media */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Play</CardTitle>
          <CardDescription>Control how videos and GIFs auto-play to manage data usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-md">
            <Label>Auto-play videos</Label>
            <Select
              value={(settings?.autoPlayVideos ?? "always") as AutoPlayVideosPreference}
              onValueChange={(val) =>
                setSettings((prev) => (prev ? { ...prev, autoPlayVideos: val as AutoPlayVideosPreference } : prev))
              }
              disabled={!settings}
            >
              <SelectTrigger data-testid="select-autoplay-videos">
                <SelectValue placeholder="Select auto-play behavior" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="wifi">Wi‑Fi Only</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Always may use more data on cellular.</p>
          </div>

          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>Auto-play GIFs</Label>
              <p className="text-xs text-muted-foreground">When off, GIFs show a static image with a play overlay.</p>
            </div>
            <Switch
              checked={settings?.autoPlayGifs ?? true}
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, autoPlayGifs: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} disabled={!settings || saving}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Quality Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Media Quality Filters</CardTitle>
          <CardDescription>Only show the highest quality photos and videos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>High Quality Only (Photos)</Label>
              <p className="text-xs text-muted-foreground">Hide low-resolution and poorly lit photos using on-device analysis.</p>
            </div>
            <Switch
              checked={settings?.highQualityOnlyImages ?? false}
              data-testid="toggle-high-quality-only-images"
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, highQualityOnlyImages: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>Videos Only HD</Label>
              <p className="text-xs text-muted-foreground">Show only high-definition (1080p+) videos to ensure clarity.</p>
            </div>
            <Switch
              checked={settings?.videosOnlyHD ?? false}
              data-testid="toggle-videos-only-hd"
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, videosOnlyHD: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} disabled={!settings || saving}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audio & Video Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle>Audio & Video</CardTitle>
          <CardDescription>Improve accessibility when watching videos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>Show captions</Label>
              <p className="text-xs text-muted-foreground">Automatically enable closed captions when available.</p>
            </div>
            <Switch
              checked={settings?.showCaptions ?? true}
              data-testid="toggle-show-captions"
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, showCaptions: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="grid gap-2 max-w-md">
            <Label htmlFor="caption-language">Caption language preference</Label>
            <Select
              value={(settings?.captionLanguage ?? "auto") as CaptionLanguagePreference}
              onValueChange={(val) =>
                setSettings((prev) => (prev ? { ...prev, captionLanguage: val as CaptionLanguagePreference } : prev))
              }
              disabled={!settings}
            >
              <SelectTrigger id="caption-language" data-testid="select-caption-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>Audio descriptions</Label>
              <p className="text-xs text-muted-foreground">Enable descriptive audio tracks when available.</p>
            </div>
            <Switch
              checked={settings?.audioDescriptions ?? false}
              data-testid="toggle-audio-descriptions"
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, audioDescriptions: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>Flash warnings</Label>
              <p className="text-xs text-muted-foreground">Warn before content with flashing lights.</p>
            </div>
            <Switch
              checked={settings?.flashWarnings ?? true}
              data-testid="toggle-flash-warnings"
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, flashWarnings: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="flex justify-end">
            <Button data-testid="btn-save-media-settings" onClick={handleSave} loading={saving} disabled={!settings || saving}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploads quality */}
      <Card>
        <CardHeader>
          <CardTitle>Uploads</CardTitle>
          <CardDescription>Choose upload quality to balance clarity and bandwidth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-md">
            <div className="space-y-1">
              <Label>High quality uploads</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, photos and videos upload at full resolution. When disabled, they may be compressed to save
                bandwidth and storage.
              </p>
            </div>
            <Switch
              checked={settings?.highQualityUploads ?? true}
              onCheckedChange={(val) => setSettings((prev) => (prev ? { ...prev, highQualityUploads: val } : prev))}
              disabled={!settings}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} disabled={!settings || saving}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cellular data usage */}
      <Card>
        <CardHeader>
          <CardTitle>Cellular data usage</CardTitle>
          <CardDescription>Adjust how the app uses data on cellular connections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup.Root
            className="grid gap-3 max-w-xl"
            value={(settings?.cellularDataUsage ?? "reduced") as CellularDataUsage}
            onValueChange={(val) =>
              setSettings((prev) => (prev ? { ...prev, cellularDataUsage: val as CellularDataUsage } : prev))
            }
            disabled={!settings}
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <RadioGroup.Item value="unrestricted" className="mt-1 h-4 w-4 rounded-full border" />
              <div>
                <div className="font-medium">Unrestricted</div>
                <div className="text-xs text-muted-foreground">Full quality media and preloading on cellular.</div>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <RadioGroup.Item value="reduced" className="mt-1 h-4 w-4 rounded-full border" />
              <div>
                <div className="font-medium">Reduced</div>
                <div className="text-xs text-muted-foreground">Lower quality images/videos to conserve data.</div>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
              <RadioGroup.Item value="minimal" className="mt-1 h-4 w-4 rounded-full border" />
              <div>
                <div className="font-medium">Minimal</div>
                <div className="text-xs text-muted-foreground">Text only; media does not load on cellular.</div>
              </div>
            </label>
          </RadioGroup.Root>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} disabled={!settings || saving}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
