"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, User, PawPrint, FileText, BookOpen, Hash, Filter, MapPin } from "lucide-react"
import Link from "next/link"
import { getUsers, getPets, getBlogPosts, getWikiArticles } from "@/lib/storage"
import type { User as UserType, Pet, BlogPost, WikiArticle } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialTab = searchParams.get("tab") || "all"

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [filters, setFilters] = useState({
    species: [] as string[],
    location: "",
    breed: "",
    category: [] as string[],
  })
  const [results, setResults] = useState({
    users: [] as UserType[],
    pets: [] as Pet[],
    blogs: [] as BlogPost[],
    wiki: [] as WikiArticle[],
    hashtags: [] as string[],
  })

  useEffect(() => {
    if (
      !query.trim() &&
      filters.species.length === 0 &&
      !filters.location &&
      !filters.breed &&
      filters.category.length === 0
    ) {
      setResults({ users: [], pets: [], blogs: [], wiki: [], hashtags: [] })
      return
    }

    const searchQuery = query.toLowerCase()

    // Search users with location filter
    let users = getUsers().filter(
      (user) =>
        user.username.toLowerCase().includes(searchQuery) ||
        user.fullName.toLowerCase().includes(searchQuery) ||
        user.bio?.toLowerCase().includes(searchQuery),
    )

    if (filters.location) {
      users = users.filter((user) => user.location?.toLowerCase().includes(filters.location.toLowerCase()))
    }

    // Search pets with species and breed filters
    let pets = getPets().filter(
      (pet) =>
        pet.name.toLowerCase().includes(searchQuery) ||
        pet.species.toLowerCase().includes(searchQuery) ||
        pet.breed?.toLowerCase().includes(searchQuery) ||
        pet.bio?.toLowerCase().includes(searchQuery),
    )

    if (filters.species.length > 0) {
      pets = pets.filter((pet) => filters.species.includes(pet.species))
    }

    if (filters.breed) {
      pets = pets.filter((pet) => pet.breed?.toLowerCase().includes(filters.breed.toLowerCase()))
    }

    // Search blog posts
    const blogs = getBlogPosts().filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery) ||
        post.content.toLowerCase().includes(searchQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery)) ||
        post.hashtags?.some((tag) => tag.toLowerCase().includes(searchQuery)),
    )

    // Search wiki articles with category filter
    let wiki = getWikiArticles().filter(
      (article) =>
        article.title.toLowerCase().includes(searchQuery) ||
        article.content.toLowerCase().includes(searchQuery) ||
        article.category.toLowerCase().includes(searchQuery),
    )

    if (filters.category.length > 0) {
      wiki = wiki.filter((article) => filters.category.includes(article.category))
    }

    // Extract hashtags from blogs
    const allHashtags = new Set<string>()
    getBlogPosts().forEach((post) => {
      post.hashtags?.forEach((tag) => {
        if (tag.toLowerCase().includes(searchQuery)) {
          allHashtags.add(tag)
        }
      })
    })

    setResults({
      users,
      pets,
      blogs,
      wiki,
      hashtags: Array.from(allHashtags),
    })
  }, [query, filters])

  const toggleSpeciesFilter = (species: string) => {
    setFilters((prev) => ({
      ...prev,
      species: prev.species.includes(species) ? prev.species.filter((s) => s !== species) : [...prev.species, species],
    }))
  }

  const toggleCategoryFilter = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }))
  }

  const clearFilters = () => {
    setFilters({
      species: [],
      location: "",
      breed: "",
      category: [],
    })
  }

  const hasActiveFilters =
    filters.species.length > 0 || filters.location || filters.breed || filters.category.length > 0

  const totalResults =
    results.users.length + results.pets.length + results.blogs.length + results.wiki.length + results.hashtags.length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search & Discover</h1>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for users, pets, blogs, wiki articles, or hashtags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full md:w-[180px]">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {filters.species.length +
                      filters.category.length +
                      (filters.location ? 1 : 0) +
                      (filters.breed ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Pet Species</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.species.includes("dog")}
                onCheckedChange={() => toggleSpeciesFilter("dog")}
              >
                Dogs
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.species.includes("cat")}
                onCheckedChange={() => toggleSpeciesFilter("cat")}
              >
                Cats
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.species.includes("bird")}
                onCheckedChange={() => toggleSpeciesFilter("bird")}
              >
                Birds
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.species.includes("rabbit")}
                onCheckedChange={() => toggleSpeciesFilter("rabbit")}
              >
                Rabbits
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.species.includes("hamster")}
                onCheckedChange={() => toggleSpeciesFilter("hamster")}
              >
                Hamsters
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Wiki Categories</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={filters.category.includes("care")}
                onCheckedChange={() => toggleCategoryFilter("care")}
              >
                Care
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.category.includes("health")}
                onCheckedChange={() => toggleCategoryFilter("health")}
              >
                Health
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.category.includes("training")}
                onCheckedChange={() => toggleCategoryFilter("training")}
              >
                Training
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.category.includes("nutrition")}
                onCheckedChange={() => toggleCategoryFilter("nutrition")}
              >
                Nutrition
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <div className="p-2">
                <Input
                  placeholder="Location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="h-8"
                />
              </div>
              <div className="p-2">
                <Input
                  placeholder="Breed..."
                  value={filters.breed}
                  onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                  className="h-8"
                />
              </div>

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                      Clear All Filters
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-2">
            {filters.species.map((species) => (
              <Badge key={species} variant="secondary" className="gap-1">
                {species}
                <button onClick={() => toggleSpeciesFilter(species)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {filters.category.map((category) => (
              <Badge key={category} variant="secondary" className="gap-1">
                {category}
                <button onClick={() => toggleCategoryFilter(category)} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
            {filters.location && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {filters.location}
                <button
                  onClick={() => setFilters({ ...filters, location: "" })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.breed && (
              <Badge variant="secondary" className="gap-1">
                {filters.breed}
                <button onClick={() => setFilters({ ...filters, breed: "" })} className="ml-1 hover:text-destructive">
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {query && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{query}"
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
          <TabsTrigger value="users">
            <User className="h-4 w-4 mr-1" />
            Users ({results.users.length})
          </TabsTrigger>
          <TabsTrigger value="pets">
            <PawPrint className="h-4 w-4 mr-1" />
            Pets ({results.pets.length})
          </TabsTrigger>
          <TabsTrigger value="blogs">
            <FileText className="h-4 w-4 mr-1" />
            Blogs ({results.blogs.length})
          </TabsTrigger>
          <TabsTrigger value="wiki">
            <BookOpen className="h-4 w-4 mr-1" />
            Wiki ({results.wiki.length})
          </TabsTrigger>
          <TabsTrigger value="hashtags">
            <Hash className="h-4 w-4 mr-1" />
            Tags ({results.hashtags.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {!query ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Start typing to search across the platform</p>
              </CardContent>
            </Card>
          ) : totalResults === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No results found for "{query}"</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {results.users.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Users</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.users.slice(0, 4).map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              )}

              {results.pets.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Pets</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.pets.slice(0, 4).map((pet) => (
                      <PetCard key={pet.id} pet={pet} />
                    ))}
                  </div>
                </div>
              )}

              {results.blogs.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Blog Posts</h2>
                  <div className="space-y-4">
                    {results.blogs.slice(0, 4).map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {results.wiki.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Wiki Articles</h2>
                  <div className="space-y-4">
                    {results.wiki.slice(0, 4).map((article) => (
                      <WikiCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}

              {results.hashtags.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Hashtags</h2>
                  <div className="flex flex-wrap gap-2">
                    {results.hashtags.slice(0, 10).map((tag) => (
                      <Link key={tag} href={`/explore/hashtag/${tag}`}>
                        <Badge
                          variant="secondary"
                          className="text-sm px-3 py-1 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        >
                          #{tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {results.users.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pets" className="mt-6">
          {results.pets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No pets found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blogs" className="mt-6">
          {results.blogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No blog posts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.blogs.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wiki" className="mt-6">
          {results.wiki.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No wiki articles found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.wiki.map((article) => (
                <WikiCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-6">
          {results.hashtags.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No hashtags found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {results.hashtags.map((tag) => (
                <Link key={tag} href={`/explore/hashtag/${tag}`}>
                  <Badge
                    variant="secondary"
                    className="text-base px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserCard({ user }: { user: UserType }) {
  return (
    <Link href={`/user/${user.username}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.fullName}</p>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              {user.bio && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{user.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PetCard({ pet }: { pet: Pet }) {
  const users = getUsers()
  const owner = users.find((u) => u.id === pet.ownerId)
  const petUrl = owner ? getPetUrlFromPet(pet, owner.username) : `/pet/${pet.id}`
  return (
    <Link href={petUrl}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={pet.avatar || "/placeholder.svg"} />
              <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{pet.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{pet.breed || pet.species}</p>
              {pet.bio && <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{pet.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.hashtags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function WikiCard({ article }: { article: WikiArticle }) {
  return (
    <Link href={`/wiki/${article.slug}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
              <Badge variant="secondary" className="text-xs mb-2 capitalize">
                {article.category}
              </Badge>
              <p className="text-sm text-muted-foreground line-clamp-2">{article.content}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
