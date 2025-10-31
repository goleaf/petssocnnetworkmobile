"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
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
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedSubcategory = value
    ? subcategories.find((sub) => sub.id === value)
    : null

  // Filter subcategories based on search query
  const filteredSubcategories = subcategories.filter((subcategory) =>
    subcategory.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery("")
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

  const handleSelect = (subcategoryId: string) => {
    onValueChange(subcategoryId === value ? null : subcategoryId)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(null)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30"
        )}
      >
        <span className={cn("truncate", !selectedSubcategory && "text-muted-foreground")}>
          {selectedSubcategory ? selectedSubcategory.name : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {selectedSubcategory && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 mt-1 w-full min-w-[200px] max-h-[300px] overflow-hidden border shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false)
                    setSearchQuery("")
                  }
                }}
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {filteredSubcategories.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No subcategories found
              </div>
            ) : (
              <div className="p-1">
                {filteredSubcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => handleSelect(subcategory.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground outline-none",
                      value === subcategory.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{subcategory.name}</span>
                      {subcategory.groupCount !== undefined && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({subcategory.groupCount})
                        </span>
                      )}
                    </div>
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

