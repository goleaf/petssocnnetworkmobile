import type { User, PrivacyLevel } from "@/lib/types"

export type PrivacyScope = "pets" | "posts" | "followers" | "following"

function getDisplayName(user: User): string {
  const fullName = user.fullName?.trim()
  if (!fullName) {
    return user.username
  }

  const parts = fullName.split(/\s+/)
  return parts[0] || user.username
}

function getPossessive(name: string): string {
  return name.endsWith("s") ? `${name}'` : `${name}'s`
}

export function getPrivacyNotice(options: {
  profileUser: User
  scope: PrivacyScope
  viewerId: string | null
  canRequestAccess?: boolean
}): string {
  const { profileUser, scope, viewerId, canRequestAccess = false } = options
  const displayName = getDisplayName(profileUser)
  const possessiveName = getPossessive(displayName)
  const privacySetting = profileUser.privacy?.[scope] as PrivacyLevel | undefined

  const followCta =
    privacySetting === "followers-only"
      ? !viewerId
        ? " Log in to request access."
        : canRequestAccess
          ? " Send a follow request to see more."
          : ""
      : ""

  let baseMessage: string

  switch (scope) {
    case "pets": {
      if (privacySetting === "private") {
        baseMessage = `${possessiveName} pets are visible only to them.`
      } else if (privacySetting === "followers-only") {
        baseMessage = `${displayName} shares their pets with approved followers only.`
      } else {
        baseMessage = "These pets are hidden by the owner's privacy settings."
      }
      break
    }
    case "posts": {
      if (privacySetting === "private") {
        baseMessage = `${possessiveName} posts are visible only to them.`
      } else if (privacySetting === "followers-only") {
        baseMessage = `${displayName} shares their posts with approved followers only.`
      } else {
        baseMessage = "These posts are hidden by the owner's privacy settings."
      }
      break
    }
    case "followers": {
      if (privacySetting === "private") {
        baseMessage = `${possessiveName} followers list is visible only to them.`
      } else if (privacySetting === "followers-only") {
        baseMessage = `${displayName} shares their followers list with approved followers only.`
      } else {
        baseMessage = "This followers list is hidden by the owner's privacy settings."
      }
      break
    }
    case "following": {
      if (privacySetting === "private") {
        baseMessage = `${possessiveName} following list is visible only to them.`
      } else if (privacySetting === "followers-only") {
        baseMessage = `${displayName} shares who they follow with approved followers only.`
      } else {
        baseMessage = "This following list is hidden by the owner's privacy settings."
      }
      break
    }
    default: {
      baseMessage = "This content is hidden by the owner's privacy settings."
    }
  }

  return `${baseMessage}${followCta}`
}

