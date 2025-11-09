import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Navigation } from "@/components/navigation"
import { DeepLinkHandler } from "@/components/deep-link-handler"
import { TierComputationProvider } from "@/components/tier-computation-provider"
import { LinkCheckerScheduler } from "@/components/link-checker-scheduler"
import { PetReminderScheduler } from "@/components/pet-reminder-scheduler"
import { DraftRetentionScheduler } from "@/components/draft-retention-scheduler"
import { ContentPublishScheduler } from "@/components/content-publish-scheduler"
import { StoryExpiryScheduler } from "@/components/stories/story-expiry-scheduler"
import { getLocale } from 'next-intl/server'
import { NavigationLoadingIndicator } from "@/components/ui/navigation-loading-indicator"
import { ScreenReaderProvider } from "@/components/a11y/screen-reader-provider"
import { MotorAccessibilityProvider } from "@/components/a11y/motor-accessibility-provider"
import { SkipLinks } from "@/components/a11y/SkipLinks"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PawSocial - Pet Social Network",
  description: "Connect with pet lovers, share your pets stories, and learn from our pet care wiki",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()

  return (
    <html lang={locale}>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <TierComputationProvider>
            <ScreenReaderProvider>
              <MotorAccessibilityProvider>
                <SkipLinks />
                <DeepLinkHandler />
                <LinkCheckerScheduler />
                <PetReminderScheduler />
                <DraftRetentionScheduler />
                <ContentPublishScheduler />
                <StoryExpiryScheduler />
                <NavigationLoadingIndicator />
                <Navigation />
                <main id="main-content" role="main" className="min-h-[60vh] pb-16 md:pb-0">
                  {children}
                </main>
              </MotorAccessibilityProvider>
            </ScreenReaderProvider>
          </TierComputationProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
