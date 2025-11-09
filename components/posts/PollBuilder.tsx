"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { PostPoll } from "@/lib/types"

type Duration = "1d" | "3d" | "1w" | "none"

export interface PollBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: PostPoll | null
  onChange: (poll: PostPoll | null) => void
}

export function PollBuilder({ open, onOpenChange, value, onChange }: PollBuilderProps) {
  const [question, setQuestion] = useState(value?.question || "What's your pick?")
  const [options, setOptions] = useState<string[]>(value?.options?.map((o) => o.text) || ["Option 1", "Option 2"])
  const [allowMultiple, setAllowMultiple] = useState<boolean>(value?.allowMultiple || false)
  const [anonymous, setAnonymous] = useState<boolean>(value?.anonymous || false)
  const [duration, setDuration] = useState<Duration>(value?.expiresAt ? "1w" : "none")

  useEffect(() => {
    if (open && value) {
      setQuestion(value.question || "What's your pick?")
      setOptions(value.options?.map((o) => o.text) || ["Option 1", "Option 2"])
      setAllowMultiple(Boolean(value.allowMultiple))
      setDuration(value.expiresAt ? "1w" : "none")
    }
  }, [open])

  const addOption = () => {
    if (options.length >= 4) return
    setOptions([...options, `Option ${options.length + 1}`])
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== idx))
  }

  const save = () => {
    const now = Date.now()
    let expiresAt: string | undefined
    if (duration === "1d") expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString()
    if (duration === "3d") expiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString()
    if (duration === "1w") expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
    const poll: PostPoll = {
      question,
      options: options.map((t, i) => ({ id: `opt_${i + 1}`, text: t, voteCount: 0 })),
      allowMultiple: allowMultiple || undefined,
      expiresAt,
      anonymous: anonymous || undefined,
    }
    onChange(poll)
    onOpenChange(false)
  }

  const clear = () => {
    onChange(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Question</label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value.slice(0,280))} maxLength={280} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Options (2–4)</label>
              <Button type="button" size="sm" variant="outline" onClick={addOption} disabled={options.length >= 4}>Add</Button>
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={opt} onChange={(e) => setOptions(options.map((o, i) => (i === idx ? e.target.value.slice(0,50) : o)))} maxLength={50} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(idx)} disabled={options.length <= 2}>×</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={allowMultiple} onCheckedChange={(v) => setAllowMultiple(Boolean(v))} />
            <span className="text-sm">Allow multiple selections</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(Boolean(v))} />
            <span className="text-sm">Anonymous voting</span>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Duration</label>
            <div className="flex gap-2">
              {([
                { key: "1d", label: "1 day" },
                { key: "3d", label: "3 days" },
                { key: "1w", label: "1 week" },
                { key: "none", label: "No expiration" },
              ] as const).map((d) => (
                <Button key={d.key} type="button" size="sm" variant={duration === d.key ? "default" : "outline"} onClick={() => setDuration(d.key)}>
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {value && <Button variant="destructive" onClick={clear}>Remove poll</Button>}
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PollBuilder
