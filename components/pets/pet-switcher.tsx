"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Plus, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { getPetsByOwnerId, getPetById } from "@/lib/storage"
import type { Pet, User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { getCurrentPetId, setCurrentPetId } from "@/lib/pets/current-pet"

type SortOption = "recent" | "alpha" | "species" | "age"

function normalizeCreatedAt(pet: Pet): number {
  // Use adoptionDate, then birthday, else fallback to 0
  const d = pet.adoptionDate || pet.birthday
  return d ? new Date(d).getTime() : 0
}

function petSort(sortBy: SortOption, a: Pet, b: Pet): number {
  switch (sortBy) {
    case "recent":
      return normalizeCreatedAt(b) - normalizeCreatedAt(a)
    case "alpha":
      return a.name.localeCompare(b.name)
    case "species":
      return a.species.localeCompare(b.species)
    case "age":
      // Missing age sorts last; higher age first
      return (b.age ?? -1) - (a.age ?? -1)
  }
}

export function PetSwitcher() {
  const { user } = useAuth()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [currentPet, setCurrentPet] = useState<Pet | null>(null)

  // Load pets for the signed-in user
  useEffect(() => {
    if (!user) return
    const list = getPetsByOwnerId(user.id)
    setPets(list)

    // Resolve current pet
    const stored = getCurrentPetId()
    if (stored) {
      const p = getPetById(stored)
      if (p && p.ownerId === user.id) {
        setCurrentPet(p)
      } else if (list.length) {
        setCurrentPet(list[0]!)
      }
    } else if (list.length) {
      setCurrentPet(list[0]!)
    }
  }, [user?.id])

  useEffect(() => {
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<{ petId: string }>).detail
      const pid = detail?.petId
      if (!pid) return
      const updated = getPetById(pid)
      if (updated) setCurrentPet(updated)
    }
    window.addEventListener("pet_social_current_pet_changed", handler)
    return () => window.removeEventListener("pet_social_current_pet_changed", handler)
  }, [])

  const filtered = useMemo(() => {
    const base = [...pets].sort((a, b) => petSort(sortBy, a, b))
    if (!query.trim()) return base
    const q = query.trim().toLowerCase()
    return base.filter((p) => `${p.name} ${p.breed ?? ""} ${p.species}`.toLowerCase().includes(q))
  }, [pets, query, sortBy])

  if (!user) return null

  const petCount = pets.length
  const needsSearch = petCount >= 10
  const username = (user as User).username

  const handlePick = (pet: Pet) => {
    setCurrentPetId(pet.id)
    setOpen(false)
    router.push(getPetUrlFromPet(pet))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {currentPet ? (
            <span className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentPet.avatar || "/placeholder.svg"} alt={currentPet.name} />
                <AvatarFallback>{currentPet.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{currentPet.name}</span>
              <ChevronDown className="h-4 w-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Pets
              <ChevronDown className="h-4 w-4" />
            </span>
          )}
          {petCount > 0 && (
            <span className="absolute -top-2 -right-2 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
              {petCount} {petCount === 1 ? "pet" : "pets"}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="p-3 border-b space-y-2">
          <DropdownMenuLabel className="px-0 py-0">Your Pets</DropdownMenuLabel>
          <div className="flex gap-2 items-center">
            {needsSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pets…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            )}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="alpha">Alphabetical</SelectItem>
                <SelectItem value="species">Species</SelectItem>
                <SelectItem value="age">Age</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="max-h-[360px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">No pets found</div>
          ) : (
            filtered.map((pet) => {
              const isActive = currentPet?.id === pet.id
              return (
                <DropdownMenuItem
                  key={pet.id}
                  onClick={() => handlePick(pet)}
                  className={cn("gap-2 cursor-pointer", isActive && "bg-accent/60")}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                    <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-tight truncate">{pet.name}</div>
                    <div className="text-xs text-muted-foreground leading-tight truncate">
                      {pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}
                    </div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2 flex gap-2">
          <Link href={`/user/${username}/add-pet`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Pet
            </Button>
          </Link>
          <Link href="/pets/compare" className="hidden sm:block">
            <Button variant="ghost">Compare</Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
