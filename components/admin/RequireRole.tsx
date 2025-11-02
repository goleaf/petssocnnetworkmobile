/**
 * Server Component: Role-based Access Control Guard
 * 
 * Wraps admin pages and redirects unauthorized users
 */

import 'server-only'
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole, type AdminRole } from '@/lib/auth/session'

export default async function RequireRole({
  roles,
  children,
}: {
  roles: AdminRole[]
  children: ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!hasRole(user, roles)) {
    redirect('/login?next=/admin')
  }
  
  return <>{children}</>
}

