import type { Draft } from "./types"

const STORAGE_KEY = "pet_social_drafts"

export function getDrafts(): Draft[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function getDraftById(id: string): Draft | undefined {
  return getDrafts().find((d) => d.id === id)
}

export function getDraftsByUserId(userId: string, type?: "blog" | "wiki"): Draft[] {
  const drafts = getDrafts().filter((d) => d.userId === userId)
  return type ? drafts.filter((d) => d.type === type) : drafts
}

export function saveDraft(draft: Draft) {
  if (typeof window === "undefined") return
  const drafts = getDrafts()
  const index = drafts.findIndex((d) => d.id === draft.id)

  if (index !== -1) {
    drafts[index] = draft
  } else {
    drafts.push(draft)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export function deleteDraft(id: string) {
  if (typeof window === "undefined") return
  const drafts = getDrafts().filter((d) => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export function autoSaveDraft(draft: Draft) {
  const updated = { ...draft, lastSaved: new Date().toISOString() }
  saveDraft(updated)
  return updated
}
