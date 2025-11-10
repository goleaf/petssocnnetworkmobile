"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import type { CountdownStickerData } from "./types"

interface CountdownStickerProps {
  onSave: (data: CountdownStickerData) => void
  onCancel: () => void
}

export function CountdownSticker({ onSave, onCancel }: CountdownStickerProps) {
  const [label, setLabel] = useState("")
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState("12:00")

  const handleSave = () => {
    if (!date) {
      alert("Please select a date")
      return
    }

    // Combine date and time
    const [hours, minutes] = time.split(":").map(Number)
    const targetDate = new Date(date)
    targetDate.setHours(hours, minutes, 0, 0)

    const countdownData: CountdownStickerData = {
      targetDate: targetDate.toISOString(),
      label: label.trim() || undefined,
    }

    onSave(countdownData)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Add Countdown</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Label (optional)
          </label>
          <Input
            placeholder="e.g., Birthday, Vacation, Event"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={30}
          />
        </div>

        {/* Date Picker */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Target date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Time
          </label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        {date && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="font-medium mb-1">Preview</div>
            <div className="text-muted-foreground">
              {label && <div>{label}</div>}
              <div>
                {format(date, "MMMM d, yyyy")} at {time}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t">
        <Button onClick={handleSave} className="w-full">
          Add Countdown
        </Button>
      </div>
    </div>
  )
}
