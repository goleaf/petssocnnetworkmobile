"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getWikiArticles } from "@/lib/storage"
import type { WikiArticle } from "@/lib/types"
import { Search, Eye, Heart, BookOpen, ChevronLeft, ChevronRight, Stethoscope, GraduationCap, Apple, Brain, Sparkles } from "lucide-react"
import Link from "next/link"

const ARTICLES_PER_PAGE = 9

export default function WikiPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [articles, setArticles] = useState<WikiArticle[]>([])

  useEffect(() => {
    setArticles(getWikiArticles())
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

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase().trim()
    const titleMatch = article.title?.toLowerCase().includes(query) ?? false
    const contentMatch = article.content?.toLowerCase().includes(query) ?? false
    const categoryMatch = article.category?.toLowerCase().includes(query) ?? false
    
    return titleMatch || contentMatch || categoryMatch
  })

  const categories = [
    { value: "all", label: "All Articles", icon: BookOpen },
    { value: "care", label: "Care", icon: Heart },
    { value: "health", label: "Health", icon: Stethoscope },
    { value: "training", label: "Training", icon: GraduationCap },
    { value: "nutrition", label: "Nutrition", icon: Apple },
    { value: "behavior", label: "Behavior", icon: Brain },
    { value: "breeds", label: "Breeds", icon: Sparkles },
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
    
    return filtered
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedSubcategory])

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pet Care Wiki</h1>
        <p className="text-muted-foreground text-lg">
          Your comprehensive guide to pet care, health, training, and more
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 mb-6">
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
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
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {article.likes.length}
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
