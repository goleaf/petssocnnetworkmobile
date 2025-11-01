"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Building2, AlertTriangle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface BrandAffiliationData {
  disclosed: boolean
  organizationName?: string
  organizationType?: "brand" | "organization" | "sponsor" | "affiliate"
}

interface BrandAffiliationDisclosureProps {
  value: BrandAffiliationData
  onChange: (value: BrandAffiliationData) => void
  required?: boolean
  showReminder?: boolean
  className?: string
}

export function BrandAffiliationDisclosure({
  value,
  onChange,
  required = false,
  showReminder = true,
  className,
}: BrandAffiliationDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(value.disclosed || false)

  const handleDisclosureChange = (disclosed: boolean) => {
    setIsExpanded(disclosed)
    onChange({
      disclosed,
      organizationName: disclosed ? value.organizationName : undefined,
      organizationType: disclosed ? value.organizationType : undefined,
    })
  }

  return (
    <TooltipProvider>
      <div className={className}>
        {showReminder && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Transparency Notice:</strong> If this edit is sponsored, affiliated with a brand, or made on behalf of an organization, please disclose it below. This helps maintain trust and transparency in our community.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="brand-disclosure"
                checked={value.disclosed}
                onCheckedChange={(checked) => handleDisclosureChange(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="brand-disclosure"
                    className="text-sm font-medium cursor-pointer"
                  >
                    This edit is affiliated with a brand or organization
                  </Label>
                  {required && <span className="text-destructive">*</span>}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Please disclose if this edit is sponsored, affiliated with a brand, or made on behalf of an organization. This includes paid partnerships, sponsorships, or any material connection to a brand.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Check this box if your edit has any affiliation with a brand, organization, sponsor, or affiliate relationship.
                </p>
              </div>
            </div>

            {isExpanded && value.disclosed && (
              <div className="pl-7 space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="org-name" className="text-sm font-medium">
                    Organization/Brand Name
                  </Label>
                  <Input
                    id="org-name"
                    value={value.organizationName || ""}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        organizationName: e.target.value || undefined,
                      })
                    }
                    placeholder="e.g., Pet Food Brand, Animal Shelter, etc."
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-type" className="text-sm font-medium">
                    Relationship Type
                  </Label>
                  <Select
                    value={value.organizationType || ""}
                    onValueChange={(type) =>
                      onChange({
                        ...value,
                        organizationType: type as BrandAffiliationData["organizationType"],
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select relationship type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">Brand Partnership</SelectItem>
                      <SelectItem value="organization">Organization Affiliation</SelectItem>
                      <SelectItem value="sponsor">Sponsor</SelectItem>
                      <SelectItem value="affiliate">Affiliate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {value.organizationName && value.organizationType && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                    <Building2 className="h-4 w-4" />
                    <span>
                      Disclosure: This edit is affiliated with <strong>{value.organizationName}</strong> ({value.organizationType.replace("brand", "Brand Partnership").replace("organization", "Organization Affiliation")})
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

