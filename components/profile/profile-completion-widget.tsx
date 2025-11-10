"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, X, ChevronRight } from 'lucide-react'
import type { User } from '@/lib/types'

type CompletionSection = 'basic-info' | 'about-me' | 'contact' | 'pets'

export interface ProfileCompletionWidgetProps {
  user: User
  petsCount?: number
  onNavigate?: (section: string) => void
  className?: string
}

interface CompletionItem {
  id: string
  label: string
  completed: boolean
  section: CompletionSection
  weight: number
}

/**
 * Profile completion weights based on importance for user engagement.
 * Total should sum to 100 for percentage calculation.
 */
const COMPLETION_WEIGHTS = {
  avatar: 10,        // Profile photo is essential for recognition
  cover: 5,          // Cover photo is nice-to-have
  bio: 15,           // Bio helps users connect
  location: 5,       // Location enables local connections
  birthday: 5,       // Birthday for age verification
  phoneVerified: 10, // Verified contact increases trust
  emailVerified: 10, // Email verification is security-critical
  interests: 10,     // Interests drive recommendations
  hasPet: 20,        // Core feature - highest weight
  contactInfo: 5,    // Additional contact methods
  socialLinks: 5,    // Social presence
} as const

// Validate weights sum to 100 in development
if (process.env.NODE_ENV === 'development') {
  const total = Object.values(COMPLETION_WEIGHTS).reduce((a, b) => a + b, 0)
  if (total !== 100) {
    console.warn(`Profile completion weights sum to ${total}, expected 100`)
  }
}

function getCompletionColor(percentage: number): string {
  if (percentage < 30) return 'text-red-500'
  if (percentage < 60) return 'text-yellow-500'
  return 'text-green-500'
}

function getMotivationalText(percentage: number): string {
  if (percentage < 30) return "Get started on your profile"
  if (percentage < 60) return "You're making progress!"
  if (percentage < 100) return "Looking good!"
  return "Profile complete!"
}

function getMotivationalTip(percentage: number): string {
  if (percentage < 30) return 'Complete your profile to get more visibility'
  if (percentage < 60) return 'Profiles with photos get 10x more views'
  return 'Add interests to connect with like-minded pet lovers'
}

function createCompletionItems(
  user: ExtendedUser,
  petsCount: number
): CompletionItem[] {
  return [
    {
      id: 'avatar',
      label: 'Profile photo',
      completed: Boolean(user.avatar),
      section: 'basic-info',
      weight: COMPLETION_WEIGHTS.avatar,
    },
    {
      id: 'cover',
      label: 'Cover photo',
      completed: Boolean(user.coverPhoto),
      section: 'basic-info',
      weight: COMPLETION_WEIGHTS.cover,
    },
    {
      id: 'bio',
      label: 'Bio (at least 50 characters)',
      completed: Boolean(user.bio && user.bio.length >= 50),
      section: 'about-me',
      weight: COMPLETION_WEIGHTS.bio,
    },
    {
      id: 'location',
      label: 'Location',
      completed: Boolean(user.location),
      section: 'contact',
      weight: COMPLETION_WEIGHTS.location,
    },
    {
      id: 'birthday',
      label: 'Date of birth',
      completed: Boolean(user.dateOfBirth),
      section: 'basic-info',
      weight: COMPLETION_WEIGHTS.birthday,
    },
    {
      id: 'phoneVerified',
      label: 'Verified phone number',
      completed: Boolean(user.phoneVerified),
      section: 'contact',
      weight: COMPLETION_WEIGHTS.phoneVerified,
    },
    {
      id: 'emailVerified',
      label: 'Verified email',
      completed: Boolean(
        user.emailVerified || user.emailVerification?.status === 'verified'
      ),
      section: 'contact',
      weight: COMPLETION_WEIGHTS.emailVerified,
    },
    {
      id: 'interests',
      label: 'Interests (at least 3)',
      completed: Boolean(Array.isArray(user.interests) && user.interests.length >= 3),
      section: 'about-me',
      weight: COMPLETION_WEIGHTS.interests,
    },
    {
      id: 'hasPet',
      label: 'At least one pet added',
      completed: petsCount > 0,
      section: 'pets',
      weight: COMPLETION_WEIGHTS.hasPet,
    },
    {
      id: 'contactInfo',
      label: 'Contact info (phone or website)',
      completed: Boolean(
        (user.phone && user.phone.trim()) ||
          (user.website && user.website.trim())
      ),
      section: 'contact',
      weight: COMPLETION_WEIGHTS.contactInfo,
    },
    {
      id: 'socialLinks',
      label: 'At least one social link',
      completed: (() => {
        const social = user.socialMedia || {}
        return !!(
          social.instagram ||
          social.facebook ||
          social.twitter ||
          social.youtube ||
          social.linkedin ||
          social.tiktok
        )
      })(),
      section: 'contact',
      weight: COMPLETION_WEIGHTS.socialLinks,
    },
  ]
}

function calculateCompletion(items: CompletionItem[]): number {
  const totalScore = items.reduce(
    (sum, item) => sum + (item.completed ? item.weight : 0),
    0
  )
  return Math.max(0, Math.min(100, Math.round(totalScore)))
}

export function ProfileCompletionWidget({
  user,
  petsCount = 0,
  onNavigate,
  className,
}: ProfileCompletionWidgetProps) {
  // Defensive check for malformed user data
  if (!user) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          Unable to load profile completion data
        </CardContent>
      </Card>
    )
  }

  const { percentage, items } = useMemo(() => {
    const items = createCompletionItems(user, petsCount)
    const percentage = calculateCompletion(items)
    return { percentage, items }
  }, [user, petsCount])

  const handleItemClick = (section: string): void => {
    if (onNavigate) {
      onNavigate(section)
    }
  }

  const incompleteItems = items.filter((item) => !item.completed)
  const colorClass = getCompletionColor(percentage)
  const motivationalText = getMotivationalText(percentage)

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>Profile Completion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="relative w-32 h-32"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion progress"
          >
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
                className={cn('transition-all duration-500', colorClass)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-3xl font-bold', colorClass)}>{percentage}%</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center">{motivationalText}</p>
        </div>

        {/* Checklist of incomplete items */}
        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Complete your profile:</h3>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.section)}
                  aria-label={`${item.completed ? 'Completed' : 'Complete'}: ${item.label}`}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-md transition-colors text-left',
                    onNavigate && 'hover:bg-accent cursor-pointer',
                    !onNavigate && 'cursor-default'
                  )}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.completed ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-sm truncate',
                        item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  {!item.completed && onNavigate && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completion message */}
        {percentage === 100 && (
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              🎉 Your profile is complete! You&apos;ll get more visibility and connections.
            </p>
          </div>
        )}

        {/* Motivational tip for incomplete profiles */}
        {percentage < 100 && (
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {getMotivationalTip(percentage)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
