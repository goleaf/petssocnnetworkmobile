"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface AutocompleteOption {
  value: string
  label: string
  [key: string]: unknown
}

interface AutocompleteProps {
  options: AutocompleteOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  error?: boolean
  className?: string
  displayValue?: (option: AutocompleteOption | undefined) => string
  renderOption?: (option: AutocompleteOption) => React.ReactNode
}

export function Autocomplete({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  disabled = false,
  error = false,
  className,
  displayValue,
  renderOption,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter((opt) => opt.label.toLowerCase().includes(query))
  }, [options, searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery("")
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("")
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      )
      if (listRef.current && highlightedIndex < filteredOptions.length - 1) {
        const nextItem = listRef.current.children[highlightedIndex + 1] as HTMLButtonElement
        nextItem?.scrollIntoView({ block: "nearest" })
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      if (listRef.current && highlightedIndex > 0) {
        const prevItem = listRef.current.children[highlightedIndex - 1] as HTMLButtonElement
        prevItem?.scrollIntoView({ block: "nearest" })
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex !== -1 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value)
      } else if (searchQuery && filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setSearchQuery("")
    }
  }

  const getDisplayValue = () => {
    if (displayValue) {
      return displayValue(selectedOption)
    }
    return selectedOption ? selectedOption.label : placeholder
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          isOpen && "ring-2 ring-ring ring-offset-2",
          !value && "text-muted-foreground",
          "dark:bg-input/30"
        )}
      >
        <span className="truncate text-left">
          {getDisplayValue()}
        </span>
        <div className="flex items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <Card className="absolute z-50 mt-0.5 w-full min-w-[200px] max-h-[min(280px,calc(100vh-200px))] overflow-hidden border shadow-xl bg-popover animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200">
          <div className="p-2 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 h-9 bg-background"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div
            ref={listRef}
            className="max-h-[min(220px,calc(100vh-240px))] overflow-y-auto overscroll-contain custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--border)) transparent',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground outline-none",
                      value === option.value && "bg-accent text-accent-foreground font-medium",
                      highlightedIndex === index && "bg-accent text-accent-foreground"
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                  >
                    {renderOption ? renderOption(option) : option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

