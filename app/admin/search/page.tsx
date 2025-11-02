"use client"

import { useState, useEffect, useCallback } from "react"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Synonym, AliasSet, TermBoost, IndexRebuildStatus } from "@/lib/types"
import { X, Plus, Edit, Trash2, RefreshCw } from "lucide-react"

export default function AdminSearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <BackButton href="/admin" />
          <h1 className="text-3xl font-bold mt-4">Search Administration</h1>
          <p className="text-muted-foreground mt-2">
            Manage synonyms, alias sets, term boosts, and search index
          </p>
        </div>

        <Tabs defaultValue="synonyms" className="space-y-6">
          <TabsList>
            <TabsTrigger value="synonyms">Synonyms</TabsTrigger>
            <TabsTrigger value="alias-sets">Alias Sets</TabsTrigger>
            <TabsTrigger value="term-boosts">Term Boosts</TabsTrigger>
            <TabsTrigger value="rebuild">Rebuild Index</TabsTrigger>
          </TabsList>

          <TabsContent value="synonyms">
            <SynonymsManager />
          </TabsContent>

          <TabsContent value="alias-sets">
            <AliasSetsManager />
          </TabsContent>

          <TabsContent value="term-boosts">
            <TermBoostsManager />
          </TabsContent>

          <TabsContent value="rebuild">
            <RebuildIndexManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SynonymsManager() {
  const [synonyms, setSynonyms] = useState<Synonym[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Synonym | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchSynonyms()
  }, [])

  const fetchSynonyms = async () => {
    try {
      const res = await fetch("/api/admin/search/synonyms")
      if (res.ok) {
        const data = await res.json()
        setSynonyms(data)
      }
    } catch (error) {
      console.error("Error fetching synonyms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this synonym?")) return

    try {
      const res = await fetch(`/api/admin/search/synonyms/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchSynonyms()
      }
    } catch (error) {
      console.error("Error deleting synonym:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Synonyms</CardTitle>
            <CardDescription>
              Manage search term synonyms for query expansion
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Synonym
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Synonym" : "Add Synonym"}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update the synonym entry"
                    : "Create a new synonym entry"}
                </DialogDescription>
              </DialogHeader>
              <SynonymForm
                synonym={editing}
                onSuccess={() => {
                  setIsDialogOpen(false)
                  setEditing(null)
                  fetchSynonyms()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {synonyms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No synonyms found. Add your first synonym set.
          </div>
        ) : (
          <div className="space-y-4">
            {synonyms.map((synonym) => (
              <div
                key={synonym.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold mb-2">{synonym.term}</div>
                  <div className="flex flex-wrap gap-2">
                    {synonym.synonyms.map((s, idx) => (
                      <Badge key={idx} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(synonym)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(synonym.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SynonymForm({
  synonym,
  onSuccess,
}: {
  synonym: Synonym | null
  onSuccess: () => void
}) {
  const [term, setTerm] = useState(synonym?.term || "")
  const [synonyms, setSynonyms] = useState<string[]>(synonym?.synonyms || [])
  const [newSynonym, setNewSynonym] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddSynonym = () => {
    if (newSynonym.trim() && !synonyms.includes(newSynonym.trim())) {
      setSynonyms([...synonyms, newSynonym.trim()])
      setNewSynonym("")
    }
  }

  const handleRemoveSynonym = (index: number) => {
    setSynonyms(synonyms.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim() || synonyms.length === 0) return

    setLoading(true)
    try {
      const url = synonym
        ? `/api/admin/search/synonyms/${synonym.id}`
        : "/api/admin/search/synonyms"
      const method = synonym ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: term.trim(), synonyms }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to save synonym")
      }
    } catch (error) {
      console.error("Error saving synonym:", error)
      alert("Failed to save synonym")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="term">Term</Label>
        <Input
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g., dog"
          required
        />
      </div>

      <div>
        <Label>Synonyms</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newSynonym}
            onChange={(e) => setNewSynonym(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSynonym()
              }
            }}
            placeholder="Add synonym"
          />
          <Button type="button" onClick={handleAddSynonym}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {synonyms.map((s, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {s}
              <button
                type="button"
                onClick={() => handleRemoveSynonym(idx)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {synonym ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

function AliasSetsManager() {
  const [aliasSets, setAliasSets] = useState<AliasSet[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AliasSet | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchAliasSets()
  }, [])

  const fetchAliasSets = async () => {
    try {
      const res = await fetch("/api/admin/search/alias-sets")
      if (res.ok) {
        const data = await res.json()
        setAliasSets(data)
      }
    } catch (error) {
      console.error("Error fetching alias sets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alias set?")) return

    try {
      const res = await fetch(`/api/admin/search/alias-sets/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchAliasSets()
      }
    } catch (error) {
      console.error("Error deleting alias set:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alias Sets</CardTitle>
            <CardDescription>
              Group equivalent terms together for search
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Alias Set
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Alias Set" : "Add Alias Set"}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update the alias set"
                    : "Create a new alias set"}
                </DialogDescription>
              </DialogHeader>
              <AliasSetForm
                aliasSet={editing}
                onSuccess={() => {
                  setIsDialogOpen(false)
                  setEditing(null)
                  fetchAliasSets()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {aliasSets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alias sets found. Add your first alias set.
          </div>
        ) : (
          <div className="space-y-4">
            {aliasSets.map((aliasSet) => (
              <div
                key={aliasSet.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold mb-2">{aliasSet.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {aliasSet.aliases.map((a, idx) => (
                      <Badge key={idx} variant="secondary">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(aliasSet)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(aliasSet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AliasSetForm({
  aliasSet,
  onSuccess,
}: {
  aliasSet: AliasSet | null
  onSuccess: () => void
}) {
  const [name, setName] = useState(aliasSet?.name || "")
  const [aliases, setAliases] = useState<string[]>(aliasSet?.aliases || [])
  const [newAlias, setNewAlias] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddAlias = () => {
    if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
      setAliases([...aliases, newAlias.trim()])
      setNewAlias("")
    }
  }

  const handleRemoveAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || aliases.length === 0) return

    setLoading(true)
    try {
      const url = aliasSet
        ? `/api/admin/search/alias-sets/${aliasSet.id}`
        : "/api/admin/search/alias-sets"
      const method = aliasSet ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), aliases }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to save alias set")
      }
    } catch (error) {
      console.error("Error saving alias set:", error)
      alert("Failed to save alias set")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Canine terms"
          required
        />
      </div>

      <div>
        <Label>Aliases</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddAlias()
              }
            }}
            placeholder="Add alias"
          />
          <Button type="button" onClick={handleAddAlias}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {aliases.map((a, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {a}
              <button
                type="button"
                onClick={() => handleRemoveAlias(idx)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {aliasSet ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

function TermBoostsManager() {
  const [termBoosts, setTermBoosts] = useState<TermBoost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TermBoost | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchTermBoosts()
  }, [])

  const fetchTermBoosts = async () => {
    try {
      const res = await fetch("/api/admin/search/term-boosts")
      if (res.ok) {
        const data = await res.json()
        setTermBoosts(data)
      }
    } catch (error) {
      console.error("Error fetching term boosts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this term boost?")) return

    try {
      const res = await fetch(`/api/admin/search/term-boosts/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchTermBoosts()
      }
    } catch (error) {
      console.error("Error deleting term boost:", error)
    }
  }

  const handleBoostChange = async (id: string, boost: number) => {
    try {
      const termBoost = termBoosts.find((tb) => tb.id === id)
      if (!termBoost) return

      const res = await fetch(`/api/admin/search/term-boosts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: termBoost.term,
          boost,
          field: termBoost.field,
        }),
      })

      if (res.ok) {
        fetchTermBoosts()
      }
    } catch (error) {
      console.error("Error updating term boost:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Term Boosts</CardTitle>
            <CardDescription>
              Adjust search ranking weights for specific terms
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Term Boost
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Term Boost" : "Add Term Boost"}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Update the term boost"
                    : "Create a new term boost"}
                </DialogDescription>
              </DialogHeader>
              <TermBoostForm
                termBoost={editing}
                onSuccess={() => {
                  setIsDialogOpen(false)
                  setEditing(null)
                  fetchTermBoosts()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {termBoosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No term boosts found. Add your first term boost.
          </div>
        ) : (
          <div className="space-y-6">
            {termBoosts.map((termBoost) => (
              <div
                key={termBoost.id}
                className="p-4 border rounded-lg space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{termBoost.term}</div>
                    {termBoost.field && (
                      <Badge variant="outline" className="mt-1">
                        Field: {termBoost.field}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(termBoost)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(termBoost.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Boost Value</Label>
                    <span className="text-sm font-medium">
                      {termBoost.boost.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[termBoost.boost]}
                    onValueChange={([value]) =>
                      handleBoostChange(termBoost.id, value)
                    }
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.0</span>
                    <span>10.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TermBoostForm({
  termBoost,
  onSuccess,
}: {
  termBoost: TermBoost | null
  onSuccess: () => void
}) {
  const [term, setTerm] = useState(termBoost?.term || "")
  const [boost, setBoost] = useState(termBoost?.boost || 1.0)
  const [field, setField] = useState(termBoost?.field || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim()) return

    setLoading(true)
    try {
      const url = termBoost
        ? `/api/admin/search/term-boosts/${termBoost.id}`
        : "/api/admin/search/term-boosts"
      const method = termBoost ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          boost,
          field: field.trim() || undefined,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to save term boost")
      }
    } catch (error) {
      console.error("Error saving term boost:", error)
      alert("Failed to save term boost")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="term">Term</Label>
        <Input
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g., golden retriever"
          required
        />
      </div>

      <div>
        <Label htmlFor="field">Field (Optional)</Label>
        <Input
          id="field"
          value={field}
          onChange={(e) => setField(e.target.value)}
          placeholder="e.g., title, content"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Boost Value</Label>
          <span className="text-sm font-medium">{boost.toFixed(1)}</span>
        </div>
        <Slider
          value={[boost]}
          onValueChange={([value]) => setBoost(value)}
          min={0}
          max={10}
          step={0.1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.0</span>
          <span>10.0</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {termBoost ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

function RebuildIndexManager() {
  const [status, setStatus] = useState<IndexRebuildStatus>({
    status: "idle",
    progress: 0,
  })
  const [isRebuilding, setIsRebuilding] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/search/reindex")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        if (data.status === "completed" || data.status === "error") {
          setIsRebuilding(false)
        }
      }
    } catch (error) {
      console.error("Error fetching rebuild status:", error)
    }
  }, [])

  useEffect(() => {
    // Initial fetch of status
    fetchStatus()

    // Set up polling when status is building
    if (status.status === "building") {
      const interval = setInterval(() => {
        fetchStatus()
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [status.status, fetchStatus])

  const handleRebuild = async () => {
    if (!confirm("Rebuild the search index? This may take several minutes.")) {
      return
    }

    setIsRebuilding(true)
    try {
      const res = await fetch("/api/admin/search/reindex", {
        method: "POST",
      })
      if (res.ok) {
        // Start polling immediately
        const responseData = await res.json()
        if (responseData.status) {
          setStatus(responseData.status)
        }
        // Fetch status to get initial state
        fetchStatus()
      } else {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || "Failed to start rebuild")
        setIsRebuilding(false)
      }
    } catch (error) {
      console.error("Error starting rebuild:", error)
      alert("Failed to start rebuild")
      setIsRebuilding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rebuild Search Index</CardTitle>
        <CardDescription>
          Rebuild the full-text search index for all blog posts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge
              variant={
                status.status === "completed"
                  ? "default"
                  : status.status === "error"
                    ? "destructive"
                    : status.status === "building"
                      ? "secondary"
                      : "outline"
              }
            >
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </Badge>
          </div>

          {status.status === "building" && (
            <div className="space-y-2">
              <Progress value={status.progress} />
              <p className="text-sm text-muted-foreground">
                {status.message || `Building index... ${status.progress}%`}
              </p>
            </div>
          )}

          {status.status === "completed" && status.message && (
            <p className="text-sm text-muted-foreground">{status.message}</p>
          )}

          {status.status === "error" && status.error && (
            <p className="text-sm text-destructive">{status.error}</p>
          )}

          {status.startedAt && (
            <p className="text-xs text-muted-foreground">
              Started: {new Date(status.startedAt).toLocaleString()}
            </p>
          )}

          {status.completedAt && (
            <p className="text-xs text-muted-foreground">
              Completed: {new Date(status.completedAt).toLocaleString()}
            </p>
          )}
        </div>

        <Button
          onClick={handleRebuild}
          disabled={isRebuilding || status.status === "building"}
          className="w-full"
        >
          {status.status === "building" ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Rebuilding...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rebuild Index
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
