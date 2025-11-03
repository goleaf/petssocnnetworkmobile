"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Target, DollarSign, Calendar, AlertCircle, X, FileText, PawPrint } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PromotePostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [budget, setBudget] = useState("50")
  const [duration, setDuration] = useState("7")
  const [selectedPost, setSelectedPost] = useState("")

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to promote posts.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPost) {
      toast.error("Please select a post to promote")
      return
    }

    // In a real app, this would submit for review
    toast.success("Your promotion request has been submitted for review!")
    router.push("/dashboard")
  }

  const estimatedReach = Math.floor(Number.parseInt(budget) * 100 * (Number.parseInt(duration) / 7))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Promote Your Post</h1>
        <p className="text-muted-foreground">Reach more pet lovers with promoted posts</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Reach</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estimatedReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">potential impressions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${budget}</div>
            <p className="text-xs text-muted-foreground">for {duration} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duration}</div>
            <p className="text-xs text-muted-foreground">days active</p>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Post</CardTitle>
            <CardDescription>Choose which post you want to promote</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedPost} onValueChange={setSelectedPost}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a post">
                  {selectedPost && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {selectedPost === "1" && "My dog's birthday celebration 🎉"}
                        {selectedPost === "2" && "Tips for training puppies"}
                        {selectedPost === "3" && "Adoption success story"}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>My dog's birthday celebration 🎉</span>
                  </div>
                </SelectItem>
                <SelectItem value="2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>Tips for training puppies</span>
                  </div>
                </SelectItem>
                <SelectItem value="3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span>Adoption success story</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget & Duration</CardTitle>
            <CardDescription>Set your promotion budget and duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                min="10"
                max="1000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Minimum $10, Maximum $1000</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (days)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(() => {
                      return (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="truncate">{duration} days</span>
                        </div>
                      )
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>3 days</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="7">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>7 days</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="14">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>14 days</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="30">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>30 days</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Audience (Optional)</CardTitle>
            <CardDescription>Narrow down who sees your promoted post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="species">Pet Species</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All species">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">All species</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>All species</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dogs">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>Dogs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cats">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>Cats</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="birds">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>Birds</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rabbits">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span>Rabbits</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., San Francisco, CA" />
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All promoted posts are reviewed by our moderation team before going live. This typically takes 24-48 hours.
            Posts must comply with our community guidelines and advertising policies.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            Submit for Review
          </Button>
        </div>
      </form>
    </div>
  )
}
