"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"
import type { OrganizationService } from "@/lib/types"

interface ServiceListProps {
  services?: OrganizationService[]
}

export function ServiceList({ services }: ServiceListProps) {
  if (!services || services.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Services Offered</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-start justify-between gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{service.name}</h4>
                  {service.available !== undefined && (
                    <>
                      {service.available ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                )}
              </div>
              {service.price && (
                <div className="text-right">
                  {service.price.amount !== undefined && (
                    <div className="font-medium">
                      {service.price.currency || "$"}
                      {service.price.amount.toFixed(2)}
                    </div>
                  )}
                  {service.price.unit && (
                    <div className="text-xs text-muted-foreground">
                      {service.price.unit}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

