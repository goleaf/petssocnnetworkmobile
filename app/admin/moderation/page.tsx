"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Shield, TrendingUp, Users, Flag, Filter, Gauge } from "lucide-react"
import { detectSuspiciousActivity, clearUserActivity } from "@/lib/spam-detection"
import { getUsers } from "@/lib/storage"

export default function ModerationPage() {
  const { user } = useAuth()
  const [suspiciousUsers, setSuspiciousUsers] = useState<
    Array<{ userId: string; username: string; reasons: string[] }>
  >([])

  useEffect(() => {
    // Check all users for suspicious activity
    const users = getUsers()
    const suspicious = users
      .map((u) => {
        const detection = detectSuspiciousActivity(u.id)
        return {
          userId: u.id,
          username: u.username,
          reasons: detection.reasons,
          isSuspicious: detection.isSuspicious,
        }
      })
      .filter((u) => u.isSuspicious)

    setSuspiciousUsers(suspicious)
  }, [])

  const handleClearActivity = (userId: string) => {
    clearUserActivity(userId)
    setSuspiciousUsers((prev) => prev.filter((u) => u.userId !== userId))
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access moderation tools.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">Monitor and manage platform safety and content quality</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousUsers.length}</div>
            <p className="text-xs text-muted-foreground">Users flagged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Protection layers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Active limits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUsers().length}</div>
            <p className="text-xs text-muted-foreground">Monitored accounts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suspicious" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suspicious">Suspicious Activity</TabsTrigger>
          <TabsTrigger value="filters">Content Filters</TabsTrigger>
          <TabsTrigger value="limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Flag className="h-4 w-4 text-yellow-500" />
                </div>
                Flagged Users
              </CardTitle>
              <CardDescription>Users with suspicious activity patterns detected by automated systems</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No suspicious activity detected</p>
              ) : (
                <div className="space-y-4">
                  {suspiciousUsers.map((user) => (
                    <div key={user.userId} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="font-medium">@{user.username}</div>
                        <div className="flex flex-wrap gap-2">
                          {user.reasons.map((reason, index) => (
                            <Badge key={index} variant="destructive">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleClearActivity(user.userId)}>
                        Clear Flags
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-blue-500" />
                </div>
                Active Content Filters
              </CardTitle>
              <CardDescription>Automated filters protecting content quality and safety</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Profanity Filter</div>
                  <div className="text-sm text-muted-foreground">Automatically filters inappropriate language</div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Spam Detection</div>
                  <div className="text-sm text-muted-foreground">Detects spam patterns and excessive URLs</div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Duplicate Content</div>
                  <div className="text-sm text-muted-foreground">Prevents repeated identical posts</div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Gauge className="h-4 w-4 text-purple-500" />
                </div>
                Rate Limit Configuration
              </CardTitle>
              <CardDescription>Limits to prevent abuse and ensure fair usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Post Creation</span>
                  <span className="text-sm text-muted-foreground">5 per minute</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Comments</span>
                  <span className="text-sm text-muted-foreground">10 per minute</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Follow Actions</span>
                  <span className="text-sm text-muted-foreground">20 per minute</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Like Actions</span>
                  <span className="text-sm text-muted-foreground">30 per minute</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Search Queries</span>
                  <span className="text-sm text-muted-foreground">30 per minute</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Login Attempts</span>
                  <span className="text-sm text-muted-foreground">5 per 5 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Profile Updates</span>
                  <span className="text-sm text-muted-foreground">3 per minute</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
