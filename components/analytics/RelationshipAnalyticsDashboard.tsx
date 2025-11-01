"use client"

import { useEffect, useState } from "react"
import { getPets, getUsers } from "@/lib/storage"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  UserCheck,
  Shuffle,
  GitBranch,
  BarChart3,
  Activity,
  UserPlus,
  UserMinus,
  Share2,
  Network,
  PawPrint,
  Tags,
} from "lucide-react"
import {
  computeRelationshipAnalytics,
  type RelationshipAnalytics,
  type FriendCategoryUsage,
} from "@/lib/utils/relationship-analytics"
import type { Pet, User } from "@/lib/types"

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%"
  const percentage = value * 100
  if (percentage >= 10) {
    return `${percentage.toFixed(0)}%`
  }
  return `${percentage.toFixed(1)}%`
}

function formatAverage(value: number): string {
  if (!Number.isFinite(value)) return "0.0"
  return value >= 10 ? value.toFixed(0) : value.toFixed(1)
}

function formatFriendCategoryUsage(entry: FriendCategoryUsage): string {
  if (entry.categories.length === 0) {
    return entry.uncategorizedFriends > 0 ? "All friends uncategorized" : "No categories defined"
  }

  const segments = entry.categories.slice(0, 3).map((category) => `${category.categoryName} (${category.assignments})`)
  if (entry.categories.length > 3) {
    segments.push(`+${entry.categories.length - 3} more`)
  }
  if (entry.uncategorizedFriends > 0) {
    segments.push(`${entry.uncategorizedFriends} uncategorized`)
  }
  return segments.join(" · ")
}

export function RelationshipAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<RelationshipAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const pets: Pet[] = getPets()
    const users: User[] = getUsers()
    const computed = computeRelationshipAnalytics(pets, users)
    setAnalytics(computed)
    setIsLoading(false)
  }, [])

  if (isLoading || !analytics) {
    return <LoadingSpinner fullScreen />
  }

  const crossHouseholdShare =
    analytics.uniqueFriendships > 0
      ? analytics.ownerConnections.crossHouseholdFriendships / analytics.uniqueFriendships
      : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title="Relationship Analytics"
        description="Understand how pets connect across the network, uncovering friendship density, reciprocity, and cross-species patterns."
      />

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Unique Friendships"
          value={analytics.uniqueFriendships.toLocaleString()}
          icon={Users}
          iconBgColor="bg-blue-100 dark:bg-blue-500/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Mutual Friendships"
          value={analytics.mutualFriendships.toLocaleString()}
          icon={UserCheck}
          iconBgColor="bg-green-100 dark:bg-green-500/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Reciprocity Rate"
          value={formatPercent(analytics.reciprocityRate)}
          icon={Share2}
          iconBgColor="bg-purple-100 dark:bg-purple-500/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Cross-Species Friendships"
          value={analytics.crossSpeciesFriendships.toLocaleString()}
          icon={GitBranch}
          iconBgColor="bg-orange-100 dark:bg-orange-500/20"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Avg Friends per Pet"
          value={formatAverage(analytics.averageFriendsPerPet)}
          icon={BarChart3}
          iconBgColor="bg-cyan-100 dark:bg-cyan-500/20"
          iconColor="text-cyan-600 dark:text-cyan-400"
        />
        <StatCard
          label="Median Friends"
          value={formatAverage(analytics.medianFriendsPerPet)}
          icon={Activity}
          iconBgColor="bg-teal-100 dark:bg-teal-500/20"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          label="Connected Pets"
          value={`${analytics.connectedPets.toLocaleString()} / ${analytics.totalPets.toLocaleString()}`}
          icon={UserPlus}
          iconBgColor="bg-indigo-100 dark:bg-indigo-500/20"
          iconColor="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Isolated Pets"
          value={analytics.isolatedPets.toLocaleString()}
          icon={UserMinus}
          iconBgColor="bg-red-100 dark:bg-red-500/20"
          iconColor="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Network Quality */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Network Health</CardTitle>
            <CardDescription>Key indicators that show the strength of connections across the community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm font-medium mb-1">
                <span>Reciprocity</span>
                <span>{formatPercent(analytics.reciprocityRate)}</span>
              </div>
              <Progress value={Math.min(analytics.reciprocityRate * 100, 100)} />
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.mutualFriendships.toLocaleString()} mutual connections out of {analytics.uniqueFriendships.toLocaleString()} friendships.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm font-medium mb-1">
                <span>Friendship Density</span>
                <span>{formatPercent(analytics.friendshipDensity)}</span>
              </div>
              <Progress value={Math.min(analytics.friendshipDensity * 100, 100)} />
              <p className="text-xs text-muted-foreground mt-2">
                Measures how close the community is to every pet being connected with every other pet.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm font-medium mb-1">
                <span>Cross-Household Connections</span>
                <span>{formatPercent(crossHouseholdShare)}</span>
              </div>
              <Progress value={Math.min(crossHouseholdShare * 100, 100)} />
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.ownerConnections.crossHouseholdFriendships.toLocaleString()} friendships connect pets from different households.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Friendship Overview</CardTitle>
            <CardDescription>How pets are connecting within and across their households.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Within the same household</p>
              <p className="text-2xl font-semibold mt-1">{analytics.ownerConnections.sameHouseholdFriendships.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Across different households</p>
              <p className="text-2xl font-semibold mt-1">{analytics.ownerConnections.crossHouseholdFriendships.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Owner network reach</p>
              <p className="text-2xl font-semibold mt-1">
                {analytics.ownerConnections.ownersWithConnections.toLocaleString()} of{" "}
                {analytics.ownerConnections.totalOwners.toLocaleString()} owners
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Average of {formatAverage(analytics.ownerConnections.averageConnectionsPerOwner)} unique owner connections per participating household.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pets & Species Patterns */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Connected Pets</CardTitle>
            <CardDescription>Pets with the strongest relationship networks across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topPets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friendship data available yet.</p>
            ) : (
              analytics.topPets.map((pet) => (
                <div key={pet.petId} className="flex items-start justify-between rounded-md border bg-card p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{pet.petName}</h3>
                      <Badge variant="outline" className="capitalize">
                        {capitalize(pet.species)}
                      </Badge>
                    </div>
                    {pet.ownerName && (
                      <p className="text-xs text-muted-foreground mt-1">Owned by {pet.ownerName}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1 text-xs text-muted-foreground">
                    <div className="text-base font-semibold text-foreground">
                      {pet.friendCount.toLocaleString()} friends
                    </div>
                    <div>Mutual: {pet.mutualFriendCount.toLocaleString()}</div>
                    <div>Cross-species: {pet.crossSpeciesFriendCount.toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Species Connection Patterns</CardTitle>
            <CardDescription>How different species participate in the friendship network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {analytics.speciesStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pet data available.</p>
              ) : (
                analytics.speciesStats.map((stat) => (
                  <div key={stat.species} className="rounded-md border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PawPrint className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium capitalize">{stat.species}</p>
                      </div>
                      <Badge variant="secondary">
                        {stat.connectedPets.toLocaleString()} / {stat.totalPets.toLocaleString()} connected
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mt-3">
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          {formatAverage(stat.averageFriends)}
                        </p>
                        <p>Avg friends</p>
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          {stat.crossSpeciesConnections.toLocaleString()}
                        </p>
                        <p>Cross-species ties</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {analytics.speciesPairings.length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-muted-foreground" />
                  Top species pairings
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {analytics.speciesPairings.slice(0, 5).map((pair) => (
                    <div key={`${pair.speciesA}-${pair.speciesB}`} className="flex items-center justify-between">
                      <span>
                        <span className="capitalize">{pair.speciesA}</span> ↔{" "}
                        <span className="capitalize">{pair.speciesB}</span>
                      </span>
                      <span className="text-foreground font-medium">{pair.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Owner Connections & Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Owner Network Insights</CardTitle>
            <CardDescription>Households that are forming the strongest inter-pet relationships.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.ownerConnections.topOwnerPairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pets haven{"'"}t connected across different households yet.
              </p>
            ) : (
              analytics.ownerConnections.topOwnerPairs.map((pair) => (
                <div key={`${pair.ownerAId}-${pair.ownerBId}`} className="rounded-md border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span>{pair.ownerAName ?? "Owner " + pair.ownerAId}</span>
                    <span className="text-muted-foreground">↔</span>
                    <span>{pair.ownerBName ?? "Owner " + pair.ownerBId}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {pair.petConnectionCount.toLocaleString()} friendship
                    {pair.petConnectionCount === 1 ? "" : "s"} linking their pets.
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Friend Category Usage</CardTitle>
            <CardDescription>How pets organize their friendship circles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.friendCategoryUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friendship categories have been assigned yet.</p>
            ) : (
              analytics.friendCategoryUsage.slice(0, 5).map((entry) => (
                <div key={entry.petId} className="rounded-md border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Tags className="h-4 w-4 text-muted-foreground" />
                        <span>{entry.petName}</span>
                      </p>
                      {entry.ownerName && (
                        <p className="text-xs text-muted-foreground mt-1">Owned by {entry.ownerName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total friends</p>
                      <p className="text-lg font-semibold">{entry.totalFriends.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span>Categorized</span>
                      <span>
                        {entry.categorizedFriends.toLocaleString()} / {entry.totalFriends.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={
                        entry.totalFriends > 0
                          ? Math.min((entry.categorizedFriends / entry.totalFriends) * 100, 100)
                          : 0
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFriendCategoryUsage(entry)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
