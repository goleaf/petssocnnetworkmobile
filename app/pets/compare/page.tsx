"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth"
import { getPetsByOwnerId } from "@/lib/storage"
import { getPetsByOwnerIdDecrypted } from "@/lib/pet-health-storage"
import type { Pet } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { SparklineChart } from "@/components/dashboard/sparkline-chart"
import { Download } from "lucide-react"
import { useRouter } from "next/navigation"

function isVaccinationsUpToDate(pet: Pet): boolean {
  if (!pet.vaccinations || pet.vaccinations.length === 0) return false
  const now = Date.now()
  return pet.vaccinations.every((v) => !v.nextDue || new Date(v.nextDue).getTime() > now)
}

function activeMedicationsCount(pet: Pet): number {
  if (!pet.medications) return 0
  const now = Date.now()
  return pet.medications.filter((m) => {
    const start = new Date(m.startDate).getTime()
    const end = m.endDate ? new Date(m.endDate).getTime() : Number.POSITIVE_INFINITY
    return start <= now && now <= end
  }).length
}

function buildActivitySeries(pet: Pet): number[] {
  // Generate a deterministic pseudo-random sparkline series using pet id hash + energy level
  const seed = Array.from(pet.id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const baseline = (pet.personality?.energyLevel ?? 3) * 10
  const arr: number[] = []
  let x = seed % 97
  for (let i = 0; i < 14; i++) {
    x = (x * 31 + 7) % 100
    arr.push(Math.max(5, Math.min(100, baseline + ((x % 21) - 10))))
  }
  return arr
}

export default function ComparePetsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    getPetsByOwnerIdDecrypted(user.id).then(setPets)
  }, [user?.id])

  const selectedPets = useMemo(() => pets.filter((p) => selectedIds.includes(p.id)), [pets, selectedIds])
  const canSelectMore = selectedIds.length < 4

  const toggleSelect = (petId: string) => {
    setSelectedIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : canSelectMore ? [...prev, petId] : prev,
    )
  }

  const handleExport = () => {
    // Simple print-to-PDF flow, relies on browser print dialog
    window.print()
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <p className="text-center text-muted-foreground">Sign in to compare your pets.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-10 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Compare Pets</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export as PDF
        </Button>
      </div>

      {/* Selection Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select up to 4 pets</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pets.map((pet) => {
            const checked = selectedIds.includes(pet.id)
            return (
              <label key={pet.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-accent cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={() => toggleSelect(pet.id)} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                  <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{pet.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{pet.breed ? `${pet.species} • ${pet.breed}` : pet.species}</div>
                </div>
              </label>
            )
          })}
        </CardContent>
      </Card>

      {/* Comparison Grid */}
      {selectedPets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
          {selectedPets.map((pet) => {
            const upToDate = isVaccinationsUpToDate(pet)
            const meds = activeMedicationsCount(pet)
            const series = buildActivitySeries(pet)
            return (
              <Card key={pet.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg leading-tight">{pet.name}</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {pet.species}{pet.breed ? ` • ${pet.breed}` : ""}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Age</div>
                      <div>{typeof pet.age === 'number' ? `${pet.age} yr` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Weight</div>
                      <div>{pet.weight ?? '—'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground">Health</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={upToDate ? 'secondary' : 'destructive'}>
                          {upToDate ? 'Vaccinations up-to-date' : 'Vaccinations due'}
                        </Badge>
                        <Badge variant={meds > 0 ? 'secondary' : 'outline'}>
                          {meds > 0 ? `${meds} active medication${meds>1?'s':''}` : 'No active meds'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Activity (last 2 weeks)</div>
                    <div className="h-16">
                      <SparklineChart data={series} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Select pets above to compare.</div>
      )}
    </div>
  )
}
