"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, FileText, MapPin } from "lucide-react"
import type { OrganizationNonprofitInfo } from "@/lib/types"

interface NonprofitInfoProps {
  nonprofitInfo?: OrganizationNonprofitInfo
}

export function NonprofitInfo({ nonprofitInfo }: NonprofitInfoProps) {
  if (!nonprofitInfo) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Nonprofit Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {nonprofitInfo.isNonprofit ? (
            <Badge variant="default" className="bg-green-600">
              Nonprofit Organization
            </Badge>
          ) : (
            <Badge variant="outline">For-Profit Organization</Badge>
          )}
        </div>
        {nonprofitInfo.licenseNumber && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm font-medium">License Number:</span>
              <p className="text-sm text-muted-foreground">
                {nonprofitInfo.licenseNumber}
              </p>
            </div>
          </div>
        )}
        {nonprofitInfo.taxId && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm font-medium">Tax ID:</span>
              <p className="text-sm text-muted-foreground">
                {nonprofitInfo.taxId}
              </p>
            </div>
          </div>
        )}
        {nonprofitInfo.registrationNumber && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm font-medium">Registration Number:</span>
              <p className="text-sm text-muted-foreground">
                {nonprofitInfo.registrationNumber}
              </p>
            </div>
          </div>
        )}
        {nonprofitInfo.registeredIn && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-sm font-medium">Registered In:</span>
              <p className="text-sm text-muted-foreground">
                {nonprofitInfo.registeredIn}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

