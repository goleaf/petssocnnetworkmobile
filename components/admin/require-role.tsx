/**
 * RequireRole - Server Component for RBAC protection
 * 
 * Wraps children and only renders them if user has one of the specified roles.
 * Returns 403 if user is not authenticated or doesn't have required role.
 */

import { redirect } from "next/navigation"
import { fetchSession, hasRoleInRoles } from "@/lib/auth-server"
import type { UserRole } from "@/lib/types"

interface RequireRoleProps {
  children: React.ReactNode
  roles: UserRole[]
}

/**
 * Server component that checks if user has required role(s)
 * Redirects to /unauthorized if access is denied
 */
export async function RequireRole({ children, roles }: RequireRoleProps) {
  const sessionData = await fetchSession()
  
  // Check if user is authenticated
  if (!sessionData?.user) {
    redirect("/unauthorized?reason=not-authenticated")
  }
  
  // Check if user has required role
  if (!hasRoleInRoles(sessionData.user, roles)) {
    redirect("/unauthorized?reason=insufficient-role")
  }
  
  return <>{children}</>
}

