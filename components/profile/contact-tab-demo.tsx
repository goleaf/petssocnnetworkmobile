"use client"

import { useState } from "react"
import { ContactTab } from "./edit-tabs/contact-tab"

// Demo component to showcase the ContactTab with verification UI
export function ContactTabDemo() {
  const [formData, setFormData] = useState({
    email: "user@example.com",
    emailVerified: false,
    phone: "+1 555 123 4567",
    phoneVerified: false,
    website: "https://example.com",
    country: "US",
    city: "New York",
    socialMedia: {
      instagram: "@username",
      twitter: "@username",
      youtube: "https://youtube.com/@channel"
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const countries = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "GB", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
  ]

  const availableCities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Contact Tab Demo</h1>
        <p className="text-muted-foreground">
          This demo showcases the enhanced ContactTab with email and phone verification UI.
        </p>
      </div>

      <ContactTab
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        countries={countries}
        availableCities={availableCities}
      />

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Current Form Data:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  )
}
