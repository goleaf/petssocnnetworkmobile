"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, DollarSign, FileText } from "lucide-react"
import type { AdoptionPolicy, ReturnPolicy } from "@/lib/types"

interface PolicySectionProps {
  adoptionPolicy?: AdoptionPolicy
  returnPolicy?: ReturnPolicy
}

export function PolicySection({
  adoptionPolicy,
  returnPolicy,
}: PolicySectionProps) {
  if (!adoptionPolicy && !returnPolicy) return null

  return (
    <div className="space-y-6">
      {adoptionPolicy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Adoption Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adoptionPolicy.fees && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Adoption Fees</span>
                </div>
                {adoptionPolicy.fees.amount !== undefined && (
                  <div className="ml-6">
                    <Badge variant="outline" className="mb-2">
                      {adoptionPolicy.fees.currency || "$"}
                      {adoptionPolicy.fees.amount.toFixed(2)}
                    </Badge>
                    {adoptionPolicy.fees.description && (
                      <p className="text-sm text-muted-foreground">
                        {adoptionPolicy.fees.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {adoptionPolicy.requirements && adoptionPolicy.requirements.length > 0 && (
              <div>
                <span className="font-medium block mb-2">Requirements:</span>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {adoptionPolicy.requirements.map((req, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {adoptionPolicy.process && (
              <div>
                <span className="font-medium block mb-2">Process:</span>
                <p className="text-sm text-muted-foreground">
                  {adoptionPolicy.process}
                </p>
              </div>
            )}
            {adoptionPolicy.ageRestrictions && (
              <div>
                <span className="font-medium block mb-2">Age Restrictions:</span>
                <p className="text-sm text-muted-foreground">
                  {adoptionPolicy.ageRestrictions}
                </p>
              </div>
            )}
            {adoptionPolicy.applicationLink && (
              <div>
                <a
                  href={adoptionPolicy.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  View Application
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {returnPolicy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Return Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {returnPolicy.allowed ? (
                <Badge variant="default" className="bg-green-600">
                  Returns Accepted
                </Badge>
              ) : (
                <Badge variant="destructive">Returns Not Accepted</Badge>
              )}
            </div>
            {returnPolicy.timeframe && (
              <div>
                <span className="font-medium block mb-1">Timeframe:</span>
                <p className="text-sm text-muted-foreground">
                  {returnPolicy.timeframe}
                </p>
              </div>
            )}
            {returnPolicy.conditions && returnPolicy.conditions.length > 0 && (
              <div>
                <span className="font-medium block mb-2">Conditions:</span>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {returnPolicy.conditions.map((condition, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {returnPolicy.refundPolicy && (
              <div>
                <span className="font-medium block mb-1">Refund Policy:</span>
                <p className="text-sm text-muted-foreground">
                  {returnPolicy.refundPolicy}
                </p>
              </div>
            )}
            {returnPolicy.contactInfo && (
              <div>
                <span className="font-medium block mb-1">Contact for Returns:</span>
                <p className="text-sm text-muted-foreground">
                  {returnPolicy.contactInfo}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

