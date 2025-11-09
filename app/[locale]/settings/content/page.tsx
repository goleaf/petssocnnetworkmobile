"use client"

import { useEffect, useMemo, useState } from "react"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { updateUser } from "@/lib/storage"

export default function ContentSettingsPage(): JSX.Element {
  const { user, refresh } = useAuth()
  const prefs = user?.displayPreferences

  const [saving, setSaving] = useState(false)
  const [showExploreContent, setShowExploreContent] = useState<boolean>(true)
  const [showSponsoredPosts, setShowSponsoredPosts] = useState<boolean>(true)
  const [showSuggestedPosts, setShowSuggestedPosts] = useState<boolean>(true)
  const [mutedWords, setMutedWords] = useState<string[]>([])
  const [newWord, setNewWord] = useState("")

  useEffect(() => {
    if (!prefs) return
    setShowExploreContent(prefs.showExploreContent !== false)
    setShowSponsoredPosts(prefs.showSponsoredPosts !== false)
    setShowSuggestedPosts(prefs.showSuggestedPosts !== false)
    setMutedWords(Array.isArray(prefs.mutedKeywords) ? prefs.mutedKeywords : [])
  }, [prefs])

  const addWord = () => {
    const w = newWord.trim()
    if (!w) return
    if (mutedWords.some((m) => m.toLowerCase() === w.toLowerCase())) {
      setNewWord("")
      return
    }
    setMutedWords((prev) => [...prev, w])
    setNewWord("")
  }

  const removeWord = (w: string) => {
    setMutedWords((prev) => prev.filter((x) => x !== w))
  }

  const handleSave = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      updateUser(user.id, {
        displayPreferences: {
          ...(user.displayPreferences || ({} as any)),
          showExploreContent,
          showSponsoredPosts,
          showSuggestedPosts,
          mutedKeywords: mutedWords,
        },
      })
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHeader description="Control discovery, suggestions, and content filters for your feed." />

      <Card>
        <CardHeader>
          <CardTitle>Discovery & Recommendations</CardTitle>
          <CardDescription>Choose whether to see content from outside your network and recommendation inserts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between max-w-xl">
            <div className="space-y-1">
              <Label>Show posts from people I don’t follow</Label>
              <p className="text-xs text-muted-foreground">Include explore content from outside your follow network.</p>
            </div>
            <Switch
              checked={showExploreContent}
              data-testid="toggle-show-explore-content"
              onCheckedChange={setShowExploreContent}
              disabled={!user}
            />
          </div>

          <div className="flex items-center justify-between max-w-xl">
            <div className="space-y-1">
              <Label>Show suggested posts</Label>
              <p className="text-xs text-muted-foreground">Allow recommended posts to be injected into your Home feed.</p>
            </div>
            <Switch
              checked={showSuggestedPosts}
              data-testid="toggle-show-suggested-posts"
              onCheckedChange={setShowSuggestedPosts}
              disabled={!user}
            />
          </div>

          <div className="flex items-center justify-between max-w-xl">
            <div className="space-y-1">
              <Label>Show sponsored posts</Label>
              <p className="text-xs text-muted-foreground">Display promoted or sponsored posts (ads) in feeds.</p>
            </div>
            <Switch
              checked={showSponsoredPosts}
              data-testid="toggle-show-sponsored-posts"
              onCheckedChange={setShowSponsoredPosts}
              disabled={!user}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!user || saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Muted Words</CardTitle>
          <CardDescription>Hide posts containing these words or phrases.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 max-w-xl">
            <Input
              placeholder="Add a word or phrase"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWord() } }}
            />
            <Button variant="outline" onClick={addWord} disabled={!newWord.trim()}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mutedWords.length === 0 ? (
              <p className="text-xs text-muted-foreground">No muted words</p>
            ) : (
              mutedWords.map((w) => (
                <Badge key={w} variant="secondary" className="flex items-center gap-1">
                  <span>{w}</span>
                  <button type="button" aria-label={`Remove ${w}`} className="ml-1 rounded px-1 hover:bg-muted"
                    onClick={() => removeWord(w)}>
                    ×
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!user || saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

