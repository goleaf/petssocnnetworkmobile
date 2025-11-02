"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
// ScrollArea and Separator replaced with standard HTML
import { BookOpen, Plus, ExternalLink, CheckCircle2, AlertCircle, X } from "lucide-react"
import type { Source, Citation } from "@/lib/types"
import { getSources, addSource, updateSource } from "@/lib/storage"

interface CitationsDrawerProps {
  revisionId: string
  citations: Citation[]
  onCitationsChange: (citations: Citation[]) => void
  readOnly?: boolean
}

export function CitationsDrawer({
  revisionId,
  citations,
  onCitationsChange,
  readOnly = false,
}: CitationsDrawerProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSources(getSources())
    }
  }, [isOpen])

  const handleAddCitation = (sourceId: string, locator?: string) => {
    const newCitation: Citation = {
      id: `cit_${Date.now()}`,
      sourceId,
      locator,
    }
    onCitationsChange([...citations, newCitation])
    setIsOpen(false)
  }

  const handleRemoveCitation = (citationId: string) => {
    onCitationsChange(citations.filter((c) => c.id !== citationId))
  }

  const handleAddCitationNeeded = () => {
    const newCitation: Citation = {
      id: `cit_needed_${Date.now()}`,
      isCitationNeeded: true,
    }
    onCitationsChange([...citations, newCitation])
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Citations ({citations.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Citations & Sources</SheetTitle>
          <SheetDescription>
            Manage citations and reusable sources for this revision
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Add Citation Needed */}
          {!readOnly && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Quick Actions</p>
                <p className="text-xs text-muted-foreground">
                  Add a citation needed marker
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddCitationNeeded}>
                <Plus className="h-4 w-4 mr-2" />
                Citation Needed
              </Button>
            </div>
          )}

          <hr className="my-4" />

          {/* Citations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Current Citations ({citations.length})</p>
            </div>
            <div className="h-[400px] overflow-y-auto">
              <div className="space-y-2">
                {citations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No citations yet</p>
                    <p className="text-xs mt-1">Add citations from sources below</p>
                  </div>
                ) : (
                  citations.map((citation, index) => {
                    const source = sources.find((s) => s.id === citation.sourceId)
                    return (
                      <div
                        key={citation.id}
                        className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {index + 1}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          {citation.isCitationNeeded ? (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-warning" />
                              <span className="text-sm font-medium">Citation needed</span>
                            </div>
                          ) : source ? (
                            <>
                              <p className="text-sm font-medium line-clamp-1">{source.title}</p>
                              {source.publisher && (
                                <p className="text-xs text-muted-foreground">{source.publisher}</p>
                              )}
                              {citation.locator && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {citation.locator}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Source not found</p>
                          )}
                        </div>
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCitation(citation.id)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* Sources Library */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Sources Library</p>
              {!readOnly && (
                <AddSourceDialog
                  onSourceAdded={(source) => {
                    setSources([...sources, source])
                    handleAddCitation(source.id)
                  }}
                />
              )}
            </div>
            <div className="h-[300px] overflow-y-auto">
              <div className="space-y-2">
                {sources.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No sources yet</p>
                    <p className="text-xs mt-1">Create reusable sources for citations</p>
                  </div>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if (!readOnly) {
                          handleAddCitation(source.id)
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-2">{source.title}</p>
                            {source.publisher && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {source.publisher}
                              </p>
                            )}
                            {source.date && (
                              <p className="text-xs text-muted-foreground">{source.date}</p>
                            )}
                          </div>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                        </div>
                        {source.isValid === false && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            Broken Link
                          </Badge>
                        )}
                        {source.isValid === true && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AddSourceDialog({ onSourceAdded }: { onSourceAdded: (source: Source) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [publisher, setPublisher] = useState("")
  const [date, setDate] = useState("")

  const handleSubmit = () => {
    if (!title.trim() || !url.trim()) return

    const source: Source = {
      id: `src_${Date.now()}`,
      title: title.trim(),
      url: url.trim(),
      publisher: publisher.trim() || undefined,
      date: date.trim() || undefined,
      isValid: undefined,
    }

    addSource(source)
    onSourceAdded(source)
    setIsOpen(false)
    setTitle("")
    setUrl("")
    setPublisher("")
    setDate("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Source</DialogTitle>
          <DialogDescription>
            Create a reusable source for citations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="source-title" required>
              Title
            </Label>
            <Input
              id="source-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Study on Canine Nutrition"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-url" required>
              URL
            </Label>
            <Input
              id="source-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-publisher">Publisher</Label>
            <Input
              id="source-publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g., Journal of Veterinary Medicine"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-date">Date</Label>
            <Input
              id="source-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g., 2024-01-15"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !url.trim()}>
            Add Source
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

