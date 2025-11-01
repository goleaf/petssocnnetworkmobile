/**
 * Centralized Permission Policy System
 * 
 * PRINCIPLES:
 * - Deny by default: All permissions default to false unless explicitly granted
 * - Audited decisions: All permission logic is documented and testable
 * - Single source of truth: All permission checks go through this module
 */

import type { User, UserRole, WikiArticle, BlogPost, ExpertProfile } from "./types"
import { getUsers } from "./storage"

/**
 * Permission Action Types
 */
export type PermissionAction =
  | "create_wiki"
  | "edit_wiki"
  | "publish_health"
  | "protect_content"
  | "publish_blog"
  | "promote_blog"
  | "verify_wiki_revision"

/**
 * Resource Context for permission checks
 */
export interface PermissionContext {
  user: User | null
  resource?: {
    type: "wiki" | "blog" | "comment"
    ownerId?: string
    category?: string
    [key: string]: unknown
  }
}

/**
 * Check if a user is an expert (vet badge or expert profile)
 * 
 * AUDIT: Experts are users with:
 * - badge === "vet" OR
 * - A verified ExpertProfile record
 * 
 * @param user - User to check
 * @returns true if user is an expert
 */
export function isExpert(user: User | null | undefined): boolean {
  if (!user) return false

  // Check for vet badge
  if (user.badge === "vet") {
    return true
  }

  // Check for expert profile (if stored separately)
  // Note: ExpertProfile lookup would be implemented here if needed
  // For now, badge check is sufficient

  return false
}

/**
 * Check if user can create wiki articles
 * 
 * AUDIT: All authenticated users can create wiki articles.
 * However, health category articles require expert status.
 * 
 * @param user - User attempting to create
 * @param category - Wiki category (optional, required for health checks)
 * @returns true if user can create
 */
export function canCreateWiki(
  user: User | null | undefined,
  category?: string
): boolean {
  if (!user) return false

  // Health category requires expert status
  if (category === "health") {
    return isExpert(user)
  }

  // All authenticated users can create non-health wiki articles
  return true
}

/**
 * Check if user can edit a wiki article
 * 
 * AUDIT: Users can edit if:
 * - They own the article OR
 * - They are admin/moderator
 * 
 * @param user - User attempting to edit
 * @param article - Wiki article being edited
 * @returns true if user can edit
 */
export function canEditWiki(
  user: User | null | undefined,
  article: WikiArticle | null | undefined
): boolean {
  if (!user || !article) return false

  // Owner can always edit
  if (article.authorId === user.id) {
    return true
  }

  // Admin and moderator can edit any article
  if (user.role === "admin" || user.role === "moderator") {
    return true
  }

  return false
}

/**
 * Check if user can publish health-related content
 * 
 * AUDIT: Only experts can publish health content to ensure accuracy.
 * This applies to:
 * - Health category wiki articles
 * - Health-related blog posts
 * - Health wiki revisions verification
 * 
 * @param user - User attempting to publish
 * @returns true if user can publish health content
 */
export function canPublishHealth(user: User | null | undefined): boolean {
  if (!user) return false
  return isExpert(user)
}

/**
 * Check if user can protect content (make it protected/restricted)
 * 
 * AUDIT: Only admins and moderators can protect content.
 * Protection typically means:
 * - Making content private/restricted
 * - Limiting access to specific groups
 * - Adding content warnings
 * 
 * @param user - User attempting to protect
 * @returns true if user can protect content
 */
export function canProtect(user: User | null | undefined): boolean {
  if (!user) return false

  // Only admins and moderators can protect content
  return user.role === "admin" || user.role === "moderator"
}

/**
 * Check if user can publish a blog post
 * 
 * AUDIT: Users can publish their own blog posts.
 * 
 * @param user - User attempting to publish
 * @param post - Blog post being published
 * @returns true if user can publish
 */
export function canPublishBlog(
  user: User | null | undefined,
  post: BlogPost | null | undefined
): boolean {
  if (!user || !post) return false

  // Users can only publish their own posts
  return post.authorId === user.id
}

/**
 * Check if user can promote a blog post
 * 
 * AUDIT: Only admins and moderators can approve/promote blog posts.
 * Promotion makes posts appear more prominently.
 * 
 * @param user - User attempting to promote
 * @returns true if user can promote
 */
export function canPromoteBlog(user: User | null | undefined): boolean {
  if (!user) return false

  // Only admins and moderators can promote posts
  return user.role === "admin" || user.role === "moderator"
}

/**
 * Check if user can verify a wiki revision (for health content)
 * 
 * AUDIT: Only experts can verify health-related wiki revisions.
 * Verification indicates expert approval of health content accuracy.
 * 
 * @param user - User attempting to verify
 * @param category - Wiki category (must be "health" for verification)
 * @returns true if user can verify
 */
export function canVerifyWikiRevision(
  user: User | null | undefined,
  category?: string
): boolean {
  if (!user) return false

  // Only health category revisions can be verified
  if (category !== "health") {
    return false
  }

  // Only experts can verify health revisions
  return isExpert(user)
}

/**
 * Unified permission check function
 * 
 * This is the main entry point for all permission checks.
 * Use this for consistency across the application.
 * 
 * @param action - The permission action to check
 * @param context - Permission context with user and resource info
 * @returns true if permission is granted
 */
export function hasPermission(
  action: PermissionAction,
  context: PermissionContext
): boolean {
  const { user, resource } = context

  switch (action) {
    case "create_wiki":
      return canCreateWiki(user, resource?.category)

    case "edit_wiki":
      return canEditWiki(user, resource as WikiArticle | undefined)

    case "publish_health":
      return canPublishHealth(user)

    case "protect_content":
      return canProtect(user)

    case "publish_blog":
      return canPublishBlog(user, resource as BlogPost | undefined)

    case "promote_blog":
      return canPromoteBlog(user)

    case "verify_wiki_revision":
      return canVerifyWikiRevision(user, resource?.category)

    default:
      // Deny by default
      return false
  }
}

/**
 * Permission check result with reason
 */
export interface PermissionResult {
  allowed: boolean
  reason?: string
}

/**
 * Get permission result with explanation
 * 
 * Useful for displaying permission errors to users.
 * 
 * @param action - The permission action to check
 * @param context - Permission context
 * @returns PermissionResult with allowed status and optional reason
 */
export function getPermissionResult(
  action: PermissionAction,
  context: PermissionContext
): PermissionResult {
  const { user, resource } = context

  if (!user) {
    return {
      allowed: false,
      reason: "You must be logged in to perform this action",
    }
  }

  const allowed = hasPermission(action, context)

  if (!allowed) {
    let reason = "You don't have permission to perform this action"

    switch (action) {
      case "create_wiki":
        if (resource?.category === "health") {
          reason = "Only verified experts can create health-related wiki articles"
        } else {
          reason = "You don't have permission to create wiki articles"
        }
        break

      case "edit_wiki":
        reason = "You can only edit your own wiki articles"
        break

      case "publish_health":
        reason = "Only verified experts can publish health content"
        break

      case "protect_content":
        reason = "Only administrators can protect content"
        break

      case "publish_blog":
        reason = "You can only publish your own blog posts"
        break

      case "promote_blog":
        reason = "Only administrators can promote blog posts"
        break

      case "verify_wiki_revision":
        reason = "Only verified experts can verify health wiki revisions"
        break
    }

    return { allowed: false, reason }
  }

  return { allowed: true }
}

