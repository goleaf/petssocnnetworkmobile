"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, Bell, Settings, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useKeyboardShortcut } from "@/components/a11y/useKeyboardShortcut"

interface BreadcrumbItem {
  label: string
  href: string
}

export function AdminTopbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Generate breadcrumbs from pathname
  const breadcrumbs: BreadcrumbItem[] = (() => {
    if (!pathname) return []
    
    const parts = pathname.split("/").filter(Boolean)
    const crumbs: BreadcrumbItem[] = [{ label: "Admin", href: "/admin" }]
    
    if (parts.length > 1) {
      parts.slice(1).forEach((part, index) => {
        const path = "/" + parts.slice(0, index + 2).join("/")
        const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ")
        crumbs.push({ label, href: path })
      })
    }
    
    return crumbs
  })()

  // Keyboard shortcut: Cmd/Ctrl + K for search (respects sticky/slow keys)
  useKeyboardShortcut(
    "k",
    () => {
      setShowSearch(true)
      setTimeout(() => searchInputRef.current?.focus(), 0)
    },
    { withCtrlOrMeta: true }
  )

  // Escape to close search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSearch) setShowSearch(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showSearch])

  // Focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
      setShowSearch(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              <a
                href={crumb.href}
                className={cn(
                  "transition-colors",
                  index === breadcrumbs.length - 1
                    ? "font-medium text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {crumb.label}
              </a>
            </div>
          ))}
        </nav>

        {/* Search and Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search admin panel... (Esc to close)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
                onBlur={() => {
                  // Delay hiding to allow form submission
                  setTimeout(() => setShowSearch(false), 200)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(false)}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              aria-label="Open search"
              title="Search (Cmd/Ctrl + K)"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" aria-label="Settings" asChild>
            <a href="/admin/settings">
              <Settings className="h-4 w-4" />
            </a>
          </Button>

          {/* User menu placeholder */}
          <Button variant="ghost" size="icon" aria-label="User menu">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
