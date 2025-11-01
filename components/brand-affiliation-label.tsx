"use client"

import { Badge } from "@/components/ui/badge"
import { Building2, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BrandAffiliationLabelProps {
  brandAffiliation?: {
    disclosed: boolean
    organizationName?: string
    organizationType?: "brand" | "organization" | "sponsor" | "affiliate"
    disclosureMissing?: boolean
  }
  variant?: "default" | "compact"
}

export function BrandAffiliationLabel({ brandAffiliation, variant = "default" }: BrandAffiliationLabelProps) {
  if (!brandAffiliation) return null

  if (brandAffiliation.disclosureMissing) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {variant === "compact" ? "Missing Disclosure" : "Missing Brand Disclosure"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              This revision/edit is missing a required brand/organization affiliation disclosure and requires moderation review.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (brandAffiliation.disclosed && brandAffiliation.organizationName) {
    const typeLabels = {
      brand: "Brand Partnership",
      organization: "Organization Affiliation",
      sponsor: "Sponsor",
      affiliate: "Affiliate",
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {variant === "compact" 
                ? brandAffiliation.organizationName
                : `${brandAffiliation.organizationName} (${typeLabels[brandAffiliation.organizationType || "brand"]})`
              }
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              This revision/edit is affiliated with <strong>{brandAffiliation.organizationName}</strong> 
              ({typeLabels[brandAffiliation.organizationType || "brand"]}).
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return null
}

