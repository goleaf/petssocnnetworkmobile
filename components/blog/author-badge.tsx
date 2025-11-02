"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Stethoscope, Mail, Globe, MessageSquare } from "lucide-react"
import Link from "next/link"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AuthorBadgeProps {
  author: User
  showContact?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AuthorBadge({
  author,
  showContact = false,
  size = "md",
  className,
}: AuthorBadgeProps) {
  const isVet = author.badge === "vet" || author.role === "admin"
  const avatarSize = size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-10 w-10"
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"
  
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/user/${author.id}`}>
              <Avatar className={cn(avatarSize, "cursor-pointer hover:ring-2 hover:ring-primary transition-all")}>
                <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.fullName} />
                <AvatarFallback>{author.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{author.fullName}</p>
              {author.bio && <p className="text-xs">{author.bio}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/user/${author.id}`}
              className={cn("font-medium hover:underline truncate", textSize)}
            >
              {author.fullName}
            </Link>
            {isVet && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="flex items-center gap-1 px-1.5 py-0">
                    <Stethoscope className="h-3 w-3" />
                    <span className="text-xs">Vet</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verified Veterinarian</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          {author.bio && (
            <p className={cn("text-muted-foreground truncate", textSize === "text-xs" ? "text-[10px]" : "text-xs")}>
              {author.bio}
            </p>
          )}
        </div>
        
        {showContact && (
          <div className="flex items-center gap-1 ml-auto">
            {author.email && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={`mailto:${author.email}`}>
                      <Mail className="h-3 w-3" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email {author.fullName}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {author.website && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                    <a href={author.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3 w-3" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visit website</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link href={`/user/${author.id}`}>
                    <MessageSquare className="h-3 w-3" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View profile</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
