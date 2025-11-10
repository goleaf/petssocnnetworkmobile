"use client"

import { useState, useEffect } from "react"
import { X, Filter, Calendar, Hash, Volume2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FeedFilters {
  contentTypes: string[]
  dateRange: 'today' | 'week' | 'month' | 'all' | 'custom'
  customDateStart?: string
  customDateEnd?: string
  highQualityOnly: boolean
  topics: string[]
  mutedWords: string[]
}

export interface FilterPreset {
  id: string
  name: string
  filters: FeedFilters
}

interface FilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FeedFilters
  onFiltersChange: (filters: FeedFilters) => void
  onApply: () => void
}

const CONTENT_TYPES = [
  { id: 'photo_album', label: 'Photos' },
  { id: 'video', label: 'Videos' },
  { id: 'standard', label: 'Text Only' },
  { id: 'poll', label: 'Polls' },
  { id: 'shared', label: 'Shared Posts' },
]

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
]

export function FilterPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FeedFilters>(filters)
  const [topicInput, setTopicInput] = useState("")
  const [mutedWordInput, setMutedWordInput] = useState("")
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem("feedFilterPresets")
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets))
      } catch (error) {
        console.error("Failed to load filter presets:", error)
      }
    }
  }, [])

  // Sync local filters with prop filters when they change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleContentTypeToggle = (typeId: string) => {
    const newTypes = localFilters.contentTypes.includes(typeId)
      ? localFilters.contentTypes.filter((t) => t !== typeId)
      : [...localFilters.contentTypes, typeId]
    
    setLocalFilters({ ...localFilters, contentTypes: newTypes })
  }

  const handleDateRangeChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      dateRange: value as FeedFilters['dateRange'],
      // Clear custom dates if not custom
      ...(value !== 'custom' ? { customDateStart: undefined, customDateEnd: undefined } : {}),
    })
  }

  const handleAddTopic = () => {
    if (topicInput.trim() && !localFilters.topics.includes(topicInput.trim())) {
      setLocalFilters({
        ...localFilters,
        topics: [...localFilters.topics, topicInput.trim()],
      })
      setTopicInput("")
    }
  }

  const handleRemoveTopic = (topic: string) => {
    setLocalFilters({
      ...localFilters,
      topics: localFilters.topics.filter((t) => t !== topic),
    })
  }

  const handleAddMutedWord = () => {
    if (mutedWordInput.trim() && !localFilters.mutedWords.includes(mutedWordInput.trim())) {
      setLocalFilters({
        ...localFilters,
        mutedWords: [...localFilters.mutedWords, mutedWordInput.trim()],
      })
      setMutedWordInput("")
    }
  }

  const handleRemoveMutedWord = (word: string) => {
    setLocalFilters({
      ...localFilters,
      mutedWords: localFilters.mutedWords.filter((w) => w !== word),
    })
  }

  const handleSavePreset = () => {
    const presetName = prompt("Enter a name for this filter preset:")
    if (!presetName) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: localFilters,
    }

    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    localStorage.setItem("feedFilterPresets", JSON.stringify(updatedPresets))
  }

  const handleLoadPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setLocalFilters(preset.filters)
      setSelectedPreset(presetId)
    }
  }

  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId)
    setPresets(updatedPresets)
    localStorage.setItem("feedFilterPresets", JSON.stringify(updatedPresets))
    if (selectedPreset === presetId) {
      setSelectedPreset("")
    }
  }

  const handleReset = () => {
    const defaultFilters: FeedFilters = {
      contentTypes: [],
      dateRange: 'all',
      highQualityOnly: false,
      topics: [],
      mutedWords: [],
    }
    setLocalFilters(defaultFilters)
    setSelectedPreset("")
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
    onOpenChange(false)
  }

  const activeFilterCount = 
    localFilters.contentTypes.length +
    (localFilters.dateRange !== 'all' ? 1 : 0) +
    (localFilters.highQualityOnly ? 1 : 0) +
    localFilters.topics.length +
    localFilters.mutedWords.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Feed Filters
          </SheetTitle>
          <SheetDescription>
            Customize what you see in your feed
            {activeFilterCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                ({activeFilterCount} active)
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Filter Presets */}
          {presets.length > 0 && (
            <div className="space-y-3">
              <Label>Saved Presets</Label>
              <div className="flex gap-2">
                <Select value={selectedPreset} onValueChange={handleLoadPreset}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Load a preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPreset && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeletePreset(selectedPreset)}
                    title="Delete preset"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content Types */}
          <div className="space-y-3">
            <Label>Content Types</Label>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`content-type-${type.id}`}
                    checked={localFilters.contentTypes.includes(type.id)}
                    onCheckedChange={() => handleContentTypeToggle(type.id)}
                  />
                  <label
                    htmlFor={`content-type-${type.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <Select value={localFilters.dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Date Range */}
            {localFilters.dateRange === 'custom' && (
              <div className="space-y-2 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date-start" className="text-xs">Start Date</Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={localFilters.customDateStart || ''}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, customDateStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date-end" className="text-xs">End Date</Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={localFilters.customDateEnd || ''}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, customDateEnd: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* High Quality Only */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="high-quality" className="flex-1 cursor-pointer">
              High Quality Only
              <span className="block text-xs font-normal text-muted-foreground mt-1">
                Filter out low-resolution and poorly lit content
              </span>
            </Label>
            <Switch
              id="high-quality"
              checked={localFilters.highQualityOnly}
              onCheckedChange={(checked) =>
                setLocalFilters({ ...localFilters, highQualityOnly: checked })
              }
            />
          </div>

          {/* Topics Filter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Show Posts About
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add hashtag..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTopic()
                  }
                }}
              />
              <Button onClick={handleAddTopic} size="sm">
                Add
              </Button>
            </div>
            {localFilters.topics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localFilters.topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="gap-1">
                    #{topic}
                    <button
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${topic}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Muted Words */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Muted Words
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add word to mute..."
                value={mutedWordInput}
                onChange={(e) => setMutedWordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMutedWord()
                  }
                }}
              />
              <Button onClick={handleAddMutedWord} size="sm">
                Add
              </Button>
            </div>
            {localFilters.mutedWords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localFilters.mutedWords.map((word) => (
                  <Badge key={word} variant="outline" className="gap-1">
                    {word}
                    <button
                      onClick={() => handleRemoveMutedWord(word)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${word}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleSavePreset}
              className="flex-1"
              disabled={activeFilterCount === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
          </div>
          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
