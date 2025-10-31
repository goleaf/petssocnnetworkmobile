"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getWikiArticles, getUsers } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Search, Eye, Heart, BookOpen, ChevronLeft, ChevronRight, Stethoscope, GraduationCap, Apple, Brain, Sparkles, Clock, TrendingUp, Star, Filter, FileText, Award, Dog, Cat, Bird, Rabbit, Fish, PawPrint } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"

const ARTICLES_PER_PAGE = 9

// Helper function to calculate reading time (average reading speed: 200 words per minute)
function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / 200)
}

// Helper to get recently viewed articles
function getRecentlyViewedArticles(userId: string): string[] {
  if (typeof window === "undefined") return []
  const key = `wiki_recently_viewed_${userId}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

// Helper to add article to recently viewed
function addToRecentlyViewed(userId: string, articleSlug: string) {
  if (typeof window === "undefined") return
  const key = `wiki_recently_viewed_${userId}`
  let recentlyViewed = getRecentlyViewedArticles(userId)
  // Remove if already exists and add to front
  recentlyViewed = recentlyViewed.filter((slug) => slug !== articleSlug)
  recentlyViewed.unshift(articleSlug)
  // Keep only last 10
  recentlyViewed = recentlyViewed.slice(0, 10)
  localStorage.setItem(key, JSON.stringify(recentlyViewed))
}

export default function WikiPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "most-viewed" | "most-liked">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const { user, isAuthenticated } = useAuth()
  const articles = getWikiArticles()
  const users = getUsers()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Define subcategories for each main category
  const subcategories: Record<string, { value: string; label: string }[]> = {
    care: [
      { value: "daily-care", label: "Daily Care" },
      { value: "grooming", label: "Grooming" },
      { value: "exercise", label: "Exercise" },
      { value: "housing", label: "Housing" },
    ],
    health: [
      { value: "general-health", label: "General Health" },
      { value: "preventive-care", label: "Preventive Care" },
      { value: "common-illnesses", label: "Common Illnesses" },
      { value: "emergency-care", label: "Emergency Care" },
    ],
    training: [
      { value: "basic-training", label: "Basic Training" },
      { value: "advanced-training", label: "Advanced Training" },
      { value: "puppy-training", label: "Puppy Training" },
      { value: "behavior-modification", label: "Behavior Modification" },
    ],
    nutrition: [
      { value: "feeding-basics", label: "Feeding Basics" },
      { value: "special-diets", label: "Special Diets" },
      { value: "treats-supplements", label: "Treats & Supplements" },
      { value: "weight-management", label: "Weight Management" },
    ],
    behavior: [
      { value: "understanding-behavior", label: "Understanding Behavior" },
      { value: "problem-behaviors", label: "Problem Behaviors" },
      { value: "socialization", label: "Socialization" },
      { value: "communication", label: "Communication" },
    ],
    breeds: [
      { value: "dog-breeds", label: "Dog Breeds" },
      { value: "cat-breeds", label: "Cat Breeds" },
      { value: "breed-selection", label: "Breed Selection" },
      { value: "mixed-breeds", label: "Mixed Breeds" },
    ],
  }

  // Get all unique species from articles
  const allSpecies = useMemo(() => {
    const speciesSet = new Set<string>()
    articles.forEach((article) => {
      article.species?.forEach((s) => speciesSet.add(s))
    })
    return Array.from(speciesSet).sort()
  }, [articles])

  // Species icons mapping
  const speciesIcons: Record<string, any> = {
    dog: Dog,
    cat: Cat,
    bird: Bird,
    rabbit: Rabbit,
    hamster: PawPrint,
    fish: Fish,
    other: PawPrint,
  }

  const filteredArticles = useMemo(() => {
    let filtered = articles
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((article) => {
        const titleMatch = article.title?.toLowerCase().includes(query) ?? false
        const contentMatch = article.content?.toLowerCase().includes(query) ?? false
        const categoryMatch = article.category?.toLowerCase().includes(query) ?? false
        return titleMatch || contentMatch || categoryMatch
      })
    }
    
    // Species filter
    if (selectedSpecies !== "all") {
      filtered = filtered.filter((article) => 
        article.species?.includes(selectedSpecies)
      )
    }
    
    return filtered
  }, [articles, searchQuery, selectedSpecies])

  const categories = [
    { value: "all", label: "All Articles", icon: BookOpen, color: "text-blue-500" },
    { value: "care", label: "Care", icon: Heart, color: "text-red-500" },
    { value: "health", label: "Health", icon: Stethoscope, color: "text-emerald-500" },
    { value: "training", label: "Training", icon: GraduationCap, color: "text-amber-500" },
    { value: "nutrition", label: "Nutrition", icon: Apple, color: "text-orange-500" },
    { value: "behavior", label: "Behavior", icon: Brain, color: "text-purple-500" },
    { value: "breeds", label: "Breeds", icon: Sparkles, color: "text-pink-500" },
  ]

  const getArticlesByCategory = (category: string, subcategory?: string | null) => {
    let filtered = filteredArticles
    
    if (category !== "all") {
      filtered = filtered.filter((article) => article.category === category)
      
      // Filter by subcategory if selected
      if (subcategory) {
        filtered = filtered.filter((article) => article.subcategory === subcategory)
      }
    }
    
    // Sort articles
    const sorted = [...filtered]
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "most-viewed") {
      sorted.sort((a, b) => b.views - a.views)
    } else if (sortBy === "most-liked") {
      sorted.sort((a, b) => b.likes.length - a.likes.length)
    }
    
    return sorted
  }

  // Get featured articles (top 3 most viewed or liked)
  const featuredArticles = useMemo(() => {
    const sorted = [...articles]
      .sort((a, b) => {
        // Prioritize by likes, then views
        const scoreA = a.likes.length * 2 + a.views
        const scoreB = b.likes.length * 2 + b.views
        return scoreB - scoreA
      })
      .slice(0, 3)
    return sorted
  }, [articles])

  // Get recently viewed articles
  const recentlyViewedSlugs = useMemo(() => {
    if (!isAuthenticated || !user) return []
    return getRecentlyViewedArticles(user.id)
  }, [isAuthenticated, user])

  const recentlyViewedArticles = useMemo(() => {
    return recentlyViewedSlugs
      .map((slug) => articles.find((a) => a.slug === slug))
      .filter((article): article is typeof articles[0] => article !== undefined)
      .slice(0, 6)
  }, [recentlyViewedSlugs, articles])

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedSpecies, sortBy])

  // Reset page when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory(null) // Reset subcategory when main category changes
    setCurrentPage(1)
  }

  const handleSubcategoryChange = (subcategory: string | null) => {
    setSelectedSubcategory(subcategory)
    setCurrentPage(1)
  }

  const getPaginatedArticles = (category: string) => {
    const allArticles = getArticlesByCategory(category, selectedSubcategory)
    const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE)
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE
    const endIndex = startIndex + ARTICLES_PER_PAGE
    return {
      articles: allArticles.slice(startIndex, endIndex),
      totalPages,
      currentPage,
      totalArticles: allArticles.length,
    }
  }

  const currentSubcategories = selectedCategory !== "all" ? subcategories[selectedCategory] || [] : []

  // Stats
  const totalArticles = articles.length
  const totalViews = articles.reduce((sum, article) => sum + article.views, 0)
  const totalLikes = articles.reduce((sum, article) => sum + article.likes.length, 0)

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Pet Care Wiki</h1>
          <p className="text-muted-foreground text-lg">
            Your comprehensive guide to pet care, health, training, and more
          </p>
        </div>
        <div className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageHeader
        title="Pet Care Wiki"
        description="Your comprehensive guide to pet care, health, training, and more"
      />

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-2xl font-bold">{totalArticles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold">Featured Articles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredArticles.map((article) => {
              const author = users.find((u) => u.id === article.authorId)
              return (
                <Link key={article.id} href={`/wiki/${article.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden p-0">
                    {article.coverImage && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="px-6 pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <Badge variant="secondary" className="capitalize">
                          {article.category}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {article.content.substring(0, 120)}...
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {article.likes.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {calculateReadingTime(article.content)} min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recently Viewed (if authenticated) */}
      {isAuthenticated && recentlyViewedArticles.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-bold">Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentlyViewedArticles.map((article) => (
              <Link key={article.id} href={`/wiki/${article.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {article.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm line-clamp-2">{article.title}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {selectedSpecies === "all" ? (
                  <span>All Species</span>
                ) : (
                  <>
                    {(() => {
                      const Icon = speciesIcons[selectedSpecies] || PawPrint
                      return (
                        <>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedSpecies.charAt(0).toUpperCase() + selectedSpecies.slice(1)}</span>
                        </>
                      )
                    })()}
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>All Species</span>
              </div>
            </SelectItem>
            {allSpecies.map((species) => {
              const Icon = speciesIcons[species] || PawPrint
              return (
                <SelectItem key={species} value={species}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{species.charAt(0).toUpperCase() + species.slice(1)}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: "newest" | "most-viewed" | "most-liked") => setSortBy(value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>
                  {sortBy === "newest" && "Newest"}
                  {sortBy === "most-viewed" && "Most Viewed"}
                  {sortBy === "most-liked" && "Most Liked"}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Newest</span>
              </div>
            </SelectItem>
            <SelectItem value="most-viewed">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Most Viewed</span>
              </div>
            </SelectItem>
            <SelectItem value="most-liked">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span>Most Liked</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
              <category.icon className={`h-4 w-4 ${category.color}`} />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Subcategory Filter */}
        {selectedCategory !== "all" && currentSubcategories.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedSubcategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleSubcategoryChange(null)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                All {categories.find((c) => c.value === selectedCategory)?.label}
              </Button>
              {currentSubcategories.map((subcat) => (
                <Button
                  key={subcat.value}
                  variant={selectedSubcategory === subcat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSubcategoryChange(subcat.value)}
                >
                  {subcat.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {categories.map((category) => {
          const { articles: paginatedArticles, totalPages, currentPage: page, totalArticles } = getPaginatedArticles(category.value)
          
          return (
            <TabsContent key={category.value} value={category.value}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedArticles.map((article) => (
                <Link key={article.id} href={`/wiki/${article.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden p-0">
                    {article.coverImage && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={article.coverImage || "/placeholder.svg"}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="px-6 pt-6">
                      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="capitalize">
                            {article.category}
                          </Badge>
                          {article.subcategory && (
                            <Badge variant="outline" className="capitalize">
                              {article.subcategory.replace(/-/g, " ")}
                            </Badge>
                          )}
                        </div>
                        {article.species && article.species.length > 0 && (
                          <Badge variant="outline" className="capitalize">
                            {article.species[0]}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {article.likes.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {calculateReadingTime(article.content)} min read
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                ))}
              </div>
              
              {paginatedArticles.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center space-y-4">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground">No articles found in this category</p>
                  </CardContent>
                </Card>
              ) : totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * ARTICLES_PER_PAGE + 1} to {Math.min(page * ARTICLES_PER_PAGE, totalArticles)} of {totalArticles} articles
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
