/**
 * Admin Layout with RBAC Protection
 * 
 * Wraps all admin routes with role-based access control
 * This layout applies to all routes under /admin/*
 */

import { RequireRole } from '@/components/admin/require-role'
import AdminNav from '@/components/admin/AdminNav'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Map ContentManager to moderator role (since ContentManager doesn't exist in UserRole)
  const allowedRoles: UserRole[] = ['admin', 'moderator']

  return (
    <RequireRole roles={allowedRoles}>
      <div className="min-h-screen flex bg-background">
        <AdminNav />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </RequireRole>
  )
}

