"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Input } from "@/components/ui/input"
import { FormLabel } from "@/components/ui/form-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { MapPin, Phone, Globe, Mail, Instagram, Twitter, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"

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
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="phone" icon={Phone}>
              Phone
            </FormLabel>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
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
                onChange={(value) => {
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
    </div>
  )
}
