/**
 * Admin Layout with RBAC Protection
 * 
 * Wraps all admin routes with role-based access control
 * Includes persistent sidebar and topbar
 */

import { RequireRole } from "@/components/admin/require-role"
import { AdminSidebar } from "./components/admin-sidebar"
import { AdminTopbar } from "./components/admin-topbar"
import type { UserRole } from "@/lib/types"

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Map ContentManager to moderator role (since ContentManager doesn't exist in UserRole)
  const allowedRoles: UserRole[] = ["admin", "moderator"]

  return (
    <RequireRole roles={allowedRoles}>
      <div className="flex h-screen overflow-hidden bg-white">
        <AdminSidebar />
        <div 
          className="flex flex-1 flex-col overflow-hidden transition-all duration-300"
          style={{ marginLeft: "var(--admin-sidebar-width, 256px)" }}
        >
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </RequireRole>
  )
}
