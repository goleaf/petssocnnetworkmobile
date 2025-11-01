import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { Navigation } from "@/components/navigation"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PawSocial - Pet Social Network",
  description: "Connect with pet lovers, share your pets stories, and learn from our pet care wiki",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PawSocial",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <Navigation />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
