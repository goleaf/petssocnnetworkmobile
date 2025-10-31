"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBlogPosts, getPets, getUsers } from "@/lib/storage"
import { PawPrint, Heart, Users, BookOpen, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import DashboardContent from "./dashboard-content"

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Array<{ label: string; value: number; icon: any }>>([
    { label: "Active Users", value: 0, icon: Users },
    { label: "Pets", value: 0, icon: PawPrint },
    { label: "Blog Posts", value: 0, icon: BookOpen },
  ])

  useEffect(() => {
    // Get featured posts (most liked)
    const posts = getBlogPosts()
    const featured = [...posts].sort((a, b) => b.likes.length - a.likes.length).slice(0, 6)
    setFeaturedPosts(featured)

    // Calculate stats only on client
    setStats([
      { label: "Active Users", value: getUsers().length, icon: Users },
      { label: "Pets", value: getPets().length, icon: PawPrint },
      { label: "Blog Posts", value: getBlogPosts().length, icon: BookOpen },
    ])
    
    setIsLoading(false)
  }, [])

  // Show loading spinner while checking auth and loading data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is logged in, show dashboard
  if (isAuthenticated && user) {
    return <DashboardContent user={user} />
  }

  // If user is not logged in, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <PawPrint className="h-4 w-4" />
              <span>The Social Network for Pet Lovers</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance">
              Connect, Share, and Learn About Your Pets
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Join a vibrant community of pet owners. Share your pet{"'"}s adventures, discover care tips, and connect
              with fellow animal lovers.
            </p>
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold text-lg">{stat.value}+</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="flex flex-col gap-6">
            {showRegister ? (
              <RegisterForm
                onSuccess={() => {}}
                onSwitchToLogin={() => setShowRegister(false)}
              />
            ) : (
              <LoginForm onSuccess={() => {}} onSwitchToRegister={() => setShowRegister(true)} />
            )}
            
            {/* Demo Credentials Section */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2 text-muted-foreground">Demo Credentials</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Username:</strong> sarahpaws, mikecatlover, emmabirds, alexrabbits</p>
                  <p><strong className="text-foreground">Password:</strong> password123</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need for Your Pet Community</h2>
          <p className="text-muted-foreground text-lg">Discover features designed for pet lovers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Pet Profiles</h3>
              <p className="text-muted-foreground">
                Create detailed profiles for each of your pets. Share their photos, stories, and milestones with the
                community.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Pet Care Wiki</h3>
              <p className="text-muted-foreground">
                Access comprehensive guides on pet care, health, training, and nutrition. Learn from experts and
                experienced pet owners.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Social Features</h3>
              <p className="text-muted-foreground">
                Follow other pet owners, like and comment on posts, and build connections with people who share your
                love for animals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                Trending Stories
              </h2>
              <p className="text-muted-foreground">Popular posts from our community</p>
            </div>
            <Link href="/blog">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => {
              const pet = getPets().find((p) => p.id === post.petId)
              return (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
                  {post.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={post.coverImage || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-1">By {pet?.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        {post.likes.length}
                      </div>
                      <div className="flex gap-1">
                        {post.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Join the Community?</h2>
            <p className="text-lg opacity-90">
              Create your account today and start sharing your pet{"'"}s amazing journey
            </p>
            <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)}>
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
