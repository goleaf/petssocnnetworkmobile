/**
 * Admin Navigation Sidebar Component
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Flag, FileText, Users, BarChart3, Search, Shield, Bell, MapPin, Activity, Settings, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const items = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/moderation', label: 'Moderation', icon: Flag },
  { href: '/admin/moderation/reports', label: 'Reports', icon: Flag },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/analytics/search', label: 'Search Analytics', icon: Search },
  { href: '/admin/analytics/relationships', label: 'Relationship Analytics', icon: Users },
  { href: '/admin/revisions', label: 'Revisions', icon: FileText },
  { href: '/admin/flagged-revisions', label: 'Flagged Revisions', icon: FileText },
  { href: '/admin/wiki/revisions', label: 'Wiki Revisions', icon: FileText },
  { href: '/admin/wiki/quality', label: 'Wiki Quality', icon: CheckCircle2 },
  { href: '/admin/expert-verification', label: 'Expert Verification', icon: Shield },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/places/moderation', label: 'Places Moderation', icon: MapPin },
  { href: '/admin/blog/queue', label: 'Blog Queue', icon: FileText },
  { href: '/admin/privacy', label: 'Privacy', icon: Shield },
  { href: '/admin/orgs', label: 'Organizations', icon: Users },
]

const settingsItems = [
  { href: '/admin/settings/flags', label: 'Feature Flags', icon: Flag },
  { href: '/admin/settings/ops', label: 'Operations', icon: Activity },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(
    pathname?.startsWith('/admin/settings') || false
  )
  
  const isSettingsActive = pathname?.startsWith('/admin/settings')
  
  return (
    <aside className="w-64 shrink-0 border-r bg-background">
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        
        <div className="pt-2 mt-2 border-t">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`w-full flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
              isSettingsActive
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          {settingsOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {settingsItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}

