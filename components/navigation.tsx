"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  PawPrint,
  Menu,
  LogOut,
  User,
  UserPlus,
  Users,
  MessageCircle,
  PenSquare,
  Settings,
  Search,
  Home,
  Heart,
  TrendingUp,
  CalendarClock,
  UsersRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { useApplyProfilePhotoUpdates } from "@/lib/profile-updates"
import { ScreenReaderToggle } from "@/components/a11y/ScreenReaderToggle"
import { PetSwitcher } from "@/components/pets/pet-switcher"

export function Navigation() {
  const { user, isAuthenticated, logout, isAdmin, isModerator } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for profile photo updates (SSE/BroadcastChannel) and patch auth store/local cache
  useApplyProfilePhotoUpdates()

  const baseItems = [
    { href: "/blog", label: "Blogs", icon: FileText },
    { href: "/groups", label: "Groups", icon: UsersRound },
    { href: "/wiki", label: "Wiki", icon: BookOpen },
    { href: "/shelters", label: "Shelters", icon: Heart },
    { href: "/search", label: "Search", icon: Search },
  ]
  const authedItems = [
    { href: "/", label: "Feed", icon: Home },
    { href: "/messages", label: "Messages", icon: MessageCircle },
  ]
  const navItems = isAuthenticated ? [...authedItems, ...baseItems] : baseItems

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  return (
    <nav id="primary-navigation" aria-label="Primary" className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <PawPrint className="h-6 w-6" />
            <span>PawSocial</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(pathname === item.href && "bg-accent")}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <PetSwitcher />
                <Link href="/blog/create">
                  <Button size="sm">
                    <PenSquare className="h-4 w-4 mr-2" />
                    Write
                  </Button>
                </Link>
                {/* Screen reader mode toggle (desktop) */}
                <ScreenReaderToggle />
                <Link href="/promote">
                  <Button size="sm" variant="outline">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Promote
                  </Button>
                </Link>
                <Link href="/dashboard/schedule">
                  <Button size="sm" variant="outline">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </Link>
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                        <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link href={`/user/${user.username}`}>
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/">
                      <DropdownMenuItem>
                        <Home className="mr-2 h-4 w-4" />
                        Feed
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/messages">
                      <DropdownMenuItem>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Messages
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <Link href="/shelters">
                      <DropdownMenuItem>
                        <Heart className="mr-2 h-4 w-4" />
                        Sponsor Shelters
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/promote">
                      <DropdownMenuItem>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Promote Posts
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/dashboard/schedule">
                      <DropdownMenuItem>
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Schedule Posts
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <Link href="/settings/privacy">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Privacy Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/settings/notifications">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Notification Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/drafts">
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        My Drafts
                      </DropdownMenuItem>
                    </Link>
                    {(isAdmin() || isModerator()) && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/admin/moderation">
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Moderation
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                {/* Screen reader mode toggle (desktop, signed out) */}
                <ScreenReaderToggle />
                <Link href="/register">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {mounted && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  {/* Screen reader mode toggle (mobile) */}
                  <div>
                    <ScreenReaderToggle />
                  </div>
                  {/* Pet switcher (mobile) */}
                  {isAuthenticated && user && (
                    <div>
                      <PetSwitcher />
                    </div>
                  )}
                  {isAuthenticated && user && (
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                        <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  )}
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                      <Button
                        variant="ghost"
                        className={cn("w-full justify-start", pathname === item.href && "bg-accent")}
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  {isAuthenticated && user ? (
                    <>
                      <Link href="/blog/create" onClick={() => setIsOpen(false)}>
                        <Button className="w-full justify-start">
                          <PenSquare className="h-4 w-4 mr-2" />
                          Write
                        </Button>
                      </Link>
                      <Link href="/dashboard/schedule" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <CalendarClock className="h-4 w-4 mr-2" />
                          Schedule Posts
                        </Button>
                      </Link>
                      <NotificationsDropdown />
                      <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
          {!mounted && (
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
