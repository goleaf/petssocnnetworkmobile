"use client"

import React, { useState, useEffect, use, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CardHeaderWithIcon } from "@/components/ui/card-header-with-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormLabel } from "@/components/ui/form-label"
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
import { TooltipProvider } from "@/components/ui/tooltip"
import { getUserByUsername, updateUser } from "@/lib/storage"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { User } from "@/lib/types"
import { cn } from "@/lib/utils"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { library } from "@fortawesome/fontawesome-svg-core"
import { getAnimalOptionsFA, ANIMAL_TYPES } from "@/lib/animal-types"

// Register all FontAwesome icons from animal types
library.add(...ANIMAL_TYPES.map((animal) => animal.faIcon))
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
  School,
  Quote,
  Film,
  Music,
  Book,
  Gamepad2,
  Dumbbell,
  Camera,
  Plane,
  Coffee,
  Utensils,
  Building,
  Moon,
  Sun,
  Clock as ClockIcon,
  Globe2,
  Smile,
  UtensilsCrossed,
  Youtube,
  Instagram as InstagramIcon,
  Twitter,
  Link as LinkIcon,
  Church,
  Scale,
  ShieldCheck,
  MapPin as MapPinIcon,
  Baby as BabyIcon,
  Zap,
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
      youtube: "",
      linkedin: "",
      tiktok: "",
    },
    maritalStatus: "",
    children: "",
    aboutMe: "",
    housingType: "",
    workSchedule: "",
    lookingFor: "",
    favoriteQuotes: "",
    favoriteBooks: "",
    favoriteMovies: "",
    favoriteMusic: "",
    hobbies: [] as string[],
    sports: [] as string[],
    favoriteActivities: [] as string[],
    trainingStyle: "",
    willingToAdopt: "",
    breedPreferences: "",
    activityLevelPreference: "",
    energyLevelPreference: "",
    groomingNeedsPreference: "",
    exerciseNeedsPreference: "",
    agePreference: "",
    healthStatusPreference: "",
    specialNeedsAcceptance: "",
    religion: "",
    politicalViews: "",
    workPlace: "",
    educationDetails: "",
    familyMembers: "",
    currentPets: [] as string[],
    preferredPetSize: "",
    temperamentPreference: "",
    livingSpacePreference: "",
    playStylePreference: "",
    feedingSchedulePreference: "",
    socializationPreference: "",
    lifestyle: "",
    travelFrequency: "",
    homeEnvironment: "",
    yardAccess: "",
    livingSpace: "",
    timeAtHome: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animal options with FontAwesome icons and colors (from shared config)
  const animalOptions = getAnimalOptionsFA()

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
      dateOfBirth: fetchedUser.dateOfBirth || "",
      email: fetchedUser.email || "",
      languages: fetchedUser.languages || [],
      petExperience: fetchedUser.petExperience || "",
      petCareStyle: fetchedUser.petCareStyle || "",
      willingToAdopt: fetchedUser.willingToAdopt || "",
      preferredPetSize: fetchedUser.preferredPetSize || "",
      trainingStyle: fetchedUser.trainingStyle || "",
      breedPreferences: fetchedUser.breedPreferences || "",
      activityLevelPreference: fetchedUser.activityLevelPreference || "",
      energyLevelPreference: fetchedUser.energyLevelPreference || "",
      groomingNeedsPreference: fetchedUser.groomingNeedsPreference || "",
      exerciseNeedsPreference: fetchedUser.exerciseNeedsPreference || "",
      agePreference: fetchedUser.agePreference || "",
      healthStatusPreference: fetchedUser.healthStatusPreference || "",
      specialNeedsAcceptance: fetchedUser.specialNeedsAcceptance || "",
      temperamentPreference: (fetchedUser as any).temperamentPreference || "",
      livingSpacePreference: (fetchedUser as any).livingSpacePreference || "",
      playStylePreference: (fetchedUser as any).playStylePreference || "",
      feedingSchedulePreference: (fetchedUser as any).feedingSchedulePreference || "",
      socializationPreference: (fetchedUser as any).socializationPreference || "",
      housingType: "",
      workSchedule: "",
      lookingFor: "",
      favoriteQuotes: "",
      favoriteBooks: "",
      favoriteMovies: "",
      favoriteMusic: "",
      hobbies: [],
      sports: [],
      favoriteActivities: [],
      gender: fetchedUser.gender || "",
      education: fetchedUser.education || "",
      socialMedia: {
        instagram: fetchedUser.socialMedia?.instagram || "",
        facebook: fetchedUser.socialMedia?.facebook || "",
        twitter: fetchedUser.socialMedia?.twitter || "",
        youtube: fetchedUser.socialMedia?.youtube || "",
        linkedin: fetchedUser.socialMedia?.linkedin || "",
        tiktok: fetchedUser.socialMedia?.tiktok || "",
      },
      maritalStatus: fetchedUser.maritalStatus || "",
      children: fetchedUser.children || "",
      aboutMe: fetchedUser.aboutMe || "",
      religion: "",
      politicalViews: "",
      workPlace: "",
      educationDetails: "",
      familyMembers: "",
      currentPets: [],
      lifestyle: "",
      travelFrequency: "",
      homeEnvironment: "",
      yardAccess: "",
      livingSpace: "",
      timeAtHome: "",
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

    // Validate form before submission
    const isValid = validate()
    if (!isValid) {
      const errorMessages = Object.values(errors).filter(Boolean)
      if (errorMessages.length > 0) {
        setMessage({
          type: "error",
          text: `Please fix the following errors: ${errorMessages.join(", ")}`
        })
      } else {
        setMessage({ type: "error", text: "Please fix the errors in the form" })
      }
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = Object.keys(errors).find(key => errors[key])
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField) || document.querySelector(`[name="${firstErrorField}"]`)
          element?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
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
        petExperience: formData.petExperience,
        petCareStyle: formData.petCareStyle,
        willingToAdopt: formData.willingToAdopt,
        preferredPetSize: formData.preferredPetSize,
        trainingStyle: formData.trainingStyle,
        breedPreferences: formData.breedPreferences,
        activityLevelPreference: formData.activityLevelPreference,
        energyLevelPreference: formData.energyLevelPreference,
        groomingNeedsPreference: formData.groomingNeedsPreference,
        exerciseNeedsPreference: formData.exerciseNeedsPreference,
        agePreference: formData.agePreference,
        healthStatusPreference: formData.healthStatusPreference,
        specialNeedsAcceptance: formData.specialNeedsAcceptance,
        temperamentPreference: formData.temperamentPreference,
        livingSpacePreference: formData.livingSpacePreference,
        playStylePreference: formData.playStylePreference,
        feedingSchedulePreference: formData.feedingSchedulePreference,
        socializationPreference: formData.socializationPreference,
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
              <CardHeaderWithIcon
                title="Basic Information"
                description="Your profile picture and personal details"
                icon={UserIcon}
              />
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Profile Picture Section - Left Side */}
                  <div className="flex flex-col items-center lg:items-start gap-6 lg:w-1/3">
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

                    <div className="w-full space-y-4">
                      <div className="space-y-2">
                        <FormLabel htmlFor="avatar-upload" icon={ImageIcon} className="text-base font-medium">
                          Profile Picture
                        </FormLabel>
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
                        <p className="text-xs text-muted-foreground text-center lg:text-left">
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

                  {/* Personal Details Section - Right Side */}
                  <div className="flex-1 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <FormLabel htmlFor="fullName" icon={UserIcon} required>
                          Full Name
                        </FormLabel>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => {
                            setFormData({ ...formData, fullName: e.target.value })
                            if (errors.fullName) {
                              setErrors((prev) => ({ ...prev, fullName: "" }))
                            }
                          }}
                          placeholder="Enter your full name"
                          required
                          className={cn(errors.fullName && "border-destructive")}
                        />
                        {errors.fullName && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <XIcon className="h-3 w-3" />
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <FormLabel htmlFor="occupation" icon={Briefcase}>
                          Occupation
                        </FormLabel>
                        <Input
                          id="occupation"
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          placeholder="Your profession"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <FormLabel
                        htmlFor="bio"
                        icon={FileText}
                        tooltip="Share a bit about yourself and your pets"
                      >
                        Bio
                      </FormLabel>
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
                </div>
              </CardContent>
            </Card>

            {/* Personal Details Card */}
            <Card className="mb-6">
              <CardHeaderWithIcon
                title="Personal Details"
                description="Additional information about yourself"
                icon={UserIcon}
              />
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormLabel htmlFor="dateOfBirth" icon={Calendar}>
                      Date of Birth
                    </FormLabel>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="gender" icon={UserIcon}>
                      Gender
                    </FormLabel>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formData.gender === "male" ? "Male" :
                                formData.gender === "female" ? "Female" :
                                  formData.gender === "other" ? "Other" :
                                    formData.gender === "prefer-not-to-say" ? "Prefer not to say" :
                                      "Select gender"}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Male</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="female">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Female</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Other</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Prefer not to say</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="education" icon={GraduationCap}>
                      Education
                    </FormLabel>
                    <Select
                      value={formData.education}
                      onValueChange={(value) => setFormData({ ...formData, education: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formData.education === "high-school" ? "High School" :
                                formData.education === "some-college" ? "Some College" :
                                  formData.education === "bachelors" ? "Bachelor's Degree" :
                                    formData.education === "masters" ? "Master's Degree" :
                                      formData.education === "phd" ? "PhD" :
                                        formData.education === "vocational" ? "Vocational" :
                                          formData.education === "other" ? "Other" :
                                            "Select education level"}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>High School</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="some-college">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Some College</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bachelors">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Bachelor's Degree</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="masters">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Master's Degree</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="phd">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>PhD</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="vocational">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Vocational</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Other</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="maritalStatus" icon={HeartIcon}>
                      Marital Status
                    </FormLabel>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formData.maritalStatus === "single" ? "Single" :
                                formData.maritalStatus === "married" ? "Married" :
                                  formData.maritalStatus === "divorced" ? "Divorced" :
                                    formData.maritalStatus === "widowed" ? "Widowed" :
                                      formData.maritalStatus === "in-relationship" ? "In a Relationship" :
                                        formData.maritalStatus === "prefer-not-to-say" ? "Prefer not to say" :
                                          "Select marital status"}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4" />
                            <span>Single</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="married">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4" />
                            <span>Married</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="divorced">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4" />
                            <span>Divorced</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="widowed">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4" />
                            <span>Widowed</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="in-relationship">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4" />
                            <span>In a Relationship</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          <div className="flex items-center gap-2">
                            <HeartIcon className="h-4 w-4" />
                            <span>Prefer not to say</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <FormLabel htmlFor="children" icon={Baby}>
                      Children
                    </FormLabel>
                    <Select
                      value={formData.children}
                      onValueChange={(value) => setFormData({ ...formData, children: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select children status">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formData.children === "none" ? "No Children" :
                                formData.children === "one" ? "One Child" :
                                  formData.children === "two" ? "Two Children" :
                                    formData.children === "three" ? "Three Children" :
                                      formData.children === "four-plus" ? "Four or More" :
                                        formData.children === "prefer-not-to-say" ? "Prefer not to say" :
                                          "Select children status"}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span>No Children</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="one">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span>One Child</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="two">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span>Two Children</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="three">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span>Three Children</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="four-plus">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span>Four or More</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4" />
                            <span>Prefer not to say</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel htmlFor="aboutMe" icon={FileText}>
                    About Me
                  </FormLabel>
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
              <CardHeaderWithIcon
                title="Social Media"
                description="Connect your social media profiles"
                icon={Globe}
              />
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <FormLabel htmlFor="instagram" icon={Hash} iconClassName="text-pink-500">
                      Instagram
                    </FormLabel>
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
                    <FormLabel htmlFor="facebook" icon={Users} iconClassName="text-blue-500">
                      Facebook
                    </FormLabel>
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
                    <FormLabel htmlFor="twitter" icon={Hash} iconClassName="text-blue-400">
                      Twitter / X
                    </FormLabel>
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
              {/* Personal Life & Lifestyle Card */}
              <Card>
                <CardHeaderWithIcon
                  title="Personal Life & Lifestyle"
                  description="Tell us about your personal life and lifestyle preferences"
                  icon={Users}
                />
                <CardContent className="space-y-6">
                  {/* Location Block - Country and City Combined */}
                  <div className="space-y-3">
                    <FormLabel icon={MapPin} required>
                      Location
                    </FormLabel>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel>Country</FormLabel>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => {
                            setFormData({ ...formData, country: value, city: "" })
                            setErrors((prev) => ({ ...prev, country: "", city: "" }))
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              errors.country && "border-destructive",
                              "w-full"
                            )}
                          >
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.country && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <XIcon className="h-3 w-3" />
                            {errors.country}
                          </p>
                        )}
                      </div>

                      {formData.country ? (
                        <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                          <FormLabel>City</FormLabel>
                          <CityAutocomplete
                            cities={availableCities}
                            value={formData.city}
                            onValueChange={(value) => {
                              setFormData({ ...formData, city: value })
                              setErrors((prev) => ({ ...prev, city: "" }))
                            }}
                            placeholder="Select city"
                            disabled={!formData.country}
                            error={!!errors.city}
                          />
                          {errors.city && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                              <XIcon className="h-3 w-3" />
                              {errors.city}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-lg p-6 bg-muted/30">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span>Please select a country to continue</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <FormLabel htmlFor="email" icon={Mail}>
                        Email
                      </FormLabel>
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
                      <FormLabel htmlFor="phone" icon={Phone}>
                        Phone
                      </FormLabel>
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
                      <FormLabel htmlFor="website" icon={Globe}>
                        Website
                      </FormLabel>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => {
                            setFormData({ ...formData, website: e.target.value })
                            if (errors.website) {
                              setErrors((prev) => ({ ...prev, website: "" }))
                            }
                          }}
                          placeholder="https://yourwebsite.com"
                          className={cn("pl-9", errors.website && "border-destructive")}
                        />
                      </div>
                      {errors.website && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XIcon className="h-3 w-3" />
                          {errors.website}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Personal Life & Lifestyle Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <FormLabel htmlFor="housingType" icon={Home}>
                        Housing Type
                      </FormLabel>
                      <Select
                        value={formData.housingType}
                        onValueChange={(value) => setFormData({ ...formData, housingType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select housing type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>Apartment</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="house">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>House</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="condo">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>Condo</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="townhouse">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Townhouse</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="farm">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Farm</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="workSchedule" icon={ClockIcon}>
                        Work Schedule
                      </FormLabel>
                      <Select
                        value={formData.workSchedule}
                        onValueChange={(value) => setFormData({ ...formData, workSchedule: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select work schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              <span>Full-time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="part-time">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              <span>Part-time</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="flexible">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" />
                              <span>Flexible</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="unemployed">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Unemployed</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="retired">
                            <div className="flex items-center gap-2">
                              <Coffee className="h-4 w-4" />
                              <span>Retired</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="timeAtHome" icon={ClockIcon}>
                        Time at Home
                      </FormLabel>
                      <Select
                        value={formData.timeAtHome}
                        onValueChange={(value) => setFormData({ ...formData, timeAtHome: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How much time at home?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Always at Home</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="most-day">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              <span>Most of the Day</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="half-day">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" />
                              <span>Half Day</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="evenings">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              <span>Evenings Only</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="weekends">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Weekends Only</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="travelFrequency" icon={Plane}>
                        Travel Frequency
                      </FormLabel>
                      <Select
                        value={formData.travelFrequency}
                        onValueChange={(value) => setFormData({ ...formData, travelFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How often do you travel?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Never</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rarely">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4" />
                              <span>Rarely</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4" />
                              <span>Monthly</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="weekly">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4" />
                              <span>Weekly</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="frequently">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4" />
                              <span>Frequently</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="yardAccess" icon={Home}>
                        Yard Access
                      </FormLabel>
                      <Select
                        value={formData.yardAccess}
                        onValueChange={(value) => setFormData({ ...formData, yardAccess: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Do you have yard access?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="large-yard">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Large Yard</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="small-yard">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Small Yard</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="balcony">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>Balcony Only</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>No Yard Access</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="livingSpace" icon={Home}>
                        Living Space
                      </FormLabel>
                      <Select
                        value={formData.livingSpace}
                        onValueChange={(value) => setFormData({ ...formData, livingSpace: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Size of living space" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="studio">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>Studio</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="small">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Small (1-2 rooms)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Medium (3-4 rooms)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="large">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4" />
                              <span>Large (5+ rooms)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pet Information Card */}
              <Card>
                <CardHeaderWithIcon
                  title="Pet Information"
                  description="Your preferences and experience with pets"
                  icon={Heart}
                />
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormLabel icon={Heart}>
                      Favorite Animals
                    </FormLabel>

                    {/* Selected Animals Display */}
                    {formData.favoriteAnimals.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border-2 border-dashed">
                        {formData.favoriteAnimals.map((animal) => {
                          const animalConfig = animalOptions.find((opt) => opt.value === animal)
                          if (!animalConfig) return null
                          return (
                            <Badge
                              key={animal}
                              variant="secondary"
                              className="px-3 py-2 flex items-center gap-2.5 text-sm font-medium shadow-sm"
                            >
                              <div className={cn("p-1.5 rounded-md", animalConfig.bgColor)}>
                                <FontAwesomeIcon
                                  icon={animalConfig.icon}
                                  className={cn("h-4 w-4", animalConfig.color)}
                                />
                              </div>
                              <span>{animalConfig.label}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    favoriteAnimals: formData.favoriteAnimals.filter((a) => a !== animal),
                                  })
                                }}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                              >
                                <XIcon className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}

                    {/* Animal Options with Checkboxes */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {animalOptions.map((animal) => {
                        const isSelected = formData.favoriteAnimals.includes(animal.value)
                        return (
                          <label
                            key={animal.value}
                            className={cn(
                              "relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                              "hover:border-primary hover:shadow-md hover:scale-[1.02]",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                : "border-border bg-card hover:bg-accent/50"
                            )}
                          >
                            <div className="absolute top-2 right-2">
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
                            </div>
                            <div className={cn("p-4 rounded-xl transition-transform", animal.bgColor, isSelected && "scale-110")}>
                              <FontAwesomeIcon
                                icon={animal.icon}
                                className={cn("h-8 w-8", animal.color)}
                              />
                            </div>
                            <span className={cn("text-sm font-medium text-center", isSelected ? "text-primary" : "text-foreground")}>
                              {animal.label}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">

                    <div className="space-y-2">
                      <FormLabel htmlFor="petExperience" icon={UserCheck}>
                        Pet Experience
                      </FormLabel>
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
              <CardHeaderWithIcon
                title="Additional Information"
                description="Languages you speak and interests"
                icon={Languages}
              />
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <FormLabel htmlFor="languages" icon={Languages}>
                    Languages
                  </FormLabel>
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
                </div>

                <div className="space-y-2">
                  <FormLabel htmlFor="interests" icon={Heart}>
                    Interests
                  </FormLabel>
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
                </div>
              </CardContent>
            </Card>

            {/* Social Media & Links Card */}
            <Card className="mb-6">
              <CardHeaderWithIcon
                title="Social Media & Links"
                description="Connect your social media profiles"
                icon={Globe2}
              />
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormLabel htmlFor="instagram" icon={InstagramIcon}>
                      Instagram
                    </FormLabel>
                    <div className="relative">
                      <InstagramIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        type="text"
                        value={formData.socialMedia.instagram}
                        onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, instagram: e.target.value } })}
                        placeholder="@username"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="twitter" icon={Twitter}>
                      Twitter/X
                    </FormLabel>
                    <div className="relative">
                      <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="twitter"
                        type="text"
                        value={formData.socialMedia.twitter}
                        onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, twitter: e.target.value } })}
                        placeholder="@username"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="youtube" icon={Youtube}>
                      YouTube
                    </FormLabel>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="youtube"
                        type="text"
                        value={formData.socialMedia.youtube}
                        onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, youtube: e.target.value } })}
                        placeholder="Channel name or URL"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="facebook" icon={LinkIcon}>
                      Facebook
                    </FormLabel>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facebook"
                        type="text"
                        value={formData.socialMedia.facebook}
                        onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, facebook: e.target.value } })}
                        placeholder="Profile URL"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Favorites & Entertainment Card */}
            <Card className="mb-6">
              <CardHeaderWithIcon
                title="Favorites & Entertainment"
                description="Share your favorite things"
                icon={Star}
              />
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <FormLabel htmlFor="favoriteBooks" icon={Book}>
                      Favorite Books
                    </FormLabel>
                    <Textarea
                      id="favoriteBooks"
                      value={formData.favoriteBooks}
                      onChange={(e) => setFormData({ ...formData, favoriteBooks: e.target.value })}
                      placeholder="List your favorite books..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="favoriteMovies" icon={Film}>
                      Favorite Movies
                    </FormLabel>
                    <Textarea
                      id="favoriteMovies"
                      value={formData.favoriteMovies}
                      onChange={(e) => setFormData({ ...formData, favoriteMovies: e.target.value })}
                      placeholder="List your favorite movies..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="favoriteMusic" icon={Music}>
                      Favorite Music
                    </FormLabel>
                    <Textarea
                      id="favoriteMusic"
                      value={formData.favoriteMusic}
                      onChange={(e) => setFormData({ ...formData, favoriteMusic: e.target.value })}
                      placeholder="List your favorite artists, bands, genres..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="favoriteQuotes" icon={Quote}>
                      Favorite Quotes
                    </FormLabel>
                    <Textarea
                      id="favoriteQuotes"
                      value={formData.favoriteQuotes}
                      onChange={(e) => setFormData({ ...formData, favoriteQuotes: e.target.value })}
                      placeholder="Share your favorite quotes..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel htmlFor="hobbies" icon={Sparkles}>
                    Hobbies
                  </FormLabel>
                  <TagInput
                    value={formData.hobbies.join(", ")}
                    onChange={(value) => {
                      const hobbiesArray = value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag)
                      setFormData({ ...formData, hobbies: hobbiesArray })
                    }}
                    placeholder="Photography, Gaming, Cooking, Reading..."
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel htmlFor="sports" icon={Dumbbell}>
                    Sports & Activities
                  </FormLabel>
                  <TagInput
                    value={formData.sports.join(", ")}
                    onChange={(value) => {
                      const sportsArray = value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag)
                      setFormData({ ...formData, sports: sportsArray })
                    }}
                    placeholder="Running, Swimming, Yoga, Tennis..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pet Preferences Card */}
            <Card className="mb-6">
              <CardHeaderWithIcon
                title="Pet Preferences"
                description="Your preferences for future pets"
                icon={Heart}
              />
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <FormLabel htmlFor="willingToAdopt" icon={HeartHandshake}>
                      Willing to Adopt
                    </FormLabel>
                    <Select
                      value={formData.willingToAdopt}
                      onValueChange={(value) => setFormData({ ...formData, willingToAdopt: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Are you willing to adopt?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="h-4 w-4" />
                            <span>Yes, Looking to Adopt</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="maybe">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Maybe in the Future</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="no">
                          <div className="flex items-center gap-2">
                            <XIcon className="h-4 w-4" />
                            <span>Not Currently</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="preferredPetSize" icon={Ruler}>
                      Preferred Pet Size
                    </FormLabel>
                    <Select
                      value={formData.preferredPetSize}
                      onValueChange={(value) => setFormData({ ...formData, preferredPetSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred pet size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">
                          <div className="flex items-center gap-2">
                            <BabyIcon className="h-4 w-4" />
                            <span>Small</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span>Medium</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="large">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Large</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Size</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="trainingStyle" icon={GraduationCap}>
                      Training Style Preference
                    </FormLabel>
                    <Select
                      value={formData.trainingStyle}
                      onValueChange={(value) => setFormData({ ...formData, trainingStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred training style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive-reinforcement">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Positive Reinforcement</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="balanced">
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4" />
                            <span>Balanced Training</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="clicker">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span>Clicker Training</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="natural">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            <span>Natural Training</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="activityLevelPreference" icon={Activity}>
                      Activity Level Preference
                    </FormLabel>
                    <Select
                      value={formData.activityLevelPreference}
                      onValueChange={(value) => setFormData({ ...formData, activityLevelPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>Low (Calm/Couch Potato)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>Moderate</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>High (Very Active)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Activity Level</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="energyLevelPreference" icon={Zap}>
                      Energy Level Preference
                    </FormLabel>
                    <Select
                      value={formData.energyLevelPreference}
                      onValueChange={(value) => setFormData({ ...formData, energyLevelPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred energy level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>Low Energy</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>Moderate Energy</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>High Energy</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Energy Level</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="groomingNeedsPreference" icon={Scissors}>
                      Grooming Needs Preference
                    </FormLabel>
                    <Select
                      value={formData.groomingNeedsPreference}
                      onValueChange={(value) => setFormData({ ...formData, groomingNeedsPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred grooming needs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            <span>Minimal Grooming</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            <span>Moderate Grooming</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            <span>High Grooming Needs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="professional">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            <span>Professional Grooming Required</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Grooming Level</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="exerciseNeedsPreference" icon={Dumbbell}>
                      Exercise Needs Preference
                    </FormLabel>
                    <Select
                      value={formData.exerciseNeedsPreference}
                      onValueChange={(value) => setFormData({ ...formData, exerciseNeedsPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred exercise needs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>Low Exercise Needs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>Moderate Exercise</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            <span>High Exercise Needs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="very-high">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            <span>Very High Exercise Needs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Exercise Level</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="agePreference" icon={BabyIcon}>
                      Age Preference
                    </FormLabel>
                    <Select
                      value={formData.agePreference}
                      onValueChange={(value) => setFormData({ ...formData, agePreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred pet age" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="puppy-kitten">
                          <div className="flex items-center gap-2">
                            <BabyIcon className="h-4 w-4" />
                            <span>Puppy/Kitten (0-1 year)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="young">
                          <div className="flex items-center gap-2">
                            <BabyIcon className="h-4 w-4" />
                            <span>Young (1-3 years)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="adult">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Adult (3-7 years)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="senior">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Senior (7+ years)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Age</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="healthStatusPreference" icon={ShieldCheck}>
                      Health Status Preference
                    </FormLabel>
                    <Select
                      value={formData.healthStatusPreference}
                      onValueChange={(value) => setFormData({ ...formData, healthStatusPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred health status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthy">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Fully Healthy</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="minor-issues">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Minor Health Issues OK</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="chronic-conditions">
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="h-4 w-4" />
                            <span>Chronic Conditions OK</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="special-needs">
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="h-4 w-4" />
                            <span>Special Needs OK</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Health Status</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="specialNeedsAcceptance" icon={HeartHandshake}>
                      Special Needs Acceptance
                    </FormLabel>
                    <Select
                      value={formData.specialNeedsAcceptance}
                      onValueChange={(value) => setFormData({ ...formData, specialNeedsAcceptance: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Are you open to special needs pets?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="h-4 w-4" />
                            <span>Yes, Open to Special Needs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="maybe">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Maybe, Depending on Needs</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="no">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Prefer Fully Healthy</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="temperamentPreference" icon={Smile}>
                      Temperament Preference
                    </FormLabel>
                    <Select
                      value={formData.temperamentPreference}
                      onValueChange={(value) => setFormData({ ...formData, temperamentPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred pet temperament" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calm">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>Calm and Gentle</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Smile className="h-4 w-4" />
                            <span>Moderate Temperament</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="energetic">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Energetic and Playful</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Temperament</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="livingSpacePreference" icon={Building}>
                      Living Space Preference
                    </FormLabel>
                    <Select
                      value={formData.livingSpacePreference}
                      onValueChange={(value) => setFormData({ ...formData, livingSpacePreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred living space" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indoor">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            <span>Indoor Only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="outdoor">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            <span>Outdoor Preferred</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>Indoor and Outdoor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Living Space</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="playStylePreference" icon={Gamepad2}>
                      Play Style Preference
                    </FormLabel>
                    <Select
                      value={formData.playStylePreference}
                      onValueChange={(value) => setFormData({ ...formData, playStylePreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred play style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gentle">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Gentle and Soft</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderate">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span>Moderate Play</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rough">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            <span>Rough and Tumble</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Play Style</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="feedingSchedulePreference" icon={UtensilsCrossed}>
                      Feeding Schedule Preference
                    </FormLabel>
                    <Select
                      value={formData.feedingSchedulePreference}
                      onValueChange={(value) => setFormData({ ...formData, feedingSchedulePreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred feeding schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free-feeding">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>Free-Feeding (Food Always Available)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>Scheduled Meals</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="combination">
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="h-4 w-4" />
                            <span>Combination Approach</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Feeding Schedule</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="socializationPreference" icon={Users}>
                      Socialization Preference
                    </FormLabel>
                    <Select
                      value={formData.socializationPreference}
                      onValueChange={(value) => setFormData({ ...formData, socializationPreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Preferred socialization level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-social">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Very Social and Loving</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="moderately-social">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Moderately Social</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="independent">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Independent and Self-Sufficient</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="any">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Any Socialization Level</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <FormLabel htmlFor="breedPreferences" icon={Heart}>
                      Breed Preferences
                    </FormLabel>
                    <Textarea
                      id="breedPreferences"
                      value={formData.breedPreferences}
                      onChange={(e) => setFormData({ ...formData, breedPreferences: e.target.value })}
                      placeholder="List your preferred breeds or breed types..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
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
