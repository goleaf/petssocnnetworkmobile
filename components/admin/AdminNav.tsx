/**
 * Admin Navigation Sidebar Component
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Flag, FileText, Users, BarChart3, Search, Shield, Bell, MapPin, Activity, Settings, CheckCircle2, AlertCircle, Image, UserCheck, FilePlus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'

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

const queueItems = [
  { href: '/admin/queue/new-pages', label: 'New Pages', icon: FilePlus, queueKey: 'new-pages' as const },
  { href: '/admin/queue/flagged-health', label: 'Health Content', icon: AlertCircle, queueKey: 'flagged-health' as const },
  { href: '/admin/queue/coi-edits', label: 'COI Edits', icon: UserCheck, queueKey: 'coi-edits' as const },
  { href: '/admin/queue/image-reviews', label: 'Image Reviews', icon: Image, queueKey: 'image-reviews' as const },
]

const settingsItems = [
  { href: '/admin/settings/flags', label: 'Feature Flags', icon: Flag },
  { href: '/admin/settings/ops', label: 'Operations', icon: Activity },
]

interface QueueCounts {
  queues: {
    'new-pages': number
    'flagged-health': number
    'coi-edits': number
    'image-reviews': number
  }
  totalPending: number
  urgentCount: number
  hasUrgent: boolean
}

export default function AdminNav() {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(
    pathname?.startsWith('/admin/settings') || false
  )
  const [queuesOpen, setQueuesOpen] = useState(
    pathname?.startsWith('/admin/queue') || false
  )
  const [queueCounts, setQueueCounts] = useState<QueueCounts | null>(null)
  
  const isSettingsActive = pathname?.startsWith('/admin/settings')
  const isQueuesActive = pathname?.startsWith('/admin/queue')

  // Fetch queue counts
  useEffect(() => {
    const fetchQueueCounts = async () => {
      try {
        const response = await fetch('/api/admin/moderation/queue-counts')
        if (response.ok) {
          const data = await response.json()
          setQueueCounts(data)
        }
      } catch (error) {
        console.error('Failed to fetch queue counts:', error)
      }
    }

    fetchQueueCounts()
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchQueueCounts, 30000)
    return () => clearInterval(interval)
  }, [])
  
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
            onClick={() => setQueuesOpen(!queuesOpen)}
            className={`w-full flex items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
              isQueuesActive
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Moderation Queues
            </div>
            {queueCounts && queueCounts.totalPending > 0 && (
              <Badge 
                variant={queueCounts.hasUrgent ? "destructive" : "secondary"}
                className="ml-2"
              >
                {queueCounts.totalPending}
              </Badge>
            )}
          </button>
          {queuesOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {queueItems.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                const Icon = item.icon
                const count = queueCounts?.queues[item.queueKey] || 0
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between rounded px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

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

