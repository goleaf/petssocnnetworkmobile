"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormLabel } from "@/components/ui/form-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserIcon, Briefcase, FileText, Calendar, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormData {
  fullName: string
  occupation: string
  bio: string
  dateOfBirth: string
  gender: string
}

interface BasicInfoTabProps {
  formData: FormData
  setFormData: (data: FormData) => void
  errors: Record<string, string>
  setErrors: (updater: ((prev: Record<string, string>) => Record<string, string>) | Record<string, string>) => void
}

export function BasicInfoTab({ formData, setFormData, errors, setErrors }: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeaderWithIcon
          title="Personal Details"
          description="Your basic information"
          icon={UserIcon}
        />
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="fullName" icon={UserIcon} required>
                Full Name
              </FormLabel>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, fullName: e.target.value })
                  if (errors.fullName) {
                    setErrors((prev) => ({ ...prev, fullName: "" }))
                  }
                }}
                placeholder="Enter your full name"
                required
                className={cn(errors.fullName && "border-destructive")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="occupation" icon={Briefcase}>
                Occupation
              </FormLabel>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Your profession"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="bio" icon={FileText}>
              Bio
            </FormLabel>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself and your pets..."
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="dateOfBirth" icon={Calendar}>
                Date of Birth
              </FormLabel>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="gender" icon={Users}>
                Gender
              </FormLabel>
              <Select
                value={formData.gender}
                onValueChange={(value: string) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
