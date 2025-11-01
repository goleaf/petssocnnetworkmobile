import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WikiArticle } from "@/lib/types"
import { Calendar, Eye, Heart, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface InfoboxCardProps {
  article: WikiArticle
  viewCount?: number
  likeCount?: number
  authorName?: string
}

export function InfoboxCard({
  article,
  viewCount = article.views,
  likeCount = article.likes?.length || 0,
  authorName,
}: InfoboxCardProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Quick Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Category</div>
          <Badge variant="secondary" className="capitalize">
            {article.category}
          </Badge>
          {article.subcategory && (
            <>
              <div className="text-sm font-medium text-muted-foreground mt-3">Subcategory</div>
              <Badge variant="outline" className="capitalize">
                {article.subcategory}
              </Badge>
            </>
          )}
        </div>

        {article.species && article.species.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Species</div>
            <div className="flex flex-wrap gap-2">
              {article.species.map((species) => (
                <Badge key={species} variant="outline" className="capitalize">
                  {species}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Published</span>
          </div>
          <div className="text-sm">
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
          </div>
        </div>

        {article.updatedAt !== article.createdAt && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last Updated</span>
            </div>
            <div className="text-sm">
              {new Date(article.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Views</span>
            </div>
            <span className="font-medium">{viewCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>Likes</span>
            </div>
            <span className="font-medium">{likeCount.toLocaleString()}</span>
          </div>
        </div>

        {authorName && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Author</span>
            </div>
            <div className="text-sm font-medium">{authorName}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

