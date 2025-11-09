"use client"

import { useState, useEffect } from "react"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import UnitSettings from "@/components/settings/UnitSettings"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { useAuth } from "@/components/auth/auth-provider"
import { updateUser } from "@/lib/storage"
import type { DateFormatPreference, TimeFormatPreference, TimestampDisplayPreference } from "@/lib/types"
import { getAllCountries, getAllTimezonesWithOffsets, detectBrowserTimezone, guessUserCountry } from "@/lib/i18n/regions"
import { getCommonLanguages } from "@/lib/i18n/languages"

export default function LanguageRegionSettingsPage(): JSX.Element {
  const { user, refresh } = useAuth()

  const [language, setLanguage] = useState<string>("en")
  const [timestampDisplay, setTimestampDisplay] = useState<TimestampDisplayPreference>("relative")
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>("MDY")
  const [timeFormat, setTimeFormat] = useState<TimeFormatPreference>("12h")
  const [saving, setSaving] = useState(false)
  const [country, setCountry] = useState<string>("US")
  const [timezone, setTimezone] = useState<string>("UTC")
  const [tzOptions, setTzOptions] = useState(() => getAllTimezonesWithOffsets())
  const [countryOptions, setCountryOptions] = useState(() => getAllCountries())
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(["en"]) 
  const [showTranslations, setShowTranslations] = useState<boolean>(true)
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false)
  const [primaryLanguage, setPrimaryLanguage] = useState<string>("en")
  const [strictFilter, setStrictFilter] = useState<boolean>(false)
  const [languageOptions, setLanguageOptions] = useState(() => getCommonLanguages())

  useEffect(() => {
    if (!user) return
    // Initialize from user preferences when available
    const prefs = user.displayPreferences
    if (prefs) {
      setTimestampDisplay(prefs.timestampDisplay)
      setDateFormat(prefs.dateFormat)
      setTimeFormat(prefs.timeFormat)
      if (prefs.country) setCountry(prefs.country)
      if (prefs.timezone) setTimezone(prefs.timezone)
      if (Array.isArray(prefs.preferredContentLanguages)) setPreferredLanguages(prefs.preferredContentLanguages)
      if (typeof prefs.showTranslations === 'boolean') setShowTranslations(prefs.showTranslations)
      if (typeof prefs.autoTranslate === 'boolean') setAutoTranslate(prefs.autoTranslate)
      if (prefs.primaryLanguage) setPrimaryLanguage(prefs.primaryLanguage)
      if (typeof prefs.strictLanguageFilter === 'boolean') setStrictFilter(prefs.strictLanguageFilter)
    }
    // Initialize defaults if not set
    if (!prefs?.country) {
      const guessed = guessUserCountry()
      if (guessed) setCountry(guessed)
    }
    if (!prefs?.timezone) {
      setTimezone(detectBrowserTimezone())
    }
    if (!prefs?.primaryLanguage) {
      // Default primary language to first preferred or 'en'
      setPrimaryLanguage((prev) => (preferredLanguages && preferredLanguages.length > 0 ? preferredLanguages[0] : prev || 'en'))
    }
  }, [user])

  const handleSave = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      updateUser(user.id, {
        displayPreferences: {
          timestampDisplay,
          dateFormat,
          timeFormat,
          country,
          timezone,
          preferredContentLanguages: preferredLanguages,
          showTranslations,
          autoTranslate,
          primaryLanguage,
          strictLanguageFilter: strictFilter,
        },
      })
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHeader description="Choose your language, locale, and regional formats." />

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Select the display language for the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 max-w-xs">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!user || saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>Set your country/region and time zone for content and scheduling.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-md">
            <Label>Country/Region</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countryOptions.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 max-w-md">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {tzOptions.map((tz) => (
                  <SelectItem key={tz.id} value={tz.id}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  const detected = detectBrowserTimezone()
                  // eslint-disable-next-line no-alert
                  if (detected && window.confirm(`Set timezone to ${detected}?`)) {
                    setTimezone(detected)
                  }
                }}
              >
                Auto-detect
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!user || saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Preferences</CardTitle>
          <CardDescription>Choose languages for your feed and how translations are shown.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Primary language */}
          <div className="grid gap-2 max-w-md">
            <Label>Primary language</Label>
            <Select value={primaryLanguage} onValueChange={setPrimaryLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select primary language" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {(preferredLanguages.length > 0 ? languageOptions.filter(lo => preferredLanguages.includes(lo.code)) : languageOptions).map((opt) => (
                  <SelectItem key={opt.code} value={opt.code}>{opt.name} ({opt.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">Used as the translation target when auto-translate is on.</div>
          </div>

          {/* Preferred content languages */}
          <div className="space-y-2">
            <Label>Preferred content language(s)</Label>
            <div className="text-xs text-muted-foreground">Posts tagged with these languages will be prioritized in your feed.</div>
            <div className="max-h-60 overflow-auto rounded-md border p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {languageOptions.map((opt) => {
                const checked = preferredLanguages.includes(opt.code)
                return (
                  <label key={opt.code} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) => {
                        const isOn = Boolean(val)
                        setPreferredLanguages((prev) =>
                          isOn ? Array.from(new Set([...prev, opt.code])) : prev.filter((c) => c !== opt.code),
                        )
                      }}
                    />
                    {opt.name}
                    <span className="text-muted-foreground">({opt.code})</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Translation controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Only show preferred languages</div>
                <div className="text-xs text-muted-foreground">Strict filter hides posts that aren’t in your preferred language list.</div>
              </div>
              <Switch
                checked={strictFilter}
                onCheckedChange={(v) => setStrictFilter(Boolean(v))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Show translations</div>
                <div className="text-xs text-muted-foreground">Show a Translate button on posts in other languages.</div>
              </div>
              <Switch
                checked={showTranslations}
                onCheckedChange={(v) => {
                  const enabled = Boolean(v)
                  setShowTranslations(enabled)
                  if (!enabled) setAutoTranslate(false)
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Auto-translate</div>
                <div className="text-xs text-muted-foreground">Automatically translate posts to your preferred language. You can still view the original.</div>
              </div>
              <Switch
                checked={autoTranslate}
                onCheckedChange={(v) => setAutoTranslate(Boolean(v))}
                disabled={!showTranslations}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!user || saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>

      <UnitSettings />

      <Card>
        <CardHeader>
          <CardTitle>Language Display</CardTitle>
          <CardDescription>Control how dates and times appear across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show timestamps as */}
          <div className="space-y-2">
            <Label>Show timestamps as</Label>
            <RadioGroup.Root
              value={timestampDisplay}
              onValueChange={(v) => setTimestampDisplay(v as TimestampDisplayPreference)}
              className="grid gap-2"
            >
              <RadioGroup.Item value="relative" asChild>
                <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                  <div className="mt-0.5">
                    <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Relative</div>
                    <div className="text-xs text-muted-foreground">e.g., 2 hours ago</div>
                  </div>
                </button>
              </RadioGroup.Item>
              <RadioGroup.Item value="absolute" asChild>
                <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                  <div className="mt-0.5">
                    <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Absolute</div>
                    <div className="text-xs text-muted-foreground">e.g., Nov 9, 2025 3:45 PM</div>
                  </div>
                </button>
              </RadioGroup.Item>
              <RadioGroup.Item value="both" asChild>
                <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                  <div className="mt-0.5">
                    <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Both</div>
                    <div className="text-xs text-muted-foreground">e.g., 2 hours ago (Nov 9, 2025 3:45 PM)</div>
                  </div>
                </button>
              </RadioGroup.Item>
            </RadioGroup.Root>
          </div>

          {/* Date format */}
          <div className="grid gap-2 max-w-xs">
            <Label>Date format</Label>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormatPreference)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MDY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DMY">DD/MM/YYYY (Europe)</SelectItem>
                <SelectItem value="YMD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time format */}
          <div className="space-y-2">
            <Label>Time format</Label>
            <RadioGroup.Root
              value={timeFormat}
              onValueChange={(v) => setTimeFormat(v as TimeFormatPreference)}
              className="grid gap-2 sm:max-w-md"
            >
              <RadioGroup.Item value="12h" asChild>
                <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                  <div className="mt-0.5">
                    <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                  </div>
                  <div>
                    <div className="font-medium">12-hour</div>
                    <div className="text-xs text-muted-foreground">AM/PM</div>
                  </div>
                </button>
              </RadioGroup.Item>
              <RadioGroup.Item value="24h" asChild>
                <button className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30">
                  <div className="mt-0.5">
                    <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                  </div>
                  <div>
                    <div className="font-medium">24-hour</div>
                    <div className="text-xs text-muted-foreground">00:00–23:59</div>
                  </div>
                </button>
              </RadioGroup.Item>
            </RadioGroup.Root>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!user || saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
  
export const dynamic = "force-dynamic"
