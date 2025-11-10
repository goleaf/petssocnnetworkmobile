"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

interface FilterCarouselProps {
  selectedFilter?: string
  onFilterSelect: (filter: string | undefined) => void
}

const FILTERS = [
  { name: "None", value: undefined, preview: "Original" },
  { name: "Grayscale", value: "grayscale", preview: "B&W" },
  { name: "Sepia", value: "sepia", preview: "Vintage" },
  { name: "Saturate", value: "saturate", preview: "Vibrant" },
  { name: "Contrast", value: "contrast", preview: "Bold" },
  { name: "Brightness", value: "brightness", preview: "Bright" },
  { name: "Blur", value: "blur", preview: "Soft" },
  { name: "Hue Rotate", value: "hue-rotate", preview: "Colorful" },
  { name: "Invert", value: "invert", preview: "Negative" },
]

export function FilterCarousel({
  selectedFilter,
  onFilterSelect,
}: FilterCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const getFilterStyle = (filterValue: string | undefined) => {
    if (!filterValue) return {}

    switch (filterValue) {
      case "grayscale":
        return { filter: "grayscale(100%)" }
      case "sepia":
        return { filter: "sepia(100%)" }
      case "saturate":
        return { filter: "saturate(200%)" }
      case "contrast":
        return { filter: "contrast(150%)" }
      case "brightness":
        return { filter: "brightness(120%)" }
      case "blur":
        return { filter: "blur(2px)" }
      case "hue-rotate":
        return { filter: "hue-rotate(90deg)" }
      case "invert":
        return { filter: "invert(100%)" }
      default:
        return {}
    }
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.name}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-2",
              "scroll-snap-align-center"
            )}
            onClick={() => onFilterSelect(filter.value)}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-lg overflow-hidden border-2",
                selectedFilter === filter.value
                  ? "border-white"
                  : "border-gray-500"
              )}
              style={{
                ...getFilterStyle(filter.value),
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                {filter.preview}
              </div>
            </div>
            <span className="text-white text-xs">{filter.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
