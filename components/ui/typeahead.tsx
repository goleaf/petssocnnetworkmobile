"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TypeaheadOption {
  value: string
  label: string
  [key: string]: unknown
}

interface TypeaheadProps {
  options: TypeaheadOption[]
  value: string
  onValueChange: (value: string) => void
  onSelect?: (option: TypeaheadOption) => void
  placeholder?: string
  emptyMessage?: string
  emptyStateCTA?: {
    label: string
    onClick: () => void
  }
  debounceMs?: number
  disabled?: boolean
  error?: boolean
  className?: string
  renderOption?: (option: TypeaheadOption, query: string) => React.ReactNode
  filterOptions?: (options: TypeaheadOption[], query: string) => TypeaheadOption[]
  maxResults?: number
  minQueryLength?: number
}

// Default filter function that highlights matches
const defaultFilterOptions = (
  options: TypeaheadOption[],
  query: string
): TypeaheadOption[] => {
  if (!query.trim()) return []
  const lowerQuery = query.toLowerCase().trim()
  return options.filter((opt) =>
    opt.label.toLowerCase().includes(lowerQuery)
  )
}

// Highlight matching text in label
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text

  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let index = lowerText.indexOf(lowerQuery, lastIndex)

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    // Add highlighted match
    parts.push(
      <mark
        key={index}
        className="bg-primary/20 text-primary font-medium rounded px-0.5"
      >
        {text.slice(index, index + query.length)}
      </mark>
    )
    lastIndex = index + query.length
    index = lowerText.indexOf(lowerQuery, lastIndex)
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function Typeahead({
  options,
  value,
  onValueChange,
  onSelect,
  placeholder = "Type to search...",
  emptyMessage = "No results found",
  emptyStateCTA,
  debounceMs = 300,
  disabled = false,
  error = false,
  className,
  renderOption,
  filterOptions = defaultFilterOptions,
  maxResults = 10,
  minQueryLength = 1,
}: TypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Debounce the query for filtering
  const debouncedQuery = useDebounce(query, debounceMs)

  // Filter options based on debounced query
  const filteredOptions = React.useMemo(() => {
    if (debouncedQuery.length < minQueryLength) return []
    const filtered = filterOptions(options, debouncedQuery)
    return filtered.slice(0, maxResults)
  }, [options, debouncedQuery, filterOptions, maxResults, minQueryLength])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [highlightedIndex])

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setQuery(newValue)
      onValueChange(newValue)
      setIsOpen(true)
      setHighlightedIndex(-1)
    },
    [onValueChange]
  )

  // Handle option selection
  const handleSelect = useCallback(
    (option: TypeaheadOption) => {
      setQuery(option.label)
      onValueChange(option.label)
      if (onSelect) {
        onSelect(option)
      }
      setIsOpen(false)
      setHighlightedIndex(-1)
      inputRef.current?.blur()
    },
    [onValueChange, onSelect]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setIsOpen(true)
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break

        case "ArrowUp":
          e.preventDefault()
          setIsOpen(true)
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break

        case "Enter":
          e.preventDefault()
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredOptions.length
          ) {
            handleSelect(filteredOptions[highlightedIndex])
          } else if (filteredOptions.length === 1) {
            handleSelect(filteredOptions[0])
          }
          break

        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          setHighlightedIndex(-1)
          inputRef.current?.blur()
          break

        case "Tab":
          setIsOpen(false)
          setHighlightedIndex(-1)
          break

        default:
          setIsOpen(true)
      }
    },
    [disabled, filteredOptions, highlightedIndex, handleSelect]
  )

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (!disabled && query.length >= minQueryLength) {
      setIsOpen(true)
    }
  }, [disabled, query.length, minQueryLength])

  // Handle input blur (with delay to allow option clicks)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 200)
  }, [])

  // Get active descendant ID
  const getActiveDescendantId = () => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
      return `typeahead-option-${highlightedIndex}`
    }
    return undefined
  }

  const activeDescendantId = getActiveDescendantId()
  const showResults =
    isOpen && !disabled && debouncedQuery.length >= minQueryLength
  const hasResults = filteredOptions.length > 0
  const showEmptyState =
    showResults && !hasResults && debouncedQuery.length >= minQueryLength

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="typeahead-listbox"
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
          className={cn("pl-10", error && "border-destructive")}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("")
              onValueChange("")
              setIsOpen(false)
              setHighlightedIndex(-1)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear input"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showResults && (
        <Card className="absolute z-50 mt-2 w-full min-w-[200px] max-h-[min(300px,calc(100vh-200px))] overflow-hidden border shadow-xl bg-popover animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200">
          <CardContent className="p-0">
            {showEmptyState ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {emptyMessage}
                </p>
                {emptyStateCTA && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      emptyStateCTA.onClick()
                      setIsOpen(false)
                      setHighlightedIndex(-1)
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {emptyStateCTA.label}
                  </Button>
                )}
              </div>
            ) : (
              <ul
                ref={listRef}
                id="typeahead-listbox"
                role="listbox"
                className="max-h-[min(300px,calc(100vh-200px))] overflow-y-auto overscroll-contain"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "hsl(var(--border)) transparent",
                }}
              >
                {filteredOptions.map((option, index) => {
                  const isHighlighted = index === highlightedIndex
                  const optionId = `typeahead-option-${index}`

                  return (
                    <li
                      key={option.value}
                      id={optionId}
                      role="option"
                      aria-selected={isHighlighted}
                      className={cn(
                        "px-4 py-2 text-sm cursor-pointer transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground outline-none",
                        isHighlighted && "bg-accent text-accent-foreground"
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(option)
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      {renderOption
                        ? renderOption(option, debouncedQuery)
                        : highlightMatch(option.label, debouncedQuery)}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
