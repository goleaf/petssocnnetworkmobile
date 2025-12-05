"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  Heart, 
  Users, 
  MessageSquare, 
  FileText, 
  PawPrint, 
  Calendar, 
  ShoppingBag, 
  Globe,
  Shield,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import type { NotificationSettings } from "@/lib/types/settings"
import { getNotificationCategories } from "@/lib/services/notifications"

interface NotificationCategoriesProps {
  settings: NotificationSettings
  onUpdate: (settings: Partial<NotificationSettings>) => Promise<void>
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  interactions: Heart,
  social: Users,
  messages: MessageSquare,
  posts: FileText,
  pets: PawPrint,
  events: Calendar,
  marketplace: ShoppingBag,
  community: Globe,
  system: Shield
}

export function NotificationCategories({ settings, onUpdate }: NotificationCategoriesProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  
  const categories = getNotificationCategories()
  
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }
  
  const isCategoryEnabled = (categoryId: string): boolean => {
    // Check if any channel has this category enabled
    const channels = Object.values(settings.channelPreferences)
    return channels.some(channel => 
      channel.enabled && (
        channel.categories.length === 0 || 
        channel.categories.includes(categoryId)
      )
    )
  }
  
  const handleCategoryToggle = async (categoryId: string, enabled: boolean) => {
    setSaving(categoryId)
    try {
      // Update all channels to include/exclude this category
      const updatedChannelPreferences = { ...settings.channelPreferences }
      
      Object.keys(updatedChannelPreferences).forEach(channelKey => {
        const channel = updatedChannelPreferences[channelKey as keyof typeof updatedChannelPreferences]
        
        if (enabled) {
          // If enabling, remove from categories filter (empty = all allowed)
          // Or if categories list exists, add it
          if (channel.categories.length > 0) {
            channel.categories = [...new Set([...channel.categories, categoryId])]
          }
        } else {
          // If disabling, add to exclusion or remove from inclusion
          if (channel.categories.length === 0) {
            // Was allowing all, now exclude this one
            const allCategories = categories.map(c => c.id).filter(id => id !== categoryId)
            channel.categories = allCategories
          } else {
            // Remove from allowed list
            channel.categories = channel.categories.filter(c => c !== categoryId)
          }
        }
      })
      
      await onUpdate({ channelPreferences: updatedChannelPreferences })
    } finally {
      setSaving(null)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          Notification Categories
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Control which types of notifications you receive across all channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.id] || Bell
          const isExpanded = expandedCategories.has(category.id)
          const isEnabled = isCategoryEnabled(category.id)
          const isSaving = saving === category.id
          
          return (
            <div key={category.id} className="border rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleCategoryToggle(category.id, checked)}
                      disabled={isSaving}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(category.id)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      <p className="mb-2">This category includes notifications for:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {category.id === 'interactions' && (
                          <>
                            <li>Likes on your posts</li>
                            <li>Comments on your posts</li>
                            <li>Reactions to your content</li>
                          </>
                        )}
                        {category.id === 'social' && (
                          <>
                            <li>New followers</li>
                            <li>Friend requests</li>
                            <li>Mentions in posts</li>
                          </>
                        )}
                        {category.id === 'messages' && (
                          <>
                            <li>Direct messages</li>
                            <li>Chat notifications</li>
                            <li>Message requests</li>
                          </>
                        )}
                        {category.id === 'posts' && (
                          <>
                            <li>New posts from people you follow</li>
                            <li>Posts from friends</li>
                          </>
                        )}
                        {category.id === 'pets' && (
                          <>
                            <li>Pet health reminders</li>
                            <li>Vaccination due dates</li>
                            <li>Pet milestone updates</li>
                          </>
                        )}
                        {category.id === 'events' && (
                          <>
                            <li>Event invitations</li>
                            <li>Event reminders</li>
                            <li>Event updates</li>
                          </>
                        )}
                        {category.id === 'marketplace' && (
                          <>
                            <li>Product listings</li>
                            <li>Price changes</li>
                            <li>Marketplace messages</li>
                          </>
                        )}
                        {category.id === 'community' && (
                          <>
                            <li>Group posts</li>
                            <li>Community announcements</li>
                            <li>Group invitations</li>
                          </>
                        )}
                        {category.id === 'system' && (
                          <>
                            <li>Security alerts</li>
                            <li>Account notifications</li>
                            <li>System updates</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
