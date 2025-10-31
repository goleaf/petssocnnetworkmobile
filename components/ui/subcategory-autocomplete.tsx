"use client"

import { useMemo } from "react"
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete"
import type { GroupSubcategory } from "@/lib/types"

interface SubcategoryAutocompleteProps {
  subcategories: GroupSubcategory[]
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

export function SubcategoryAutocomplete({
  subcategories,
  value,
  onValueChange,
  placeholder = "Select subcategory...",
  className,
}: SubcategoryAutocompleteProps) {
  // Convert subcategories to AutocompleteOption format
  const options: AutocompleteOption[] = useMemo(
    () =>
      subcategories.map((sub) => ({
        value: sub.id,
        label: sub.name,
        groupCount: sub.groupCount,
      })),
    [subcategories]
  )

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === value ? null : newValue)
  }

  const renderOption = (option: AutocompleteOption) => {
    return (
      <div className="flex items-center justify-between">
        <span>{option.label}</span>
        {option.groupCount !== undefined && (
          <span className="text-xs text-muted-foreground ml-2">
            ({option.groupCount})
          </span>
        )}
      </div>
    )
  }

  return (
    <Autocomplete
      options={options}
      value={value || ""}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search subcategories..."
      emptyMessage="No subcategories found"
      className={className}
      renderOption={renderOption}
    />
  )
}

