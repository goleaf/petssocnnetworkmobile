"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Camera, FileText, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Pet Stats Bar Component
 * Requirements: 8.5, 8.6
 * 
 * Displays key statistics for a pet profile:
 * - Followers count with icon
 * - Photos count with icon
 * - Posts count with icon
 * - Age with birthday icon
 * 
 * Features:
 * - Clickable stats to navigate to respective sections
 * - Responsive layout (horizontal on desktop, grid on mobile)
 * - Hover effects for interactive stats
 */

export interface PetStatsBarProps {
  /**
   * Number of followers
   */
  followers: number
  
  /**
   * Number of photos in gallery
   */
  photos: number
  
  /**
   * Number of posts featuring this pet
   */
  posts: number
  
  /**
   * Pet's age display string (e.g., "3 years", "5 months")
   */
  age: string
  
  /**
   * Optional callback when followers stat is clicked
   */
  onFollowersClick?: () => void
  
  /**
   * Optional callback when photos stat is clicked
   */
  onPhotosClick?: () => void
  
  /**
   * Optional callback when posts stat is clicked
   */
  onPostsClick?: () => void
  
  /**
   * Optional callback when age stat is clicked
   */
  onAgeClick?: () => void
  
  /**
   * Optional className for custom styling
   */
  className?: string
}

/**
 * Individual stat item component
 */
interface StatItemProps {
  icon: React.ReactNode
  value: number | string
  label: string
  onClick?: () => void
  clickable?: boolean
}

function StatItem({ icon, value, label, onClick, clickable = true }: StatItemProps) {
  const isClickable = clickable && onClick

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50 transition-colors",
        isClickable && "hover:bg-muted cursor-pointer",
        !isClickable && "cursor-default"
      )}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      aria-label={isClickable ? `View ${label.toLowerCase()}` : undefined}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="text-primary" aria-hidden="true">
          {icon}
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Pet Stats Bar Component
 * 
 * Requirement 8.5: Display followers count, photos count, posts count, and age with icons
 * Requirement 8.6: Make stats clickable to navigate to respective sections
 */
export function PetStatsBar({
  followers,
  photos,
  posts,
  age,
  onFollowersClick,
  onPhotosClick,
  onPostsClick,
  onAgeClick,
  className,
}: PetStatsBarProps) {
  // Parse age to extract numeric value for display
  // If age starts with "Age" or is unknown, show "—"
  const firstWord = age.split(" ")[0]
  const ageValue = firstWord && !isNaN(Number(firstWord)) ? firstWord : "—"

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-6">
        {/* Responsive grid: 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Followers Stat */}
          <StatItem
            icon={<Users className="h-5 w-5" />}
            value={followers}
            label={followers === 1 ? "Follower" : "Followers"}
            onClick={onFollowersClick}
            clickable={!!onFollowersClick}
          />

          {/* Photos Stat */}
          <StatItem
            icon={<Camera className="h-5 w-5" />}
            value={photos}
            label={photos === 1 ? "Photo" : "Photos"}
            onClick={onPhotosClick}
            clickable={!!onPhotosClick}
          />

          {/* Posts Stat */}
          <StatItem
            icon={<FileText className="h-5 w-5" />}
            value={posts}
            label={posts === 1 ? "Post" : "Posts"}
            onClick={onPostsClick}
            clickable={!!onPostsClick}
          />

          {/* Age Stat */}
          <StatItem
            icon={<Calendar className="h-5 w-5" />}
            value={ageValue}
            label="Age"
            onClick={onAgeClick}
            clickable={!!onAgeClick}
          />
        </div>
      </CardContent>
    </Card>
  )
}
