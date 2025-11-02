"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Globe } from "lucide-react"
import type { OrganizationContact } from "@/lib/types"

interface ContactInfoProps {
  contact?: OrganizationContact
  website?: string
}

export function ContactInfo({ contact, website }: ContactInfoProps) {
  if (!contact && !website) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contact?.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <a
                href={`mailto:${contact.email}`}
                className="text-primary hover:underline"
              >
                {contact.email}
              </a>
            </div>
          </div>
        )}
        {contact?.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <a
                href={`tel:${contact.phone}`}
                className="text-primary hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          </div>
        )}
        {(contact?.address || contact?.city || contact?.state) && (
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              {contact.address && <div>{contact.address}</div>}
              {(contact.city || contact.state || contact.zipCode) && (
                <div>
                  {[contact.city, contact.state, contact.zipCode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
              {contact.country && <div>{contact.country}</div>}
            </div>
          </div>
        )}
        {website && (
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {website}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

