"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { BookmarkPlus, Bell, BellOff, Trash2, RefreshCw, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface SavedSearch {
  id: string
  query: string
  entityTypes: string[]
  filters?: Record<string, any>
  latLng?: { lat: number; lng: number }
  radius?: number
  alertEnabled: boolean
  lastCheckedAt?: string
  createdAt: string
}

interface SavedSearchesProps {
  userId?: string
  onSearchSelect?: (search: SavedSearch) => void
}

export function SavedSearches({ userId, onSearchSelect }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newSearch, setNewSearch] = useState({
    query: "",
    entityTypes: [] as string[],
    alertEnabled: false,
  })

  useEffect(() => {
    loadSavedSearches()
  }, [userId])

  const loadSavedSearches = async () => {
    try {
      const params = new URLSearchParams()
      if (userId) params.set("userId", userId)

      const response = await fetch(`/api/search/saved?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSavedSearches(data.savedSearches || [])
      }
    } catch (error) {
      console.error("Failed to load saved searches:", error)
    }
  }

  const createSavedSearch = async () => {
    if (!newSearch.query.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/search/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSearch,
          userId: userId || null,
        }),
      })

      if (response.ok) {
        await loadSavedSearches()
        setNewSearch({ query: "", entityTypes: [], alertEnabled: false })
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Failed to create saved search:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAlert = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/search/saved", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, alertEnabled: enabled }),
      })

      if (response.ok) {
        await loadSavedSearches()
      }
    } catch (error) {
      console.error("Failed to update saved search:", error)
    }
  }

  const deleteSavedSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/search/saved?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadSavedSearches()
      }
    } catch (error) {
      console.error("Failed to delete saved search:", error)
    }
  }

  const checkForNewResults = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/search/saved/${id}/check`)
      if (response.ok) {
        const data = await response.json()
        if (data.newResultsCount > 0) {
          alert(`Found ${data.newResultsCount} new result(s)!`)
        } else {
          alert("No new results found.")
        }
        await loadSavedSearches()
      }
    } catch (error) {
      console.error("Failed to check for new results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const entityTypes = ["pets", "posts", "wiki", "places", "groups"]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Searches</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <BookmarkPlus className="h-4 w-4" />
              Save Search
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Search</DialogTitle>
              <DialogDescription>Save this search to quickly access it later and get alerts for new results.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  value={newSearch.query}
                  onChange={(e) => setNewSearch({ ...newSearch, query: e.target.value })}
                  placeholder="e.g., lost labrador"
                />
              </div>
              <div>
                <Label>Entity Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {entityTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={newSearch.entityTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewSearch({
                              ...newSearch,
                              entityTypes: [...newSearch.entityTypes, type],
                            })
                          } else {
                            setNewSearch({
                              ...newSearch,
                              entityTypes: newSearch.entityTypes.filter((t) => t !== type),
                            })
                          }
                        }}
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="alert"
                  checked={newSearch.alertEnabled}
                  onCheckedChange={(checked) => setNewSearch({ ...newSearch, alertEnabled: checked })}
                />
                <Label htmlFor="alert">Alert me when new results appear</Label>
              </div>
              <Button onClick={createSavedSearch} disabled={isLoading || !newSearch.query.trim()}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <BookmarkPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved searches yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {savedSearches.map((search) => (
            <Card key={search.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{search.query}</span>
                      {search.alertEnabled && (
                        <Badge variant="secondary" className="gap-1">
                          <Bell className="h-3 w-3" />
                          Alerts
                        </Badge>
                      )}
                    </div>
                    {search.entityTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {search.entityTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs capitalize">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {search.lastCheckedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(search.lastCheckedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {onSearchSelect && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSearchSelect(search)}
                        className="gap-1"
                      >
                        <Search className="h-4 w-4" />
                        Search
                      </Button>
                    )}
                    {search.alertEnabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => checkForNewResults(search.id)}
                        disabled={isLoading}
                        className="gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAlert(search.id, !search.alertEnabled)}
                      className="gap-1"
                    >
                      {search.alertEnabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSavedSearch(search.id)}
                      className="gap-1 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

