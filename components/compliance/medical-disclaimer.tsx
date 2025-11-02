"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MedicalDisclaimerProps {
  className?: string
}

/**
 * Medical Disclaimer Component
 * 
 * Displays a prominent disclaimer on health-related wiki pages
 * warning users that content is for informational purposes only
 * and should not replace professional veterinary advice.
 */
export function MedicalDisclaimer({ className }: MedicalDisclaimerProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Medical Disclaimer</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          The information provided on this page is for educational and informational purposes only 
          and is not intended as a substitute for professional veterinary advice, diagnosis, or treatment. 
          Always seek the advice of your veterinarian or other qualified health provider with any 
          questions you may have regarding your pet's health condition.
        </p>
        <p className="font-medium">
          Never disregard professional veterinary advice or delay in seeking it because of something 
          you have read on this website.
        </p>
      </AlertDescription>
    </Alert>
  )
}

