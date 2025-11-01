import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Navigation } from "@/components/navigation"
import { DeepLinkHandler } from "@/components/deep-link-handler"
import { TierComputationProvider } from "@/components/tier-computation-provider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PawSocial - Pet Social Network",
  description: "Connect with pet lovers, share your pets stories, and learn from our pet care wiki",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <TierComputationProvider>
            <DeepLinkHandler />
            <Navigation />
            {children}
          </TierComputationProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
