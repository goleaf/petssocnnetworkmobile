"use client"

import { useMemo } from "react"
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete"

interface CityAutocompleteProps {
  cities: string[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
}

export function CityAutocomplete({
  cities,
  value,
  onValueChange,
  placeholder = "Select city...",
  disabled = false,
  error = false,
  className,
}: CityAutocompleteProps) {
  // Convert cities array to AutocompleteOption format
  const options: AutocompleteOption[] = useMemo(
    () => cities.map((city) => ({ value: city, label: city })),
    [cities]
  )

  return (
    <Autocomplete
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search cities..."
      emptyMessage="No cities found"
      disabled={disabled}
      error={error}
      className={className}
    />
  )
}

