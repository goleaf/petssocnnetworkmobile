"use client"

import * as React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  X,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  Save,
  BookOpen,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ANIMAL_TYPES } from "@/lib/animal-types"

export type BooleanOperator = "AND" | "OR" | "NOT"

export interface AdvancedFilterRule {
  id: string
  field: string
  operator: "contains" | "equals" | "startsWith" | "endsWith" | "in" | "notIn" | "range" | "dateRange"
  value: string | string[] | number | { min?: number; max?: number } | { from?: string; to?: string }
  booleanOperator?: BooleanOperator
}

export interface AdvancedSearchConfig {
  query: string
  rules: AdvancedFilterRule[]
  booleanOperator: BooleanOperator
  sortBy?: "relevance" | "recent" | "popular"
  limit?: number
}

interface AdvancedSearchBuilderProps {
  config: AdvancedSearchConfig
  onChange: (config: AdvancedSearchConfig) => void
  onSave?: (presetName: string) => void
  savedPresets?: Array<{ id: string; name: string; config: AdvancedSearchConfig }>
  onLoadPreset?: (config: AdvancedSearchConfig) => void
  onDeletePreset?: (id: string) => void
  className?: string
}

const AVAILABLE_FIELDS = [
  { value: "title", label: "Title", type: "text" },
  { value: "content", label: "Content", type: "text" },
  { value: "type", label: "Content Type", type: "select", options: ["users", "pets", "blogs", "wiki", "hashtags", "groups", "events"] },
  { value: "species", label: "Species", type: "select", options: ANIMAL_TYPES.map((a) => a.value) },
  { value: "tags", label: "Tags", type: "multiselect" },
  { value: "location", label: "Location", type: "text" },
  { value: "breed", label: "Breed", type: "text" },
  { value: "gender", label: "Gender", type: "select", options: ["male", "female"] },
  { value: "verified", label: "Verified", type: "boolean" },
  { value: "age", label: "Age", type: "range" },
  { value: "date", label: "Date", type: "dateRange" },
]

export function AdvancedSearchBuilder({
  config,
  onChange,
  onSave,
  savedPresets = [],
  onLoadPreset,
  onDeletePreset,
  className,
}: AdvancedSearchBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPresetName, setShowPresetName] = useState(false)
  const [presetName, setPresetName] = useState("")

  const addRule = () => {
    const newRule: AdvancedFilterRule = {
      id: `rule-${Date.now()}`,
      field: "title",
      operator: "contains",
      value: "",
      booleanOperator: "AND",
    }
    onChange({
      ...config,
      rules: [...config.rules, newRule],
    })
  }

  const removeRule = (ruleId: string) => {
    onChange({
      ...config,
      rules: config.rules.filter((r) => r.id !== ruleId),
    })
  }

  const updateRule = (ruleId: string, updates: Partial<AdvancedFilterRule>) => {
    onChange({
      ...config,
      rules: config.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
    })
  }

  const getFieldConfig = (fieldValue: string) => {
    return AVAILABLE_FIELDS.find((f) => f.value === fieldValue) || AVAILABLE_FIELDS[0]
  }

  const handleSavePreset = () => {
    if (presetName.trim() && onSave) {
      onSave(presetName.trim())
      setPresetName("")
      setShowPresetName(false)
    }
  }

  const handleLoadPreset = (presetConfig: AdvancedSearchConfig) => {
    if (onLoadPreset) {
      onLoadPreset(presetConfig)
    }
  }

  const renderRuleValueInput = (rule: AdvancedFilterRule) => {
    const fieldConfig = getFieldConfig(rule.field)

    switch (fieldConfig.type) {
      case "select":
        return (
          <Select
            value={String(rule.value || "")}
            onValueChange={(value) => updateRule(rule.id, { value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select value..." />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        const selectedValues = Array.isArray(rule.value) ? rule.value : rule.value ? [rule.value] : []
        return (
          <div className="space-y-2">
            <Input
              placeholder="Enter tags (comma-separated)"
              value={selectedValues.join(", ")}
              onChange={(e) => {
                const values = e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
                updateRule(rule.id, { value: values })
              }}
            />
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedValues.map((val, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                    {val}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = selectedValues.filter((_, i) => i !== idx)
                        updateRule(rule.id, { value: newValues })
                      }}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )

      case "range":
        const rangeValue = typeof rule.value === "object" && "min" in (rule.value || {})
          ? (rule.value as { min?: number; max?: number })
          : { min: undefined, max: undefined }
        return (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor={`${rule.id}-min`} className="text-xs text-muted-foreground">
                Min
              </Label>
              <Input
                id={`${rule.id}-min`}
                type="number"
                placeholder="Min"
                value={rangeValue.min || ""}
                onChange={(e) =>
                  updateRule(rule.id, {
                    value: {
                      ...rangeValue,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`${rule.id}-max`} className="text-xs text-muted-foreground">
                Max
              </Label>
              <Input
                id={`${rule.id}-max`}
                type="number"
                placeholder="Max"
                value={rangeValue.max || ""}
                onChange={(e) =>
                  updateRule(rule.id, {
                    value: {
                      ...rangeValue,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        )

      case "dateRange":
        const dateValue = typeof rule.value === "object" && "from" in (rule.value || {})
          ? (rule.value as { from?: string; to?: string })
          : { from: undefined, to: undefined }
        return (
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor={`${rule.id}-from`} className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id={`${rule.id}-from`}
                type="date"
                value={dateValue.from || ""}
                onChange={(e) =>
                  updateRule(rule.id, {
                    value: {
                      ...dateValue,
                      from: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
            <div className="flex-1">
              <Label htmlFor={`${rule.id}-to`} className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id={`${rule.id}-to`}
                type="date"
                value={dateValue.to || ""}
                onChange={(e) =>
                  updateRule(rule.id, {
                    value: {
                      ...dateValue,
                      to: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        )

      case "boolean":
        return (
          <Select
            value={String(rule.value || "true")}
            onValueChange={(value) => updateRule(rule.id, { value: value === "true" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            type="text"
            placeholder="Enter value..."
            value={String(rule.value || "")}
            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
          />
        )
    }
  }

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case "text":
        return [
          { value: "contains", label: "Contains" },
          { value: "equals", label: "Equals" },
          { value: "startsWith", label: "Starts with" },
          { value: "endsWith", label: "Ends with" },
        ]
      case "select":
        return [
          { value: "equals", label: "Equals" },
          { value: "in", label: "Is one of" },
          { value: "notIn", label: "Is not one of" },
        ]
      case "multiselect":
        return [
          { value: "in", label: "Contains any" },
          { value: "notIn", label: "Does not contain" },
        ]
      case "range":
        return [{ value: "range", label: "Between" }]
      case "dateRange":
        return [{ value: "dateRange", label: "Between dates" }]
      case "boolean":
        return [{ value: "equals", label: "Is" }]
      default:
        return [{ value: "contains", label: "Contains" }]
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Advanced Search</span>
              {config.rules.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {config.rules.length}
                </Badge>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Advanced Search Builder</CardTitle>
                <div className="flex gap-2">
                  {savedPresets.length > 0 && (
                    <Select
                      value=""
                      onValueChange={(presetId) => {
                        const preset = savedPresets.find((p) => p.id === presetId)
                        if (preset) handleLoadPreset(preset.config)
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Load preset..." />
                      </SelectTrigger>
                      <SelectContent>
                        {savedPresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{preset.name}</span>
                              {onDeletePreset && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeletePreset(preset.id)
                                  }}
                                  className="ml-2 hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!showPresetName && onSave && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPresetName(true)}
                      disabled={config.rules.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preset
                    </Button>
                  )}
                  {showPresetName && onSave && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Preset name..."
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        className="w-32"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSavePreset()
                          } else if (e.key === "Escape") {
                            setShowPresetName(false)
                            setPresetName("")
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleSavePreset} disabled={!presetName.trim()}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowPresetName(false)
                          setPresetName("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Base Query */}
              <div className="space-y-2">
                <Label htmlFor="base-query">Search Query</Label>
                <Input
                  id="base-query"
                  placeholder="Enter search keywords..."
                  value={config.query}
                  onChange={(e) => onChange({ ...config, query: e.target.value })}
                />
              </div>

              {/* Boolean Operator Selector */}
              {config.rules.length > 1 && (
                <div className="space-y-2">
                  <Label>Combine Rules With</Label>
                  <Select
                    value={config.booleanOperator}
                    onValueChange={(value) => onChange({ ...config, booleanOperator: value as BooleanOperator })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND (all rules must match)</SelectItem>
                      <SelectItem value="OR">OR (any rule can match)</SelectItem>
                      <SelectItem value="NOT">NOT (exclude matching results)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Rules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Filter Rules</Label>
                  <Button variant="outline" size="sm" onClick={addRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>

                {config.rules.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No rules added yet. Click "Add Rule" to get started.</p>
                  </div>
                )}

                {config.rules.map((rule, index) => {
                  const fieldConfig = getFieldConfig(rule.field)
                  const operatorOptions = getOperatorOptions(fieldConfig.type)

                  return (
                    <Card key={rule.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {index > 0 && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {rule.booleanOperator || config.booleanOperator}
                              </Badge>
                            )}
                            <span className="text-sm font-medium">Rule {index + 1}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRule(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Field */}
                          <div className="space-y-2">
                            <Label className="text-xs">Field</Label>
                            <Select
                              value={rule.field}
                              onValueChange={(value) => {
                                const newFieldConfig = getFieldConfig(value)
                                const newOperatorOptions = getOperatorOptions(newFieldConfig.type)
                                updateRule(rule.id, {
                                  field: value,
                                  operator: newOperatorOptions[0]?.value || "contains",
                                  value: "",
                                })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AVAILABLE_FIELDS.map((field) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator */}
                          <div className="space-y-2">
                            <Label className="text-xs">Operator</Label>
                            <Select
                              value={rule.operator}
                              onValueChange={(value) =>
                                updateRule(rule.id, {
                                  operator: value as AdvancedFilterRule["operator"],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operatorOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Boolean Operator (for rules after first) */}
                          {index > 0 && (
                            <div className="space-y-2">
                              <Label className="text-xs">Combine With</Label>
                              <Select
                                value={rule.booleanOperator || config.booleanOperator}
                                onValueChange={(value) =>
                                  updateRule(rule.id, { booleanOperator: value as BooleanOperator })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">AND</SelectItem>
                                  <SelectItem value="OR">OR</SelectItem>
                                  <SelectItem value="NOT">NOT</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Value Input */}
                        <div className="space-y-2">
                          <Label className="text-xs">Value</Label>
                          {renderRuleValueInput(rule)}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={config.sortBy || "relevance"}
                  onValueChange={(value) =>
                    onChange({ ...config, sortBy: value as "relevance" | "recent" | "popular" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use AND to require all rules to match</li>
                    <li>Use OR to match any of the rules</li>
                    <li>Use NOT to exclude matching results</li>
                    <li>Save frequently used search configurations as presets</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

