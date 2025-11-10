/**
 * Example usage of ProfileCompletionWidget component
 * 
 * This file demonstrates how to integrate the ProfileCompletionWidget
 * into a profile page or settings page.
 */

"use client"

import React from 'react'
import { ProfileCompletionWidget } from './profile-completion-widget'
import type { User } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface ProfileCompletionExampleProps {
  user: User
  petsCount?: number
}

export function ProfileCompletionExample({ user, petsCount = 0 }: ProfileCompletionExampleProps) {
  const router = useRouter()

  const handleNavigate = (section: string) => {
    // Navigate to the appropriate settings section
    switch (section) {
      case 'basic-info':
        router.push('/settings/profile?tab=basic-info')
        break
      case 'about-me':
        router.push('/settings/profile?tab=about-me')
        break
      case 'contact':
        router.push('/settings/profile?tab=contact')
        break
      case 'pets':
        router.push('/pets/new')
        break
      default:
        router.push('/settings/profile')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <ProfileCompletionWidget
        user={user}
        petsCount={petsCount}
        onNavigate={handleNavigate}
        className="shadow-lg"
      />
    </div>
  )
}

/**
 * Usage in a page component:
 * 
 * import { ProfileCompletionExample } from '@/components/profile/profile-completion-widget-example'
 * 
 * export default function ProfilePage() {
 *   const user = getCurrentUser() // Your user fetching logic
 *   const petsCount = getUserPetsCount(user.id) // Your pets count logic
 *   
 *   return (
 *     <div>
 *       <ProfileCompletionExample user={user} petsCount={petsCount} />
 *     </div>
 *   )
 * }
 */
