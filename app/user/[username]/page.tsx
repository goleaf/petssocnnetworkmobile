"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EditButton } from "@/components/ui/edit-button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagInput } from "@/components/ui/tag-input"
import { getUserByUsername, getUserById, updateUser, getPetsByOwnerId, getBlogPosts, getFeedPosts, getFeedPostsByAuthorId, toggleFollow } from "@/lib/storage"
import type { User, FeedPost, BlogPost } from "@/lib/types"
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  Globe,
  Users,
  Heart,
  PawPrint,
  BookOpen,
  Edit,
  Save,
  X,
  UserPlus,
  UserMinus,
  User,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { BadgeDisplay } from "@/components/badge-display"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatDate } from "@/lib/utils/date"
import {
  canViewProfile,
  canViewUserPosts,
  canViewUserPets,
  canViewFollowers,
  canViewFollowing,
  canViewProfileField,
  canSendFollowRequest,
  canViewPost,
} from "@/lib/utils/privacy"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [pets, setPets] = useState<any[]>([])
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: "",
    bio: "",
    avatar: "",
    location: "",
    website: "",
    phone: "",
    occupation: "",
    interests: [] as string[],
    favoriteAnimal: "",
  })

  useEffect(() => {
    const username = params.username as string
    const fetchedUser = getUserByUsername(username)

    if (!fetchedUser) {
      router.push("/")
      return
    }

    const viewerId = currentUser?.id || null
    
    // Check if viewer can see profile
    if (!canViewProfile(fetchedUser, viewerId)) {
      router.push("/")
      return
    }

    setUser(fetchedUser)
    
    // Filter pets and posts based on privacy
    if (canViewUserPets(fetchedUser, viewerId)) {
      setPets(getPetsByOwnerId(fetchedUser.id))
    } else {
      setPets([])
    }
    
    if (canViewUserPosts(fetchedUser, viewerId)) {
      // Get feed posts
      const allFeedPosts = getFeedPostsByAuthorId(fetchedUser.id).filter((post) => {
        if (!post.privacy || post.privacy === "public") return true
        if (post.privacy === "private" && post.authorId !== viewerId) return false
        if (post.privacy === "followers-only" && viewerId && !getUserById(viewerId || "")?.following.includes(post.authorId)) return false
        return true
      })
      setFeedPosts(allFeedPosts)
      
      // Get blog posts
      const allBlogPosts = getBlogPosts()
        .filter((post) => post.authorId === fetchedUser.id)
        .filter((post) => canViewPost(post, fetchedUser, viewerId))
      setBlogPosts(allBlogPosts)
    } else {
      setFeedPosts([])
      setBlogPosts([])
    }

    if (currentUser) {
      setIsFollowing(currentUser.following.includes(fetchedUser.id))
    }

    setEditForm({
      fullName: fetchedUser.fullName,
      bio: fetchedUser.bio || "",
      avatar: fetchedUser.avatar || "",
      location: fetchedUser.location || "",
      website: fetchedUser.website || "",
      phone: fetchedUser.phone || "",
      occupation: fetchedUser.occupation || "",
      interests: fetchedUser.interests || [],
      favoriteAnimal: fetchedUser.favoriteAnimals?.[0] || "",
    })
  }, [params.username, currentUser, router])

  const handleFollow = () => {
    if (!currentUser || !user) return
    toggleFollow(currentUser.id, user.id)
    setIsFollowing(!isFollowing)
    // Refresh user data
    const updatedUser = getUserByUsername(user.username)
    if (updatedUser) setUser(updatedUser)
  }

  const handleSaveProfile = () => {
    if (!user || !currentUser || user.id !== currentUser.id) return

    updateUser(user.id, {
      fullName: editForm.fullName,
      bio: editForm.bio,
      avatar: editForm.avatar,
      location: editForm.location,
      website: editForm.website,
      phone: editForm.phone,
      occupation: editForm.occupation,
      interests: editForm.interests,
      favoriteAnimals: editForm.favoriteAnimal ? [editForm.favoriteAnimal] : [],
    })

    const updatedUser = getUserByUsername(user.username)
    if (updatedUser) setUser(updatedUser)
    setIsEditing(false)
  }

  if (!user) return null

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)
  const canViewPosts = canViewUserPosts(user, viewerId)
  const canViewFollowersList = canViewFollowers(user, viewerId)
  const canViewFollowingList = canViewFollowing(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)
  
  const stats = [
    { label: "Pets", value: canViewPets ? pets.length : 0, icon: PawPrint, canView: canViewPets },
    { label: "Feed Posts", value: canViewPosts ? feedPosts.length : 0, icon: MessageCircle, canView: canViewPosts },
    { label: "Blog Posts", value: canViewPosts ? blogPosts.length : 0, icon: BookOpen, canView: canViewPosts },
    { label: "Followers", value: canViewFollowersList ? user.followers.length : 0, icon: Users, canView: canViewFollowersList },
    { label: "Following", value: canViewFollowingList ? user.following.length : 0, icon: Heart, canView: canViewFollowingList },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={isEditing ? editForm.avatar || "/placeholder.svg" : user.avatar || "/placeholder.svg"} alt={user.fullName} />
                <AvatarFallback className="text-4xl">{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
                {isEditing && (
                  <div className="space-y-2 w-full">
                    <Label htmlFor="avatar" className="text-xs">Avatar URL</Label>
                    <Input
                      id="avatar"
                      value={editForm.avatar}
                      onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                      placeholder="/path/to/image.png"
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    {isEditing ? (
                      <Input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="text-3xl font-bold mb-2"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold">{user.fullName}</h1>
                        <BadgeDisplay user={user} size="lg" />
                      </div>
                    )}
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.isPro && user.proExpiresAt && (
                      <p className="text-xs text-amber-600 mt-1">
                        Pro member until {formatDate(user.proExpiresAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <>
                        {isEditing ? (
                          <>
                            <Button onClick={handleSaveProfile} size="sm">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <EditButton onClick={() => setIsEditing(true)} size="sm">
                            Edit Profile
                          </EditButton>
                        )}
                      </>
                    ) : (
                      isAuthenticated && (
                        <>
                          {isFollowing ? (
                            <Button onClick={handleFollow} variant="outline">
                              <UserMinus className="h-4 w-4 mr-2" />
                              Unfollow
                            </Button>
                          ) : canFollow ? (
                            <Button onClick={handleFollow} variant="default">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </Button>
                          ) : null}
                        </>
                      )
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                ) : (
                  user.bio && <p className="text-muted-foreground">{user.bio}</p>
                )}

                {user.shelterSponsorship && (
                  <div className="flex items-center gap-2 text-sm text-pink-600 bg-pink-50 dark:bg-pink-950 px-3 py-2 rounded-lg">
                    <Heart className="h-4 w-4" />
                    <span>Supporting animal shelters</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat) => {
                    let linkHref = "#"
                    if (stat.label === "Pets") {
                      linkHref = `/user/${user.username}/pets`
                    } else if (stat.label === "Posts") {
                      linkHref = `/user/${user.username}/posts`
                    } else if (stat.label === "Followers") {
                      linkHref = `/user/${user.username}/followers`
                    } else if (stat.label === "Following") {
                      linkHref = `/user/${user.username}/following`
                    }

                    return (
                      <Link
                        key={stat.label}
                        href={linkHref}
                        onClick={(e) => {
                          if (linkHref.startsWith("#")) {
                            e.preventDefault()
                            // Scroll to the tab section
                            const tabs = document.querySelector('[role="tablist"]')
                            if (tabs) {
                              tabs.scrollIntoView({ behavior: "smooth", block: "start" })
                              // Switch to the appropriate tab
                              const tabButton = document.querySelector(
                                linkHref === "#pets"
                                  ? '[role="tab"][value="pets"]'
                                  : '[role="tab"][value="posts"]'
                              ) as HTMLButtonElement
                              if (tabButton) {
                                setTimeout(() => tabButton.click(), 100)
                              }
                            }
                          }
                        }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full">
                          <CardContent className="px-1 py-0.5 text-center">
                            <div className="flex flex-col items-center justify-center gap-0">
                              <div className="flex items-center justify-center gap-1">
                                <stat.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                                <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                  {stat.value}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground leading-tight">{stat.label}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="feed">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Feed Posts
                </TabsTrigger>
                <TabsTrigger value="blog">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Blog Posts
                </TabsTrigger>
                <TabsTrigger value="pets">
                  <PawPrint className="h-4 w-4 mr-2" />
                  Pets
                </TabsTrigger>
                <TabsTrigger value="about">
                  <User className="h-4 w-4 mr-2" />
                  About
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-4">
                {!canViewPosts ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>This user{"'"}s feed posts are private</p>
                    </CardContent>
                  </Card>
                ) : feedPosts.length > 0 ? (
                  feedPosts.map((post) => {
                    const pet = pets.find((p) => p.id === post.petId)
                    return (
                      <Card key={post.id}>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              {pet && (
                                <>
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                    <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold">{pet.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(post.createdAt)}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                            <p className="text-foreground whitespace-pre-wrap break-words">{post.content}</p>
                            {post.images && post.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {post.images.map((image, index) => (
                                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                    <img src={image} alt={`Post image ${index + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {post.hashtags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No feed posts yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="blog" className="space-y-4">
                {!canViewPosts ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>This user{"'"}s blog posts are private</p>
                    </CardContent>
                  </Card>
                ) : blogPosts.length > 0 ? (
                  blogPosts.map((post) => {
                    const pet = pets.find((p) => p.id === post.petId)
                    return (
                      <Card key={post.id}>
                        <CardContent className="p-6">
                          <Link href={`/blog/${post.id}`}>
                            <div className="space-y-3 cursor-pointer hover:opacity-80 transition-opacity">
                              <div className="flex items-center gap-3">
                                {pet && (
                                  <>
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{pet.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(post.createdAt)}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              <h3 className="text-xl font-bold">{post.title}</h3>
                              <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                              {post.coverImage && (
                                <img
                                  src={post.coverImage || "/placeholder.svg"}
                                  alt={post.title}
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{post.likes?.length || 0}</span>
                                </div>
                                <div className="flex gap-1">
                                  {post.tags.slice(0, 3).map((tag: string) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No blog posts yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pets" className="space-y-4">
                {!canViewPets ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>This user{"'"}s pets are private</p>
                    </CardContent>
                  </Card>
                ) : pets.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {pets.map((pet) => (
                      <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{pet.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {pet.breed || pet.species}
                                  {pet.age && ` • ${pet.age} years old`}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                  <Heart className="h-3 w-3" />
                                  {pet.followers.length} followers
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No pets added yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="about">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label>Occupation</Label>
                          <Input
                            value={editForm.occupation}
                            onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                            placeholder="Your occupation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            placeholder="City, Country"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Website</Label>
                          <Input
                            value={editForm.website}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Favorite Animal</Label>
                          <Input
                            value={editForm.favoriteAnimal}
                            onChange={(e) => setEditForm({ ...editForm, favoriteAnimal: e.target.value })}
                            placeholder="Dogs, Cats, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Interests</Label>
                          <TagInput
                            value={editForm.interests.join(", ")}
                            onChange={(value) => {
                              const interestsArray = value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter((tag) => tag)
                              setEditForm({ ...editForm, interests: interestsArray })
                            }}
                            placeholder="Add interests (e.g., hiking, photography, dogs)"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {user.occupation && (
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span>{user.occupation}</span>
                          </div>
                        )}
                        {user.location && canViewProfileField("location", user, viewerId) && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                            <a
                              href={user.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {user.website}
                            </a>
                          </div>
                        )}
                        {user.email && canViewProfileField("email", user, viewerId) && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.favoriteAnimals && user.favoriteAnimals.length > 0 && (
                          <div className="flex items-center gap-3">
                            <PawPrint className="h-5 w-5 text-muted-foreground" />
                            <span>Favorite: {user.favoriteAnimals.join(", ")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <span>Joined {formatDate(user.joinedAt)}</span>
                        </div>
                        {user.interests && user.interests.length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-3">Interests</h4>
                            <div className="flex flex-wrap gap-2">
                              {user.interests.map((interest) => (
                                <Badge key={interest} variant="secondary">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Followers</CardTitle>
              </CardHeader>
              <CardContent>
                {user.followers.length > 0 ? (
                  <div className="space-y-3">
                    {user.followers.slice(0, 5).map((followerId) => {
                      const follower = getUserById(followerId)
                      if (!follower) return null
                      return (
                        <Link key={follower.id} href={`/user/${follower.username}`}>
                          <div className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={follower.avatar || "/placeholder.svg"} alt={follower.fullName} />
                              <AvatarFallback>{follower.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate flex items-center gap-1">
                                {follower.fullName}
                                <BadgeDisplay user={follower} size="sm" />
                              </p>
                              <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    {user.followers.length > 5 && (
                      <Link href={`/user/${user.username}/followers`}>
                        <Button variant="ghost" className="w-full" size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          View all {user.followers.length} followers
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No followers yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Following</CardTitle>
              </CardHeader>
              <CardContent>
                {user.following.length > 0 ? (
                  <div className="space-y-3">
                    {user.following.slice(0, 5).map((followingId) => {
                      const following = getUserById(followingId)
                      if (!following) return null
                      return (
                        <Link key={following.id} href={`/user/${following.username}`}>
                          <div className="flex items-center gap-3 hover:bg-accent p-2 rounded-lg transition-colors">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={following.avatar || "/placeholder.svg"} alt={following.fullName} />
                              <AvatarFallback>{following.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate flex items-center gap-1">
                                {following.fullName}
                                <BadgeDisplay user={following} size="sm" />
                              </p>
                              <p className="text-xs text-muted-foreground truncate">@{following.username}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    {user.following.length > 5 && (
                      <Link href={`/user/${user.username}/following`}>
                        <Button variant="ghost" className="w-full" size="sm">
                          <Heart className="h-4 w-4 mr-2" />
                          View all {user.following.length} following
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Not following anyone yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
