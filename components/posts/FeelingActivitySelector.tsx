"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const FEELINGS = ["happy", "excited", "curious", "grateful", "playful", "tired", "proud"]
const ACTIVITIES = [
  "playing",
  "walking",
  "training",
  "celebrating adoption day",
  "visiting the vet",
  "meeting friends",
]

export interface FeelingActivitySelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: { feeling?: string; activity?: string }
  onChange: (value: { feeling?: string; activity?: string }) => void
  petNames?: string[]
}

export function FeelingActivitySelector({ open, onOpenChange, value, onChange, petNames = [] }: FeelingActivitySelectorProps) {
  const [feeling, setFeeling] = useState<string | undefined>(value.feeling)
  const [activity, setActivity] = useState<string | undefined>(value.activity)
  const [custom, setCustom] = useState("")

  const activitySuggestions = useMemo(() => {
    if (petNames.length === 0) return ACTIVITIES
    // Add "with Buddy" if a pet is present
    const withPet = petNames[0]
    const base = [
      `playing with ${withPet}`,
      `walking with ${withPet}`,
      ...ACTIVITIES,
    ]
    return Array.from(new Set(base))
  }, [petNames.join("|")])

  const save = () => {
    const a = custom.trim() || activity
    onChange({ feeling, activity: a })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Feeling / Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Feeling</label>
            <Select value={feeling} onValueChange={setFeeling}>
              <SelectTrigger>
                <SelectValue placeholder="Select feeling (optional)" />
              </SelectTrigger>
              <SelectContent>
                {FEELINGS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Activity</label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity (optional)" />
              </SelectTrigger>
              <SelectContent>
                {activitySuggestions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Or write your own</label>
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g., celebrating adoption day" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FeelingActivitySelector

