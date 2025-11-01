"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import {
  getOrganizationById,
  getExpertProfiles,
} from "@/lib/storage"
import type { Organization, OrganizationType } from "@/lib/types"
import {
  Building2,
  MapPin,
  Globe,
  CheckCircle,
  User,
  Award,
} from "lucide-react"
import Link from "next/link"

const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  clinic: "Veterinary Clinic",
  shelter: "Animal Shelter",
  rescue: "Rescue Organization",
  "non-profit": "Non-Profit Organization",
  other: "Other Organization",
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundOrg = getOrganizationById(id)

    if (!foundOrg) {
      setIsLoading(false)
      router.push("/organizations")
      return
    }

    setOrganization(foundOrg)
    setIsLoading(false)
  }, [id, router])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!organization) {
    return null
  }

  const expertProfiles = getExpertProfiles().filter(
    (profile) => profile.verifiedAt && profile.userId
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl">{organization.name}</CardTitle>
                      {organization.verifiedAt && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">{ORGANIZATION_TYPE_LABELS[organization.type]}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organization.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {organization.website}
                    </a>
                  </div>
                )}
                {organization.locGeo && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">
                      {organization.locGeo.latitude.toFixed(4)},
                      {organization.locGeo.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
                {organization.verifiedAt && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Verified on{" "}
                      {new Date(organization.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verified Experts */}
          {expertProfiles.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Verified Experts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expertProfiles.map((profile) => (
                    <Card key={profile.userId} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{profile.credential}</p>
                            {profile.region && (
                              <p className="text-sm text-muted-foreground">
                                {profile.region}
                              </p>
                            )}
                            {profile.licenseNo && (
                              <p className="text-xs text-muted-foreground">
                                License: {profile.licenseNo}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Type</p>
                  <p className="text-sm text-muted-foreground">
                    {ORGANIZATION_TYPE_LABELS[organization.type]}
                  </p>
                </div>
                {organization.verifiedAt && (
                  <div>
                    <p className="text-sm font-medium mb-1">Verification Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Verified</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

