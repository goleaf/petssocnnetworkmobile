"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Globe, Twitter, Instagram, Facebook, Linkedin, Award } from "lucide-react"
import type { User, AuthorInfo } from "@/lib/types"
import Link from "next/link"

interface AuthorPageProps {
  user: User
  authorInfo?: AuthorInfo
  showContactLinks?: boolean
}

/**
 * Author Page Component
 * Displays author information with bylines, vet badge, and contact links
 */
export function AuthorPage({ user, authorInfo, showContactLinks = true }: AuthorPageProps) {
  const isVet = authorInfo?.vetBadge || user.badge === "vet"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
            <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{user.fullName}</CardTitle>
              {isVet && (
                <Badge variant="default" className="gap-1">
                  <Award className="h-3 w-3" />
                  Verified Veterinarian
                </Badge>
              )}
            </div>
            {authorInfo?.byline && (
              <p className="text-muted-foreground">{authorInfo.byline}</p>
            )}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Credentials */}
        {authorInfo?.credentials && authorInfo.credentials.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Credentials</h4>
            <div className="flex flex-wrap gap-2">
              {authorInfo.credentials.map((cred, index) => (
                <Badge key={index} variant="outline">
                  {cred}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Specialization */}
        {authorInfo?.specialization && authorInfo.specialization.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Specialization</h4>
            <div className="flex flex-wrap gap-2">
              {authorInfo.specialization.map((spec, index) => (
                <Badge key={index} variant="secondary">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contact Links */}
        {showContactLinks && authorInfo?.contactLinks && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Contact</h4>
            <div className="flex flex-wrap gap-2">
              {authorInfo.contactLinks.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${authorInfo.contactLinks.email}`} className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              {authorInfo.contactLinks.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={authorInfo.contactLinks.website} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                </Button>
              )}
              {authorInfo.contactLinks.social?.twitter && (
                <Button variant="outline" size="sm" asChild>
                  <a href={authorInfo.contactLinks.social.twitter} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                </Button>
              )}
              {authorInfo.contactLinks.social?.instagram && (
                <Button variant="outline" size="sm" asChild>
                  <a href={authorInfo.contactLinks.social.instagram} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                </Button>
              )}
              {authorInfo.contactLinks.social?.facebook && (
                <Button variant="outline" size="sm" asChild>
                  <a href={authorInfo.contactLinks.social.facebook} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </a>
                </Button>
              )}
              {authorInfo.contactLinks.social?.linkedin && (
                <Button variant="outline" size="sm" asChild>
                  <a href={authorInfo.contactLinks.social.linkedin} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* View Profile Link */}
        <div className="pt-4 border-t">
          <Button variant="outline" asChild className="w-full">
            <Link href={`/profile/${user.username}`}>
              View Full Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

