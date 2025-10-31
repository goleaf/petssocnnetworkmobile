"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { PrivacySelector } from "@/components/privacy-selector"
import { updateUser } from "@/lib/storage"
import type { PrivacyLevel } from "@/lib/types"
import { ArrowLeft } from "lucide-react"

export default function PrivacySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState({
    profile: "public" as PrivacyLevel,
    email: "private" as PrivacyLevel,
    location: "followers-only" as PrivacyLevel,
    pets: "public" as PrivacyLevel,
  })

  useEffect(() => {
    if (user?.privacy) {
      setSettings(user.privacy)
    }
  }, [user])

  const handleSave = () => {
    if (!user) return
    updateUser(user.id, { privacy: settings })
    router.back()
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Privacy Settings</h1>
          <p className="text-muted-foreground mt-2">Control who can see your information and content</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Privacy</CardTitle>
            <CardDescription>Choose who can see different parts of your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <p className="text-sm text-muted-foreground mb-2">Who can see your profile information</p>
              <PrivacySelector
                value={settings.profile}
                onChange={(value) => setSettings({ ...settings, profile: value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <p className="text-sm text-muted-foreground mb-2">Who can see your email address</p>
              <PrivacySelector
                value={settings.email}
                onChange={(value) => setSettings({ ...settings, email: value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <p className="text-sm text-muted-foreground mb-2">Who can see your location</p>
              <PrivacySelector
                value={settings.location}
                onChange={(value) => setSettings({ ...settings, location: value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Pets</Label>
              <p className="text-sm text-muted-foreground mb-2">Who can see your pets</p>
              <PrivacySelector value={settings.pets} onChange={(value) => setSettings({ ...settings, pets: value })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
