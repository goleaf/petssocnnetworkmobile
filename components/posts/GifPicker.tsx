"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DEFAULT_GIFS: Array<{ url: string; tags: string[] }> = [
  { url: "https://media.giphy.com/media/3oEduSbSGpGaRX2Vri/giphy.gif", tags: ["dog", "happy"] },
  { url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", tags: ["cat", "typing"] },
  { url: "https://media.giphy.com/media/l4FGI8GoTL7N4DsyI/giphy.gif", tags: ["dog", "park"] },
  { url: "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif", tags: ["cat", "jump"] },
]

export interface GifPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (url: string) => void
}

export function GifPicker({ open, onOpenChange, onPick }: GifPickerProps) {
  const [query, setQuery] = useState("")
  const [pasteUrl, setPasteUrl] = useState("")
  const [results, setResults] = useState(DEFAULT_GIFS)

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults(DEFAULT_GIFS)
      return
    }
    setResults(DEFAULT_GIFS.filter((g) => g.tags.some((t) => t.includes(q))))
  }, [query])

  const pick = (url: string) => {
    onPick(url)
    onOpenChange(false)
  }

  const addUrl = () => {
    const u = pasteUrl.trim()
    if (!u) return
    onPick(u)
    setPasteUrl("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>GIF Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input placeholder="Search (offline demo)" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Input placeholder="Paste GIF URL" value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} />
            <Button type="button" onClick={addUrl}>Add</Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-auto">
            {results.map((g) => (
              <button key={g.url} type="button" className="relative aspect-square rounded overflow-hidden border hover:opacity-90" onClick={() => pick(g.url)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt="GIF" className="absolute inset-0 h-full w-full object-cover" />
              </button>
            ))}
            {results.length === 0 && <div className="text-sm text-muted-foreground">No results</div>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GifPicker

