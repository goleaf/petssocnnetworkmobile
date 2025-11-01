"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-provider"
import { Bell, Smartphone, Mail, CalendarClock, ShieldCheck, type LucideIcon } from "lucide-react"
import {
  createDefaultNotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
} from "@/lib/notifications"
import { requestNotificationPermission, supportsPushNotifications } from "@/lib/push-notifications"
import type {
  NotificationChannel,
  NotificationChannelPreferences,
  NotificationCategory,
  NotificationFrequency,
  NotificationPriority,
  NotificationSettings,
  NotificationType,
  NotificationTypePreference,
} from "@/lib/types"

const CHANNEL_ORDER: NotificationChannel[] = ["in_app", "push", "email", "digest"]

const CHANNEL_META: Record<NotificationChannel, { label: string; description: string; icon: LucideIcon }> = {
  in_app: {
    label: "In-app",
    description: "Real-time alerts inside the app interface",
    icon: Bell,
  },
  push: {
    label: "Push",
    description: "Native push notifications on your device",
    icon: Smartphone,
  },
  email: {
    label: "Email",
    description: "Summary emails delivered to your inbox",
    icon: Mail,
  },
  digest: {
    label: "Digest",
    description: "Scheduled recap delivered at configured intervals",
    icon: CalendarClock,
  },
}

const CATEGORY_OPTIONS: Array<{ value: NotificationCategory; label: string }> = [
  { value: "social", label: "Social" },
  { value: "community", label: "Community" },
  { value: "system", label: "System" },
  { value: "promotions", label: "Promotions" },
  { value: "reminders", label: "Reminders" },
]

const PRIORITY_OPTIONS: Array<{ value: NotificationPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const FREQUENCY_OPTIONS: Array<{ value: NotificationFrequency; label: string }> = [
  { value: "real-time", label: "Real-time" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
]

const TYPE_LABELS: Record<NotificationType, { label: string; description: string }> = {
  follow: { label: "New followers", description: "Someone starts following your profile" },
  like: { label: "Post likes", description: "A user reacts to your content" },
  comment: { label: "Comments", description: "New comments on your posts" },
  mention: { label: "Mentions", description: "Someone mentions you" },
  post: { label: "New posts", description: "Accounts you follow share new posts" },
  friend_request: { label: "Friend requests", description: "Incoming pet friendship requests" },
  friend_request_accepted: { label: "Request accepted", description: "Your request was accepted" },
  friend_request_declined: { label: "Request declined", description: "Your request was declined" },
  friend_request_cancelled: { label: "Request cancelled", description: "A pending request was cancelled" },
  message: { label: "Direct messages", description: "New private messages" },
}

const DEFAULT_TEMPLATE = createDefaultNotificationSettings("")

function cloneSettings(settings: NotificationSettings): NotificationSettings {
  const channelEntries = Object.entries(settings.channelPreferences ?? {}) as [
    NotificationChannel,
    NotificationChannelPreferences,
  ][]
  const typeEntries = Object.entries(settings.typePreferences ?? {}) as [
    NotificationType,
    NotificationTypePreference,
  ][]

  return {
    ...settings,
    channelPreferences: channelEntries.reduce((acc, [channel, pref]) => {
      acc[channel] = {
        ...pref,
        categories: [...pref.categories],
      }
      return acc
    }, {} as NotificationSettings["channelPreferences"]),
    typePreferences: typeEntries.reduce((acc, [type, pref]) => {
      acc[type] = {
        ...pref,
        channels: [...pref.channels],
      }
      return acc
    }, {} as NotificationSettings["typePreferences"]),
    digestSchedule: {
      ...settings.digestSchedule,
      categories: [...settings.digestSchedule.categories],
    },
    mutedCategories: settings.mutedCategories ? [...settings.mutedCategories] : [],
  }
}

function ensureChannelPreference(
  settings: NotificationSettings,
  channel: NotificationChannel,
): NotificationChannelPreferences {
  const current = settings.channelPreferences?.[channel]
  if (current) {
    return {
      ...current,
      categories: [...current.categories],
    }
  }

  const fallback = DEFAULT_TEMPLATE.channelPreferences?.[channel]
  return fallback
    ? {
        ...fallback,
        categories: [...fallback.categories],
      }
    : {
        enabled: true,
        frequency: "real-time",
        categories: [],
        priorityThreshold: "normal",
      }
}

function ensureTypePreference(
  settings: NotificationSettings,
  type: NotificationType,
): NotificationTypePreference {
  const current = settings.typePreferences?.[type]
  if (current) {
    return {
      ...current,
      channels: [...current.channels],
    }
  }

  const fallback = DEFAULT_TEMPLATE.typePreferences?.[type]
  return fallback
    ? {
        ...fallback,
        channels: [...fallback.channels],
      }
    : {
        enabled: true,
        channels: ["in_app"],
      }
}

export default function NotificationSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSettings>(() => cloneSettings(DEFAULT_TEMPLATE))
  const [pushStatus, setPushStatus] = useState<NotificationPermission | "unsupported">("unsupported")
  const [isCheckingPushSupport, setIsCheckingPushSupport] = useState(true)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  useEffect(() => {
    if (!user) return
    const stored = getNotificationSettings(user.id)
    setSettings(cloneSettings({ ...stored, userId: user.id }))
  }, [user])

  useEffect(() => {
    if (supportsPushNotifications()) {
      setPushStatus(Notification.permission)
    } else {
      setPushStatus("unsupported")
    }
    setIsCheckingPushSupport(false)
  }, [])

  const updateChannelPreference = (
    channel: NotificationChannel,
    updater: (current: NotificationChannelPreferences) => NotificationChannelPreferences,
  ) => {
    setSettings((prev) => {
      const base = ensureChannelPreference(prev, channel)
      const nextPref = updater(base)
      return {
        ...prev,
        channelPreferences: {
          ...prev.channelPreferences,
          [channel]: {
            ...nextPref,
            categories: [...nextPref.categories],
          },
        },
      }
    })
  }

  const updateTypePreference = (
    type: NotificationType,
    updater: (current: NotificationTypePreference) => NotificationTypePreference,
  ) => {
    setSettings((prev) => {
      const base = ensureTypePreference(prev, type)
      const nextPref = updater(base)
      return {
        ...prev,
        typePreferences: {
          ...prev.typePreferences,
          [type]: {
            ...nextPref,
            channels: [...nextPref.channels],
          },
        },
      }
    })
  }

  const handleRequestPushPermission = async () => {
    if (isRequestingPermission || !supportsPushNotifications()) return
    setIsRequestingPermission(true)
    try {
      const permission = await requestNotificationPermission()
      setPushStatus(permission)
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handleSave = () => {
    if (!user) return
    saveNotificationSettings({ ...settings, userId: user.id })
    router.back()
  }

  const handleReset = () => {
    if (!user) return
    const defaults = createDefaultNotificationSettings(user.id)
    setSettings(cloneSettings(defaults))
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <BackButton onClick={() => router.back()} label="Back" />

      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Control delivery preferences, channels, and event coverage for your notifications.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Channel delivery</CardTitle>
          <CardDescription>Choose where notifications are sent and tailor frequency and categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CHANNEL_ORDER.map((channel) => {
            const meta = CHANNEL_META[channel]
            const preference = ensureChannelPreference(settings, channel)
            const disabled = channel === "push" && pushStatus === "unsupported"

            return (
              <div key={channel} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <meta.icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                  </div>
                  <Switch
                    disabled={disabled}
                    checked={preference.enabled && !disabled}
                    onCheckedChange={(checked) =>
                      updateChannelPreference(channel, (current) => ({ ...current, enabled: checked }))
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Frequency</Label>
                    <Select
                      value={preference.frequency}
                      onValueChange={(value) =>
                        updateChannelPreference(channel, (current) => ({
                          ...current,
                          frequency: value as NotificationFrequency,
                        }))
                      }
                      disabled={disabled || !preference.enabled}
                    >
                      <SelectTrigger size="sm">
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
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Priority threshold</Label>
                    <Select
                      value={preference.priorityThreshold}
                      onValueChange={(value) =>
                        updateChannelPreference(channel, (current) => ({
                          ...current,
                          priorityThreshold: value as NotificationPriority,
                        }))
                      }
                      disabled={disabled || !preference.enabled}
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map((category) => {
                      const isChecked = preference.categories.includes(category.value)
                      return (
                        <label
                          key={`${channel}-${category.value}`}
                          className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                        >
                          <Checkbox
                            disabled={disabled || !preference.enabled}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              updateChannelPreference(channel, (current) => {
                                const nextCategories = checked
                                  ? Array.from(new Set([...current.categories, category.value]))
                                  : current.categories.filter((item) => item !== category.value)
                                return {
                                  ...current,
                                  categories: nextCategories,
                                }
                              })
                              if (channel === "digest") {
                                setSettings((prev) => {
                                  const nextCategories = checked
                                    ? Array.from(
                                        new Set([
                                          ...prev.digestSchedule.categories,
                                          category.value,
                                        ]),
                                      )
                                    : prev.digestSchedule.categories.filter((item) => item !== category.value)
                                  return {
                                    ...prev,
                                    digestSchedule: {
                                      ...prev.digestSchedule,
                                      categories: nextCategories,
                                    },
                                  }
                                })
                              }
                            }}
                          />
                          {category.label}
                        </label>
                      )
                    })}
                  </div>
                </div>

                {channel === "push" && (
                  <div className="flex flex-col gap-2 rounded-md border border-dashed px-3 py-2 bg-muted/40">
                    <div className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Permission status:</span>
                      <Badge variant={pushStatus === "granted" ? "secondary" : "outline"}>
                        {isCheckingPushSupport
                          ? "Checking..."
                          : pushStatus === "unsupported"
                            ? "Not supported"
                            : pushStatus === "granted"
                              ? "Granted"
                              : pushStatus === "denied"
                                ? "Denied"
                                : "Prompt required"}
                      </Badge>
                    </div>
                    {supportsPushNotifications() && pushStatus !== "granted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRequestPushPermission}
                        disabled={isRequestingPermission}
                        className="self-start"
                      >
                        {isRequestingPermission ? "Requesting..." : "Request push permission"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Digest scheduling</CardTitle>
          <CardDescription>Configure periodic digest delivery and included content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable scheduled digest</p>
              <p className="text-xs text-muted-foreground">Receive a summary of activity at your preferred cadence.</p>
            </div>
            <Switch
              checked={settings.digestSchedule.enabled}
              onCheckedChange={(checked) => {
                setSettings((prev) => {
                  const digestPreference = ensureChannelPreference(prev, "digest")
                  return {
                    ...prev,
                    digestSchedule: {
                      ...prev.digestSchedule,
                      enabled: checked,
                    },
                    channelPreferences: {
                      ...prev.channelPreferences,
                      digest: {
                        ...digestPreference,
                        enabled: checked,
                      },
                    },
                  }
                })
              }}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Interval</Label>
              <Select
                value={settings.digestSchedule.interval}
                onValueChange={(value) =>
                  setSettings((prev) => {
                    const mappedFrequency = value === "weekly" ? "weekly" : "daily"
                    return {
                      ...prev,
                      digestSchedule: {
                        ...prev.digestSchedule,
                        interval: value as "daily" | "weekly",
                      },
                      channelPreferences: {
                        ...prev.channelPreferences,
                        digest: {
                          ...ensureChannelPreference(prev, "digest"),
                          frequency: mappedFrequency,
                        },
                      },
                    }
                  })
                }
                disabled={!settings.digestSchedule.enabled}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Delivery time</Label>
              <Input
                type="time"
                value={settings.digestSchedule.timeOfDay}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    digestSchedule: {
                      ...prev.digestSchedule,
                      timeOfDay: event.target.value,
                    },
                  }))
                }
                disabled={!settings.digestSchedule.enabled}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase text-muted-foreground">Content scope</Label>
              <div className="flex items-center gap-2 rounded border px-3 py-2 text-xs">
                <Checkbox
                  checked={settings.digestSchedule.includeUnreadOnly}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      digestSchedule: {
                        ...prev.digestSchedule,
                        includeUnreadOnly: Boolean(checked),
                      },
                    }))
                  }
                  disabled={!settings.digestSchedule.enabled}
                />
                <span>Only include unread items</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Digest categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((category) => {
                const isChecked = settings.digestSchedule.categories.includes(category.value)
                return (
                  <label
                    key={`digest-${category.value}`}
                    className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setSettings((prev) => {
                          const nextCategories = checked
                            ? Array.from(new Set([...prev.digestSchedule.categories, category.value]))
                            : prev.digestSchedule.categories.filter((item) => item !== category.value)
                          return {
                            ...prev,
                            digestSchedule: {
                              ...prev.digestSchedule,
                              categories: nextCategories,
                            },
                            channelPreferences: {
                              ...prev.channelPreferences,
                              digest: {
                                ...ensureChannelPreference(prev, "digest"),
                                categories: nextCategories,
                              },
                            },
                          }
                        })
                      }}
                      disabled={!settings.digestSchedule.enabled}
                    />
                    {category.label}
                  </label>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notification types</CardTitle>
          <CardDescription>Choose which channels deliver each notification category.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="text-left">
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Enable</th>
                {CHANNEL_ORDER.map((channel) => (
                  <th key={`head-${channel}`} className="py-2 pr-4 font-medium">
                    {CHANNEL_META[channel].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(Object.keys(TYPE_LABELS) as NotificationType[]).map((type) => {
                const info = TYPE_LABELS[type]
                const preference = ensureTypePreference(settings, type)
                return (
                  <tr key={type} className="align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{info.label}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <Switch
                        checked={preference.enabled}
                        onCheckedChange={(checked) =>
                          updateTypePreference(type, (current) => ({
                            ...current,
                            enabled: checked,
                          }))
                        }
                      />
                    </td>
                    {CHANNEL_ORDER.map((channel) => {
                      const channelEnabled = ensureChannelPreference(settings, channel).enabled
                      return (
                        <td key={`${type}-${channel}`} className="py-3 pr-4">
                          <Checkbox
                            checked={preference.channels.includes(channel)}
                            onCheckedChange={(checked) =>
                              updateTypePreference(type, (current) => {
                                const nextChannels = checked
                                  ? Array.from(new Set([...current.channels, channel]))
                                  : current.channels.filter((item) => item !== channel)
                                return {
                                  ...current,
                                  channels: nextChannels,
                                }
                              })
                            }
                            disabled={!preference.enabled || !channelEnabled}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to defaults
        </Button>
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  )
}
