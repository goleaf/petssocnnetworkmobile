"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BackButton } from "@/components/ui/back-button"
import { GroupCard } from "@/components/groups/GroupCard"
import {
  getGroupCategoryBySlug,
  getGroupsByCategory,
  canUserViewGroup,
  searchGroups,
} from "@/lib/storage"
import type { Group, GroupCategory } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { Search, ArrowLeft, Grid, List } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortOption = "recent" | "popular" | "members"

export default function GroupCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [category, setCategory] = useState<GroupCategory | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundCategory = getGroupCategoryBySlug(categorySlug)
    if (!foundCategory) {
      setIsLoading(false)
      router.push("/groups")
      return
    }

    setCategory(foundCategory)
    let categoryGroups = getGroupsByCategory(foundCategory.id)

    // Filter by visibility
    if (isAuthenticated && user) {
      categoryGroups = categoryGroups.filter((g) =>
        canUserViewGroup(g.id, user.id)
      )
    } else {
      categoryGroups = categoryGroups.filter(
        (g) => g.type === "open" || g.type === "closed"
      )
    }

    setGroups(categoryGroups)
    setFilteredGroups(categoryGroups)
    setIsLoading(false)
  }, [categorySlug, user, isAuthenticated, router])

  useEffect(() => {
    let filtered = [...groups]

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query) ||
          g.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.memberCount - a.memberCount
        case "members":
          return b.memberCount - a.memberCount
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      }
    })

    setFilteredGroups(filtered)
  }, [searchQuery, sortBy, groups])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-20">
            <p className="text-muted-foreground">Category not found</p>
            <BackButton href="/groups" className="mt-4">Back to Groups</BackButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <BackButton href="/groups">Back to Groups</BackButton>
        </div>

        {/* Category Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  backgroundColor: category.color ? `${category.color}20` : "#3b82f620",
                  color: category.color || "#3b82f6",
                }}
              >
                {category.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  {groups.length} {groups.length === 1 ? "group" : "groups"} in this category
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="members">Most Members</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex items-center gap-2 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-semibold mb-2">
                  {searchQuery ? "No groups found" : "No groups in this category"}
                </p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Be the first to create a group in this category!"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredGroups.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {filteredGroups.length} of {groups.length}{" "}
            {groups.length === 1 ? "group" : "groups"}
          </div>
        )}
      </div>
    </div>
  )
}

