"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { usePreferences } from "@/lib/preferences"
import type { UnitSystem } from "@/lib/i18n/formatting"

export default function UnitSettings(): JSX.Element {
  const { unitSystem, setUnitSystem, clearUnitSystem } = usePreferences((s) => ({
    unitSystem: s.unitSystem,
    setUnitSystem: s.setUnitSystem,
    clearUnitSystem: s.clearUnitSystem,
  }))

  // Local state to avoid hydration mismatch; undefined => Auto
  const [selected, setSelected] = useState<UnitSystem | undefined>(undefined)

  useEffect(() => {
    setSelected(unitSystem)
  }, [unitSystem])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurement Units</CardTitle>
        <CardDescription>Choose how distances, weights, and temperatures are shown.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 max-w-md">
          <div className="flex items-center gap-3">
            <input
              id="units-auto"
              type="radio"
              name="unitSystem"
              value="auto"
              checked={selected === undefined}
              onChange={() => {
                setSelected(undefined)
                clearUnitSystem()
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="units-auto" className="cursor-pointer">
              Auto
              <span className="block text-xs text-muted-foreground">follow locale (default)</span>
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="units-metric"
              type="radio"
              name="unitSystem"
              value="metric"
              checked={selected === "metric"}
              onChange={() => {
                setSelected("metric")
                setUnitSystem("metric")
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="units-metric" className="cursor-pointer">
              Metric
              <span className="block text-xs text-muted-foreground">kilometers, kilograms, Celsius</span>
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="units-imperial"
              type="radio"
              name="unitSystem"
              value="imperial"
              checked={selected === "imperial"}
              onChange={() => {
                setSelected("imperial")
                setUnitSystem("imperial")
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="units-imperial" className="cursor-pointer">
              Imperial
              <span className="block text-xs text-muted-foreground">miles, pounds, Fahrenheit</span>
            </Label>
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelected(undefined)
                clearUnitSystem()
              }}
            >
              Reset to Auto
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
