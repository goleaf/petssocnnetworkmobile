"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Cookie, X, Settings } from "lucide-react"
import { setCookieConsent, getCookieConsent } from "@/lib/storage"

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  functional: false,
}

/**
 * Cookie Consent Banner Component
 * 
 * GDPR/CCPA compliant cookie consent banner with preference management.
 * Allows users to accept all, reject all, or customize cookie preferences.
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)

  useEffect(() => {
    const consent = getCookieConsent()
    if (!consent) {
      setShowBanner(true)
    } else {
      setPreferences(consent.preferences)
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    }
    setPreferences(allAccepted)
    setCookieConsent({
      preferences: allAccepted,
      timestamp: new Date().toISOString(),
    })
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    setCookieConsent({
      preferences: DEFAULT_PREFERENCES,
      timestamp: new Date().toISOString(),
    })
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    setCookieConsent({
      preferences,
      timestamp: new Date().toISOString(),
    })
    setShowBanner(false)
    setShowPreferences(false)
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-lg">
      <Alert className="max-w-4xl mx-auto">
        <Cookie className="h-5 w-5" />
        <AlertTitle>Cookie Consent</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>
            We use cookies to enhance your browsing experience, serve personalized content, 
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
            You can customize your preferences or reject non-essential cookies.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handleAcceptAll} size="sm">
              Accept All
            </Button>
            <Button onClick={handleRejectAll} variant="outline" size="sm">
              Reject All
            </Button>
            <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Preferences
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Cookie Preferences</DialogTitle>
                  <DialogDescription>
                    Manage your cookie preferences. Necessary cookies are required for the site to function.
                  </DialogDescription>
                </DialogHeader>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Cookie Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="necessary" className="font-semibold">
                          Necessary Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Required for the website to function properly. Cannot be disabled.
                        </p>
                      </div>
                      <Switch
                        id="necessary"
                        checked={preferences.necessary}
                        disabled
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="analytics" className="font-semibold">
                          Analytics Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Help us understand how visitors interact with our website.
                        </p>
                      </div>
                      <Switch
                        id="analytics"
                        checked={preferences.analytics}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, analytics: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing" className="font-semibold">
                          Marketing Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Used to deliver personalized advertisements and track campaign performance.
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={preferences.marketing}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, marketing: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="functional" className="font-semibold">
                          Functional Cookies
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable enhanced functionality and personalization.
                        </p>
                      </div>
                      <Switch
                        id="functional"
                        checked={preferences.functional}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, functional: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowPreferences(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePreferences}>
                    Save Preferences
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBanner(false)}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

