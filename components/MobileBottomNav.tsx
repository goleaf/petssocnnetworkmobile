"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, MessageCircle, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { CreatePostButton } from "@/components/posts/CreatePostButton"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background">
      <div className="grid grid-cols-5 items-center h-16">
        <Link href="/" className="flex items-center justify-center">
          <Button variant="ghost" size="icon" className={cn(pathname === "/" && "text-primary")}
            aria-label="Home">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/search" className="flex items-center justify-center">
          <Button variant="ghost" size="icon" className={cn(pathname?.startsWith("/search") && "text-primary")}
            aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
        </Link>

        {/* Central create post button */}
        <div className="flex items-center justify-center">
          <CreatePostButton
            iconOnly
            size="icon"
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg"
            aria-label="Create post"
          />
        </div>

        <Link href={isAuthenticated ? "/messages" : "/login"} className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn(pathname?.startsWith("/messages") && "text-primary")}
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </Link>
        <Link href={isAuthenticated && user ? `/user/${user.username}` : "/login"} className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={cn(pathname?.startsWith("/user/") && "text-primary")}
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </nav>
  )
}

export default MobileBottomNav

