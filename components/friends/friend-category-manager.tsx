"use client"

import { useEffect, useState } from "react"
import type { FriendCategory, Pet } from "@/lib/types"
import {
  addFriendCategory,
  assignFriendToCategory,
  deleteFriendCategory,
  updateFriendCategory,
} from "@/lib/storage"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FriendCategoryManagerProps {
  petId: string
  categories: FriendCategory[]
  friends: Pet[]
  assignments: Record<string, string | null>
  onRefresh: () => void
}

type CategoryDraft = Record<
  string,
  {
    name: string
    description: string
  }
>

const generateCategoryId = (name: string) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "category"

  return `${base}-${Date.now()}`
}

export function FriendCategoryManager({ petId, categories, friends, assignments, onRefresh }: FriendCategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [drafts, setDrafts] = useState<CategoryDraft>({})

  useEffect(() => {
    setDrafts(
      categories.reduce<CategoryDraft>((acc, category) => {
        acc[category.id] = {
          name: category.name,
          description: category.description ?? "",
        }
        return acc
      }, {}),
    )
  }, [categories])

  const hasCategories = categories.length > 0

  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim()
    if (!trimmedName) return

    const categoryId = generateCategoryId(trimmedName)
    addFriendCategory(petId, {
      id: categoryId,
      name: trimmedName,
      description: newCategoryDescription.trim() || undefined,
    })
    setNewCategoryName("")
    setNewCategoryDescription("")
    onRefresh()
  }

  const handleUpdateCategory = (categoryId: string) => {
    const draft = drafts[categoryId]
    if (!draft) return
    const trimmedName = draft.name.trim()
    if (!trimmedName) return

    updateFriendCategory(petId, categoryId, {
      name: trimmedName,
      description: draft.description.trim() || undefined,
    })
    onRefresh()
  }

  const handleDeleteCategory = (categoryId: string) => {
    deleteFriendCategory(petId, categoryId)
    onRefresh()
  }

  const handleAssign = (friendId: string, value: string) => {
    const categoryId = value === "none" ? null : value
    assignFriendToCategory(petId, friendId, categoryId)
    onRefresh()
  }

  const handleResetCategory = (categoryId: string) => {
    const original = categories.find((category) => category.id === categoryId)
    if (!original) return
    setDrafts((prev) => ({
      ...prev,
      [categoryId]: {
        name: original.name,
        description: original.description ?? "",
      },
    }))
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold leading-6">Create a new category</h3>
          <p className="text-sm text-muted-foreground">Use categories to organize your pet’s close connections.</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new-category-name" required>
              Category name
            </Label>
            <Input
              id="new-category-name"
              placeholder="e.g. Family, Park Buddies"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-category-description">Description</Label>
            <Textarea
              id="new-category-description"
              placeholder="What makes this group special?"
              value={newCategoryDescription}
              onChange={(event) => setNewCategoryDescription(event.target.value)}
            />
          </div>
          <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
            Add category
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold leading-6">Existing categories</h3>
          <p className="text-sm text-muted-foreground">
            Rename or remove categories. Deleting a category keeps friends but clears their assignment.
          </p>
        </div>

        {hasCategories ? (
          <div className="space-y-4">
            {categories.map((category) => {
              const draft = drafts[category.id]
              return (
                <div key={category.id} className="rounded-lg border p-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`category-name-${category.id}`} required>
                      Name
                    </Label>
                    <Input
                      id={`category-name-${category.id}`}
                      value={draft?.name ?? ""}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [category.id]: {
                            name: event.target.value,
                            description: prev[category.id]?.description ?? "",
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`category-description-${category.id}`}>Description</Label>
                    <Textarea
                      id={`category-description-${category.id}`}
                      value={draft?.description ?? ""}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [category.id]: {
                            name: prev[category.id]?.name ?? "",
                            description: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateCategory(category.id)}
                      disabled={!draft?.name.trim()}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResetCategory(category.id)}>
                      Reset
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No categories yet.</p>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold leading-6">Assign friends</h3>
          <p className="text-sm text-muted-foreground">
            Choose one category per friend. You can leave a friend unassigned at any time.
          </p>
        </div>
        {friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div key={friend.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{friend.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{friend.species}</p>
                </div>
                <Select
                  value={assignments[friend.id] ?? "none"}
                  onValueChange={(value) => handleAssign(friend.id, value)}
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Add friends first to assign them to categories.</p>
        )}
      </section>
    </div>
  )
}
