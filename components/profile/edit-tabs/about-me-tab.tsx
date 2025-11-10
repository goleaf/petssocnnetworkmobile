"use client"

import * as React from "react"
import { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Textarea } from "@/components/ui/textarea"
import { FormLabel } from "@/components/ui/form-label"
import { TagInput } from "@/components/ui/tag-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MentionAutocomplete, type MentionUser } from "@/components/profile/mention-autocomplete"
import { Heart, Book, Film, Music, Gamepad2, Quote, GraduationCap } from "lucide-react"

interface FormData {
  aboutMe: string
  interests: string
  hobbies: string
  education: string
  maritalStatus: string
  favoriteBooks: string
  favoriteMovies: string
  favoriteMusic: string
}

interface AboutMeTabProps {
  formData: FormData
  setFormData: (data: FormData) => void
}

export function AboutMeTab({ formData, setFormData }: AboutMeTabProps) {
  const aboutMeTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSearchUsers = async (query: string): Promise<MentionUser[]> => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=10`)
      if (!response.ok) {
        throw new Error("Failed to search users")
      }
      const data = await response.json()
      return data.users || []
    } catch (error) {
      console.error("Error searching users:", error)
      return []
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeaderWithIcon
          title="About Me"
          description="Share more about your personality and interests"
          icon={Heart}
        />
        <CardContent className="space-y-6">
          <div className="space-y-2 relative">
            <FormLabel htmlFor="aboutMe" icon={Quote}>
              About Me
            </FormLabel>
            <Textarea
              ref={aboutMeTextareaRef}
              id="aboutMe"
              value={formData.aboutMe}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, aboutMe: e.target.value })}
              placeholder="Tell us more about yourself... (Use @ to mention users)"
              rows={6}
              className="resize-none"
            />
            <MentionAutocomplete
              textareaRef={aboutMeTextareaRef as React.RefObject<HTMLTextAreaElement>}
              value={formData.aboutMe}
              onChange={(newValue) => setFormData({ ...formData, aboutMe: newValue })}
              onSearchUsers={handleSearchUsers}
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="interests" icon={Heart}>
              Interests
            </FormLabel>
            <TagInput
              value={formData.interests}
              onChange={(tags: string) => setFormData({ ...formData, interests: tags })}
              placeholder="Add interests (e.g., hiking, photography)"
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="hobbies" icon={Gamepad2}>
              Hobbies
            </FormLabel>
            <TagInput
              value={formData.hobbies}
              onChange={(tags: string) => setFormData({ ...formData, hobbies: tags })}
              placeholder="Add hobbies"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="education" icon={GraduationCap}>
                Education
              </FormLabel>
              <Select
                value={formData.education}
                onValueChange={(value: string) => setFormData({ ...formData, education: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                  <SelectItem value="masters">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="maritalStatus" icon={Heart}>
                Marital Status
              </FormLabel>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value: string) => setFormData({ ...formData, maritalStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="favoriteBooks" icon={Book}>
              Favorite Books
            </FormLabel>
            <Textarea
              id="favoriteBooks"
              value={formData.favoriteBooks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, favoriteBooks: e.target.value })}
              placeholder="List your favorite books..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="favoriteMovies" icon={Film}>
              Favorite Movies
            </FormLabel>
            <Textarea
              id="favoriteMovies"
              value={formData.favoriteMovies}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, favoriteMovies: e.target.value })}
              placeholder="List your favorite movies..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="favoriteMusic" icon={Music}>
              Favorite Music
            </FormLabel>
            <Textarea
              id="favoriteMusic"
              value={formData.favoriteMusic}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, favoriteMusic: e.target.value })}
              placeholder="List your favorite music..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
