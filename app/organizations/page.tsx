"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Building2,
  MapPin,
  Globe,
  CheckCircle,
  Plus,
  Filter,
} from "lucide-react"
import Link from "next/link"
import {
  getOrganizations,
  getVerifiedOrganizations,
} from "@/lib/storage"
import type { Organization, OrganizationType } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const ORGANIZATIONS_PER_PAGE = 12

const ORGANIZATION_TYPES: OrganizationType[] = ["clinic", "shelter", "rescue", "non-profit", "other"]

const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  clinic: "Clinic",
  shelter: "Shelter",
  rescue: "Rescue",
  "non-profit": "Non-Profit",
  other: "Other",
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<OrganizationType | "all">("all")
  const [showOnlyVerified, setShowOnlyVerified] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (typeof window === "undefined") return

    let orgs = showOnlyVerified ? getVerifiedOrganizations() : getOrganizations()

    // Filter by type
    if (selectedType !== "all") {
      orgs = orgs.filter((org) => org.type === selectedType)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      orgs = orgs.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.website?.toLowerCase().includes(query)
      )
    }

    setOrganizations(orgs)
    setIsLoading(false)
  }, [searchQuery, selectedType, showOnlyVerified])

  const totalPages = Math.ceil(organizations.length / ORGANIZATIONS_PER_PAGE)
  const displayedOrgs = organizations.slice(
    (currentPage - 1) * ORGANIZATIONS_PER_PAGE,
    currentPage * ORGANIZATIONS_PER_PAGE
  )

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Organizations</h1>
            <p className="text-muted-foreground">
              Find verified pet organizations, clinics, shelters, and rescues
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OrganizationType | "all")}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Types</option>
              {ORGANIZATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ORGANIZATION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            <Button
              variant={showOnlyVerified ? "default" : "outline"}
              onClick={() => setShowOnlyVerified(!showOnlyVerified)}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Verified Only
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {organizations.length} organization{organizations.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Organizations Grid */}
      {displayedOrgs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No organizations found</p>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOrgs.map((org) => (
            <Link key={org.id} href={`/organizations/${org.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{org.name}</CardTitle>
                    {org.verifiedAt && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">{ORGANIZATION_TYPE_LABELS[org.type]}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {org.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="truncate">{org.website}</span>
                      </div>
                    )}
                    {org.locGeo && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {org.locGeo.latitude.toFixed(4)}, {org.locGeo.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

