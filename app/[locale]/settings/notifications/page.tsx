"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { useAuth } from "@/components/auth/auth-provider"
import { Bell, Smartphone, Mail, CalendarClock, ShieldCheck, MessageSquare, type LucideIcon } from "lucide-react"
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

const CHANNEL_ORDER: NotificationChannel[] = ["in_app", "push", "email", "digest", "sms"]

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
  sms: {
    label: "SMS",
    description: "Text alerts (charges may apply)",
    icon: MessageSquare,
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

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

  const NON_CRITICAL_TYPES: NotificationType[] = [
    "follow",
    "like",
    "comment",
    "mention",
    "post",
    "friend_request",
    "friend_request_accepted",
    "friend_request_declined",
    "friend_request_cancelled",
    "message",
  ]

  const currentEmailMode: "realtime" | "hourly" | "daily" | "weekly" = (() => {
    if (!settings.digestSchedule.enabled) return "realtime"
    if (settings.digestSchedule.interval === "hourly") return "hourly"
    if (settings.digestSchedule.interval === "weekly") return "weekly"
    return "daily"
  })()

  const setEmailMode = (mode: "realtime" | "hourly" | "daily" | "weekly") => {
    setSettings((prev) => {
      let next = { ...prev }
      if (mode === "realtime") {
        next = {
          ...next,
          digestSchedule: { ...next.digestSchedule, enabled: false },
        }
        NON_CRITICAL_TYPES.forEach((t) => {
          const base = ensureTypePreference(next, t)
          next = {
            ...next,
            typePreferences: {
              ...next.typePreferences,
              [t]: {
                ...base,
                enabled: base.enabled,
                channels: Array.from(new Set([...(base.channels || []).filter((c) => c !== "digest"), "email"])) ,
              },
            },
          }
        })
      } else {
        next = {
          ...next,
          digestSchedule: {
            ...next.digestSchedule,
            enabled: true,
            interval: mode,
            timeOfDay: next.digestSchedule.timeOfDay || "08:00",
          },
        }
        NON_CRITICAL_TYPES.forEach((t) => {
          const base = ensureTypePreference(next, t)
          next = {
            ...next,
            typePreferences: {
              ...next.typePreferences,
              [t]: {
                ...base,
                enabled: base.enabled,
                channels: Array.from(new Set([...(base.channels || []).filter((c) => c !== "email"), "digest"])) ,
              },
            },
          }
        })
      }
      return next
    })
  }

  const CATEGORY_DEFS: Array<{
    key:
      | "interactions"
      | "social"
      | "messages"
      | "posts"
      | "pets"
      | "events"
      | "marketplace"
      | "community"
      | "system"
    label: string
    description: string
    types: NotificationType[]
    placeholders?: Array<{ label: string }>
  }> = [
    {
      key: "interactions",
      label: "Interactions",
      description: "Likes, comments, and shares",
      types: ["like", "comment"],
      placeholders: [{ label: "Shares" }],
    },
    {
      key: "social",
      label: "Social",
      description: "Followers, requests, mentions, tags",
      types: [
        "follow",
        "friend_request",
        "friend_request_accepted",
        "friend_request_declined",
        "friend_request_cancelled",
        "mention",
      ],
      placeholders: [{ label: "Tags" }],
    },
    {
      key: "messages",
      label: "Messages",
      description: "New DMs and conversations",
      types: ["message"],
      placeholders: [{ label: "Group messages" }],
    },
    {
      key: "posts",
      label: "Posts",
      description: "New posts and tags in posts",
      types: ["post"],
      placeholders: [{ label: "Posts you are tagged in" }],
    },
    { key: "pets", label: "Pets", description: "Reminders and pet care", types: [], placeholders: [
      { label: "Vet appointments" }, { label: "Medication" }
    ] },
    { key: "events", label: "Events", description: "Invitations and reminders", types: [], placeholders: [
      { label: "Event invitations" }, { label: "Event reminders" }, { label: "Event updates" }
    ] },
    { key: "marketplace", label: "Marketplace", description: "Orders and payments", types: [], placeholders: [
      { label: "Order updates" }, { label: "Payment confirmations" }, { label: "Messages from sellers" }
    ] },
    { key: "community", label: "Community", description: "Groups and forums", types: [], placeholders: [
      { label: "Group posts" }, { label: "Forum replies" }, { label: "Group invitations" }
    ] },
    { key: "system", label: "System", description: "Security and updates", types: [], placeholders: [
      { label: "Account security" }, { label: "Policy updates" }, { label: "New features" }
    ] },
  ]

  const isCategoryEnabled = (def: (typeof CATEGORY_DEFS)[number]) => {
    if (def.types.length === 0) return true
    return def.types.some((t) => ensureTypePreference(settings, t).enabled)
  }

  const toggleCategory = (def: (typeof CATEGORY_DEFS)[number], enabled: boolean) => {
    if (def.types.length === 0) return
    def.types.forEach((t) => {
      setSettings((prev) => {
        const base = ensureTypePreference(prev, t)
        return {
          ...prev,
          typePreferences: {
            ...prev.typePreferences,
            [t]: { ...base, enabled },
          },
        }
      })
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <SettingsHeader description="Choose how and when you’re notified." />

      {/* Notification Preview & Lock Screen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notification display</CardTitle>
          <CardDescription>Control how notifications appear on your devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show notification previews</Label>
              <p className="text-xs text-muted-foreground">When off, notifications show generic text like “New message”</p>
            </div>
            <Switch
              checked={settings.previewContent !== false}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, previewContent: Boolean(checked) }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show on lock screen</Label>
              <p className="text-xs text-muted-foreground">Hide sensitive notifications on the lock screen</p>
            </div>
            <Switch
              checked={settings.showOnLockScreen !== false}
              onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, showOnLockScreen: Boolean(checked) }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Do Not Disturb Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Do Not Disturb Schedule</CardTitle>
          <CardDescription>Silence push and sounds during selected times. In‑app notifications remain visible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable quiet hours</Label>
              <p className="text-xs text-muted-foreground">No push notifications, no sounds; emails are queued</p>
            </div>
            <Switch
              checked={Boolean(settings.quietHours?.enabled)}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  quietHours: {
                    ...(prev.quietHours || ({} as any)),
                    enabled: Boolean(checked),
                    start: prev.quietHours?.start || "22:00",
                    end: prev.quietHours?.end || "07:00",
                    timezone: prev.quietHours?.timezone || (user?.displayPreferences?.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")),
                    days:
                      prev.quietHours?.days || [
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                      ],
                    allowCritical: prev.quietHours?.allowCritical ?? true,
                  },
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Start time</Label>
              <Input
                type="time"
                value={settings.quietHours?.start || "22:00"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    quietHours: { ...(prev.quietHours || ({} as any)), start: e.target.value, enabled: true, timezone: prev.quietHours?.timezone || (user?.displayPreferences?.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")) },
                  }))
                }
                disabled={!settings.quietHours?.enabled}
              />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">End time</Label>
              <Input
                type="time"
                value={settings.quietHours?.end || "07:00"}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    quietHours: { ...(prev.quietHours || ({} as any)), end: e.target.value, enabled: true, timezone: prev.quietHours?.timezone || (user?.displayPreferences?.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")) },
                  }))
                }
                disabled={!settings.quietHours?.enabled}
              />
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Timezone</Label>
              <Input type="text" value={settings.quietHours?.timezone || (user?.displayPreferences?.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"))} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-muted-foreground">Days</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { k: "monday", l: "Mon" },
                  { k: "tuesday", l: "Tue" },
                  { k: "wednesday", l: "Wed" },
                  { k: "thursday", l: "Thu" },
                  { k: "friday", l: "Fri" },
                  { k: "saturday", l: "Sat" },
                  { k: "sunday", l: "Sun" },
                ] as const
              ).map(({ k, l }) => {
                const isChecked = (settings.quietHours?.days || []).includes(k as any)
                return (
                  <label key={k} className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => {
                          const days = new Set(prev.quietHours?.days || [])
                          if (checked) days.add(k as any)
                          else days.delete(k as any)
                          return {
                            ...prev,
                            quietHours: {
                              ...(prev.quietHours || ({} as any)),
                              enabled: true,
                              days: Array.from(days) as any,
                              timezone: prev.quietHours?.timezone || (user?.displayPreferences?.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")),
                            },
                          }
                        })
                      }
                      disabled={!settings.quietHours?.enabled}
                    />
                    {l}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Allow critical notifications during quiet hours</Label>
              <p className="text-xs text-muted-foreground">Security alerts, emergency reminders are always delivered</p>
            </div>
            <Switch
              checked={Boolean(settings.quietHours?.allowCritical) !== false}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  quietHours: { ...(prev.quietHours || ({} as any)), allowCritical: Boolean(checked) },
                }))
              }
              disabled={!settings.quietHours?.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notification categories</CardTitle>
          <CardDescription>Enable or disable groups of notifications at once.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORY_DEFS.map((def) => {
            const catEnabled = isCategoryEnabled(def)
            const open = expanded[def.key]
            return (
              <div key={def.key} className="rounded-lg border">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/40"
                  onClick={() => setExpanded((prev) => ({ ...prev, [def.key]: !open }))}
                  aria-expanded={open}
                >
                  <div className="text-left">
                    <div className="font-medium">{def.label}</div>
                    <div className="text-xs text-muted-foreground">{def.description}</div>
                  </div>
                  <Switch
                    checked={catEnabled}
                    onCheckedChange={(checked) => toggleCategory(def, Boolean(checked))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </button>
                {open && (
                  <div className="px-4 pb-3 pt-2 space-y-2">
                    {def.types.map((t) => {
                      const pref = ensureTypePreference(settings, t)
                      return (
                        <div key={t} className="flex items-center justify-between">
                          <div className="text-sm">
                            <div className="font-medium">{TYPE_LABELS[t].label}</div>
                            <div className="text-xs text-muted-foreground">{TYPE_LABELS[t].description}</div>
                          </div>
                          <Switch
                            checked={pref.enabled}
                            onCheckedChange={(checked) =>
                              updateTypePreference(t, (current) => ({ ...current, enabled: checked }))
                            }
                          />
                        </div>
                      )
                    })}
                    {def.placeholders && def.placeholders.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {def.placeholders.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between opacity-70">
                            <div>{p.label}</div>
                            <Switch disabled checked={false} />
                          </div>
                        ))}
                      </div>
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

      {/* Email Digest Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Email Digest Settings</CardTitle>
          <CardDescription>Applies to non-critical notifications. Security alerts always send immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup.Root
            value={currentEmailMode}
            onValueChange={(v) => setEmailMode(v as any)}
            className="grid gap-2"
          >
            <RadioGroup.Item value="realtime" asChild>
              <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                <div className="mt-0.5">
                  <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                </div>
                <div>
                  <div className="font-medium">Real-time</div>
                  <div className="text-xs text-muted-foreground">Immediate email for each notification</div>
                </div>
              </button>
            </RadioGroup.Item>
            <RadioGroup.Item value="hourly" asChild>
              <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                <div className="mt-0.5">
                  <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                </div>
                <div>
                  <div className="font-medium">Hourly Digest</div>
                  <div className="text-xs text-muted-foreground">One email per hour with all notifications</div>
                </div>
              </button>
            </RadioGroup.Item>
            <RadioGroup.Item value="daily" asChild>
              <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                <div className="mt-0.5">
                  <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Daily Digest</div>
                  <div className="text-xs text-muted-foreground">One email per day at your preferred time</div>
                  <div className="mt-2">
                    <Label className="text-xs uppercase text-muted-foreground">Delivery time</Label>
                    <Input
                      type="time"
                      value={settings.digestSchedule.timeOfDay}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          digestSchedule: { ...prev.digestSchedule, timeOfDay: e.target.value },
                        }))
                      }
                      className="max-w-[160px]"
                      disabled={currentEmailMode !== 'daily'}
                    />
                  </div>
                </div>
              </button>
            </RadioGroup.Item>
            <RadioGroup.Item value="weekly" asChild>
              <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                <div className="mt-0.5">
                  <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Weekly Summary</div>
                  <div className="text-xs text-muted-foreground">One email per week on your selected day</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Day</Label>
                      <Select
                        value={settings.digestSchedule.dayOfWeek || 'monday'}
                        onValueChange={(v) => setSettings((prev) => ({ ...prev, digestSchedule: { ...prev.digestSchedule, dayOfWeek: v as any } }))}
                        disabled={currentEmailMode !== 'weekly'}
                      >
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs uppercase text-muted-foreground">Delivery time</Label>
                      <Input
                        type="time"
                        value={settings.digestSchedule.timeOfDay}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            digestSchedule: { ...prev.digestSchedule, timeOfDay: e.target.value },
                          }))
                        }
                        className="max-w-[160px]"
                        disabled={currentEmailMode !== 'weekly'}
                      />
                    </div>
                  </div>
                </div>
              </button>
            </RadioGroup.Item>
          </RadioGroup.Root>
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
                      const isSms = channel === "sms"
                      const isEmail = channel === "email"
                      const isDigest = channel === "digest"

                      // Allow SMS only for critical types (placeholder: none), keep disabled with cost notice
                      const SMS_ALLOWED: NotificationType[] = []
                      const smsDisabled = isSms && !SMS_ALLOWED.includes(type)

                      return (
                        <td key={`${type}-${channel}`} className="py-3 pr-4 align-top">
                          <div className="space-y-1">
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
                              disabled={!preference.enabled || !channelEnabled || smsDisabled}
                            />
                            {isEmail && (
                              <div className="mt-1">
                                <Select
                                  value={preference.channels.includes("digest") ? "digest" : "instant"}
                                  onValueChange={(value) =>
                                    updateTypePreference(type, (current) => {
                                      const withoutEmail = current.channels.filter((c) => c !== "email" && c !== "digest")
                                      return {
                                        ...current,
                                        channels: value === "instant" ? [...withoutEmail, "email"] : [...withoutEmail, "digest"],
                                      }
                                    })
                                  }
                                  disabled={!preference.enabled || !channelEnabled}
                                >
                                  <SelectTrigger size="sm" className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="instant">Instant</SelectItem>
                                    <SelectItem value="digest">Daily Digest</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {isSms && (
                              <div className="text-[11px] text-muted-foreground">Critical alerts only • Charges may apply</div>
                            )}
                          </div>
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
