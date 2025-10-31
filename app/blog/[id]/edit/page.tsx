"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TagInput } from "@/components/ui/tag-input"
import { getBlogPostById, getPetsByOwnerId, updateBlogPost } from "@/lib/storage"
import type { BlogPost, PrivacyLevel } from "@/lib/types"
import { Save, X, Globe, Users, Lock, Upload, Image as ImageIcon, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import RichTextEditor from "reactjs-tiptap-editor"
import { BaseKit } from "reactjs-tiptap-editor"
import { Bold } from "reactjs-tiptap-editor/bold"
import { Italic } from "reactjs-tiptap-editor/italic"
import { TextUnderline } from "reactjs-tiptap-editor/textunderline"
import { Strike } from "reactjs-tiptap-editor/strike"
import { Heading } from "reactjs-tiptap-editor/heading"
import { BulletList } from "reactjs-tiptap-editor/bulletlist"
import { OrderedList } from "reactjs-tiptap-editor/orderedlist"
import { ListItem } from "reactjs-tiptap-editor/listitem"
import { TaskList } from "reactjs-tiptap-editor/tasklist"
import { TextAlign } from "reactjs-tiptap-editor/textalign"
import { Link as TiptapLink } from "reactjs-tiptap-editor/link"
import { Image } from "reactjs-tiptap-editor/image"
import { Code } from "reactjs-tiptap-editor/code"
import { CodeBlock } from "reactjs-tiptap-editor/codeblock"
import { Blockquote } from "reactjs-tiptap-editor/blockquote"
import { Highlight } from "reactjs-tiptap-editor/highlight"
import { Color } from "reactjs-tiptap-editor/color"
import { SubAndSuperScript } from "reactjs-tiptap-editor/subandsuperscript"
import { Clear } from "reactjs-tiptap-editor/clear"
import { Table } from "reactjs-tiptap-editor/table"
import { HorizontalRule } from "reactjs-tiptap-editor/horizontalrule"
import { Indent } from "reactjs-tiptap-editor/indent"
import "reactjs-tiptap-editor/style.css"

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [myPets, setMyPets] = useState<any[]>([])
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState<string>("")
  const [imagePreview, setImagePreview] = useState<string>("")
  const [imageError, setImageError] = useState<string>("")
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Minimum dimensions for blog cover images (16:9 aspect ratio)
  const MIN_WIDTH = 1280
  const MIN_HEIGHT = 720

  const [formData, setFormData] = useState({
    petId: "",
    title: "",
    tags: "",
    privacy: "public" as PrivacyLevel,
    hashtags: "",
  })

  const extensions = [
    BaseKit.configure({
      placeholder: {
        showOnlyCurrent: true,
      },
      characterCount: {
        limit: 50000,
      },
    }),
    // Text Formatting
    Bold,
    Italic,
    TextUnderline,
    Strike,
    Code,
    SubAndSuperScript,
    
    // Headings
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
    
    // Lists
    BulletList,
    OrderedList,
    ListItem,
    TaskList,
    Indent,
    
    // Alignment
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    
    // Colors
    Color,
    Highlight,
    
    // Links and Media
    TiptapLink.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
    Image.configure({
      resourceImage: "link",
      HTMLAttributes: {
        class: "max-w-full rounded-lg",
      },
    }),
    
    // Code
    CodeBlock,
    
    // Other
    Blockquote,
    HorizontalRule,
    Table,
    Clear,
  ]

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        router.push("/")
        return
      }

      setIsLoading(true)

      // Simulate a small delay to show spinner
      await new Promise((resolve) => setTimeout(resolve, 300))

      const loadedPost = getBlogPostById(id)
      if (!loadedPost) {
        router.push("/feed")
        return
      }

      // Check if user owns the post
      if (loadedPost.authorId !== user.id) {
        router.push(`/blog/${id}`)
        return
      }

      setPost(loadedPost)
      const pets = getPetsByOwnerId(user.id)
      setMyPets(pets)

      setFormData({
        petId: loadedPost.petId,
        title: loadedPost.title,
        tags: loadedPost.tags.join(", "),
        privacy: (loadedPost.privacy || "public") as PrivacyLevel,
        hashtags: loadedPost.hashtags?.join(", ") || "",
      })

      setContent(loadedPost.content)
      setCoverImage(loadedPost.coverImage || "")
      setImagePreview(loadedPost.coverImage || "")
      setIsLoading(false)
    }

    loadData()
  }, [id, user, router])

  const handleTagsChange = (value: string) => {
    setFormData((prev) => ({ ...prev, tags: value }))
  }

  const handleHashtagsChange = (value: string) => {
    setFormData((prev) => ({ ...prev, hashtags: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file")
      return
    }

    setImageError("")
    const reader = new FileReader()

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      const img = new window.Image()
      img.onload = () => {
        const width = img.naturalWidth
        const height = img.naturalHeight

        setImageDimensions({ width, height })

        // Validate dimensions
        if (width < MIN_WIDTH || height < MIN_HEIGHT) {
          setImageError(
            `Image dimensions are too small. Minimum required: ${MIN_WIDTH}x${MIN_HEIGHT}px. Current: ${width}x${height}px`
          )
          setImagePreview("")
          setCoverImage("")
          return
        }

        // Check if aspect ratio is approximately 16:9 (allow some tolerance)
        const aspectRatio = width / height
        const targetRatio = 16 / 9
        const tolerance = 0.1

        if (Math.abs(aspectRatio - targetRatio) > tolerance) {
          setImageError(
            `Image aspect ratio should be approximately 16:9 (width:height). Current ratio: ${aspectRatio.toFixed(2)}:1, recommended: 1.78:1`
          )
          // Still allow upload, but show warning
        } else {
          setImageError("")
        }

        setImagePreview(dataUrl)
        setCoverImage(dataUrl)
      }

      img.onerror = () => {
        setImageError("Failed to load image. Please try another file.")
      }

      img.src = dataUrl
    }

    reader.onerror = () => {
      setImageError("Failed to read file. Please try again.")
    }

    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setCoverImage("")
    setImagePreview("")
    setImageDimensions(null)
    setImageError("")
    // Reset file input
    const fileInput = document.getElementById("coverImage") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post || isSaving) return

    setIsSaving(true)

    try {
      // Extract hashtags from content
      const hashtagMatches = content.match(/#\w+/g) || []
      const contentHashtags = hashtagMatches.map((tag) => tag.substring(1))
      
      // Get manual hashtags from tagify
      const manualHashtags = formData.hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      
      const allHashtags = [...new Set([...contentHashtags, ...manualHashtags])]

      // Get tags from tagify
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      const updatedPost: BlogPost = {
        ...post,
        petId: formData.petId,
        title: formData.title,
        content: content,
        coverImage: coverImage || undefined,
        tags: tags,
        hashtags: allHashtags,
        privacy: formData.privacy,
        updatedAt: new Date().toISOString(),
      }

      updateBlogPost(updatedPost)
      router.push(`/blog/${post.id}`)
    } catch (error) {
      console.error("Error updating post:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Post not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href={`/blog/${post.id}`} label="Back to Post" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Blog Post</CardTitle>
              <CardDescription>Update your pet{"'"}s story</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="petId" required>
                  Select Pet
                </Label>
                <Select value={formData.petId} onValueChange={(value) => setFormData({ ...formData, petId: value })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a pet">
                      {(() => {
                        const selectedPet = myPets.find((p) => p.id === formData.petId)
                        return selectedPet ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarImage src={selectedPet.avatar || "/placeholder.svg"} alt={selectedPet.name} />
                              <AvatarFallback className="text-xs">{selectedPet.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedPet.name}</span>
                          </div>
                        ) : null
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {myPets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                            <AvatarFallback className="text-xs">{pet.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{pet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy" required>
                  Privacy
                </Label>
                <Select
                  value={formData.privacy}
                  onValueChange={(value: PrivacyLevel) => setFormData({ ...formData, privacy: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(() => {
                        const privacyIcons = {
                          public: Globe,
                          "followers-only": Users,
                          private: Lock,
                        }
                        const Icon = privacyIcons[formData.privacy] || Globe
                        const labels = {
                          public: "Public",
                          "followers-only": "Followers Only",
                          private: "Private",
                        }
                        return (
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{labels[formData.privacy]}</span>
                          </div>
                        )
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="followers-only">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Followers Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" required>
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Give your post a catchy title"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage" description={`Minimum dimensions: ${MIN_WIDTH}x${MIN_HEIGHT}px (16:9 aspect ratio)`}>
                Cover Image
              </Label>
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-input bg-muted">
                    <img src={imagePreview} alt="Cover preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                    {imageDimensions && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {imageDimensions.width} × {imageDimensions.height}px
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("coverImage")?.click()}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="coverImage"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="h-10 w-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Minimum: {MIN_WIDTH}×{MIN_HEIGHT}px (16:9 aspect ratio)
                        </p>
                      </div>
                      <input
                        id="coverImage"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              )}
              {imageError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
              {imageDimensions && !imageError && imageDimensions.width >= MIN_WIDTH && imageDimensions.height >= MIN_HEIGHT && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Image dimensions meet requirements ({imageDimensions.width}×{imageDimensions.height}px)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" required description="Write your story with rich text formatting">
                Content
              </Label>
              <div className="border border-input rounded-md overflow-hidden bg-background">
                <RichTextEditor
                  content={content}
                  output="html"
                  onChangeContent={setContent}
                  extensions={extensions}
                  minHeight="300px"
                  contentClass="min-h-[300px] p-4 prose prose-sm max-w-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" description="Add tags separated by commas">
                Tags
              </Label>
              <TagInput
                value={formData.tags}
                onChange={handleTagsChange}
                placeholder="adventure, training, funny"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags" description="Hashtags in your content (#tag) will be automatically detected">
                Hashtags
              </Label>
              <TagInput
                value={formData.hashtags}
                onChange={handleHashtagsChange}
                placeholder="dogs, puppylove, goldenretriever"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Link href={`/blog/${post.id}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isSaving || !formData.title.trim() || !content.trim()}>
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
