import type { User } from '@/lib/types'

export function computeProfileCompletionForServer(user: User, petsCount: number = 0): number {
  const w = { avatar: 10, cover: 5, bio: 15, location: 5, birthday: 5, phoneVerified: 10, emailVerified: 10, interests: 10, hasPet: 20, contactInfo: 5, socialLinks: 5 }
  let total = 0
  if (user.avatar) total += w.avatar
  if (user.coverPhoto) total += w.cover
  if (user.bio) total += w.bio
  if (user.location) total += w.location
  if (user.dateOfBirth) total += w.birthday
  const phoneVerified = (user as any).phoneVerified === true
  if (phoneVerified) total += w.phoneVerified
  const emailVerified = Boolean(user.emailVerified || (user as any).emailVerification?.status === 'verified')
  if (emailVerified) total += w.emailVerified
  if (Array.isArray(user.interests) && user.interests.length > 0) total += w.interests
  if (petsCount > 0) total += w.hasPet
  if (((user as any).phone && (user as any).phone.trim()) || (user.website && user.website.trim())) total += w.contactInfo
  const social = (user as any).socialMedia || {}
  const hasSocial = Boolean(social.instagram || social.facebook || social.twitter || social.youtube || social.linkedin || social.tiktok)
  if (hasSocial) total += w.socialLinks
  return Math.max(0, Math.min(100, Math.round(total)))
}

