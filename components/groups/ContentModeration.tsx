"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getGroupTopicsByGroupId,
  deleteGroupTopic,
  getGroupPollsByGroupId,
  deleteGroupPoll,
  getGroupEventsByGroupId,
  deleteGroupEvent,
  addModerationAction,
} from "@/lib/storage"
import type { Group, GroupTopic, GroupPoll, GroupEvent } from "@/lib/types"
import { MessageSquare, BarChart3, Calendar, Trash2, Check, X } from "lucide-react"

interface ContentModerationProps {
  group: Group
  currentUserId: string
  onContentAction?: () => void
}

export function ContentModeration({
  group,
  currentUserId,
  onContentAction,
}: ContentModerationProps) {
  const [activeTab, setActiveTab] = useState("topics")

  const topics = getGroupTopicsByGroupId(group.id)
  const polls = getGroupPollsByGroupId(group.id)
  const events = getGroupEventsByGroupId(group.id)

  const handleApproveContent = (
    type: "topic" | "poll" | "event",
    contentId: string
  ) => {
    addModerationAction({
      id: `mod_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      actionType: "approve_content",
      targetId: contentId,
      targetType: type,
      performedBy: currentUserId,
      timestamp: new Date().toISOString(),
    })
    onContentAction?.()
  }

  const handleRejectContent = (
    type: "topic" | "poll" | "event",
    contentId: string
  ) => {
    addModerationAction({
      id: `mod_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      actionType: "reject_content",
      targetId: contentId,
      targetType: type,
      performedBy: currentUserId,
      timestamp: new Date().toISOString(),
    })

    // Delete the content
    if (type === "topic") {
      deleteGroupTopic(contentId)
    } else if (type === "poll") {
      deleteGroupPoll(contentId)
    } else if (type === "event") {
      deleteGroupEvent(contentId)
    }

    onContentAction?.()
  }

  const handleDeleteContent = (
    type: "topic" | "poll" | "event",
    contentId: string
  ) => {
    if (!confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      return
    }

    addModerationAction({
      id: `mod_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: group.id,
      actionType: "delete_content",
      targetId: contentId,
      targetType: type,
      performedBy: currentUserId,
      timestamp: new Date().toISOString(),
    })

    if (type === "topic") {
      deleteGroupTopic(contentId)
    } else if (type === "poll") {
      deleteGroupPoll(contentId)
    } else if (type === "event") {
      deleteGroupEvent(contentId)
    }

    onContentAction?.()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Moderation</h3>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="topics">
              <MessageSquare className="h-4 w-4 mr-2" />
              Topics ({topics.length})
            </TabsTrigger>
            <TabsTrigger value="polls">
              <BarChart3 className="h-4 w-4 mr-2" />
              Polls ({polls.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events ({events.length})
            </TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            {topics.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No topics to moderate
                </CardContent>
              </Card>
            ) : (
              topics.map((topic) => (
                <Card key={topic.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{topic.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {topic.isPinned && (
                            <Badge variant="default">Pinned</Badge>
                          )}
                          {topic.isLocked && (
                            <Badge variant="secondary">Locked</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {topic.viewCount} views • {topic.commentCount} comments
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveContent("topic", topic.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectContent("topic", topic.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContent("topic", topic.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {topic.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls" className="space-y-4">
            {polls.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No polls to moderate
                </CardContent>
              </Card>
            ) : (
              polls.map((poll) => (
                <Card key={poll.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{poll.question}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {poll.voteCount} votes
                          </span>
                          {poll.isClosed && (
                            <Badge variant="secondary">Closed</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveContent("poll", poll.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectContent("poll", poll.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContent("poll", poll.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {poll.options.map((option) => (
                        <div key={option.id} className="text-sm">
                          <span className="font-medium">{option.text}</span>
                          <span className="text-muted-foreground ml-2">
                            ({option.voteCount} votes)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {events.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No events to moderate
                </CardContent>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.startDate).toLocaleDateString()}
                          </span>
                          {event.location && (
                            <span className="text-sm text-muted-foreground">
                              • {event.location}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            • {event.attendeeCount} attending
                          </span>
                          {event.isCancelled && (
                            <Badge variant="destructive">Cancelled</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveContent("event", event.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectContent("event", event.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContent("event", event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

