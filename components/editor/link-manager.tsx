'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link as LinkIcon, Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Editor } from '@tiptap/core'

interface LinkInfo {
  url: string
  text: string
  isValid?: boolean
  isBroken?: boolean
  statusCode?: number
}

interface LinkManagerProps {
  editor: Editor | null
  articleLinks?: LinkInfo[]
  onLinksChange?: (links: LinkInfo[]) => void
}

export function LinkManager({ editor, articleLinks = [], onLinksChange }: LinkManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [links, setLinks] = useState<LinkInfo[]>(articleLinks)
  const [newLink, setNewLink] = useState({ url: '', text: '' })

  // Simulate internal link suggestions (in real app, this would query your database)
  useEffect(() => {
    if (searchQuery.length > 2) {
      // Mock suggestions - replace with actual API call
      const mockSuggestions = [
        'Golden Retriever',
        'German Shepherd',
        'Labrador Retriever',
        'Health: Vaccination Schedule',
        'Care Guide: Grooming Basics',
      ]
      setSuggestions(
        mockSuggestions.filter((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  const validateLink = async (url: string): Promise<{ isValid: boolean; statusCode?: number; error?: string }> => {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
      return { isValid: true, statusCode: 200 }
    } catch (error) {
      // Try to validate via API endpoint
      // In production, you'd have a backend endpoint to check links
      return { isValid: false, error: 'Could not validate link' }
    }
  }

  const checkAllLinks = async () => {
    const updatedLinks = await Promise.all(
      links.map(async (link) => {
        const validation = await validateLink(link.url)
        return {
          ...link,
          isValid: validation.isValid,
          isBroken: !validation.isValid,
          statusCode: validation.statusCode,
        }
      })
    )
    setLinks(updatedLinks)
    onLinksChange?.(updatedLinks)
  }

  const addLink = () => {
    if (!newLink.url || !newLink.text) return

    const link: LinkInfo = {
      url: newLink.url,
      text: newLink.text,
    }

    const updatedLinks = [...links, link]
    setLinks(updatedLinks)
    onLinksChange?.(updatedLinks)
    setNewLink({ url: '', text: '' })

    // Insert into editor
    if (editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: link.url })
        .run()
    }
  }

  const createRedLink = (text: string) => {
    // Red links are links to pages that don't exist yet
    const redLink: LinkInfo = {
      url: `#${text.toLowerCase().replace(/\s+/g, '-')}`,
      text,
      isBroken: true, // Marked as broken because page doesn't exist
    }

    const updatedLinks = [...links, redLink]
    setLinks(updatedLinks)
    onLinksChange?.(updatedLinks)

    // Insert into editor with special styling
    if (editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: redLink.url, class: 'red-link' })
        .run()
    }
  }

  const removeLink = (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index)
    setLinks(updatedLinks)
    onLinksChange?.(updatedLinks)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Manager</CardTitle>
        <CardDescription>
          Manage internal links, create red links, and check for broken links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Internal Link Autocomplete */}
        <div className="space-y-2">
          <Label>Search Internal Links</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for articles, breeds, guides..."
              className="pl-10"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      createRedLink(suggestion)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add New Link */}
        <div className="space-y-2 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium">Add New Link</h4>
          <div className="space-y-2">
            <div>
              <Label>Link Text</Label>
              <Input
                value={newLink.text}
                onChange={(e) => setNewLink({ ...newLink, text: e.target.value })}
                placeholder="Link text"
              />
            </div>
            <div>
              <Label>URL</Label>
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <Button onClick={addLink} className="w-full" type="button">
              <LinkIcon className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>

        {/* Link Checker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Links in Article</h4>
            <Button onClick={checkAllLinks} variant="outline" size="sm" type="button">
              Check All Links
            </Button>
          </div>
          {links.length === 0 ? (
            <p className="text-sm text-gray-500">No links added yet</p>
          ) : (
            <div className="space-y-2">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{link.text}</span>
                      {link.isBroken ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Broken
                        </Badge>
                      ) : link.isValid ? (
                        <Badge variant="default" className="text-xs bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      ) : null}
                      {link.url.startsWith('#') && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                          Red Link
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{link.url}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                    type="button"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

