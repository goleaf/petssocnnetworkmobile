"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { getPetsByOwnerId, getPetById } from "@/lib/storage"
import type { Pet } from "@/lib/types"

const RECENTS_KEY = "pet_social_recent_tagged_pets"

export interface PetTagSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selected: string[]
  onChange: (petIds: string[]) => void
}

export function PetTagSelector({ open, onOpenChange, selected, onChange }: PetTagSelectorProps) {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [query, setQuery] = useState("")
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    setPets(getPetsByOwnerId(user.id))
    try {
      const raw = localStorage.getItem(RECENTS_KEY)
      setRecents(raw ? (JSON.parse(raw) as string[]) : [])
    } catch { setRecents([]) }
  }, [user?.id])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = [...pets]
    return q ? base.filter((p) => `${p.name} ${p.species} ${p.breed ?? ''}`.toLowerCase().includes(q)) : base
  }, [pets, query])

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    onChange(next)
  }

  const save = () => {
    try {
      const next = Array.from(new Set([...selected, ...recents])).slice(0, 10)
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
    } catch {}
    onOpenChange(false)
  }

  const recentPets: Pet[] = recents.map((id) => getPetById(id)).filter(Boolean) as Pet[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tag Pets</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Search your pets..." value={query} onChange={(e) => setQuery(e.target.value)} />

          {recentPets.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Recently tagged</div>
              <div className="flex flex-wrap gap-2">
                {recentPets.map((p) => (
                  <button key={p.id} type="button" className="px-2 py-1 rounded-full border text-sm hover:bg-accent" onClick={() => toggle(p.id)}>
                    {selected.includes(p.id) ? '✓ ' : ''}{p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-auto divide-y rounded border">
            {filtered.map((p) => (
              <label key={p.id} className="flex items-center gap-3 p-2 cursor-pointer">
                <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                <Avatar className="h-7 w-7">
                  <AvatarImage src={p.avatar || '/placeholder.svg'} alt={p.name} />
                  <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.species}{p.breed ? ` • ${p.breed}` : ''}</div>
                </div>
              </label>
            ))}
            {filtered.length === 0 && <div className="p-3 text-sm text-muted-foreground">No pets found</div>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PetTagSelector

