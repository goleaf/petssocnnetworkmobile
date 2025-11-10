"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { FormLabel } from "@/components/ui/form-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TagInput } from "@/components/ui/tag-input"
import { Textarea } from "@/components/ui/textarea"
import { Dog, Heart, Languages, Home, Activity } from "lucide-react"
import { getAnimalOptions } from "@/lib/animal-types"

interface PreferencesTabProps {
  formData: any
  setFormData: (data: any) => void
}

export function PreferencesTab({ formData, setFormData }: PreferencesTabProps) {
  const animalOptions = getAnimalOptions()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeaderWithIcon
          title="Pet Preferences"
          description="Your pet care style and preferences"
          icon={Dog}
        />
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <FormLabel htmlFor="favoriteAnimals" icon={Heart}>
              Favorite Animals
            </FormLabel>
            <div className="flex flex-wrap gap-2">
              {animalOptions.map((animal) => {
                const Icon = animal.icon
                const isSelected = formData.favoriteAnimals?.includes(animal.value)
                return (
                  <button
                    key={animal.value}
                    type="button"
                    onClick={() => {
                      const current = formData.favoriteAnimals || []
                      const updated = isSelected
                        ? current.filter((a: string) => a !== animal.value)
                        : [...current, animal.value]
                      setFormData({ ...formData, favoriteAnimals: updated })
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `border-${animal.color}-500 bg-${animal.color}-50 text-${animal.color}-700`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{animal.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="petExperience" icon={Activity}>
                Pet Experience
              </FormLabel>
              <Select
                value={formData.petExperience}
                onValueChange={(value) => setFormData({ ...formData, petExperience: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="petCareStyle" icon={Heart}>
                Pet Care Style
              </FormLabel>
              <Select
                value={formData.petCareStyle}
                onValueChange={(value) => setFormData({ ...formData, petCareStyle: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select care style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hands-on">Hands-on</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="willingToAdopt" icon={Heart}>
                Willing to Adopt
              </FormLabel>
              <Select
                value={formData.willingToAdopt}
                onValueChange={(value) => setFormData({ ...formData, willingToAdopt: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="preferredPetSize" icon={Dog}>
                Preferred Pet Size
              </FormLabel>
              <Select
                value={formData.preferredPetSize}
                onValueChange={(value) => setFormData({ ...formData, preferredPetSize: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="breedPreferences" icon={Dog}>
              Breed Preferences
            </FormLabel>
            <Textarea
              id="breedPreferences"
              value={formData.breedPreferences}
              onChange={(e) => setFormData({ ...formData, breedPreferences: e.target.value })}
              placeholder="List your preferred breeds..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeaderWithIcon
          title="Lifestyle"
          description="Your living situation and daily routine"
          icon={Home}
        />
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FormLabel htmlFor="activityLevelPreference" icon={Activity}>
                Activity Level
              </FormLabel>
              <Select
                value={formData.activityLevelPreference}
                onValueChange={(value) => setFormData({ ...formData, activityLevelPreference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very-high">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="livingSpacePreference" icon={Home}>
                Living Space
              </FormLabel>
              <Select
                value={formData.livingSpacePreference}
                onValueChange={(value) => setFormData({ ...formData, livingSpacePreference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="house-with-yard">House with Yard</SelectItem>
                  <SelectItem value="farm">Farm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="languages" icon={Languages}>
              Languages
            </FormLabel>
            <TagInput
              id="languages"
              value={formData.languages}
              onChange={(tags) => setFormData({ ...formData, languages: tags })}
              placeholder="Add languages you speak"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
