'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import type { Source, Citation } from '@/lib/types'

interface CitationManagerProps {
  sources?: Source[]
  citations?: Citation[]
  onSourcesChange?: (sources: Source[]) => void
  onCitationsChange?: (citations: Citation[]) => void
}

export function CitationManager({
  sources = [],
  citations = [],
  onSourcesChange,
  onCitationsChange,
}: CitationManagerProps) {
  const [newSource, setNewSource] = useState({
    title: '',
    url: '',
    publisher: '',
    date: '',
    license: '',
  })

  const addSource = () => {
    if (!newSource.title || !newSource.url) return

    const source: Source = {
      id: `source-${Date.now()}`,
      title: newSource.title,
      url: newSource.url,
      publisher: newSource.publisher || undefined,
      date: newSource.date || undefined,
      license: newSource.license || undefined,
    }

    onSourcesChange?.([...sources, source])
    setNewSource({ title: '', url: '', publisher: '', date: '', license: '' })
  }

  const removeSource = (id: string) => {
    onSourcesChange?.(sources.filter((s) => s.id !== id))
  }

  const addCitation = (sourceId?: string) => {
    const citation: Citation = {
      id: `citation-${Date.now()}`,
      sourceId,
      url: sourceId ? undefined : newSource.url,
      text: '',
      locator: '',
    }

    onCitationsChange?.([...citations, citation])
  }

  const removeCitation = (id: string) => {
    onCitationsChange?.(citations.filter((c) => c.id !== id))
  }

  const validateUrl = async (url: string) => {
    // This would typically call an API to validate the URL
    // For now, we'll just check if it's a valid URL format
    try {
      new URL(url)
      return { isValid: true }
    } catch {
      return { isValid: false, error: 'Invalid URL format' }
    }
  }

  return (
    <div className="space-y-4">
      {/* Sources Management */}
      <Card>
        <CardHeader>
          <CardTitle>Reusable Sources</CardTitle>
          <CardDescription>
            Manage sources that can be referenced multiple times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Source */}
          <div className="space-y-2 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium">Add New Source</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Title *</Label>
                <Input
                  value={newSource.title}
                  onChange={(e) => setNewSource({ ...newSource, title: e.target.value })}
                  placeholder="Source title"
                />
              </div>
              <div className="space-y-1">
                <Label>URL *</Label>
                <Input
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              <div className="space-y-1">
                <Label>Publisher</Label>
                <Input
                  value={newSource.publisher}
                  onChange={(e) => setNewSource({ ...newSource, publisher: e.target.value })}
                  placeholder="Publisher name"
                />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  value={newSource.date}
                  onChange={(e) => setNewSource({ ...newSource, date: e.target.value })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>License</Label>
                <Input
                  value={newSource.license}
                  onChange={(e) => setNewSource({ ...newSource, license: e.target.value })}
                  placeholder="e.g., CC BY 4.0"
                />
              </div>
            </div>
            <Button onClick={addSource} className="w-full" type="button">
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>

          {/* Existing Sources */}
          <div className="space-y-2">
            <h4 className="font-medium">Existing Sources</h4>
            {sources.length === 0 ? (
              <p className="text-sm text-gray-500">No sources added yet</p>
            ) : (
              sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-start justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{source.title}</div>
                    <div className="text-sm text-gray-600">{source.url}</div>
                    {source.publisher && (
                      <div className="text-xs text-gray-500">Publisher: {source.publisher}</div>
                    )}
                    {source.brokenAt && (
                      <div className="text-xs text-red-500">Broken link detected</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addCitation(source.id)}
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(source.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Citations */}
      <Card>
        <CardHeader>
          <CardTitle>Citations & Footnotes</CardTitle>
          <CardDescription>
            Citations referenced in the article
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {citations.length === 0 ? (
            <p className="text-sm text-gray-500">No citations added yet</p>
          ) : (
            citations.map((citation) => {
              const source = sources.find((s) => s.id === citation.sourceId)
              return (
                <div
                  key={citation.id}
                  className="p-3 border border-gray-200 rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        Citation #{citation.id}
                        {source && ` - ${source.title}`}
                      </div>
                      {citation.locator && (
                        <div className="text-sm text-gray-600">Locator: {citation.locator}</div>
                      )}
                      {citation.text && (
                        <div className="text-sm text-gray-600">{citation.text}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCitation(citation.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
          <Button
            variant="outline"
            onClick={() => addCitation()}
            className="w-full"
            type="button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Citation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

