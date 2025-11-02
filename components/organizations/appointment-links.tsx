"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Calendar } from "lucide-react"
import type { AppointmentLink } from "@/lib/types"

interface AppointmentLinksProps {
  appointmentLinks?: AppointmentLink[]
}

export function AppointmentLinks({ appointmentLinks }: AppointmentLinksProps) {
  if (!appointmentLinks || appointmentLinks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointmentLinks.map((link, idx) => (
            <Button
              key={idx}
              variant="default"
              className="w-full justify-start gap-2"
              asChild
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar className="h-4 w-4" />
                {link.label || `Book on ${link.platform}`}
                <ExternalLink className="h-4 w-4 ml-auto" />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

