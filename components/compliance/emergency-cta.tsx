"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Phone, AlertCircle } from "lucide-react"
import Link from "next/link"

interface EmergencyCTAProps {
  className?: string
  showPhoneNumber?: boolean
}

/**
 * Emergency CTA Component
 * 
 * Displays a prominent call-to-action for pet emergencies,
 * encouraging users to contact their veterinarian immediately.
 */
export function EmergencyCTA({ className, showPhoneNumber = false }: EmergencyCTAProps) {
  return (
    <Alert className={`bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900 ${className}`}>
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      <AlertTitle className="font-bold text-red-900 dark:text-red-100">
        Pet Emergency?
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-red-800 dark:text-red-200 font-medium">
          If your pet is experiencing a medical emergency, contact your veterinarian immediately 
          or visit the nearest emergency veterinary clinic.
        </p>
        {showPhoneNumber && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-red-900 dark:text-red-100 font-semibold">
              Emergency Veterinary Hotline: 1-800-PET-HELP
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button 
            asChild 
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Link href="tel:+18007384357">
              <Phone className="mr-2 h-4 w-4" />
              Call Emergency Vet
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline"
            className="border-red-300 text-red-900 hover:bg-red-100 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-900"
          >
            <Link href="/wiki/emergency-clinics">
              Find Emergency Clinic
            </Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

