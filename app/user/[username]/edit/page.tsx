"use client"

import React, { useState, useEffect, use, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader } from "@/components/ui/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TagInput } from "@/components/ui/tag-input"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { AvatarEditor } from "@/components/ui/avatar-editor"
import { FormActions } from "@/components/ui/form-actions"
import { getUserByUsername, updateUser } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Save,
  X,
  User as UserIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  MapPin,
  Phone,
  Briefcase,
  Heart,
  ArrowLeft,
  Calendar,
  Mail,
  Languages,
  UserCheck,
  GraduationCap,
  Users,
  Baby,
  Heart as HeartIcon,
  Hash,
  Upload,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X as XIcon,
  Baby,
  GraduationCap,
  Award,
  Star,
  Trophy,
  Crown,
  Sparkles,
  HeartHandshake,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  Turtle,
  CircleDot,
  Ruler,
  Activity,
  Home,
  Scissors,
  Droplet,
  Shield,
  Target,
  TrendingUp,
  FileText,
  BookOpen,
  Info,
  ImageIcon,
} from "lucide-react"

export default function EditProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    avatar: "",
    location: "",
    website: "",
    phone: "",
    occupation: "",
    interests: [] as string[],
    favoriteAnimals: [] as string[],
    country: "",
    city: "",
    dateOfBirth: "",
    email: "",
    languages: [] as string[],
    petExperience: "",
    petCareStyle: "",
    gender: "",
    education: "",
    socialMedia: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
    maritalStatus: "",
    children: "",
    aboutMe: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animal options with icons and colors (matching wiki colors)
  const animalOptions = [
    { value: "dog", label: "Dogs", icon: Dog, color: "text-amber-500" },
    { value: "cat", label: "Cats", icon: Cat, color: "text-blue-500" },
    { value: "bird", label: "Birds", icon: Bird, color: "text-yellow-500" },
    { value: "rabbit", label: "Rabbits", icon: Rabbit, color: "text-pink-500" },
    { value: "hamster", label: "Hamsters", icon: CircleDot, color: "text-orange-500" },
    { value: "fish", label: "Fish", icon: Fish, color: "text-cyan-500" },
    { value: "turtle", label: "Turtles", icon: Turtle, color: "text-green-500" },
    { value: "snake", label: "Snakes", icon: CircleDot, color: "text-emerald-500" },
    { value: "lizard", label: "Lizards", icon: CircleDot, color: "text-lime-500" },
    { value: "guinea-pig", label: "Guinea Pigs", icon: Heart, color: "text-rose-500" },
    { value: "ferret", label: "Ferrets", icon: CircleDot, color: "text-indigo-500" },
    { value: "chinchilla", label: "Chinchillas", icon: CircleDot, color: "text-violet-500" },
    { value: "hedgehog", label: "Hedgehogs", icon: CircleDot, color: "text-purple-500" },
  ]

  // Minimum image dimensions for avatar
  const MIN_IMAGE_WIDTH = 200
  const MIN_IMAGE_HEIGHT = 200

  useEffect(() => {
    // Wait for auth to initialize before checking user
    if (!isInitialized) {
      return
    }

    // Only redirect if user is confirmed to be null AFTER initialization
    if (!user) {
      router.push("/")
      return
    }

    const fetchedUser = getUserByUsername(username)
    if (!fetchedUser) {
      router.push("/")
      return
    }

    // Check if user owns the profile
    if (fetchedUser.id !== user.id) {
      router.push(`/user/${username}`)
      return
    }

    setProfileUser(fetchedUser)
    const locationParts = (fetchedUser.location || "").split(", ")
    const country = locationParts.length > 1 ? locationParts[1] : ""
    const city = locationParts.length > 0 ? locationParts[0] : ""
    
    setFormData({
      fullName: fetchedUser.fullName || "",
      bio: fetchedUser.bio || "",
      avatar: fetchedUser.avatar || "",
      location: fetchedUser.location || "",
      website: fetchedUser.website || "",
      phone: fetchedUser.phone || "",
      occupation: fetchedUser.occupation || "",
      interests: fetchedUser.interests || [],
      favoriteAnimals: fetchedUser.favoriteAnimals || [],
      country: country || "",
      city: city || "",
      dateOfBirth: "",
      email: fetchedUser.email || "",
      languages: [],
      petExperience: "",
      petCareStyle: "",
      gender: fetchedUser.gender || "",
      education: fetchedUser.education || "",
      socialMedia: fetchedUser.socialMedia || { instagram: "", facebook: "", twitter: "" },
      maritalStatus: fetchedUser.maritalStatus || "",
      children: fetchedUser.children || "",
      aboutMe: fetchedUser.aboutMe || "",
    })
    setImagePreview(fetchedUser.avatar || "")
    setIsLoading(false)
  }, [username, user, isInitialized, router])

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Please select an image file" }))
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ 
        ...prev, 
        avatar: `File size must be less than 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      // Check image dimensions
      const img = new window.Image()
      img.onload = () => {
        const width = img.naturalWidth
        const height = img.naturalHeight

        // Validate minimum dimensions
        if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
          setErrors((prev) => ({ 
            ...prev, 
            avatar: `Image dimensions are too small. Minimum required: ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px. Current: ${width}x${height}px` 
          }))
          return
        }

        // Clear errors and open editor
        setErrors((prev) => ({ ...prev, avatar: "" }))
        setTempImageSrc(dataUrl)
        setIsEditorOpen(true)
      }
      img.onerror = () => {
        setErrors((prev) => ({ ...prev, avatar: "Failed to load image. Please try another file." }))
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      setErrors((prev) => ({ ...prev, avatar: "Failed to read file. Please try again." }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveCroppedImage = (croppedImage: string) => {
    setImagePreview(croppedImage)
    setFormData((prev) => ({ ...prev, avatar: croppedImage }))
    setIsEditingImage(true)
    setIsEditorOpen(false)
    setTempImageSrc("")
  }

  const handleRotateImage = () => {
    if (!imagePreview) return

    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Rotate 90 degrees clockwise
      canvas.width = img.height
      canvas.height = img.width
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((90 * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      const rotatedDataUrl = canvas.toDataURL("image/png")
      setImagePreview(rotatedDataUrl)
      setFormData((prev) => ({ ...prev, avatar: rotatedDataUrl }))
    }
    img.src = imagePreview
  }

  const handleResizeImage = (scale: number) => {
    if (!imagePreview) return

    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const newWidth = img.width * scale
      const newHeight = img.height * scale

      canvas.width = newWidth
      canvas.height = newHeight
      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      const resizedDataUrl = canvas.toDataURL("image/png", 0.9)
      setImagePreview(resizedDataUrl)
      setFormData((prev) => ({ ...prev, avatar: resizedDataUrl }))
    }
    img.src = imagePreview
  }

  const handleRemoveImage = () => {
    setImagePreview("")
    setFormData((prev) => ({ ...prev, avatar: "" }))
    setIsEditingImage(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSaveImage = () => {
    if (imagePreview) {
      setFormData((prev) => ({ ...prev, avatar: imagePreview }))
      setIsEditingImage(false)
    }
  }

  const handleCancelImageEdit = () => {
    setImagePreview(formData.avatar || "")
    setIsEditingImage(false)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required"
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required"
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = "Please enter a valid URL (e.g., https://example.com)"
    }

    if (formData.avatar && !isValidUrl(formData.avatar)) {
      newErrors.avatar = "Please enter a valid image URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!validate()) {
      setMessage({ type: "error", text: "Please fix the errors in the form" })
      return
    }

    if (!profileUser || !user) return

    setIsSubmitting(true)

    try {
      updateUser(profileUser.id, {
        fullName: formData.fullName,
        bio: formData.bio,
        avatar: formData.avatar,
        location: formData.city && formData.country ? `${formData.city}, ${formData.country}` : formData.location,
        website: formData.website,
        phone: formData.phone,
        occupation: formData.occupation,
        interests: formData.interests,
        favoriteAnimals: formData.favoriteAnimals || [],
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        education: formData.education,
        socialMedia: formData.socialMedia,
        maritalStatus: formData.maritalStatus,
        children: formData.children,
        aboutMe: formData.aboutMe,
        languages: formData.languages,
      })

      setMessage({ type: "success", text: "Profile updated successfully!" })

      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push(`/user/${username}`)
      }, 1500)
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  // Baltic countries and cities
  const countries = [
    { value: "Lithuania", label: "Lithuania" },
    { value: "Latvia", label: "Latvia" },
    { value: "Estonia", label: "Estonia" },
  ]

  const citiesByCountry: Record<string, string[]> = {
    Lithuania: [
      "Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai",
      "Jonava", "Utena", "Kėdainiai", "Telšiai", "Visaginas", "Tauragė", "Ukmergė", "Plungė",
      "Šilutė", "Kretinga", "Radviliškis", "Druskininkai", "Gargždai", "Rokiškis", "Biržai", "Elektrėnai",
      "Kuršėnai", "Garliava", "Jurbarkas", "Raseiniai", "Anykščiai", "Lentvaris", "Grigiškės", "Prienai",
      "Joniškis", "Kelmė", "Varėna", "Kaišiadorys", "Pasvalys", "Kupiškis", "Zarasai", "Skuodas",
      "Kazlų Rūda", "Širvintos", "Molėtai", "Šalčininkai", "Šakiai", "Ignalina", "Pabradė", "Švenčionys",
      "Vievis", "Lazdijai", "Kalvarija", "Rietavas", "Žiežmariai", "Ežerėlis", "Ariogala", "Vilkaviškis",
      "Viekšniai", "Nemenčinė", "Leliūnai", "Eišiškės", "Leipalingis", "Gelgaudiškis", "Kudirkos Naumiestis",
      "Simnas", "Salantai", "Linkuva", "Veisiejai", "Žagarė", "Eržvilkas", "Tytuvėnai", "Rūdiškės",
      "Dūkštas", "Pandėlys", "Dusetos", "Užventis", "Seda", "Vabalninkas", "Balbieriškis", "Kybartai",
      "Pilviškiai", "Priekulė", "Veiviržėnai", "Neringa", "Pagėgiai", "Ramygala", "Varniai", "Kvėdarna",
    ],
    Latvia: [
      "Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala", "Ventspils", "Rēzekne", "Valmiera",
      "Ogre", "Cēsis", "Salaspils", "Kuldīga", "Olaine", "Saldus", "Tukums", "Dobele",
      "Jēkabpils", "Aizkraukle", "Bauska", "Siglunda", "Krustpils", "Līvāni", "Gulbene", "Madona",
      "Ludza", "Alūksne", "Krāslava", "Rēzekne", "Balvi", "Aizpute", "Kandava", "Limbaži",
      "Līgatne", "Lielvārde", "Preiļi", "Stende", "Auce", "Ikšķile", "Ilūkste", "Jaunjelgava",
      "Koknese", "Līvāni", "Mārupe", "Nīca", "Pāvilosta", "Pļaviņas", "Priekule", "Rūjiena",
      "Saulkrasti", "Skrunda", "Smiltene", "Staicele", "Stende", "Talsi", "Vecpiebalga", "Viļaka",
      "Viļāni", "Zilupe", "Ādaži", "Engure", "Inčukalns", "Krimulda", "Ķegums", "Mālpils",
    ],
    Estonia: [
      "Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Rakvere", "Maardu",
      "Kuressaare", "Sillamäe", "Võru", "Valga", "Jõhvi", "Haapsalu", "Keila", "Paide",
      "Elva", "Saue", "Tapa", "Põlva", "Kiviõli", "Jõgeva", "Rapla", "Sindi",
      "Paldiski", "Kärdla", "Loksa", "Türi", "Kehra", "Narva-Jõesuu", "Põltsamaa", "Kunda",
      "Püssi", "Mustvee", "Võhma", "Antsla", "Otepää", "Põlva", "Kallaste", "Abja-Paluoja",
      "Kanepi", "Karksi-Nuia", "Mõisaküla", "Räpina", "Suure-Jaani", "Võnnu", "Väike-Maarja",
      "Aegviidu", "Audru", "Karksi-Nuia", "Kohtla-Nõmme", "Laekvere", "Leisi", "Märjamaa",
    ],
  }

  const [availableCities, setAvailableCities] = useState<string[]>([])

  useEffect(() => {
    if (formData.country && citiesByCountry[formData.country]) {
      const cities = citiesByCountry[formData.country]
      setAvailableCities(cities)
      // Reset city if current city is not in the new country's cities
      if (formData.city && !cities.includes(formData.city)) {
        setFormData((prev) => ({ ...prev, city: "" }))
      }
    } else {
      setAvailableCities([])
    }
  }, [formData.country, formData.city])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <LoadingSpinner fullScreen />
        </div>
      </div>
    )
  }

  if (!profileUser || !user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Profile not found or you don't have permission to edit.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <PageHeader
            title="Edit Profile"
            description="Update your profile information and preferences"
          />

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Message */}
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Profile Picture & Basic Information - Combined (Full Width) */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserIcon className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>Your profile picture and personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center gap-6 pb-6 border-b">
                <div className="relative">
                  <Avatar className="h-40 w-40 border-4 border-primary/20 shadow-xl ring-4 ring-background">
                    <AvatarImage src={imagePreview || formData.avatar || "/placeholder.svg"} alt={formData.fullName || "User"} />
                    <AvatarFallback className="text-5xl bg-primary/10 text-primary">
                      {(formData.fullName || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {imagePreview && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 rounded-full h-8 w-8 shadow-lg"
                      onClick={handleRemoveImage}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="w-full max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar-upload" className="text-base font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Profile Picture
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setTempImageSrc(imagePreview)
                            setIsEditorOpen(true)
                          }}
                          className="flex-1"
                        >
                          <ZoomIn className="h-4 w-4 mr-2" />
                          Edit & Crop
                        </Button>
                      )}
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      JPG, PNG or GIF (max 5MB, min {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT}px)
                    </p>
                  </div>

                  {/* Avatar Editor Dialog */}
                  {tempImageSrc && (
                    <AvatarEditor
                      imageSrc={tempImageSrc}
                      isOpen={isEditorOpen}
                      onClose={() => {
                        setIsEditorOpen(false)
                        setTempImageSrc("")
                      }}
                      onSave={handleSaveCroppedImage}
                      minWidth={MIN_IMAGE_WIDTH}
                      minHeight={MIN_IMAGE_HEIGHT}
                    />
                  )}

                  {imagePreview && isEditingImage && (
                    <Card className="border-2 border-primary bg-primary/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Image Editor</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelImageEdit}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleResizeImage(1.1)}
                          >
                            <ZoomIn className="h-4 w-4 mr-1" />
                            Zoom In
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleResizeImage(0.9)}
                          >
                            <ZoomOut className="h-4 w-4 mr-1" />
                            Zoom Out
                          </Button>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveImage}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Apply Changes
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation" className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Occupation
                  </Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Your profession"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Bio
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Share a bit about yourself and your pets</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself and your pets..."
                  rows={5}
                  className="resize-none"
                />
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Details Card */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserIcon className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Additional information about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education" className="text-sm font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </Label>
                  <Select
                    value={formData.education}
                    onValueChange={(value) => setFormData({ ...formData, education: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high-school">High School</SelectItem>
                      <SelectItem value="some-college">Some College</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus" className="text-sm font-medium flex items-center gap-2">
                    <HeartIcon className="h-4 w-4" />
                    Marital Status
                  </Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="in-relationship">In a Relationship</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="children" className="text-sm font-medium flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    Children
                  </Label>
                  <Select
                    value={formData.children}
                    onValueChange={(value) => setFormData({ ...formData, children: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select children status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Children</SelectItem>
                      <SelectItem value="one">One Child</SelectItem>
                      <SelectItem value="two">Two Children</SelectItem>
                      <SelectItem value="three">Three Children</SelectItem>
                      <SelectItem value="four-plus">Four or More</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutMe" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  About Me
                </Label>
                <Textarea
                  id="aboutMe"
                  value={formData.aboutMe}
                  onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
                  placeholder="Tell us more about yourself, your hobbies, lifestyle, and what makes you unique..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Share additional details about yourself</p>
              </div>
            </CardContent>
          </Card>

          {/* Social Media Card */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Globe className="h-5 w-5 text-primary" />
                Social Media
              </CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-pink-500" />
                    Instagram
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="instagram"
                      type="text"
                      value={formData.socialMedia.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                        })
                      }
                      placeholder="username"
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    type="text"
                    value={formData.socialMedia.facebook}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: { ...formData.socialMedia, facebook: e.target.value },
                      })
                    }
                    placeholder="Your Facebook profile"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-sm font-medium flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-blue-400" />
                    Twitter / X
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="twitter"
                      type="text"
                      value={formData.socialMedia.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, twitter: e.target.value },
                        })
                      }
                      placeholder="username"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid Layout for Cards - 2 columns on desktop/tablet, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact & Location Card */}
            <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Location & Contact
              </CardTitle>
              <CardDescription>Where you're located and how to reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location Block - Country and City Combined */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location <span className="text-destructive">*</span>
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value, city: "" })}
                    >
                      <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                        <SelectValue placeholder="Country not selected" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                    {!formData.country && (
                      <p className="text-xs text-muted-foreground">Please select a country first</p>
                    )}
                  </div>

                  {formData.country && (
                    <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <CityAutocomplete
                        cities={availableCities}
                        value={formData.city}
                        onValueChange={(value) => setFormData({ ...formData, city: value })}
                        placeholder="Select city"
                        disabled={false}
                        error={!!errors.city}
                      />
                      {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                      {!formData.city && (
                        <p className="text-xs text-muted-foreground">City not selected</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+370 600 00000"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className={`pl-9 ${errors.website ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.website && <p className="text-sm text-destructive">{errors.website}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pet Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Heart className="h-5 w-5 text-primary" />
                Pet Information
              </CardTitle>
              <CardDescription>Your preferences and experience with pets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Favorite Animals
                </Label>
                
                {/* Selected Animals Display */}
                {formData.favoriteAnimals.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md border">
                    {formData.favoriteAnimals.map((animal) => {
                      const animalConfig = animalOptions.find((opt) => opt.value === animal)
                      if (!animalConfig) return null
                      const Icon = animalConfig.icon
                      return (
                        <Badge
                          key={animal}
                          variant="secondary"
                          className="px-3 py-1.5 flex items-center gap-2 text-sm"
                        >
                          <Icon className={cn("h-4 w-4", animalConfig.color)} />
                          <span>{animalConfig.label}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                favoriteAnimals: formData.favoriteAnimals.filter((a) => a !== animal),
                              })
                            }}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Animal Options with Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 bg-background border rounded-md">
                  {animalOptions.map((animal) => {
                    const Icon = animal.icon
                    const isSelected = formData.favoriteAnimals.includes(animal.value)
                    return (
                      <label
                        key={animal.value}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                favoriteAnimals: [...formData.favoriteAnimals, animal.value],
                              })
                            } else {
                              setFormData({
                                ...formData,
                                favoriteAnimals: formData.favoriteAnimals.filter((a) => a !== animal.value),
                              })
                            }
                          }}
                        />
                        <Icon className={cn("h-4 w-4", animal.color)} />
                        <span className="text-sm">{animal.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <Label htmlFor="petExperience" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Pet Experience
                  </Label>
                  <Select
                    value={formData.petExperience}
                    onValueChange={(value) => setFormData({ ...formData, petExperience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <Baby className="h-4 w-4" />
                          <span>No Experience</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="beginner">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Beginner (0-1 years)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="novice">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>Novice (1-2 years)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          <span>Intermediate (2-5 years)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <span>Advanced (5-10 years)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expert">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          <span>Expert (10-15 years)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="master">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          <span>Master (15+ years)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="professional">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="h-4 w-4" />
                          <span>Professional</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Additional Information Card (Full Width) */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Languages className="h-5 w-5 text-primary" />
                Additional Information
              </CardTitle>
              <CardDescription>Languages you speak and interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="languages" className="text-sm font-medium flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Languages
                </Label>
                <TagInput
                  value={formData.languages.join(", ")}
                  onChange={(value) => {
                    const languagesArray = value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag)
                    setFormData({ ...formData, languages: languagesArray })
                  }}
                  placeholder="English, Lithuanian, Russian..."
                />
                <p className="text-xs text-muted-foreground">Separate multiple languages with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests" className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Interests
                </Label>
                <TagInput
                  value={formData.interests.join(", ")}
                  onChange={(value) => {
                    const interestsArray = value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag)
                    setFormData({ ...formData, interests: interestsArray })
                  }}
                  placeholder="Hiking, Photography, Dog Training..."
                />
                <p className="text-xs text-muted-foreground">Separate multiple interests with commas</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <FormActions
            onCancel={() => router.push(`/user/${username}`)}
            isSubmitting={isSubmitting}
            className="pt-6"
          />
        </form>
      </div>
    </div>
    </TooltipProvider>
  )
}
