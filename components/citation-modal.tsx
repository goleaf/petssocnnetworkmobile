"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, Plus, Search, X } from "lucide-react"
import { getSources, createOrUpdateSource, getSourceByUrl } from "@/lib/sources"
import { parseCitationsFromMarkdown } from "@/lib/citations"
import type { Source } from "@/lib/types"

interface CitationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (citationMarkdown: string) => void
  content: string // Current markdown content to extract existing citations
}

export function CitationModal({ open, onOpenChange, onInsert, content }: CitationModalProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"library" | "new">("library")
  const [selectedSourceId, setSelectedSourceId] = useState<string>("")
  
  // New source form
  const [newSourceUrl, setNewSourceUrl] = useState("")
  const [newSourceTitle, setNewSourceTitle] = useState("")
  const [newSourcePublisher, setNewSourcePublisher] = useState("")
  const [newSourceDate, setNewSourceDate] = useState("")
  
  // Citation form
  const [citationLocator, setCitationLocator] = useState("")
  const [citationText, setCitationText] = useState("")
  const [citationNeededMode, setCitationNeededMode] = useState(false)

  // Extract existing citations to get next citation number
  const { citations, sources: existingSources } = useMemo(() => {
    return parseCitationsFromMarkdown(content)
  }, [content])

  const nextCitationNumber = useMemo(() => {
    const numericIds = citations
      .filter((c) => !c.isCitationNeeded && !isNaN(parseInt(c.id, 10)))
      .map((c) => parseInt(c.id, 10))
    return numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1
  }, [citations])

  // Load sources when modal opens
  useEffect(() => {
    if (open) {
      setSources(getSources())
      setSearchQuery("")
      setSelectedSourceId("")
      setCitationLocator("")
      setCitationText("")
      setCitationNeededMode(false)
      setNewSourceUrl("")
      setNewSourceTitle("")
      setNewSourcePublisher("")
      setNewSourceDate("")
    }
  }, [open])

  // Filter sources by search query
  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources
    
    const query = searchQuery.toLowerCase()
    return sources.filter(
      (source) =>
        source.title.toLowerCase().includes(query) ||
        source.url.toLowerCase().includes(query) ||
        source.publisher?.toLowerCase().includes(query) ||
        ""
    )
  }, [sources, searchQuery])

  const handleCreateNewSource = () => {
    if (!newSourceUrl.trim()) return

    try {
      // Check if source already exists
      const existing = getSourceByUrl(newSourceUrl)
      if (existing) {
        setSelectedSourceId(existing.id)
        setActiveTab("library")
        setNewSourceUrl("")
        setNewSourceTitle("")
        setNewSourcePublisher("")
        setNewSourceDate("")
        setSources(getSources())
        return
      }

      const source = createOrUpdateSource({
        url: newSourceUrl,
        title: newSourceTitle.trim() || newSourceUrl,
        publisher: newSourcePublisher.trim() || undefined,
        date: newSourceDate.trim() || undefined,
      })

      setSources(getSources())
      setSelectedSourceId(source.id)
      setActiveTab("library")
      setNewSourceUrl("")
      setNewSourceTitle("")
      setNewSourcePublisher("")
      setNewSourceDate("")
    } catch (error) {
      console.error("Failed to create source:", error)
    }
  }

  const handleInsertCitation = () => {
    let citationMarkdown = ""
    let sourceDefinition = ""

    if (citationNeededMode) {
      citationMarkdown = "[^citation-needed]"
    } else if (selectedSourceId) {
      const source = sources.find((s) => s.id === selectedSourceId)
      if (!source) return

      const citationId = nextCitationNumber.toString()
      citationMarkdown = `[^${citationId}]`

      // Build source definition
      sourceDefinition = `\n\n[^${citationId}]: ${source.url}`
      if (source.title) {
        sourceDefinition += ` "${source.title}"`
      }
      if (citationLocator) {
        sourceDefinition += ` (see: ${citationLocator})`
      }
      if (citationText) {
        sourceDefinition += ` | ${citationText}`
      }
    } else {
      return
    }

    onInsert(citationMarkdown + sourceDefinition)
    onOpenChange(false)
  }

  const selectedSource = selectedSourceId ? sources.find((s) => s.id === selectedSourceId) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Citation</DialogTitle>
          <DialogDescription>
            Select a source from your library or create a new one, then insert a citation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "library" | "new")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Source Library</TabsTrigger>
            <TabsTrigger value="new">New Source</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {filteredSources.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">
                    {searchQuery ? "No sources found matching your search." : "No sources in your library yet."}
                  </p>
                  <p className="text-xs mt-2">
                    Create a new source in the "New Source" tab.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSources.map((source) => {
                    const isSelected = selectedSourceId === source.id
                    const isBroken = source.brokenAt !== undefined
                    
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => setSelectedSourceId(source.id)}
                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                          isSelected ? "bg-muted border-l-4 border-l-primary" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{source.title}</h4>
                              {isBroken && (
                                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                                  <AlertCircle className="h-3 w-3" />
                                  Broken
                                </Badge>
                              )}
                            </div>
                            {source.publisher && (
                              <p className="text-xs text-muted-foreground mb-1">{source.publisher}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ExternalLink className="h-3 w-3" />
                              <span className="truncate">{source.url}</span>
                            </div>
                            {source.date && (
                              <p className="text-xs text-muted-foreground mt-1">Date: {source.date}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedSource && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selected Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <p className="font-medium">{selectedSource.title}</p>
                    </div>
                    {selectedSource.publisher && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Publisher</Label>
                        <p>{selectedSource.publisher}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">URL</Label>
                      <a
                        href={selectedSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{selectedSource.url}</span>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-url" required>
                  URL
                </Label>
                <Input
                  id="source-url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-title">Title</Label>
                <Input
                  id="source-title"
                  placeholder="Article Title (optional, defaults to URL)"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-publisher">Publisher</Label>
                  <Input
                    id="source-publisher"
                    placeholder="Publisher name (optional)"
                    value={newSourcePublisher}
                    onChange={(e) => setNewSourcePublisher(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source-date">Date</Label>
                  <Input
                    id="source-date"
                    placeholder="YYYY-MM-DD (optional)"
                    value={newSourceDate}
                    onChange={(e) => setNewSourceDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateNewSource}
                disabled={!newSourceUrl.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Library
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="citation-needed"
              checked={citationNeededMode}
              onChange={(e) => {
                setCitationNeededMode(e.target.checked)
                if (e.target.checked) {
                  setSelectedSourceId("")
                }
              }}
              className="rounded border-gray-300"
            />
            <Label htmlFor="citation-needed" className="cursor-pointer">
              Insert "citation needed" tag instead
            </Label>
          </div>

          {!citationNeededMode && selectedSourceId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="citation-locator">Location Reference (optional)</Label>
                <Input
                  id="citation-locator"
                  placeholder="e.g., 'p. 42', 'section 3.2', 'timestamp 1:23'"
                  value={citationLocator}
                  onChange={(e) => setCitationLocator(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="citation-text">Citation Note (optional)</Label>
                <Textarea
                  id="citation-text"
                  placeholder="Additional citation text or note"
                  value={citationText}
                  onChange={(e) => setCitationText(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInsertCitation}
            disabled={!citationNeededMode && !selectedSourceId}
          >
            Insert Citation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

