"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Crosshair } from "lucide-react"
import { getApprovedPlaces, getPlacesNearLocation } from "@/lib/storage"
import type { Place } from "@/lib/types"

export interface LocationSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selected: Place | null
  onSelect: (place: Place | null) => void
}

export function LocationSelector({ open, onOpenChange, selected, onSelect }: LocationSelectorProps) {
  const [query, setQuery] = useState("")
  const [places, setPlaces] = useState<Place[]>([])
  const [nearby, setNearby] = useState<Place[] | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    setPlaces(getApprovedPlaces())
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return places
    return places.filter((p) => `${p.name} ${p.address}`.toLowerCase().includes(q))
  }, [query, places])

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const list = getPlacesNearLocation(lat, lng, 25)
        setNearby(list)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 5000 }
    )
  }

  const pick = (p: Place) => {
    onSelect(p)
    onOpenChange(false)
  }

  const clear = () => {
    onSelect(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Search places" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={locating}>
              <Crosshair className="h-4 w-4 mr-2" /> {locating ? 'Locating...' : 'Nearby'}
            </Button>
          </div>

          {nearby && nearby.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Nearby</div>
              <div className="max-h-56 overflow-auto divide-y rounded border">
                {nearby.map((p) => (
                  <button key={p.id} type="button" className="w-full text-left p-2 hover:bg-accent flex items-center gap-2" onClick={() => pick(p)}>
                    <MapPin className="h-4 w-4 text-primary" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                    </div>
                  </button>
                ))}
                {nearby.length === 0 && <div className="p-2 text-sm text-muted-foreground">No nearby places</div>}
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-auto divide-y rounded border">
            {filtered.map((p) => (
              <button key={p.id} type="button" className="w-full text-left p-2 hover:bg-accent flex items-center gap-2" onClick={() => pick(p)}>
                <MapPin className="h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-2 text-sm text-muted-foreground">No places found</div>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {selected && <Button variant="destructive" onClick={clear}>Clear location</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LocationSelector

