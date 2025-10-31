"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface WarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  onConfirm: (level: 1 | 2 | 3, reason: string, notes?: string) => void
}

export function WarningDialog({
  open,
  onOpenChange,
  userName,
  onConfirm,
}: WarningDialogProps) {
  const [level, setLevel] = useState<"1" | "2" | "3">("1")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Reason is required")
      return
    }

    onConfirm(Number(level) as 1 | 2 | 3, reason.trim(), notes.trim() || undefined)
    setLevel("1")
    setReason("")
    setNotes("")
    setError(null)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLevel("1")
    setReason("")
    setNotes("")
    setError(null)
    onOpenChange(false)
  }

  const levelDescriptions = {
    "1": "Minor - First warning for minor infractions",
    "2": "Moderate - Repeated or more serious violations",
    "3": "Severe - Serious violation, may lead to ban",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue Warning</DialogTitle>
          <DialogDescription>
            Issue a warning to {userName}. This action will be recorded in the moderation log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warning-level">Warning Level</Label>
            <Select value={level} onValueChange={(value) => setLevel(value as "1" | "2" | "3")}>
              <SelectTrigger id="warning-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Level 1 - Minor</SelectItem>
                <SelectItem value="2">Level 2 - Moderate</SelectItem>
                <SelectItem value="3">Level 3 - Severe</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{levelDescriptions[level]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warning-reason">Reason *</Label>
            <Textarea
              id="warning-reason"
              placeholder="Describe the reason for this warning..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warning-notes">Notes (Optional)</Label>
            <Textarea
              id="warning-notes"
              placeholder="Additional notes for moderation records..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Issue Warning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

