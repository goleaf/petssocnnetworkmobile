"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import {
  AlertCircle,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock,
  ListChecks,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DeleteButton } from "@/components/ui/delete-button"
import { cn } from "@/lib/utils"
import { getPetsByOwnerId, getBlogPosts } from "@/lib/storage"
import {
  deleteScheduledPost,
  getScheduledPostsByUserId,
  upsertScheduledPost,
  updateScheduledPost,
} from "@/lib/content-scheduler"
import type { BlogPost, Pet, ScheduledPost } from "@/lib/types"

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const
type Weekday = (typeof WEEK_DAYS)[number]
type ContentType = ScheduledPost["contentType"]
type AudienceOption = "followers" | "all" | "local" | "custom"

interface Recommendation {
  id: string
  day: Weekday
  time: string
  score: number
  reason: string
  source: "benchmark" | "insights"
}

interface FormState {
  title: string
  contentType: ContentType
  existingPostId: string
  petId: string
  targetAudience: AudienceOption
  scheduledDate: string
  scheduledTime: string
  notes: string
  useSuggestedTime: boolean
}

const initialFormState: FormState = {
  title: "",
  contentType: "blog",
  existingPostId: "",
  petId: "",
  targetAudience: "followers",
  scheduledDate: "",
  scheduledTime: "",
  notes: "",
  useSuggestedTime: true,
}

function computeEngagement(post: BlogPost): number {
  const likes = Array.isArray(post.likes) ? post.likes.length : 0
  const reactions = post.reactions
    ? Object.values(post.reactions).reduce((sum, ids) => sum + ids.length, 0)
    : 0
  return likes + reactions
}

function calculateAverageEngagement(posts: BlogPost[]): number {
  if (!posts.length) return 0
  const total = posts.reduce((sum, post) => sum + computeEngagement(post), 0)
  return total / posts.length
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

function getNextOccurrence(day: Weekday, time: string): Date | null {
  const [hours, minutes] = time.split(":").map((value) => Number.parseInt(value, 10))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  const now = new Date()
  const target = new Date(now)
  const targetDay = WEEK_DAYS.indexOf(day)
  if (targetDay === -1) return null

  let daysAhead = targetDay - target.getDay()
  if (daysAhead < 0) {
    daysAhead += 7
  }
  target.setDate(target.getDate() + daysAhead)
  target.setHours(hours, minutes, 0, 0)

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 7)
  }

  return target
}

function extractDateTimeFields(isoString: string): { date: string; time: string } {
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" }
  }
  return {
    date: toDateInputValue(parsed),
    time: toTimeInputValue(parsed),
  }
}

function buildRecommendations(posts: BlogPost[], scheduled: ScheduledPost[]): Recommendation[] {
  const base: Recommendation[] = [
    {
      id: "Tuesday-18:00",
      day: "Tuesday",
      time: "18:00",
      score: 82,
      reason: "Tuesday evenings capture after-work scrolling from pet parents.",
      source: "benchmark",
    },
    {
      id: "Thursday-12:30",
      day: "Thursday",
      time: "12:30",
      score: 78,
      reason: "Midweek lunch breaks keep your content top of mind.",
      source: "benchmark",
    },
    {
      id: "Saturday-10:00",
      day: "Saturday",
      time: "10:00",
      score: 75,
      reason: "Weekend mornings catch relaxed community browsing.",
      source: "benchmark",
    },
  ]

  if (!posts.length) {
    return base
  }

  const dayStats = WEEK_DAYS.map((weekday, index) => {
    const matches = posts.filter((post) => {
      const created = new Date(post.createdAt)
      return !Number.isNaN(created.getTime()) && created.getDay() === index
    })
    const engagementTotal = matches.reduce((total, post) => total + computeEngagement(post), 0)
    const count = matches.length
    const avgEngagement = count ? engagementTotal / count : 0
    const recencyBoost = matches.some((post) => {
      const created = new Date(post.createdAt)
      return !Number.isNaN(created.getTime()) && created.getTime() > Date.now() - 1000 * 60 * 60 * 24 * 14
    })
      ? 6
      : 0

    return {
      day: weekday,
      count,
      avgEngagement,
      score: count ? avgEngagement * 6 + count * 4 + recencyBoost : 0,
    }
  })

  const sorted = dayStats.filter((stat) => stat.count > 0).sort((a, b) => b.score - a.score)
  const preferredTimes = ["18:30", "12:30", "09:30"]
  const scheduledKeys = new Set(
    scheduled.map((entry) => {
      const scheduledDate = new Date(entry.scheduledAt)
      if (Number.isNaN(scheduledDate.getTime())) return ""
      const keyDay = WEEK_DAYS[scheduledDate.getDay()]
      const hours = String(scheduledDate.getHours()).padStart(2, "0")
      const minutes = String(scheduledDate.getMinutes()).padStart(2, "0")
      return `${keyDay}-${hours}:${minutes}`
    }),
  )

  return base.map((fallback, index) => {
    const stat = sorted[index]
    if (!stat) {
      return fallback
    }

    const time = preferredTimes[index] ?? fallback.time
    const id = `${stat.day}-${time}`
    const isDoubleBooked = scheduledKeys.has(id)
    const baseScore = Math.round(72 + stat.avgEngagement * 6 + stat.count * 4)
    const score = Math.min(97, isDoubleBooked ? Math.max(60, baseScore - 6) : baseScore)

    return {
      id,
      day: stat.day,
      time,
      score,
      reason: stat.count
        ? `Your ${stat.count} ${stat.count === 1 ? "post" : "posts"} on ${stat.day} averaged ${Math.round(
            stat.avgEngagement || 0,
          )} interactions.`
        : fallback.reason,
      source: "insights" as const,
    }
  })
}

function sortByScheduledAt(posts: ScheduledPost[]): ScheduledPost[] {
  return [...posts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )
}

function formatScheduleLabel(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatCountdown(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ""
  return formatDistanceToNow(date, { addSuffix: true })
}

function deriveStatus(post: ScheduledPost): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  isPast: boolean
} {
  const scheduledDate = new Date(post.scheduledAt)
  const now = Date.now()
  const isPast = !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() < now

  if (post.status === "published") {
    return { label: "Published", variant: "secondary", isPast }
  }

  if (post.status === "canceled") {
    return { label: "Canceled", variant: "outline", isPast }
  }

  if (post.status === "missed" || (post.status === "scheduled" && isPast)) {
    return { label: "Missed window", variant: "destructive", isPast: true }
  }

  return { label: "Scheduled", variant: "default", isPast: false }
}

function normalizeAudience(value?: string): AudienceOption {
  if (value === "followers" || value === "all" || value === "local" || value === "custom") {
    return value
  }
  return "followers"
}

export default function ContentSchedulingPage() {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { useSuggestedTime, scheduledDate, scheduledTime } = formState

  useEffect(() => {
    if (!user) return

    const ownedPets = getPetsByOwnerId(user.id)
    setPets(ownedPets)

    const myPosts = getBlogPosts().filter((post) => post.authorId === user.id)
    setPosts(myPosts)

    const schedule = getScheduledPostsByUserId(user.id)
    const now = Date.now()
    const overdue = schedule.filter(
      (item) => item.status === "scheduled" && new Date(item.scheduledAt).getTime() < now,
    )

    if (overdue.length) {
      overdue.forEach((item) => updateScheduledPost(item.id, { status: "missed" }))
      setScheduledPosts(getScheduledPostsByUserId(user.id))
    } else {
      setScheduledPosts(schedule)
    }
  }, [user])

  const recommendedSlots = useMemo(() => buildRecommendations(posts, scheduledPosts), [posts, scheduledPosts])

  useEffect(() => {
    if (!useSuggestedTime || editingId) return
    if (scheduledDate && scheduledTime) return
    if (!recommendedSlots.length) return

    const selected = recommendedSlots[0]
    const next = getNextOccurrence(selected.day, selected.time)
    if (!next) return

    setActiveRecommendation(selected)
    setFormState((prev) => ({
      ...prev,
      scheduledDate: toDateInputValue(next),
      scheduledTime: toTimeInputValue(next),
    }))
  }, [useSuggestedTime, scheduledDate, scheduledTime, recommendedSlots, editingId])

  const upcomingPosts = useMemo(() => {
    const now = Date.now()
    return sortByScheduledAt(
      scheduledPosts.filter((post) => {
        if (post.status === "canceled" || post.status === "published") return false
        const time = new Date(post.scheduledAt).getTime()
        return !Number.isNaN(time) && time >= now
      }),
    )
  }, [scheduledPosts])

  const pastHistory = useMemo(() => {
    const now = Date.now()
    return [...scheduledPosts]
      .filter((post) => {
        const time = new Date(post.scheduledAt).getTime()
        return !Number.isNaN(time) && time < now
      })
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 5)
  }, [scheduledPosts])

  const nextScheduled = upcomingPosts[0]
  const scheduledWithinWeek = useMemo(() => {
    const weekAhead = Date.now() + 1000 * 60 * 60 * 24 * 7
    return upcomingPosts.filter((post) => {
      const time = new Date(post.scheduledAt).getTime()
      return !Number.isNaN(time) && time <= weekAhead
    }).length
  }, [upcomingPosts])

  const averageEngagement = useMemo(() => Math.round(calculateAverageEngagement(posts)), [posts])

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>
            Please log in to schedule posts and receive personalised timing recommendations.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const refreshScheduledPosts = () => {
    if (!user) return
    setScheduledPosts(getScheduledPostsByUserId(user.id))
  }

  const resetForm = () => {
    setEditingId(null)
    setActiveRecommendation(null)
    setFormState((prev) => ({
      ...initialFormState,
      contentType: prev.contentType,
      targetAudience: prev.targetAudience,
    }))
  }

  const handleApplyRecommendation = (recommendation: Recommendation) => {
    const next = getNextOccurrence(recommendation.day, recommendation.time)
    if (!next) return
    setEditingId(null)
    setActiveRecommendation(recommendation)
    setFormState((prev) => ({
      ...prev,
      useSuggestedTime: true,
      scheduledDate: toDateInputValue(next),
      scheduledTime: toTimeInputValue(next),
    }))
  }

  const handleSuggestedToggle = (checked: boolean) => {
    if (!checked) {
      setActiveRecommendation(null)
      setFormState((prev) => ({ ...prev, useSuggestedTime: false }))
      return
    }

    if (!recommendedSlots.length) {
      toast.error("Add a few posts first to unlock smart timing recommendations.")
      return
    }

    const next = getNextOccurrence(recommendedSlots[0].day, recommendedSlots[0].time)
    if (!next) return
    setActiveRecommendation(recommendedSlots[0])
    setFormState((prev) => ({
      ...prev,
      useSuggestedTime: true,
      scheduledDate: toDateInputValue(next),
      scheduledTime: toTimeInputValue(next),
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    if (!formState.title.trim()) {
      toast.error("Give this scheduled post a title.")
      return
    }

    if (!formState.scheduledDate || !formState.scheduledTime) {
      toast.error("Pick a date and time to schedule.")
      return
    }

    const scheduledDateTime = new Date(`${formState.scheduledDate}T${formState.scheduledTime}`)
    if (Number.isNaN(scheduledDateTime.getTime())) {
      toast.error("That date and time combination isn’t valid.")
      return
    }

    if (scheduledDateTime.getTime() <= Date.now()) {
      toast.error("Schedule posts for a time in the future.")
      return
    }

    const existing = editingId ? scheduledPosts.find((post) => post.id === editingId) : undefined

    const record: ScheduledPost = {
      id: editingId ?? `schedule_${Date.now()}`,
      userId: user.id,
      title: formState.title.trim(),
      contentType: formState.contentType,
      scheduledAt: scheduledDateTime.toISOString(),
      status: "scheduled",
      targetAudience: formState.targetAudience,
      petId: formState.petId || undefined,
      postId: formState.existingPostId || undefined,
      notes: formState.notes.trim() || undefined,
      performanceScore: activeRecommendation?.score ?? existing?.performanceScore,
      recommendationReason: activeRecommendation?.reason ?? existing?.recommendationReason,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    upsertScheduledPost(record)
    setScheduledPosts((prev) => sortByScheduledAt([...prev.filter((item) => item.id !== record.id), record]))

    toast.success(editingId ? "Schedule updated." : "Post scheduled!")
    resetForm()
  }

  const startEditing = (post: ScheduledPost) => {
    setEditingId(post.id)
    setActiveRecommendation(null)
    const fields = extractDateTimeFields(post.scheduledAt)
    setFormState({
      title: post.title,
      contentType: post.contentType,
      existingPostId: post.postId || "",
      petId: post.petId || "",
      targetAudience: normalizeAudience(post.targetAudience),
      scheduledDate: fields.date,
      scheduledTime: fields.time,
      notes: post.notes || "",
      useSuggestedTime: false,
    })
  }

  const markAsPublished = (post: ScheduledPost) => {
    updateScheduledPost(post.id, { status: "published" })
    setScheduledPosts((prev) =>
      prev.map((item) =>
        item.id === post.id
          ? { ...item, status: "published", updatedAt: new Date().toISOString() }
          : item,
      ),
    )
    toast.success("Marked as published.")
  }

  const removeSchedule = (id: string) => {
    deleteScheduledPost(id)
    setScheduledPosts((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) {
      resetForm()
    }
    toast.success("Scheduled post removed.")
  }

  const cancelSchedule = (post: ScheduledPost) => {
    updateScheduledPost(post.id, { status: "canceled" })
    refreshScheduledPosts()
    toast.success("Schedule canceled.")
  }

  const nextRecommendation = recommendedSlots[0]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">Content Scheduling</h1>
        <p className="mt-2 text-muted-foreground">
          Plan posts for the moments when your audience is most engaged. Use smart recommendations based on your
          performance to keep your content cadence consistent.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next recommended slot</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextRecommendation ? (
              <div>
                <p className="text-2xl font-semibold">{nextRecommendation.day}</p>
                <p className="text-muted-foreground">{nextRecommendation.time}</p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Create a few posts to unlock timing insights.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled this week</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{scheduledWithinWeek}</p>
            <p className="text-sm text-muted-foreground">in the next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{averageEngagement || 0}</p>
            <p className="text-sm text-muted-foreground">per published post</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingId ? "Update scheduled post" : "Schedule a post"}</CardTitle>
                  <CardDescription>
                    Pick the content, audience, and timing. We’ll remind you when it’s time to publish.
                  </CardDescription>
                </div>
                {editingId && (
                  <Badge variant="outline">Editing</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="title">
                      Post title
                    </label>
                    <Input
                      id="title"
                      value={formState.title}
                      placeholder="Morning walk adventures"
                      onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content type</label>
                    <Select
                      value={formState.contentType}
                      onValueChange={(value: ContentType) =>
                        setFormState((prev) => ({
                          ...prev,
                          contentType: value,
                          existingPostId: value === "blog" ? prev.existingPostId : "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog post</SelectItem>
                        <SelectItem value="feed">Feed update</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formState.contentType === "blog" && posts.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Attach published blog</label>
                    <Select
                      value={formState.existingPostId}
                      onValueChange={(value) => {
                        const selected = posts.find((post) => post.id === value)
                        setFormState((prev) => ({
                          ...prev,
                          existingPostId: value,
                          title: !prev.title.trim() && selected ? selected.title : prev.title,
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional: Link to an existing blog post" />
                      </SelectTrigger>
                      <SelectContent>
                        {posts.map((post) => (
                          <SelectItem key={post.id} value={post.id}>
                            {post.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Featured pet</label>
                    <Select
                      value={formState.petId}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, petId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All pets</SelectItem>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Audience</label>
                    <Select
                      value={formState.targetAudience}
                      onValueChange={(value: AudienceOption) =>
                        setFormState((prev) => ({ ...prev, targetAudience: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="followers">Followers only</SelectItem>
                        <SelectItem value="all">Entire community</SelectItem>
                        <SelectItem value="local">Local pet lovers</SelectItem>
                        <SelectItem value="custom">Custom list</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Publish date</label>
                    <Input
                      type="date"
                      value={formState.scheduledDate}
                      onChange={(event) => {
                        setActiveRecommendation(null)
                        setFormState((prev) => ({
                          ...prev,
                          useSuggestedTime: false,
                          scheduledDate: event.target.value,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Publish time</label>
                    <Input
                      type="time"
                      value={formState.scheduledTime}
                      onChange={(event) => {
                        setActiveRecommendation(null)
                        setFormState((prev) => ({
                          ...prev,
                          useSuggestedTime: false,
                          scheduledTime: event.target.value,
                        }))
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={formState.notes}
                    placeholder="Remind yourself what to include, cross-posting steps, or collaboration details."
                    onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-start justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Use recommended timing</p>
                    <p className="text-sm text-muted-foreground">
                      Let us auto-fill the highest scoring posting window for you.
                    </p>
                  </div>
                  <Switch checked={formState.useSuggestedTime} onCheckedChange={handleSuggestedToggle} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">
                    {editingId ? "Update schedule" : "Schedule post"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming schedule</CardTitle>
              <CardDescription>Manage what’s coming next and keep your cadence on track.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                  <CalendarRange className="mb-3 h-10 w-10" />
                  <p className="font-medium">Nothing planned yet</p>
                  <p className="mt-1 text-sm">Create a schedule to see it appear here.</p>
                </div>
              )}

              {upcomingPosts.map((post) => {
                const status = deriveStatus(post)
                const countdown = formatCountdown(post.scheduledAt)
                return (
                  <div key={post.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold leading-tight">{post.title}</h3>
                          <Badge variant="secondary">{post.contentType}</Badge>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatScheduleLabel(post.scheduledAt)}
                          </span>
                          {countdown && !status.isPast && <span>{countdown}</span>}
                          {post.targetAudience && <span>Audience: {post.targetAudience}</span>}
                          {post.petId && (
                            <span>
                              Featuring: {pets.find((pet) => pet.id === post.petId)?.name || "Pet"}
                            </span>
                          )}
                          {post.postId && (
                            <Link
                              href={`/blog/${post.postId}`}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              View post
                            </Link>
                          )}
                        </div>
                        {post.notes && (
                          <p className="text-sm text-muted-foreground">Notes: {post.notes}</p>
                        )}
                        {status.isPast && status.variant === "destructive" && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Window passed — reschedule to keep momentum.
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.status !== "published" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => markAsPublished(post)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark posted
                          </Button>
                        )}
                        {post.status !== "published" && (
                          <Button size="sm" variant="outline" onClick={() => startEditing(post)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reschedule
                          </Button>
                        )}
                        {post.status !== "published" && (
                          <Button size="sm" variant="ghost" onClick={() => cancelSchedule(post)}>
                            Cancel
                          </Button>
                        )}
                        <DeleteButton size="sm" onClick={() => removeSchedule(post.id)}>
                          Delete
                        </DeleteButton>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended times</CardTitle>
              <CardDescription>Pick a slot backed by your performance data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendedSlots.map((recommendation) => {
                const isActive = activeRecommendation?.id === recommendation.id
                return (
                  <div
                    key={recommendation.id}
                    className={cn(
                      "rounded-xl border p-4 transition",
                      isActive ? "border-primary/70 bg-primary/5" : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          <p className="font-semibold">
                            {recommendation.day} · {recommendation.time}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">Score {recommendation.score}</Badge>
                          <Badge variant="outline">{recommendation.source === "insights" ? "Your data" : "Benchmark"}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isActive ? "secondary" : "ghost"}
                        onClick={() => handleApplyRecommendation(recommendation)}
                      >
                        {isActive ? "Selected" : "Apply"}
                      </Button>
                    </div>
                  </div>
                )
              })}
              {recommendedSlots.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  We’ll recommend timing after you publish a couple of posts.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent performance</CardTitle>
              <CardDescription>Last few scheduled items and how they landed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Once you complete scheduled posts, they’ll show up here for quick reference.
                </p>
              )}

              {pastHistory.map((post) => {
                const status = deriveStatus(post)
                return (
                  <div key={post.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium leading-tight">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{formatScheduleLabel(post.scheduledAt)}</p>
                        {post.recommendationReason && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {post.recommendationReason}
                          </p>
                        )}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
