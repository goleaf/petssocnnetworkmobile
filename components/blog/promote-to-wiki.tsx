"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { promoteBlogSectionToWiki } from "@/lib/actions/blog"
import { BookOpen, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PromoteToWikiProps {
  postId: string
  blockId: string
  sectionContent: string
  onSuccess?: () => void
}

/**
 * Promote Blog Section to Wiki Button
 * Allows users to convert a blog section into a wiki draft
 */
export function PromoteToWikiButton({
  postId,
  blockId,
  sectionContent,
  onSuccess,
}: PromoteToWikiProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [citations, setCitations] = useState<string>("")

  const handlePromote = async () => {
    if (!sectionContent || sectionContent.trim() === "") {
      toast.error("Section content is required")
      return
    }

    setLoading(true)
    try {
      const citationList = citations
        .split("\n")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)

      const result = await promoteBlogSectionToWiki(
        postId,
        blockId,
        sectionContent,
        citationList.length > 0 ? citationList : undefined
      )

      if (result.success) {
        toast.success("Section promoted to wiki successfully")
        setOpen(false)
        setCitations("")
        onSuccess?.()
      } else {
        toast.error(result.error || "Failed to promote section")
      }
    } catch (error) {
      console.error("Error promoting to wiki:", error)
      toast.error("An error occurred while promoting to wiki")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Promote to Wiki
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Promote Section to Wiki</DialogTitle>
          <DialogDescription>
            Convert this blog section into a wiki article draft. You can add citations and review it before publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Section Content</Label>
            <Textarea
              value={sectionContent}
              readOnly
              className="min-h-[150px] bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="citations">
              Citations (optional)
            </Label>
            <Textarea
              id="citations"
              placeholder="Add citations, one per line&#10;Example:&#10;Smith, J. (2023). Pet Care Guide. Journal of Veterinary Medicine."
              value={citations}
              onChange={(e) => setCitations(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Add citations or references for this section, one per line.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Promoting...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Promote to Wiki
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
