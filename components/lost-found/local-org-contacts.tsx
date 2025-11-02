"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Globe, Mail } from "lucide-react"
import type { WikiArticle } from "@/lib/types"
import { getWikiArticles } from "@/lib/storage"

interface LocalOrgContactsProps {
  location: {
    city?: string
    state?: string
    country?: string
    latitude?: number
    longitude?: number
  }
  className?: string
}

interface Organization {
  name: string
  type: "shelter" | "rescue" | "vet" | "animal_control"
  phone?: string
  website?: string
  email?: string
  address?: string
  distance?: number
}

export function LocalOrgContacts({ location, className }: LocalOrgContactsProps) {
  const organizations = React.useMemo<Organization[]>(() => {
    // In a real app, this would fetch from an API or database
    // For now, we'll extract from wiki articles and simulate
    const allArticles = getWikiArticles()
    const orgs: Organization[] = []
    
    const locationKey = [
      location.city,
      location.state,
      location.country,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    
    // Find wiki articles about local organizations
    const orgArticles = allArticles.filter(
      (article) =>
        (article.title.toLowerCase().includes("shelter") ||
          article.title.toLowerCase().includes("rescue") ||
          article.title.toLowerCase().includes("organization")) &&
        (article.content.toLowerCase().includes(locationKey) ||
          article.tags.some((tag) => tag.toLowerCase().includes(locationKey)))
    )
    
    // Extract organization info from articles (simplified)
    orgArticles.slice(0, 5).forEach((article) => {
      // In a real implementation, you'd parse structured data from the article
      // For now, we'll create placeholder organizations
      orgs.push({
        name: article.title,
        type: article.title.toLowerCase().includes("shelter")
          ? "shelter"
          : article.title.toLowerCase().includes("rescue")
          ? "rescue"
          : "shelter",
        address: location.city && location.state
          ? `${location.city}, ${location.state}`
          : undefined,
      })
    })
    
    // Add some sample organizations if none found
    if (orgs.length === 0 && location.city) {
      orgs.push(
        {
          name: `${location.city} Animal Shelter`,
          type: "shelter",
          phone: "(555) 123-4567",
          address: location.city,
        },
        {
          name: `${location.city} Pet Rescue`,
          type: "rescue",
          website: "https://example.com",
          address: location.city,
        },
        {
          name: `${location.city} Animal Control`,
          type: "animal_control",
          phone: "(555) 987-6543",
          address: location.city,
        }
      )
    }
    
    return orgs
  }, [location])
  
  if (organizations.length === 0) {
    return null
  }
  
  const getTypeLabel = (type: Organization["type"]) => {
    const labels = {
      shelter: "Shelter",
      rescue: "Rescue",
      vet: "Veterinarian",
      animal_control: "Animal Control",
    }
    return labels[type]
  }
  
  const getTypeColor = (type: Organization["type"]) => {
    const colors = {
      shelter: "bg-blue-100 text-blue-800",
      rescue: "bg-purple-100 text-purple-800",
      vet: "bg-green-100 text-green-800",
      animal_control: "bg-orange-100 text-orange-800",
    }
    return colors[type]
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Local Organizations
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {location.city && `${location.city}, `}
          {location.state && `${location.state}, `}
          {location.country}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {organizations.map((org, index) => (
          <div
            key={index}
            className="p-3 rounded-md border bg-background hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1">{org.name}</h4>
                <Badge
                  variant="secondary"
                  className={`text-xs mt-1 ${getTypeColor(org.type)}`}
                >
                  {getTypeLabel(org.type)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1 mt-2">
              {org.address && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">{org.address}</span>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <a
                    href={`tel:${org.phone}`}
                    className="hover:text-primary transition-colors"
                  >
                    {org.phone}
                  </a>
                </div>
              )}
              {org.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <a
                    href={`mailto:${org.email}`}
                    className="hover:text-primary transition-colors line-clamp-1"
                  >
                    {org.email}
                  </a>
                </div>
              )}
              {org.website && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors line-clamp-1"
                  >
                    Visit website
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        
        <Button asChild variant="outline" size="sm" className="w-full mt-4">
          <Link href="/wiki?category=care&tags=organization,shelter,rescue">
            Find more organizations
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

