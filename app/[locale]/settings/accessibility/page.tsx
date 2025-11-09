"use client"

import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useMotorA11y } from "@/components/a11y/motor-accessibility-provider"
import { cn } from "@/lib/utils"

export default function AccessibilitySettingsPage(): JSX.Element {
  const {
    stickyKeys,
    slowKeys,
    slowKeysDelayMs,
    clickDelayMs,
    largeTouchTargets,
    setStickyKeys,
    setSlowKeys,
    setSlowKeysDelayMs,
    setClickDelayMs,
    setLargeTouchTargets,
  } = useMotorA11y()

  return (
    <div className="space-y-6">
      <SettingsHeader description="Motor accessibility preferences for keyboard and touch input." />

      <Card>
        <CardHeader>
          <CardTitle>Keyboard</CardTitle>
          <CardDescription>Adjust how keyboard shortcuts and keypresses are handled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="font-medium">Sticky keys for keyboard shortcuts</Label>
              <p className="text-sm text-muted-foreground">Press modifier keys (Ctrl/⌘, Shift, Alt) sequentially before a key to trigger shortcuts.</p>
            </div>
            <Switch checked={stickyKeys} onCheckedChange={setStickyKeys} aria-label="Enable sticky keys" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Label className="font-medium">Slow keys</Label>
              <p className="text-sm text-muted-foreground">Adds a short hold time before shortcut keypresses register to prevent accidental inputs.</p>
              {/* Hidden fine-tuning: expose hold delay when slow keys enabled */}
              <div className={cn("mt-3 max-w-md", !slowKeys && "opacity-50 pointer-events-none") }>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Hold time</span>
                  <span className="text-xs tabular-nums">{slowKeysDelayMs} ms</span>
                </div>
                <Slider min={0} max={2000} value={[slowKeysDelayMs]} onValueChange={(v) => setSlowKeysDelayMs(v[0] ?? 0)} />
              </div>
            </div>
            <Switch checked={slowKeys} onCheckedChange={setSlowKeys} aria-label="Enable slow keys" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clicks & Touch</CardTitle>
          <CardDescription>Reduce accidental double-activations and increase touch target size on mobile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <Label className="font-medium">Click delay</Label>
            <p className="text-sm text-muted-foreground">Ignore additional clicks that occur within this time window to prevent accidental double-clicks.</p>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Delay window</span>
                <span className="text-xs tabular-nums">{clickDelayMs} ms</span>
              </div>
              <Slider min={0} max={2000} value={[clickDelayMs]} onValueChange={(v) => setClickDelayMs(v[0] ?? 0)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="font-medium">Large touch targets (mobile)</Label>
              <p className="text-sm text-muted-foreground">Increase the minimum size of buttons and links to 44×44px on touch devices.</p>
            </div>
            <Switch checked={largeTouchTargets} onCheckedChange={setLargeTouchTargets} aria-label="Enable large touch targets" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
