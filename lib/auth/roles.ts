/**
 * Role-based Authorization Utilities
 * 
 * Provides predicates and guard wrappers for role-based access control
 * that can be used in server components and route handlers.
 */

import { getSession } from "../auth-server"
import type { User, UserRole } from "../types"

export interface RolePredicate {
  (user: User | null): boolean
}

export interface GuardResult {
  authorized: boolean
  user: User | null
  error?: string
}

/**
 * Role hierarchy definition
 * Lower roles inherit permissions from higher roles
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
}

/**
 * Check if a role has at least the required level
 */
export function hasRoleLevel(role: UserRole | undefined, requiredLevel: number): boolean {
  if (!role) return false
  const level = ROLE_HIERARCHY[role] || 0
  return level >= requiredLevel
}

/**
 * Role predicates - pure functions that check if a user has a role
 */
export const rolePredicates = {
  /**
   * Check if user is an admin
   */
  isAdmin: (user: User | null): boolean => {
    return user?.role === "admin"
  },

  /**
   * Check if user is a moderator (includes admin)
   */
  isModerator: (user: User | null): boolean => {
    return user?.role === "moderator" || user?.role === "admin"
  },

  /**
   * Check if user is an expert (currently mapped to admin/moderator, can be extended)
   */
  isExpert: (user: User | null): boolean => {
    return user?.role === "moderator" || user?.role === "admin"
  },

  /**
   * Check if user has a specific role
   */
  hasRole: (role: UserRole) => (user: User | null): boolean => {
    return user?.role === role || false
  },

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (...roles: UserRole[]) => (user: User | null): boolean => {
    if (!user?.role) return false
    return roles.includes(user.role)
  },

  /**
   * Check if user is authenticated (not null)
   */
  isAuthenticated: (user: User | null): boolean => {
    return user !== null
  },
}

/**
 * Guard wrappers - check authorization from session and return results
 */
export const guards = {
  /**
   * Check if current user is admin
   * Returns guard result with authorization status
   */
  requireAdmin: async (): Promise<GuardResult> => {
    const session = await getSession()
    
    if (!session) {
      return {
        authorized: false,
        user: null,
        error: "Not authenticated",
      }
    }

    // Import here to avoid circular dependency
    const { getUserById } = await import("../storage")
    const user = getUserById(session.userId)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: "User not found",
      }
    }

    const authorized = rolePredicates.isAdmin(user)

    return {
      authorized,
      user: authorized ? user : null,
      error: authorized ? undefined : "Admin role required",
    }
  },

  /**
   * Check if current user is moderator (includes admin)
   * Returns guard result with authorization status
   */
  requireModerator: async (): Promise<GuardResult> => {
    const session = await getSession()
    
    if (!session) {
      return {
        authorized: false,
        user: null,
        error: "Not authenticated",
      }
    }

    const { getUserById } = await import("../storage")
    const user = getUserById(session.userId)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: "User not found",
      }
    }

    const authorized = rolePredicates.isModerator(user)

    return {
      authorized,
      user: authorized ? user : null,
      error: authorized ? undefined : "Moderator role required",
    }
  },

  /**
   * Check if current user is expert
   * Returns guard result with authorization status
   */
  requireExpert: async (): Promise<GuardResult> => {
    const session = await getSession()
    
    if (!session) {
      return {
        authorized: false,
        user: null,
        error: "Not authenticated",
      }
    }

    const { getUserById } = await import("../storage")
    const user = getUserById(session.userId)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: "User not found",
      }
    }

    const authorized = rolePredicates.isExpert(user)

    return {
      authorized,
      user: authorized ? user : null,
      error: authorized ? undefined : "Expert role required",
    }
  },

  /**
   * Check if current user has a specific role
   * Returns guard result with authorization status
   */
  requireRole: (role: UserRole) => async (): Promise<GuardResult> => {
    const session = await getSession()
    
    if (!session) {
      return {
        authorized: false,
        user: null,
        error: "Not authenticated",
      }
    }

    const { getUserById } = await import("../storage")
    const user = getUserById(session.userId)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: "User not found",
      }
    }

    const authorized = rolePredicates.hasRole(role)(user)

    return {
      authorized,
      user: authorized ? user : null,
      error: authorized ? undefined : `Role '${role}' required`,
    }
  },

  /**
   * Check if current user has any of the specified roles
   * Returns guard result with authorization status
   */
  requireAnyRole: (...roles: UserRole[]) => async (): Promise<GuardResult> => {
    const session = await getSession()
    
    if (!session) {
      return {
        authorized: false,
        user: null,
        error: "Not authenticated",
      }
    }

    const { getUserById } = await import("../storage")
    const user = getUserById(session.userId)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: "User not found",
      }
    }

    const authorized = rolePredicates.hasAnyRole(...roles)(user)

    return {
      authorized,
      user: authorized ? user : null,
      error: authorized ? undefined : `One of roles [${roles.join(", ")}] required`,
    }
  },

  /**
   * Check if current user is authenticated
   * Returns guard result with authorization status
   */
  requireAuth: async (): Promise<GuardResult> => {
    const session = await getSession()
    
    if (!session) {
      return {
        authorized: false,
        user: null,
        error: "Not authenticated",
      }
    }

    const { getUserById } = await import("../storage")
    const user = getUserById(session.userId)

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: "User not found",
      }
    }

    return {
      authorized: true,
      user,
    }
  },
}

/**
 * Throwing guards - throw errors if authorization fails
 * Useful for route handlers and server components that can handle errors
 */
export const throwingGuards = {
  /**
   * Require admin role, throws if not authorized
   */
  requireAdmin: async (): Promise<User> => {
    const result = await guards.requireAdmin()
    if (!result.authorized || !result.user) {
      throw new Error(result.error || "Admin role required")
    }
    return result.user
  },

  /**
   * Require moderator role, throws if not authorized
   */
  requireModerator: async (): Promise<User> => {
    const result = await guards.requireModerator()
    if (!result.authorized || !result.user) {
      throw new Error(result.error || "Moderator role required")
    }
    return result.user
  },

  /**
   * Require expert role, throws if not authorized
   */
  requireExpert: async (): Promise<User> => {
    const result = await guards.requireExpert()
    if (!result.authorized || !result.user) {
      throw new Error(result.error || "Expert role required")
    }
    return result.user
  },

  /**
   * Require specific role, throws if not authorized
   */
  requireRole: (role: UserRole) => async (): Promise<User> => {
    const result = await guards.requireRole(role)()
    if (!result.authorized || !result.user) {
      throw new Error(result.error || `Role '${role}' required`)
    }
    return result.user
  },

  /**
   * Require any of specified roles, throws if not authorized
   */
  requireAnyRole: (...roles: UserRole[]) => async (): Promise<User> => {
    const result = await guards.requireAnyRole(...roles)()
    if (!result.authorized || !result.user) {
      throw new Error(result.error || `One of roles [${roles.join(", ")}] required`)
    }
    return result.user
  },

  /**
   * Require authentication, throws if not authenticated
   */
  requireAuth: async (): Promise<User> => {
    const result = await guards.requireAuth()
    if (!result.authorized || !result.user) {
      throw new Error(result.error || "Authentication required")
    }
    return result.user
  },
}

/**
 * Helper to check role from user object (pure function)
 * Useful when you already have the user object
 */
export function checkUserRole(user: User | null, predicate: RolePredicate): boolean {
  return predicate(user)
}

/**
 * Helper to check multiple predicates with AND logic
 */
export function checkAllRoles(user: User | null, predicates: RolePredicate[]): boolean {
  return predicates.every(predicate => predicate(user))
}

/**
 * Helper to check multiple predicates with OR logic
 */
export function checkAnyRole(user: User | null, predicates: RolePredicate[]): boolean {
  return predicates.some(predicate => predicate(user))
}

