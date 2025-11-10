"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormLabel } from "@/components/ui/form-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { MapPin, Phone, Globe, Mail, Instagram, Twitter, Youtube, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmailChangeModal } from "@/components/profile/email-change-modal"
import { PhoneVerificationModal } from "@/components/profile/phone-verification-modal"

interface ContactTabProps {
  formData: any
  setFormData: (data: any) => void
  errors: Record<string, string>
  setErrors: (errors: any) => void
  countries: Array<{ value: string; label: string }>
  availableCities: string[]
}

export function ContactTab({ 
  formData, 
  setFormData, 
  errors, 
  setErrors,
  countries,
  availableCities 
}: ContactTabProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)

  // Mock handlers - these would be replaced with actual API calls
  const handleEmailChange = async (newEmail: string, password: string) => {
    // TODO: Implement actual API call to change email
    console.log("Changing email to:", newEmail, "with password verification")
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Update form data
    setFormData({ ...formData, email: newEmail, emailVerified: false })
  }

  const handlePhoneSubmit = async (phoneNumber: string, countryCode: string) => {
    // TODO: Implement actual API call to send OTP
    console.log("Sending OTP to:", countryCode, phoneNumber)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handlePhoneVerifyOTP = async (otp: string) => {
    // TODO: Implement actual API call to verify OTP
    console.log("Verifying OTP:", otp)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Update form data
    setFormData({ ...formData, phoneVerified: true })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeaderWithIcon
          title="Contact Information"
          description="How people can reach you"
          icon={Mail}
        />
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <FormLabel htmlFor="email" icon={Mail}>
              Email
            </FormLabel>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="flex-1 bg-muted"
              />
              {formData.emailVerified ? (
                <div className="flex items-center gap-1 text-green-600 text-sm whitespace-nowrap">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600 text-sm whitespace-nowrap">
                  <AlertCircle className="h-4 w-4" />
                  <span>Unverified</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {formData.emailVerified 
                  ? "Your email address is verified" 
                  : "Verify your email to secure your account"}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setIsEmailModalOpen(true)}
                className="h-auto p-0 text-xs"
              >
                Change Email
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="phone" icon={Phone}>
              Phone
            </FormLabel>
            <div className="flex items-center gap-2">
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                disabled
                placeholder="Not added"
                className="flex-1 bg-muted"
              />
              {formData.phone && formData.phoneVerified ? (
                <div className="flex items-center gap-1 text-green-600 text-sm whitespace-nowrap">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verified</span>
                </div>
              ) : formData.phone ? (
                <div className="flex items-center gap-1 text-amber-600 text-sm whitespace-nowrap">
                  <AlertCircle className="h-4 w-4" />
                  <span>Unverified</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {formData.phone 
                  ? formData.phoneVerified 
                    ? "Your phone number is verified"
                    : "Verify your phone number for account recovery"
                  : "Add a phone number for account security"}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setIsPhoneModalOpen(true)}
                className="h-auto p-0 text-xs"
              >
                {formData.phone ? "Change Phone" : "Add Phone"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="website" icon={Globe}>
              Website
            </FormLabel>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => {
                setFormData({ ...formData, website: e.target.value })
                if (errors.website) {
                  setErrors((prev: any) => ({ ...prev, website: "" }))
                }
              }}
              placeholder="https://yourwebsite.com"
              className={cn(errors.website && "border-destructive")}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeaderWithIcon
          title="Location"
          description="Where you're based"
          icon={MapPin}
        />
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="country" icon={MapPin} required>
                Country
              </FormLabel>
              <Select
                value={formData.country}
                onValueChange={(value) => {
                  setFormData({ ...formData, country: value })
                  if (errors.country) {
                    setErrors((prev: any) => ({ ...prev, country: "" }))
                  }
                }}
              >
                <SelectTrigger className={cn(errors.country && "border-destructive")}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country}</p>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="city" icon={MapPin} required>
                City
              </FormLabel>
              <CityAutocomplete
                value={formData.city}
                onValueChange={(value: string) => {
                  setFormData({ ...formData, city: value })
                  if (errors.city) {
                    setErrors((prev: any) => ({ ...prev, city: "" }))
                  }
                }}
                cities={availableCities}
                placeholder="Select or type city"
                className={cn(errors.city && "border-destructive")}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeaderWithIcon
          title="Social Media"
          description="Connect your social profiles"
          icon={Instagram}
        />
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FormLabel htmlFor="instagram" icon={Instagram}>
              Instagram
            </FormLabel>
            <Input
              id="instagram"
              value={formData.socialMedia?.instagram || ""}
              onChange={(e) => setFormData({ 
                ...formData, 
                socialMedia: { ...formData.socialMedia, instagram: e.target.value }
              })}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="twitter" icon={Twitter}>
              Twitter / X
            </FormLabel>
            <Input
              id="twitter"
              value={formData.socialMedia?.twitter || ""}
              onChange={(e) => setFormData({ 
                ...formData, 
                socialMedia: { ...formData.socialMedia, twitter: e.target.value }
              })}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="youtube" icon={Youtube}>
              YouTube
            </FormLabel>
            <Input
              id="youtube"
              value={formData.socialMedia?.youtube || ""}
              onChange={(e) => setFormData({ 
                ...formData, 
                socialMedia: { ...formData.socialMedia, youtube: e.target.value }
              })}
              placeholder="Channel URL"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={formData.email}
        onSubmit={handleEmailChange}
      />

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        currentPhone={formData.phone}
        onSubmit={handlePhoneSubmit}
        onVerifyOTP={handlePhoneVerifyOTP}
      />
    </div>
  )
}
