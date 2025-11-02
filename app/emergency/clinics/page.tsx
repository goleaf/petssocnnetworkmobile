"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { MapPin, Phone, Clock, ExternalLink, Search } from "lucide-react"
import { getEmergencyMapsUrl, getEmergencyPhoneUrl } from "@/lib/utils/emergency"
import { Input } from "@/components/ui/input"
import type { EmergencyClinic } from "@/lib/utils/emergency"

// Mock data - in production, this would come from an API or location service
const mockClinics: EmergencyClinic[] = [
  {
    id: "1",
    name: "24/7 Emergency Veterinary Hospital",
    phone: "(555) 123-4567",
    address: "123 Main Street, Your City, ST 12345",
    is24Hours: true,
    distance: 2.3,
  },
  {
    id: "2",
    name: "Animal Emergency Center",
    phone: "(555) 234-5678",
    address: "456 Oak Avenue, Your City, ST 12345",
    is24Hours: true,
    distance: 5.7,
  },
  {
    id: "3",
    name: "Pet Emergency Clinic",
    phone: "(555) 345-6789",
    address: "789 Elm Road, Your City, ST 12345",
    is24Hours: false,
    distance: 8.2,
  },
]

export default function EmergencyClinicsPage() {
  const [clinics, setClinics] = useState<EmergencyClinic[]>(mockClinics)
  const [searchQuery, setSearchQuery] = useState("")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Request user location for better clinic finding
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // User denied or error - continue without location
        }
      )
    }
  }, [])

  const filteredClinics = clinics.filter((clinic) =>
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href="/wiki" label="Back to Wiki" />

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Emergency Veterinary Clinics</h1>
        <p className="text-muted-foreground">
          Find emergency veterinary care near you. In a true emergency, call immediately.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Clinics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Emergency Hotline */}
      <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-1">
                Emergency Hotline
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Call immediately for life-threatening emergencies
              </p>
            </div>
            <Button
              asChild
              variant="destructive"
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <a href={getEmergencyPhoneUrl()} className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Emergency
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clinics List */}
      <div className="space-y-4">
        {filteredClinics.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No clinics found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          filteredClinics.map((clinic) => (
            <Card key={clinic.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      {clinic.name}
                      {clinic.is24Hours && (
                        <span className="text-xs font-normal bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          24/7
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {clinic.address}
                    </CardDescription>
                    {clinic.distance && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Approximately {clinic.distance} miles away
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <a href={getEmergencyPhoneUrl(clinic.phone)}>
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <a
                      href={getEmergencyMapsUrl(`${clinic.name} ${clinic.address}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4" />
                      Get Directions
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Note */}
      <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This directory shows available emergency clinics. 
            Always call ahead to confirm availability and hours. For life-threatening emergencies, 
            call the emergency hotline or proceed to the nearest 24/7 emergency clinic immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

