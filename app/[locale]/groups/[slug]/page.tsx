"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { GroupHeader } from "@/components/groups/GroupHeader"
import { PinnedRules } from "@/components/groups/PinnedRules"
import { ModeratorsList } from "@/components/groups/ModeratorsList"
import { LostFoundTemplateForm } from "@/components/groups/LostFoundTemplateForm"
import {
  getGroupBySlug,
  getGroupTopicsByGroupId,
  getGroupPollsByGroupId,
  getGroupEventsByGroupId,
  getGroupResourcesByGroupId,
  getGroupActivitiesByGroupId,
  getGroupMembersByGroupId,
  canUserViewGroup,
  isUserMemberOfGroup,
  canUserModerate,
  canUserViewGroupContent,
  canUserManageMembers,
  updateGroupMember,
  removeGroupMember,
} from "@/lib/storage"
import { getLostFoundTemplate } from "@/lib/lost-found-templates"
import type { Group, GroupMember } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import {
  MessageSquare,
  BarChart3,
  Calendar,
  FolderOpen,
  Users,
  Settings,
  Shield,
  FileText,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { BulkEventExportButton } from "@/components/groups/EventExportButton"
import { AnalyticsDashboard } from "@/components/groups/AnalyticsDashboard"
import { MemberList } from "@/components/groups/MemberList"

const GROUP_TAB_VALUES = new Set([
  "feed",
  "topics",
  "polls",
  "events",
  "resources",
  "members",
  "analytics",
  "settings",
])

export default function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const requestedTab = searchParams?.get("tab") ?? undefined
  const initialTab = requestedTab && GROUP_TAB_VALUES.has(requestedTab) ? requestedTab : "feed"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showLostFoundForm, setShowLostFoundForm] = useState(false)

  useEffect(() => {
    if (!requestedTab) return
    if (!GROUP_TAB_VALUES.has(requestedTab)) return
    if (requestedTab === activeTab) return
    setActiveTab(requestedTab)
  }, [requestedTab, activeTab])

  useEffect(() => {
    if (typeof window === "undefined") return

    const foundGroup = getGroupBySlug(slug)

    if (!foundGroup) {
      setIsLoading(false)
      router.push("/groups")
      return
    }

    // Check visibility
    if (isAuthenticated && user) {
      if (!canUserViewGroup(foundGroup.id, user.id)) {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    } else {
      if (foundGroup.type === "secret") {
        setIsLoading(false)
        router.push("/groups")
        return
      }
    }

    setGroup(foundGroup)
    setIsLoading(false)
  }, [slug, user, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  const isMember = isAuthenticated && user ? isUserMemberOfGroup(group.id, user.id) : false
  const canModerate = isAuthenticated && user ? canUserModerate(group.id, user.id) : false
  const canViewContent = canUserViewGroupContent(group.id, user?.id)

  const topics = getGroupTopicsByGroupId(group.id)
  const polls = getGroupPollsByGroupId(group.id)
  const events = getGroupEventsByGroupId(group.id)
  const resources = getGroupResourcesByGroupId(group.id)
  const activities = getGroupActivitiesByGroupId(group.id)
  const members = getGroupMembersByGroupId(group.id)
  const canManage = isAuthenticated && user ? canUserManageMembers(group.id, user.id) : false

  const handleRoleChange = (memberId: string, newRole: GroupMember["role"]) => {
    if (!canManage || !user) return
    const member = members.find((m) => m.id === memberId)
    if (!member) return
    updateGroupMember(memberId, { role: newRole })
  }

  const handleRemoveMember = (memberId: string) => {
    if (!canManage || !user) return
    const member = members.find((m) => m.id === memberId)
    if (!member) return
    if (confirm(`Are you sure you want to remove this member from the group?`)) {
      removeGroupMember(group.id, member.userId)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Group Header */}
      <GroupHeader group={group} />

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-7xl py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="feed" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <FileText className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
              <span className="hidden sm:inline">Topics</span>
              {topics.length > 0 && (
                <span className="ml-0.5 md:ml-1 text-xs bg-muted px-1 md:px-1.5 py-0.5 rounded-full">
                  {topics.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="polls" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
              <span className="hidden sm:inline">Polls</span>
              {polls.length > 0 && (
                <span className="ml-0.5 md:ml-1 text-xs bg-muted px-1 md:px-1.5 py-0.5 rounded-full">
                  {polls.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
              <span className="hidden sm:inline">Events</span>
              {events.length > 0 && (
                <span className="ml-0.5 md:ml-1 text-xs bg-muted px-1 md:px-1.5 py-0.5 rounded-full">
                  {events.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <FolderOpen className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
              <span className="hidden sm:inline">Resources</span>
              {resources.length > 0 && (
                <span className="ml-0.5 md:ml-1 text-xs bg-muted px-1 md:px-1.5 py-0.5 rounded-full">
                  {resources.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4 text-indigo-500" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            {canModerate && (
              <TabsTrigger value="analytics" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-teal-500" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Settings className="h-3 w-3 md:h-4 md:w-4 text-gray-500" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Feed Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl md:text-2xl font-bold">Group Feed</h2>
                  {isMember && (
                    <div className="flex gap-2">
                      {group.city && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowLostFoundForm(!showLostFoundForm)}
                          className="w-full sm:w-auto"
                        >
                          Lost & Found
                        </Button>
                      )}
                      <Link href={`/groups/${group.slug}/topics/create`}>
                        <Button size="sm" className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          New Topic
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Lost & Found Form */}
                {showLostFoundForm && group.city && (
                  <LostFoundTemplateForm
                    template={getLostFoundTemplate(group.city)}
                    groupId={group.id}
                    onSuccess={() => {
                      setShowLostFoundForm(false)
                      // Refresh page or update feed
                      window.location.reload()
                    }}
                    onCancel={() => setShowLostFoundForm(false)}
                  />
                )}

                {/* Pinned Rules */}
                {(group.pinnedRules && group.pinnedRules.length > 0) || (group.rules && group.rules.length > 0) ? (
                  <PinnedRules group={group} />
                ) : null}

                {/* Feed Content */}
                {!canViewContent ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Members-only content</h3>
                      <p className="text-muted-foreground">
                        Join this group to see the latest activity and participate in discussions.
                      </p>
                    </CardContent>
                  </Card>
                ) : topics.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {isMember
                          ? "Be the first to start a discussion!"
                          : "Encourage members to join and kick off the first conversation."}
                      </p>
                      {isMember && (
                        <Link href={`/groups/${group.slug}/topics/create`}>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Post
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {topics
                      .sort((a, b) => {
                        // Show pinned topics first
                        if (a.isPinned && !b.isPinned) return -1
                        if (!a.isPinned && b.isPinned) return 1
                        // Then sort by last activity or creation date
                        const aDate = a.lastActivityAt || a.createdAt
                        const bDate = b.lastActivityAt || b.createdAt
                        return new Date(bDate).getTime() - new Date(aDate).getTime()
                      })
                      .slice(0, 20)
                      .map((topic) => (
                        <Card key={topic.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {topic.isPinned && (
                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                      Pinned
                                    </span>
                                  )}
                                  {topic.isLocked && (
                                    <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      Locked
                                    </span>
                                  )}
                                </div>
                                <Link href={`/groups/${group.slug}/topics/${topic.id}`}>
                                  <h3 className="text-lg font-semibold hover:underline mb-2">
                                    {topic.title}
                                  </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                  {topic.content}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{topic.viewCount} views</span>
                                  <span>{topic.commentCount} comments</span>
                                  <span>
                                    {new Date(topic.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Moderators List */}
                <ModeratorsList group={group} />

                {/* Group Info Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-semibold">{group.memberCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Posts</span>
                        <span className="font-semibold">{group.postCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Topics</span>
                        <span className="font-semibold">{group.topicCount}</span>
                      </div>
                      {group.membershipType && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-muted-foreground">Membership</span>
                          <span className="font-semibold capitalize">{group.membershipType}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Topics</h2>
              {isMember && (
                <Link href={`/groups/${group.slug}/topics/create`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Topic
                  </Button>
                </Link>
              )}
            </div>
            {!canViewContent ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Members-only content</h3>
                  <p className="text-muted-foreground">
                    Join this group to browse and participate in discussions.
                  </p>
                </CardContent>
              </Card>
            ) : topics.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isMember
                      ? "Start the first discussion in this group!"
                      : "Check back soon—members haven't posted any topics yet."}
                  </p>
                  {isMember && (
                    <Link href={`/groups/${group.slug}/topics/create`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Topic
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {topic.isPinned && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Pinned
                              </span>
                            )}
                            {topic.isLocked && (
                              <span className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Locked
                              </span>
                            )}
                          </div>
                          <Link href={`/groups/${group.slug}/topics/${topic.id}`}>
                            <h3 className="text-lg font-semibold hover:underline mb-2">
                              {topic.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {topic.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{topic.viewCount} views</span>
                            <span>{topic.commentCount} comments</span>
                            <span>
                              {new Date(topic.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Polls</h2>
              {isMember && (
                <Link href={`/groups/${group.slug}/polls/create`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Poll
                  </Button>
                </Link>
              )}
            </div>
            {!canViewContent ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Members-only content</h3>
                  <p className="text-muted-foreground">
                    Join this group to view polls and share your vote.
                  </p>
                </CardContent>
              </Card>
            ) : polls.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No polls yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isMember
                      ? "Create a poll to gather opinions from group members!"
                      : "Members haven't created any polls yet."}
                  </p>
                  {isMember && (
                    <Link href={`/groups/${group.slug}/polls/create`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Poll
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {polls.map((poll) => (
                  <Card key={poll.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <Link href={`/groups/${group.slug}/polls/${poll.id}`}>
                        <h3 className="text-lg font-semibold hover:underline mb-3">
                          {poll.question}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{poll.voteCount} votes</span>
                        <span>
                          {poll.allowMultiple ? "Multiple choice" : "Single choice"}
                        </span>
                        {poll.expiresAt && (
                          <span>
                            Expires: {new Date(poll.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        {poll.isClosed && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">Closed</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Events</h2>
              <div className="flex items-center gap-2">
                {canViewContent && events.length > 0 && (
                  <BulkEventExportButton
                    events={events}
                    groupSlug={group.slug}
                    groupName={group.name}
                    size="sm"
                  />
                )}
                {isMember && (
                  <Link href={`/groups/${group.slug}/events/create`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Event
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            {!canViewContent ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Members-only content</h3>
                  <p className="text-muted-foreground">
                    Join this group to see upcoming events and RSVP.
                  </p>
                </CardContent>
              </Card>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No events scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    {isMember
                      ? "Create an event to bring group members together!"
                      : "Members haven't planned any events yet."}
                  </p>
                  {isMember && (
                    <Link href={`/groups/${group.slug}/events/create`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Event
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <Link href={`/groups/${group.slug}/events/${event.id}`}>
                        <h3 className="text-lg font-semibold hover:underline mb-2">
                          {event.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(event.startDate).toLocaleString()}
                        </span>
                        {event.location && (
                          <span>{event.location}</span>
                        )}
                        <span>{event.attendeeCount} attending</span>
                        {event.maxAttendees && (
                          <span>Max: {event.maxAttendees}</span>
                        )}
                        {event.isCancelled && (
                          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Resources</h2>
              {isMember && (
                <Link href={`/groups/${group.slug}/resources/create`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </Link>
              )}
            </div>
            {!canViewContent ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Members-only content</h3>
                  <p className="text-muted-foreground">
                    Join this group to access shared documents, links, and files.
                  </p>
                </CardContent>
              </Card>
            ) : resources.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isMember
                      ? "Share documents, links, and files with the group!"
                      : "Members haven't added any resources yet."}
                  </p>
                  {isMember && (
                    <Link href={`/groups/${group.slug}/resources/create`}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Resource
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{resource.type}</span>
                        {resource.category && <span>{resource.category}</span>}
                        {resource.downloadCount !== undefined && (
                          <span>{resource.downloadCount} downloads</span>
                        )}
                        <span>
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Members ({members.length})</h2>
              <Link href={`/groups/${group.slug}/members`}>
                <Button variant="outline" size="sm">
                  View All Members
                </Button>
              </Link>
            </div>
            {members.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No members yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to join this group!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <MemberList
                members={members}
                currentUserId={user?.id || ""}
                canManageMembers={canManage}
                onRoleChange={handleRoleChange}
                onRemoveMember={handleRemoveMember}
              />
            )}
          </TabsContent>

          {/* Analytics Tab */}
          {canModerate && (
            <TabsContent value="analytics">
              <AnalyticsDashboard groupId={group.id} groupName={group.name} />
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Link href={`/groups/${group.slug}/settings`}>
              <Button variant="outline">Go to Settings</Button>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
