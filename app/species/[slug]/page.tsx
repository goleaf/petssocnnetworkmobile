import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getWikiArticlesByCategory } from "@/lib/storage"
import { parseBreedInfobox, type BreedInfoboxOutput } from "@/lib/schemas/breed-infobox"
import type { WikiArticle } from "@/lib/types"

const SPECIES_MAP: Record<string, { name: string; icon: string }> = {
  dog: { name: "Dogs", icon: "🐕" },
  cat: { name: "Cats", icon: "🐈" },
  bird: { name: "Birds", icon: "🐦" },
  rabbit: { name: "Rabbits", icon: "🐰" },
  hamster: { name: "Hamsters", icon: "🐹" },
  fish: { name: "Fish", icon: "🐠" },
  other: { name: "Other", icon: "🐾" },
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const speciesInfo = SPECIES_MAP[slug]
  
  if (!speciesInfo) {
    return {
      title: "Species Not Found",
    }
  }

  return {
    title: `${speciesInfo.name} Breeds | Pet Social Network`,
    description: `Browse all ${speciesInfo.name.toLowerCase()} breeds available`,
  }
}

export default async function SpeciesDetailPage({ params }: Props) {
  const { slug } = await params
  const speciesInfo = SPECIES_MAP[slug]

  if (!speciesInfo) {
    notFound()
  }

  // Get all breed articles
  const breedArticles = getWikiArticlesByCategory("breeds")
  
  // Filter breeds by species
  const breedsForSpecies: Array<{ article: WikiArticle; infobox: BreedInfoboxOutput }> = []
  
  breedArticles.forEach((article) => {
    if (article.infobox && typeof article.infobox === "object") {
      const parsed = parseBreedInfobox(article.infobox)
      if (parsed.success && parsed.data.species === slug) {
        breedsForSpecies.push({ article, infobox: parsed.data })
      }
    }
  })

  // Sort by official name
  breedsForSpecies.sort((a, b) => 
    a.infobox.officialName.localeCompare(b.infobox.officialName)
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        <div>
          <Link 
            href="/species" 
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to all species
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-5xl">{speciesInfo.icon}</span>
            <div>
              <h1 className="text-4xl font-bold">{speciesInfo.name} Breeds</h1>
              <p className="text-muted-foreground mt-1">
                {breedsForSpecies.length} {breedsForSpecies.length === 1 ? "breed" : "breeds"} available
              </p>
            </div>
          </div>
        </div>

        {breedsForSpecies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No breeds available for this species yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {breedsForSpecies.map(({ article, infobox }) => (
              <Link key={article.id} href={`/breeds/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{infobox.officialName}</CardTitle>
                    {infobox.aliases && infobox.aliases.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Also known as: {infobox.aliases.slice(0, 2).join(", ")}
                        {infobox.aliases.length > 2 && "..."}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {infobox.sizeClass && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {infobox.sizeClass}
                        </Badge>
                      )}
                      {infobox.originCountry && (
                        <Badge variant="outline" className="text-xs">
                          {infobox.originCountry}
                        </Badge>
                      )}
                    </div>
                    {infobox.lifeExpectancyYears && (
                      <p className="text-sm text-muted-foreground">
                        Life expectancy: {infobox.lifeExpectancyYears} years
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2">
                      View details →
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

