"use client"

import { useEffect, useRef } from "react"

interface PlaceMapProps {
  lat: number
  lng: number
  name: string
  address: string
  className?: string
}

export function PlaceMap({ lat, lng, name, address, className = "" }: PlaceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Create OpenStreetMap embed using Leaflet
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`

    // Create iframe for map
    const iframe = document.createElement("iframe")
    iframe.setAttribute("width", "100%")
    iframe.setAttribute("height", "100%")
    iframe.setAttribute("frameborder", "0")
    iframe.setAttribute("scrolling", "no")
    iframe.setAttribute("marginheight", "0")
    iframe.setAttribute("marginwidth", "0")
    iframe.src = mapUrl
    iframe.title = `Map of ${name} at ${address}`
    iframe.className = "border-0 w-full h-full"

    mapRef.current.innerHTML = ""
    mapRef.current.appendChild(iframe)

    return () => {
      if (mapRef.current) {
        mapRef.current.innerHTML = ""
      }
    }
  }, [lat, lng, name, address])

  return (
    <div className={`w-full rounded-lg overflow-hidden border min-h-[300px] ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[300px]" />
      <div className="bg-muted p-2 text-xs text-center text-muted-foreground border-t">
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View larger map
        </a>
      </div>
    </div>
  )
}

