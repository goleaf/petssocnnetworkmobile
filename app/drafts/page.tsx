"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDraftsByUserId, deleteDraft } from "@/lib/drafts"
import type { Draft } from "@/lib/types"
import { FileText, Trash2, Clock } from "lucide-react"
import Link from "next/link"

export default function DraftsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }
    const userDrafts = getDraftsByUserId(user.id)
    setDrafts(userDrafts)
  }, [user, router])

  const handleDelete = (id: string) => {
    deleteDraft(id)
    setDrafts(drafts.filter((d) => d.id !== id))
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Drafts</h1>
        <p className="text-muted-foreground mt-2">Continue working on your saved drafts</p>
      </div>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No drafts yet</p>
            <Link href="/blog/create">
              <Button>Create a Blog Post</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{draft.title || "Untitled Draft"}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last saved: {new Date(draft.lastSaved).toLocaleString("en-GB")}</span>
                      </div>
                      <span className="capitalize">{draft.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={draft.type === "blog" ? "/blog/create" : "/wiki/create"}>
                      <Button variant="outline" size="sm">
                        Continue
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(draft.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">{draft.content || "No content yet..."}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
