import { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getWikiArticlesByCategory } from "@/lib/storage"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Pet Species | Pet Social Network",
  description: "Browse all pet species available in our network",
}

const SPECIES_LIST = [
  { id: "dog", name: "Dogs", icon: "🐕" },
  { id: "cat", name: "Cats", icon: "🐈" },
  { id: "bird", name: "Birds", icon: "🐦" },
  { id: "rabbit", name: "Rabbits", icon: "🐰" },
  { id: "hamster", name: "Hamsters", icon: "🐹" },
  { id: "fish", name: "Fish", icon: "🐠" },
  { id: "other", name: "Other", icon: "🐾" },
]

export default async function SpeciesPage() {
  // Get all breed articles to count breeds per species
  const breedArticles = getWikiArticlesByCategory("breeds")
  
  // Count breeds per species
  const speciesCounts: Record<string, number> = {}
  
  breedArticles.forEach((article) => {
    if (article.infobox && typeof article.infobox === "object") {
      const infobox = article.infobox as Record<string, unknown>
      const species = infobox.species as string | undefined
      if (species) {
        speciesCounts[species] = (speciesCounts[species] || 0) + 1
      }
    }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Pet Species</h1>
          <p className="text-muted-foreground">
            Explore different pet species and their breeds
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIES_LIST.map((species) => {
            const breedCount = speciesCounts[species.id] || 0
            
            return (
              <Link key={species.id} href={`/species/${species.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{species.icon}</span>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{species.name}</CardTitle>
                        {breedCount > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {breedCount} {breedCount === 1 ? "breed" : "breeds"} available
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mt-2">
                      View breeds →
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

