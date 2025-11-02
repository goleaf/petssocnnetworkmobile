/**
 * Server-side Session Utilities for Admin
 * 
 * Extends the existing auth system with admin-specific session helpers
 */

import 'server-only'
import { getCurrentUser as getAuthCurrentUser } from '../auth-server'
import { hasRole as checkUserRole } from './roles'
import type { User, UserRole } from '../types'

export type AdminRole = 'Admin' | 'Moderator' | 'Expert' | 'ContentManager' | 'OrgRep'

/**
 * Extended session user type for admin interface
 */
export type SessionUser = {
  id: string
  email: string
  name?: string | null
  roles: AdminRole[]
}

/**
 * Map UserRole to AdminRole array
 */
function mapUserRoleToAdminRoles(userRole: UserRole | undefined): AdminRole[] {
  if (!userRole) return []
  
  const roleMap: Record<UserRole, AdminRole[]> = {
    'admin': ['Admin'],
    'moderator': ['Moderator'],
    'user': [],
  }
  
  return roleMap[userRole] || []
}

/**
 * Get current user with admin role mapping
 * 
 * This extends the existing getCurrentUser() to provide admin-compatible session data
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  // Use existing auth system
  const user = await getAuthCurrentUser()
  
  if (!user) {
    // Support dev admin user via env var
    if (process.env.NODE_ENV !== 'production') {
      const raw = process.env.ADMIN_DEV_USER ?? ''
      if (raw) {
        const [id, email, roles = 'Admin'] = raw.split(',')
        return {
          id,
          email,
          roles: roles.split('|') as AdminRole[],
        }
      }
    }
    return null
  }

  // Map existing role to admin roles
  const roles = mapUserRoleToAdminRoles(user.role)
  
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    roles,
  }
}

/**
 * Check if user has any of the allowed roles
 */
export function hasRole(
  user: { roles?: AdminRole[] } | null | undefined,
  allowed: AdminRole[] = []
): boolean {
  if (!user || !Array.isArray(user.roles)) return false
  return user.roles.some(r => allowed.includes(r))
}

