import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Achievement, AchievementCategory } from "@/lib/types"
import type { LucideIcon } from "lucide-react"
import {
  Award,
  Sparkles,
  Flag,
  Target,
  Trophy,
  ShieldCheck,
  Stethoscope,
  Users,
  Mountain,
  Heart,
} from "lucide-react"

interface PetAchievementsProps {
  achievements?: Achievement[]
  petName: string
}

type AchievementTypeKey = AchievementCategory | "milestone"

const TYPE_CONFIG: Record<AchievementTypeKey, { label: string; icon: LucideIcon; color: string }> = {
  milestone: { label: "Milestone", icon: Flag, color: "text-primary" },
  training: { label: "Training", icon: Target, color: "text-amber-500" },
  competition: { label: "Competition", icon: Trophy, color: "text-yellow-500" },
  service: { label: "Service", icon: ShieldCheck, color: "text-emerald-500" },
  health: { label: "Health", icon: Stethoscope, color: "text-rose-500" },
  community: { label: "Community", icon: Users, color: "text-cyan-500" },
  adventure: { label: "Adventure", icon: Mountain, color: "text-purple-500" },
  social: { label: "Social", icon: Heart, color: "text-pink-500" },
  wellness: { label: "Wellness", icon: Sparkles, color: "text-emerald-500" },
}

const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getTypeConfig = (type?: AchievementCategory) => TYPE_CONFIG[type ?? "milestone"]

export function PetAchievementsSection({ achievements, petName }: PetAchievementsProps) {
  if (!achievements || achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements & Badges
          </CardTitle>
          <CardDescription>
            {petName}
            {"'"}s accomplishments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No achievements yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sorted = [...achievements].sort((a, b) => {
    const aDate = new Date(a.earnedAt).getTime()
    const bDate = new Date(b.earnedAt).getTime()
    return Number.isNaN(bDate) ? -1 : Number.isNaN(aDate) ? 1 : bDate - aDate
  })

  const highlights = sorted.filter((achievement) => achievement.highlight)
  const spotlight = (highlights.length > 0 ? highlights : sorted).slice(0, 3)
  const milestoneCount = sorted.filter((achievement) => (achievement.type ?? "milestone") === "milestone").length
  const latestAchievement = sorted[0]

  const stats = [
    {
      label: "Total Achievements",
      value: sorted.length.toString(),
      icon: Award,
    },
    {
      label: "Spotlight Highlights",
      value: spotlight.length.toString(),
      icon: Sparkles,
    },
    {
      label: "Milestone Moments",
      value: milestoneCount.toString(),
      icon: Flag,
    },
    {
      label: "Latest Earned",
      value: latestAchievement ? formatDisplayDate(latestAchievement.earnedAt) : "—",
      icon: Target,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Achievements & Badges
        </CardTitle>
        <CardDescription>
          {petName}
          {"'"}s accomplishments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-lg border bg-muted/40 p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        {spotlight.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Spotlight Achievements
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotlight.map((achievement) => {
                const { label, icon: TypeIcon, color } = getTypeConfig(achievement.type)
                return (
                  <div
                    key={`${achievement.id}-spotlight`}
                    className="rounded-lg border bg-primary/5 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-3xl" role="img" aria-hidden="true">
                        {achievement.icon || "🏆"}
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TypeIcon className={`h-3.5 w-3.5 ${color}`} />
                        {label}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight">{achievement.title}</p>
                      {achievement.description && (
                        <p className="text-sm text-muted-foreground leading-tight">{achievement.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Earned {formatDisplayDate(achievement.earnedAt)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Achievement Timeline
            </h3>
          </div>
          <div className="space-y-5">
            {sorted.map((achievement, index) => {
              const { label, icon: TypeIcon, color } = getTypeConfig(achievement.type)
              const isLast = index === sorted.length - 1

              return (
                <div key={achievement.id} className="relative pl-10">
                  {!isLast && (
                    <span className="absolute left-4 top-8 h-[calc(100%-2rem)] w-px bg-border" aria-hidden="true" />
                  )}
                  <span className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-lg">
                    {achievement.icon || "🏆"}
                  </span>
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{achievement.title}</p>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TypeIcon className={`h-3.5 w-3.5 ${color}`} />
                          {label}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDisplayDate(achievement.earnedAt)}
                      </span>
                    </div>
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    )}
                    {achievement.highlight && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                        <Sparkles className="h-3 w-3" />
                        Featured highlight
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

