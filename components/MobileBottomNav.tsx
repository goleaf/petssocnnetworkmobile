"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, MessageCircle, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { CreatePostButton } from "@/components/posts/CreatePostButton"
import { useEffect, useState } from "react"
import { getUserConversations, getDirectMessagesByConversation } from "@/lib/storage"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const [unreadTotal, setUnreadTotal] = useState(0)

  const recomputeUnread = () => {
    if (!user) { setUnreadTotal(0); return }
    const conversations = getUserConversations(user.id)
    let total = 0
    for (const conv of conversations) {
      const fromCounts = conv.unreadCounts?.[user.id]
      if (typeof fromCounts === "number") {
        total += fromCounts
        continue
      }
      const history = getDirectMessagesByConversation(conv.id)
      total += history.filter((m) => m.senderId !== user.id && !m.readAt?.[user.id]).length
    }
    setUnreadTotal(total)
  }

  useEffect(() => { recomputeUnread() }, [user?.id])
  useStorageListener(["pet_social_conversations", "pet_social_direct_messages"], recomputeUnread)

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

        <Link href={isAuthenticated ? "/messages" : "/login"} className="flex items-center justify-center relative">
          <Button
            variant="ghost"
            size="icon"
            className={cn(pathname?.startsWith("/messages") && "text-primary")}
            aria-label="Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          {isAuthenticated && unreadTotal > 0 && (
            <span className="absolute top-2 right-4 inline-flex min-w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-4 text-primary-foreground">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
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
