"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VerifiedBadge } from "./verified-badge"
import { Building2, MapPin, Globe } from "lucide-react"
import type { Organization, OrganizationType } from "@/lib/types"

interface OrganizationCardProps {
  organization: Organization
  organizationTypeLabels: Record<OrganizationType, string>
}

export function OrganizationCard({
  organization,
  organizationTypeLabels,
}: OrganizationCardProps) {
  return (
    <Link href={`/organizations/${organization.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg truncate">
                    {organization.name}
                  </h3>
                  <VerifiedBadge verifiedAt={organization.verifiedAt} />
                </div>
                <Badge variant="outline" className="mb-2">
                  {organizationTypeLabels[organization.type]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {organization.region && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{organization.region}</span>
            </div>
          )}
          {organization.contact?.city && organization.contact?.state && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {organization.contact.city}, {organization.contact.state}
              </span>
            </div>
          )}
          {organization.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{organization.website}</span>
            </div>
          )}
          {organization.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {organization.description}
            </p>
          )}
          {organization.services && organization.services.length > 0 && (
            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                {organization.services.length} service
                {organization.services.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

