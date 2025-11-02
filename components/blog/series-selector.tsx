"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import type { BlogSeries } from "@/lib/types"

interface SeriesSelectorProps {
  value?: string
  onChange: (seriesId: string | undefined) => void
  onSeriesOrderChange?: (order: number | undefined) => void
  seriesOrder?: number
  authorId: string
}

/**
 * Series Selector Component
 * Allows selecting an existing series or creating a new one
 */
export function SeriesSelector({
  value,
  onChange,
  onSeriesOrderChange,
  seriesOrder,
  authorId,
}: SeriesSelectorProps) {
  const [series, setSeries] = useState<BlogSeries[]>([])
  const [newSeriesTitle, setNewSeriesTitle] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // TODO: Load user's series from storage
  useEffect(() => {
    // Placeholder - would load from storage
    setSeries([])
  }, [authorId])

  const handleCreateSeries = () => {
    if (!newSeriesTitle.trim()) {
      return
    }

    // TODO: Create series via server action
    // For now, just close dialog
    setNewSeriesTitle("")
    setCreateDialogOpen(false)
  }

  const selectedSeries = series.find((s) => s.id === value)
  const NO_SERIES_VALUE = "__no_series"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Series (optional)</Label>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Series
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Series</DialogTitle>
              <DialogDescription>
                Create a series to group related blog posts together (e.g., "Puppy Week 1-4").
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="series-title">Series Title</Label>
                <Input
                  id="series-title"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder="e.g., Puppy Week 1-4"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSeries}>Create Series</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Select
        value={value ?? NO_SERIES_VALUE}
        onValueChange={(val) => onChange(val === NO_SERIES_VALUE ? undefined : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a series or leave blank">
            {selectedSeries ? selectedSeries.title : "No series"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SERIES_VALUE}>No series</SelectItem>
          {series.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value && (
        <div className="space-y-2">
          <Label htmlFor="series-order">Order in Series</Label>
          <Input
            id="series-order"
            type="number"
            min={1}
            value={seriesOrder || ""}
            onChange={(e) => {
              const order = e.target.value ? parseInt(e.target.value, 10) : undefined
              onSeriesOrderChange?.(order && order > 0 ? order : undefined)
            }}
            placeholder="e.g., 1, 2, 3..."
          />
          <p className="text-xs text-muted-foreground">
            Position of this post in the series (1 = first post, 2 = second post, etc.)
          </p>
        </div>
      )}

      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(undefined)
            onSeriesOrderChange?.(undefined)
          }}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Remove from Series
        </Button>
      )}
    </div>
  )
}

