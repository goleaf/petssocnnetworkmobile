"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LABELS: Record<string, string> = {
  privacy: "Privacy & Safety",
  notifications: "Notifications",
  appearance: "Appearance",
  language: "Language & Region",
  "data-storage": "Data & Storage",
  billing: "Billing",
  help: "Help & Support",
}

export function SettingsHeader({ description, subsection }: { description?: string; subsection?: string }) {
  const pathname = usePathname()
  // Example: /en/settings/privacy/email => ["", "en", "settings", "privacy", "email"]
  const parts = (pathname || "/").split("/")
  const locale = parts[1] || ""
  const sectionSlug = parts[3] // undefined on root settings page

  const baseHref = `/${locale}/settings`
  const sectionHref = sectionSlug ? `${baseHref}/${sectionSlug}` : baseHref
  const sectionLabel = sectionSlug ? LABELS[sectionSlug] || sectionSlug : "Account Settings"

  return (
    <div className="mb-4 sm:mb-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href={baseHref} className="hover:text-foreground">Settings</Link>
        <span>/</span>
        {sectionSlug ? (
          <>
            <Link href={sectionHref} className="hover:text-foreground">{sectionLabel}</Link>
            {subsection ? (
              <>
                <span>/</span>
                <span className="text-foreground">{subsection}</span>
              </>
            ) : null}
          </>
        ) : (
          <span className="text-foreground">{sectionLabel}</span>
        )}
      </nav>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold">{sectionLabel}</h1>
      {description ? (
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">{description}</p>
      ) : null}
    </div>
  )
}

