"use client"

import { useState, useRef, useEffect, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Shield,
  Users,
  BookOpen,
  UsersRound,
  MapPin,
  ShoppingBag,
  FileText,
  Bell,
  Search,
  Languages,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboardShortcut } from "@/components/a11y/useKeyboardShortcut"

// Context for sidebar state
const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false })

export const useSidebar = () => useContext(SidebarContext)

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  section?: string
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, section: "dashboard" },
  { label: "Moderation", href: "/admin/moderation", icon: Shield, section: "moderation" },
  { label: "Users", href: "/admin/users", icon: Users, section: "users" },
  { label: "Wiki", href: "/admin/wiki", icon: BookOpen, section: "wiki" },
  { label: "Groups", href: "/admin/groups", icon: UsersRound, section: "groups" },
  { label: "Places", href: "/admin/places", icon: MapPin, section: "places" },
  { label: "Products", href: "/admin/products", icon: ShoppingBag, section: "products" },
  { label: "Blog", href: "/admin/blog", icon: FileText, section: "blog" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, section: "notifications" },
  { label: "Search", href: "/admin/search", icon: Search, section: "search" },
  { label: "Translation", href: "/admin/translation", icon: Languages, section: "translation" },
  { label: "Settings", href: "/admin/settings", icon: Settings, section: "settings" },
  { label: "Analytics Overview", href: "/admin/analytics", icon: BarChart3, section: "analytics" },
  { label: "Search Analytics", href: "/admin/analytics/search", icon: Search, section: "analytics" },
  { label: "Relationship Analytics", href: "/admin/analytics/relationships", icon: UsersRound, section: "analytics" },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut: Cmd/Ctrl + B toggle (respects sticky/slow keys)
  useKeyboardShortcut("b", () => setCollapsed((prev) => !prev), { withCtrlOrMeta: true })

  // Update CSS variable for main content spacing
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      collapsed ? "64px" : "256px"
    )
  }, [collapsed])

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-gray-900 text-white transition-all duration-300 border-r border-gray-800",
          collapsed ? "w-16" : "w-64"
        )}
      >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          {!collapsed && <h2 className="text-lg font-semibold">Admin Panel</h2>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-md p-2 hover:bg-gray-800 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-gray-800",
                      isActive ? "bg-gray-800 text-white" : "text-gray-300"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
    </SidebarContext.Provider>
  )
}
