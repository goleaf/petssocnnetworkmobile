"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Database,
  CreditCard,
  HelpCircle,
  Accessibility,
  Compass,
  type LucideIcon,
} from "lucide-react"

type SettingsItem = {
  href: string
  label: string
  icon: LucideIcon
  // When true, this item is hidden (e.g., conditional features like Billing)
  hidden?: boolean
}

export default function SettingsSidebar({ locale, showBilling = false }: { locale: string; showBilling?: boolean }): JSX.Element {
  const pathname = usePathname()

  const base = `/${locale}/settings`
  const items: SettingsItem[] = [
    { href: `${base}`, label: "Account Settings", icon: User },
    { href: `${base}/privacy`, label: "Privacy & Safety", icon: Shield },
    { href: `${base}/content`, label: "Content Preferences", icon: Compass },
    { href: `${base}/notifications`, label: "Notifications", icon: Bell },
    { href: `${base}/appearance`, label: "Appearance", icon: Palette },
    { href: `${base}/accessibility`, label: "Accessibility", icon: Accessibility },
    { href: `${base}/language`, label: "Language & Region", icon: Globe },
    { href: `${base}/data-storage`, label: "Data & Storage", icon: Database },
    { href: `${base}/billing`, label: "Billing", icon: CreditCard, hidden: !showBilling },
    { href: `${base}/help`, label: "Help & Support", icon: HelpCircle },
  ]

  return (
    <aside className="w-64 shrink-0 border-r bg-background">
      <nav className="p-3 space-y-1">
        {items.filter((it) => !it.hidden).map((item) => {
          const Icon = item.icon
          const isRoot = item.href === base
          const isActive = isRoot ? pathname === item.href : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
