"use client"

import React, { useState, useEffect, useRef } from "react"
import { ErrorText } from "@/components/ui/error-text"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FormActions } from "@/components/ui/form-actions"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  Pet,
  PersonalityTraits,
  FavoriteThings,
  DietInfo,
  VetInfo,
  InsuranceInfo,
  HealthRecord,
  Vaccination,
  Medication,
  TrainingProgress,
  PrivacyLevel,
  Achievement,
  AchievementCategory,
} from "@/lib/types"
import { calculateAge } from "@/lib/utils/date"
import { PrivacySelector } from "@/components/privacy-selector"
import {
  Save,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  CircleDot,
  User,
  Loader2,
  FileText,
  Image as ImageIcon,
  Brain,
  Star,
  Utensils,
  AlertCircle,
  Stethoscope,
  Shield,
  Syringe,
  Pill,
  Activity,
  Plus,
  X,
  Calendar,
  Weight,
  Palette,
  MapPin,
  Phone,
  Zap,
  Heart,
  Gamepad2,
  Home,
  Apple,
  Target,
  GraduationCap,
  CheckCircle2,
  Award,
  Info,
  Eye,
  Lock,
  AlertTriangle,
  Tag,
} from "lucide-react"
import { useUnitSystem, useFormatNumber } from "@/lib/i18n/hooks"
import { convertWeight } from "@/lib/i18n/formatting"
import { getWikiArticlesByCategory } from "@/lib/storage"
import { AvatarEditor } from "@/components/ui/avatar-editor"
import { Progress } from "@/components/ui/progress"
import { uploadImageWithProgress } from "@/lib/utils/upload-signed"
import { compressDataUrl, dataUrlToBlob } from "@/lib/utils/image-compress"
import { BlockEditor } from "@/components/editor/block-editor"

// Label with Tooltip Component
interface LabelWithTooltipProps {
  htmlFor?: string
  tooltip?: string
  required?: boolean
  children: React.ReactNode
}

function LabelWithTooltip({ htmlFor, tooltip, required, icon, children }: LabelWithTooltipProps & { icon?: any }) {
  const labelContent = (
    <Label htmlFor={htmlFor} required={required} icon={icon} className="flex items-center gap-1.5">
      {children}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </Label>
  )

  return tooltip ? <TooltipProvider>{labelContent}</TooltipProvider> : labelContent
}

// Array Tag Input Component
function ArrayTagInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string
}) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue("")
    } else if (trimmed && value.includes(trimmed)) {
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        className={`
          flex flex-wrap gap-2 p-2 min-h-[44px] border rounded-md bg-background 
          focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
          ${error ? "border-destructive" : "border-input"}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1 text-sm font-medium">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm placeholder:text-muted-foreground"
        />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  )
}

const ACHIEVEMENT_TYPE_OPTIONS: { value: AchievementCategory; label: string; description: string }[] = [
  { value: "milestone", label: "Milestone", description: "Important life events or memorable moments" },
  { value: "training", label: "Training", description: "Skills mastered or obedience accomplishments" },
  { value: "competition", label: "Competition", description: "Awards from shows, races, or contests" },
  { value: "service", label: "Service", description: "Therapy, service, or volunteer certifications" },
  { value: "health", label: "Health", description: "Wellness wins or recovery milestones" },
  { value: "community", label: "Community", description: "Recognition from the community or media" },
  { value: "adventure", label: "Adventure", description: "Travel achievements or exploration milestones" },
  { value: "social", label: "Social", description: "Friendship or socialization successes" },
  { value: "wellness", label: "Wellness", description: "Calmness, balance, or lifestyle improvements" },
]

// Form Data Type
export interface PetFormData {
  name: string
  species: Pet["species"]
  speciesId?: string
  customSpecies?: string
  breed: string
  breedId?: string
  age: string
  gender: Pet["gender"] | "unknown"
  bio: string
  privacyVisibility: PrivacyLevel
  privacyInteractions: PrivacyLevel
  birthday: string
  weight: string
  color: string
  microchipId: string
  microchipCompany?: string
  microchipCompanyOther?: string
  microchipRegistrationStatus?: 'registered' | 'not_registered' | 'unknown'
  microchipCertificateUrl?: string
  collarTagId?: string
  adoptionDate: string
  specialNeeds: string
  dislikes?: string
  spayedNeutered: boolean
  avatar?: string
  photos: string[]
  photoCaptions: Record<string, string>
  isFeatured?: boolean
  allergies: string[]
  allergySeverities: Record<string, 'mild' | 'moderate' | 'severe'>
  personality: PersonalityTraits
  favoriteThings: FavoriteThings
  dietInfo: DietInfo
  vetInfo: VetInfo
  insurance: InsuranceInfo
  healthRecords: HealthRecord[]
  vaccinations: Vaccination[]
  medications: Medication[]
  conditions: Array<{ id: string; name: string; diagnosedAt?: string; notes?: string }>
  achievements: Achievement[]
  trainingProgress: TrainingProgress[]
}

interface PetFormProps {
  mode: "create" | "edit"
  initialData?: Partial<Pet>
  onSubmit: (data: PetFormData) => Promise<void> | void
  onCancel?: () => void
  petName?: string
}

// Validation errors type
interface ValidationErrors {
  [key: string]: string | undefined
}

export function PetForm({ mode, initialData, onSubmit, onCancel, petName }: PetFormProps) {
  const unitSystem = useUnitSystem()
  const formatNumber = useFormatNumber()

  // Weight local state with unit handling
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(unitSystem === 'imperial' ? 'lb' : 'kg')
  const [weightValue, setWeightValue] = useState<number | ''>('')

  // Age handling: exact birth date vs approximate age (declared after formData)

  useEffect(() => {
    // Initialize from existing weight string (e.g., "70 lbs" or "5 kg")
    const raw = initialData?.weight || ''
    const match = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|kilograms|lb|lbs|pounds)?/i)
    if (match) {
      const val = Number(match[1])
      const unit = (match[2] || (unitSystem === 'imperial' ? 'lb' : 'kg')).toLowerCase()
      setWeightValue(Number.isNaN(val) ? '' : val)
      setWeightUnit(unit.startsWith('k') ? 'kg' : 'lb')
    } else {
      setWeightValue('')
      setWeightUnit(unitSystem === 'imperial' ? 'lb' : 'kg')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Sync display weight back to formData as a formatted string
    if (weightValue === '') {
      setFormData((prev) => ({ ...prev, weight: '' }))
      return
    }
    const v = typeof weightValue === 'number' ? weightValue : Number(weightValue)
    const display = `${formatNumber(v, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${weightUnit}`
    setFormData((prev) => ({ ...prev, weight: display }))
  }, [weightValue, weightUnit, formatNumber])

  useEffect(() => {
    if (ageMode === 'approx') {
      const totalMonths = approxYears * 12 + approxMonths
      const ageYears = totalMonths / 12
      setFormData((prev) => ({ ...prev, birthday: prev.birthday && prev.birthday, age: ageYears ? ageYears.toFixed(2) : '' }))
    }
  }, [ageMode, approxYears, approxMonths])

  const currentAgeString = (() => {
    if (ageMode === 'exact' && formData.birthday) {
      const now = new Date()
      const dob = new Date(formData.birthday)
      let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
      if (now.getDate() < dob.getDate()) months -= 1
      const yrs = Math.max(0, Math.floor(months / 12))
      const mos = Math.max(0, months % 12)
      return `${yrs} year${yrs === 1 ? '' : 's'}, ${mos} month${mos === 1 ? '' : 's'} old`
    }
    const total = approxYears * 12 + approxMonths
    const yrs = Math.floor(total / 12)
    const mos = total % 12
    if (yrs === 0 && mos === 0) return ''
    return `${yrs} year${yrs === 1 ? '' : 's'}, ${mos} month${mos === 1 ? '' : 's'} old`
  })()

  // Personality: predefined traits and helpers
  const MAX_TRAITS = 10
  const PREDEFINED_TRAITS: Array<{ key: string; label: string; color: string; warn?: boolean }> = [
    { key: 'friendly', label: 'Friendly', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
    { key: 'shy', label: 'Shy', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200' },
    { key: 'energetic', label: 'Energetic', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
    { key: 'calm', label: 'Calm', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    { key: 'playful', label: 'Playful', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200' },
    { key: 'curious', label: 'Curious', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
    { key: 'protective', label: 'Protective', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
    { key: 'independent', label: 'Independent', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200' },
    { key: 'affectionate', label: 'Affectionate', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' },
    { key: 'vocal', label: 'Vocal', color: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-200' },
    { key: 'quiet', label: 'Quiet', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200' },
    { key: 'intelligent', label: 'Intelligent', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' },
    { key: 'stubborn', label: 'Stubborn', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
    { key: 'loyal', label: 'Loyal', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' },
    { key: 'anxious', label: 'Anxious', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
    { key: 'confident', label: 'Confident', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' },
    { key: 'gentle', label: 'Gentle', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200' },
    { key: 'aggressive', label: 'Aggressive', color: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200', warn: true },
    { key: 'good-with-kids', label: 'Good with Kids', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-200' },
    { key: 'good-with-pets', label: 'Good with Other Pets', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200' },
  ]

  const addTrait = (label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return
    const exists = formData.personality.traits.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    if (exists) return
    if (formData.personality.traits.length >= MAX_TRAITS) return
    setFormData({ ...formData, personality: { ...formData.personality, traits: [...formData.personality.traits, trimmed] } })
  }

  const removeTrait = (label: string) => {
    setFormData({
      ...formData,
      personality: {
        ...formData.personality,
        traits: formData.personality.traits.filter((t) => t.toLowerCase() !== label.toLowerCase()),
      },
    })
  }

  const toggleTrait = (label: string) => {
    const selected = formData.personality.traits.some((t) => t.toLowerCase() === label.toLowerCase())
    if (selected) removeTrait(label)
    else addTrait(label)
  }

  // Conditions helpers
  const COMMON_CONDITIONS = [
    'Diabetes', 'Arthritis', 'Heart disease', 'Kidney disease', 'Hip dysplasia', 'Epilepsy', 'Anxiety'
  ]
  const hasCondition = (name: string) => formData.conditions.some((c) => c.name.toLowerCase() === name.toLowerCase())
  const addCondition = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || hasCondition(trimmed)) return
    setFormData((prev) => ({ ...prev, conditions: [...prev.conditions, { id: `cond-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: trimmed }] }))
  }
  const removeCondition = (id: string) => {
    setFormData((prev) => ({ ...prev, conditions: prev.conditions.filter((c) => c.id !== id) }))
  }
  const updateCondition = (id: string, field: 'diagnosedAt' | 'notes', value: string) => {
    setFormData((prev) => ({ ...prev, conditions: prev.conditions.map((c) => c.id === id ? { ...c, [field]: value } : c) }))
  }
  const resolvedPrivacy = (() => {
    const rawPrivacy = initialData?.privacy
    if (
      rawPrivacy &&
      typeof rawPrivacy === "object" &&
      "visibility" in rawPrivacy &&
      "interactions" in rawPrivacy
    ) {
      return {
        visibility: rawPrivacy.visibility as PrivacyLevel,
        interactions: rawPrivacy.interactions as PrivacyLevel,
      }
    }

    const fallback = (rawPrivacy as PrivacyLevel | undefined) || "public"
    return {
      visibility: fallback,
      interactions: fallback,
    }
  })()

  const [formData, setFormData] = useState<PetFormData>({
    name: initialData?.name || "",
    species: initialData?.species || "dog",
    speciesId: initialData?.speciesId || undefined,
    customSpecies: "",
    breed: initialData?.breed || "",
    breedId: initialData?.breedId || undefined,
    age: initialData?.age?.toString() || "",
    gender: (initialData?.gender as PetFormData["gender"]) || "unknown",
    bio: initialData?.bio || "",
    privacyVisibility: resolvedPrivacy.visibility,
    privacyInteractions: resolvedPrivacy.interactions,
    birthday: initialData?.birthday || "",
    weight: initialData?.weight || "",
    color: initialData?.color || "",
    microchipId: initialData?.microchipId || "",
    microchipCompany: (initialData as any)?.microchipCompany || undefined,
    microchipCompanyOther: undefined,
    microchipRegistrationStatus: (initialData as any)?.microchipRegistrationStatus || 'unknown',
    microchipCertificateUrl: (initialData as any)?.microchipCertificateUrl || undefined,
    collarTagId: (initialData as any)?.collarTagId || "",
    adoptionDate: initialData?.adoptionDate || "",
    specialNeeds: initialData?.specialNeeds || "",
    dislikes: (initialData as any)?.dislikes || "",
    spayedNeutered: initialData?.spayedNeutered || false,
    avatar: initialData?.avatar || undefined,
    photos: initialData?.photos || [],
    photoCaptions: (initialData as any)?.photoCaptions || {},
    isFeatured: (initialData as any)?.isFeatured || false,
    allergies: initialData?.allergies || [],
    allergySeverities: ((initialData as any)?.allergySeverities as Record<string,'mild'|'moderate'|'severe'>) || {},
    personality: initialData?.personality || {
      energyLevel: 3,
      friendliness: 3,
      trainability: 3,
      playfulness: 3,
      independence: 3,
      traits: [],
    },
    favoriteThings: initialData?.favoriteThings || {
      toys: [],
      activities: [],
      places: [],
      foods: [],
    },
    dietInfo: initialData?.dietInfo || {
      foodBrand: "",
      foodType: "",
      portionSize: "",
      feedingSchedule: [],
      treats: [],
      restrictions: [],
    },
    vetInfo: initialData?.vetInfo || {
      clinicName: "",
      veterinarianName: "",
      phone: "",
      address: "",
      emergencyContact: "",
    },
    insurance: initialData?.insurance || {
      provider: "",
      policyNumber: "",
      coverage: "",
      expiryDate: "",
    },
    healthRecords: initialData?.healthRecords || [],
    vaccinations: initialData?.vaccinations || [],
    medications: initialData?.medications || [],
    conditions: ((initialData as any)?.conditions as Array<{ id: string; name: string; diagnosedAt?: string; notes?: string }>) || [],
    achievements: initialData?.achievements || [],
    trainingProgress: initialData?.trainingProgress || [],
  })

  const [ageMode, setAgeMode] = useState<'exact' | 'approx'>(formData.birthday ? 'exact' : 'approx')
  const [approxYears, setApproxYears] = useState<number>(0)
  const [approxMonths, setApproxMonths] = useState<number>(0)

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Character counter helper (Unicode-aware)
  const charCount = (value: string) => Array.from(value || "").length

  // Breed suggestions state (for Basic Information step)
  const [breedSuggestOpen, setBreedSuggestOpen] = useState(false)
  const allBreedArticles = React.useMemo(() => getWikiArticlesByCategory("breeds"), [])
  const breedSuggestions = React.useMemo(() => {
    const isDog = formData.species === "dog"
    const isCat = formData.species === "cat"
    const q = (formData.breed || "").toLowerCase()
    const pool = allBreedArticles.filter((a) => {
      const sub = (a.subcategory || "").toLowerCase()
      const speciesList = (a.species || []).map((s) => s.toLowerCase())
      if (isDog) return sub.includes("dog") || speciesList.includes("dog")
      if (isCat) return sub.includes("cat") || speciesList.includes("cat")
      if (formData.speciesId) return speciesList.includes((formData.speciesId || "").toLowerCase())
      return false
    })
    if (!q) return pool.slice(0, 10)
    return pool.filter((a) => a.title.toLowerCase().includes(q)).slice(0, 10)
  }, [allBreedArticles, formData.breed, formData.species, formData.speciesId])

  // Step 2: Photos & Gallery state
  const [isPrimaryEditorOpen, setIsPrimaryEditorOpen] = useState(false)
  const [tempPrimarySrc, setTempPrimarySrc] = useState<string>("")
  const [primaryUploadProgress, setPrimaryUploadProgress] = useState<number>(0)
  const [uploadingItems, setUploadingItems] = useState<Array<{ id: string; name: string; preview?: string; progress: number; error?: string }>>([])
  const maxPhotos = 20

  const canAddMorePhotos = formData.photos.length + uploadingItems.length < maxPhotos

  const openPrimaryEditorFromFile = (file: File) => {
    // HEIC/HEIF preview isn't supported broadly; handle by direct upload without cropping
    if (/(heic|heif)$/i.test(file.name) || /image\/(heic|heif)/i.test(file.type)) {
      // Direct upload with progress, set as avatar when done
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setUploadingItems((prev) => [...prev, { id, name: file.name, progress: 0 }])
      uploadImageWithProgress({ file, folder: 'pets', onProgress: (p) => setUploadingItems((prev) => prev.map((it) => it.id === id ? { ...it, progress: p } : it)) })
        .then(({ url }) => {
          setFormData((prev) => ({ ...prev, avatar: url, photos: [url, ...prev.photos] }))
        })
        .catch((e) => setUploadingItems((prev) => prev.map((it) => it.id === id ? { ...it, error: e?.message || 'Upload failed' } : it)))
        .finally(() => setUploadingItems((prev) => prev.filter((it) => it.id !== id)))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setTempPrimarySrc(e.target?.result as string)
      setIsPrimaryEditorOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handlePrimaryCroppedSave = async (dataUrl: string) => {
    // Enforce ~500x500 minimum and <10MB
    try {
      const blob = await compressDataUrl(dataUrl, { maxBytes: 10 * 1024 * 1024, maxDimension: 1000, outputType: 'image/jpeg' })
      const file = new File([blob], `primary-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setPrimaryUploadProgress(0)
      const { url } = await uploadImageWithProgress({ file, folder: 'pets', onProgress: setPrimaryUploadProgress })
      setFormData((prev) => ({ ...prev, avatar: url, photos: prev.photos.includes(url) ? prev.photos : [url, ...prev.photos] }))
    } catch (e: any) {
      alert(e?.message || 'Failed to save primary photo')
    } finally {
      setIsPrimaryEditorOpen(false)
      setTempPrimarySrc('')
      setPrimaryUploadProgress(0)
    }
  }

  const handleAdditionalFiles = (files: FileList) => {
    const selected = Array.from(files)
    const allow = Math.max(0, maxPhotos - formData.photos.length - uploadingItems.length)
    const queue = selected.slice(0, allow)
    queue.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadingItems((prev) => [...prev, { id, name: file.name, preview: e.target?.result as string, progress: 0 }])
      }
      reader.readAsDataURL(file)
      uploadImageWithProgress({ file, folder: 'pets', onProgress: (p) => setUploadingItems((prev) => prev.map((it) => it.id === id ? { ...it, progress: p } : it)) })
        .then(({ url }) => setFormData((prev) => ({ ...prev, photos: [...prev.photos, url] })))
        .catch((e) => setUploadingItems((prev) => prev.map((it) => it.id === id ? { ...it, error: e?.message || 'Upload failed' } : it)))
        .finally(() => setUploadingItems((prev) => prev.filter((it) => it.id !== id)))
    })
  }

  const movePhoto = (from: number, to: number) => {
    setFormData((prev) => {
      const arr = [...prev.photos]
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      const avatar = arr[0] || prev.avatar
      return { ...prev, photos: arr, avatar }
    })
  }

  const removePhoto = (idx: number) => {
    setFormData((prev) => {
      const arr = prev.photos.filter((_, i) => i !== idx)
      const avatar = idx === 0 ? arr[0] : prev.avatar
      const captions = { ...prev.photoCaptions }
      const removedUrl = prev.photos[idx]
      if (removedUrl) delete captions[removedUrl]
      return { ...prev, photos: arr, avatar, photoCaptions: captions }
    })
  }

  useEffect(() => {
    if (!formData.birthday) {
      setErrors((prev) => {
        if (!prev.age) {
          return prev
        }
        const { age, ...rest } = prev
        return rest
      })
      return
    }

    const computedAge = calculateAge(formData.birthday)
    const nextAgeValue = computedAge !== undefined ? computedAge.toString() : ""

    setFormData((prev) => (prev.age === nextAgeValue ? prev : { ...prev, age: nextAgeValue }))
    setErrors((prev) => {
      if (computedAge === undefined) {
        return { ...prev, age: "Unable to calculate age from the selected birthday." }
      }
      if (!prev.age) {
        return prev
      }
      const { age, ...rest } = prev
      return rest
    })
  }, [formData.birthday])

  // Real-time validation (Unicode-aware for name)
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "name": {
        const val = (value ?? "").toString()
        if (!val.trim()) {
          return "Pet name is required"
        }
        const len = charCount(val.trim())
        if (len < 2) {
          return "Pet name must be at least 2 characters"
        }
        if (len > 50) {
          return "Pet name must be 50 characters or fewer"
        }
        break
      }
      case "species": {
        if (!value) return "Species is required"
        break
      }
      case "customSpecies": {
        if (formData.species === "other" && (!formData.speciesId || formData.speciesId === "custom")) {
          const val = (value ?? "").toString().trim()
          if (charCount(val) < 2) return "Please enter a species"
        }
        break
      }
      case "age":
        if (value && (Number.isNaN(Number(value)) || Number(value) < 0 || Number(value) > 50)) {
          return "Age must be between 0 and 50"
        }
        break
      
      case "bio":
        if (value && value.length > 1000) {
          return "Bio must be less than 1000 characters"
        }
        break
      case "microchipId": {
        const v = (value || '').toString().trim()
        if (!v) return undefined
        if (!/^\d{15}$/.test(v)) return "Microchip ID should be a 15-digit number"
        break
      }
      case "microchipCompanyOther": {
        if (formData.microchipCompany === 'Other') {
          const v = (value || '').toString().trim()
          if (v.length < 2) return "Please specify the microchip company"
        }
        break
      }
    }
    return undefined
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
    if (message) setMessage(null)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    const nameError = validateField("name", formData.name)
    if (nameError) newErrors.name = nameError

    const speciesError = validateField("species", formData.species)
    if (speciesError) newErrors.species = speciesError

    if (formData.species === "other" && (!formData.speciesId || formData.speciesId === "custom")) {
      const customErr = validateField("customSpecies", formData.customSpecies)
      if (customErr) newErrors.customSpecies = customErr
    }

    const ageError = validateField("age", formData.age)
    if (ageError) newErrors.age = ageError

    const microchipError = validateField("microchipId", formData.microchipId)
    if (microchipError) newErrors.microchipId = microchipError

    const bioError = validateField("bio", formData.bio)
    if (bioError) newErrors.bio = bioError

    // Require primary photo
    if (!formData.avatar && (!formData.photos || formData.photos.length === 0)) {
      newErrors.avatar = 'Please upload a primary photo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix the validation errors before submitting." })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      await onSubmit(formData)
      setMessage({ type: "success", text: mode === "create" ? "Pet created successfully!" : "Pet updated successfully!" })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : (mode === "create" ? "Failed to create pet. Please try again." : "Failed to update pet. Please try again.")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Health record functions
  const addHealthRecord = () => {
    setFormData({
      ...formData,
      healthRecords: [
        ...formData.healthRecords,
        {
          id: `hr-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          type: "checkup",
          title: "",
          description: "",
        },
      ],
    })
  }

  const updateHealthRecord = (index: number, field: keyof HealthRecord, value: any) => {
    const updated = [...formData.healthRecords]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, healthRecords: updated })
  }

  const removeHealthRecord = (index: number) => {
    setFormData({
      ...formData,
      healthRecords: formData.healthRecords.filter((_, i) => i !== index),
    })
  }

  // Vaccination functions
  const addVaccination = () => {
    setFormData({
      ...formData,
      vaccinations: [
        ...formData.vaccinations,
        {
          id: `v-${Date.now()}`,
          name: "",
          date: new Date().toISOString().split("T")[0],
        },
      ],
    })
  }

  const updateVaccination = (index: number, field: keyof Vaccination, value: any) => {
    const updated = [...formData.vaccinations]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, vaccinations: updated })
  }

  const removeVaccination = (index: number) => {
    setFormData({
      ...formData,
      vaccinations: formData.vaccinations.filter((_, i) => i !== index),
    })
  }

  // Medication functions
  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        {
          id: `m-${Date.now()}`,
          name: "",
          dosage: "",
          frequency: "",
          startDate: new Date().toISOString().split("T")[0],
        },
      ],
    })
  }

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const updated = [...formData.medications]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, medications: updated })
  }

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    })
  }

  // Achievement functions
  const addAchievement = () => {
    setFormData({
      ...formData,
      achievements: [
        ...formData.achievements,
        {
          id: `ach-${Date.now()}`,
          title: "",
          description: "",
          icon: "🏆",
          earnedAt: new Date().toISOString().split("T")[0],
          type: "milestone",
          highlight: false,
        },
      ],
    })
  }

  const updateAchievement = (index: number, field: keyof Achievement, value: Achievement[keyof Achievement]) => {
    const updated = [...formData.achievements]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, achievements: updated })
  }

  const removeAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((_, i) => i !== index),
    })
  }

  // Training progress functions
  const addTrainingProgress = () => {
    setFormData({
      ...formData,
      trainingProgress: [
        ...formData.trainingProgress,
        {
          id: `t-${Date.now()}`,
          skill: "",
          level: "beginner",
          startedAt: new Date().toISOString().split("T")[0],
        },
      ],
    })
  }

  const updateTrainingProgress = (index: number, field: keyof TrainingProgress, value: any) => {
    const updated = [...formData.trainingProgress]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, trainingProgress: updated })
  }

  const removeTrainingProgress = (index: number) => {
    setFormData({
      ...formData,
      trainingProgress: formData.trainingProgress.filter((_, i) => i !== index),
    })
  }

  // Feeding schedule functions
  const addFeedingSchedule = () => {
    setFormData({
      ...formData,
      dietInfo: {
        ...formData.dietInfo,
        feedingSchedule: [...formData.dietInfo.feedingSchedule, ""],
      },
    })
  }

  const updateFeedingSchedule = (index: number, value: string) => {
    const updated = [...formData.dietInfo.feedingSchedule]
    updated[index] = value
    setFormData({
      ...formData,
      dietInfo: { ...formData.dietInfo, feedingSchedule: updated },
    })
  }

  const removeFeedingSchedule = (index: number) => {
    setFormData({
      ...formData,
      dietInfo: {
        ...formData.dietInfo,
        feedingSchedule: formData.dietInfo.feedingSchedule.filter((_, i) => i !== index),
      },
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success/Error Message */}
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 lg:grid-cols-12 gap-2 h-auto p-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="id" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">ID</span>
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Personality</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="diet" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              <span className="hidden sm:inline">Diet</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="bio" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Bio</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Review</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Essential details about your pet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="name" 
                    required 
                    tooltip="Enter your pet's name. This will be displayed on their profile."
                  >
                    Pet Name
                  </LabelWithTooltip>
                  <div className="relative">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      placeholder="e.g., Luna 🐕 or Milo 🐈"
                      className={`h-10 pr-14 ${errors.name ? "border-destructive" : ""}`}
                      required
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                      {charCount(formData.name)}/50
                    </span>
                  </div>
                  {errors.name && <ErrorText>{errors.name}</ErrorText>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="species" 
                      required
                      tooltip="Select the type of animal your pet is."
                    >
                      Species
                    </LabelWithTooltip>
                    {(() => {
                      // Display-level species options with emoji; map to Pet["species"] + speciesId
                      const speciesOptions: Array<{ value: string; label: string; emoji: string }> = [
                        { value: "dog", label: "Dog", emoji: "🐕" },
                        { value: "cat", label: "Cat", emoji: "🐈" },
                        { value: "bird", label: "Bird", emoji: "🐦" },
                        { value: "rabbit", label: "Rabbit", emoji: "🐇" },
                        { value: "guinea-pig", label: "Guinea Pig", emoji: "🐹" },
                        { value: "hamster", label: "Hamster", emoji: "🐹" },
                        { value: "fish", label: "Fish", emoji: "🐟" },
                        { value: "reptile", label: "Reptile", emoji: "🦎" },
                        { value: "horse", label: "Horse", emoji: "🐴" },
                        { value: "farm-animal", label: "Farm Animal", emoji: "🐄" },
                        { value: "other", label: "Other", emoji: "✨" },
                      ]

                      const getDisplayFromState = () => {
                        if (formData.species !== "other") return formData.species
                        switch (formData.speciesId) {
                          case "guinea-pig":
                          case "reptile":
                          case "horse":
                          case "farm-animal":
                            return formData.speciesId
                          default:
                            return "other"
                        }
                      }

                      const setFromDisplay = (displayValue: string) => {
                        if (["dog", "cat", "bird", "rabbit", "hamster", "fish"].includes(displayValue)) {
                          handleFieldChange("species", displayValue as Pet["species"]) // resets to core species
                          setFormData((prev) => ({ ...prev, speciesId: undefined, customSpecies: "" }))
                          return
                        }
                        // Extended categories map to species: other + speciesId
                        handleFieldChange("species", "other")
                        setFormData((prev) => ({ ...prev, speciesId: displayValue, customSpecies: displayValue === "other" ? prev.customSpecies : "" }))
                      }

                      return (
                        <Select value={getDisplayFromState()} onValueChange={setFromDisplay}>
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue>
                              {(() => {
                                const active = speciesOptions.find((o) => o.value === getDisplayFromState())
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-base" aria-hidden>{active?.emoji}</span>
                                    <span className="truncate">{active?.label}</span>
                                  </div>
                                )
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {speciesOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <span className="text-base" aria-hidden>{opt.emoji}</span>
                                  <span>{opt.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    })()}

                    {/* Custom species input when Other is selected */}
                    {formData.species === "other" && (!formData.speciesId || formData.speciesId === "other" || formData.speciesId === "custom") && (
                      <div className="mt-2 space-y-1.5">
                        <Label htmlFor="customSpecies">Custom species</Label>
                        <Input
                          id="customSpecies"
                          value={formData.customSpecies}
                          onChange={(e) => {
                            if (formData.speciesId !== "custom") setFormData((prev) => ({ ...prev, speciesId: "custom" }))
                            handleFieldChange("customSpecies", e.target.value)
                          }}
                          placeholder="e.g., Hedgehog, Mini Pig"
                          className={`h-10 ${errors.customSpecies ? "border-destructive" : ""}`}
                        />
                        {errors.customSpecies && <ErrorText>{errors.customSpecies}</ErrorText>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="gender" tooltip="Select your pet's gender. If unknown, choose Unknown.">
                      Gender
                    </LabelWithTooltip>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={() => handleFieldChange('gender', 'male')}
                          className="h-4 w-4"
                        />
                        <span>Male</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={() => handleFieldChange('gender', 'female')}
                          className="h-4 w-4"
                        />
                        <span>Female</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="unknown"
                          checked={formData.gender === 'unknown'}
                          onChange={() => handleFieldChange('gender', 'unknown')}
                          className="h-4 w-4"
                        />
                        <span>Unknown</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="breed"
                    tooltip="Select from suggestions for dogs/cats or enter a breed."
                  >
                    Breed
                  </LabelWithTooltip>
                  {(() => {
                    const isDog = formData.species === "dog"
                    const isCat = formData.species === "cat"
                    const enableSuggest = isDog || isCat || Boolean(formData.speciesId)

                    const selectBreed = (article?: any, labelOverride?: string) => {
                      if (article) {
                        setFormData((prev) => ({ ...prev, breed: article.title, breedId: article.id }))
                      } else {
                        setFormData((prev) => ({ ...prev, breed: labelOverride || prev.breed, breedId: undefined }))
                      }
                      setBreedSuggestOpen(false)
                    }

                    return (
                      <div className="relative">
                        <Popover open={breedSuggestOpen && enableSuggest} onOpenChange={setBreedSuggestOpen}>
                          <PopoverTrigger asChild>
                            <Input
                              id="breed"
                              value={formData.breed}
                              onChange={(e) => {
                                handleFieldChange("breed", e.target.value)
                                if (!breedSuggestOpen) setBreedSuggestOpen(true)
                              }}
                              onFocus={() => enableSuggest && setBreedSuggestOpen(true)}
                              placeholder={isDog ? "Search dog breeds…" : isCat ? "Search cat breeds…" : "Enter breed (optional)"}
                              className="h-10"
                              autoComplete="off"
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-[min(520px,90vw)] p-0" align="start">
                            <div className="max-h-64 overflow-auto divide-y">
                              <div className="p-2 flex gap-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => selectBreed(undefined, "Mixed Breed")}>
                                  Mixed Breed
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => selectBreed(undefined, "Unknown")}>
                                  Unknown
                                </Button>
                              </div>
                              {breedSuggestions.length === 0 ? (
                                <div className="p-3 text-sm text-muted-foreground">No suggestions. Try a different term.</div>
                              ) : (
                                <ul className="py-1">
                                  {breedSuggestions.map((a) => (
                                    <li key={a.id}>
                                      <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left"
                                        onClick={() => selectBreed(a)}
                                      >
                                        {a.coverImage ? (
                                          <img src={a.coverImage} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                                        ) : (
                                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                                        )}
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium truncate">{a.title}</p>
                                          {a.subcategory && <p className="text-xs text-muted-foreground truncate">{a.subcategory.replace(/-/g, " ")}</p>}
                                        </div>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )
                  })()}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="ageMode" value="exact" className="h-4 w-4" checked={ageMode==='exact'} onChange={() => setAgeMode('exact')} />
                      <span>Exact birth date</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="ageMode" value="approx" className="h-4 w-4" checked={ageMode==='approx'} onChange={() => setAgeMode('approx')} />
                      <span>Approximate age</span>
                    </label>
                  </div>
                  {ageMode === 'exact' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <LabelWithTooltip htmlFor="birthday" tooltip="Enter your pet's birthday if known. This helps celebrate their special day!">
                          <Calendar className="h-4 w-4" />
                          Birthday
                        </LabelWithTooltip>
                        <Input
                          id="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={(e) => {
                            const value = e.target.value
                            handleFieldChange('birthday', value)
                            if (!value) {
                              setFormData((prev) => ({ ...prev, age: '' }))
                            }
                          }}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Age</Label>
                        <div className="text-sm text-muted-foreground h-10 flex items-center">{currentAgeString || '—'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Years</Label>
                        <Select value={String(approxYears)} onValueChange={(v) => setApproxYears(Number(v))}>
                          <SelectTrigger className="h-10 w-full"><SelectValue placeholder="0" /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Months</Label>
                        <Select value={String(approxMonths)} onValueChange={(v) => setApproxMonths(Number(v))}>
                          <SelectTrigger className="h-10 w-full"><SelectValue placeholder="0" /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Current Age</Label>
                        <div className="text-sm text-muted-foreground h-10 flex items-center">{currentAgeString || '—'}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="weight" tooltip="Enter your pet's weight and unit. We'll convert automatically when you change units.">
                      <Weight className="h-4 w-4" />
                      Weight
                    </LabelWithTooltip>
                    <div className="flex gap-2">
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={weightValue}
                        onChange={(e) => setWeightValue(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={weightUnit === 'lb' ? 'e.g., 70' : 'e.g., 5.0'}
                        className="h-10"
                      />
                      <Select
                        value={weightUnit}
                        onValueChange={(unit: 'kg' | 'lb') => {
                          if (weightValue === '' || weightValue === 0) {
                            setWeightUnit(unit)
                            return
                          }
                          // Convert value when switching units
                          const fromSys = weightUnit === 'kg' ? 'metric' : 'imperial'
                          const toSys = unit === 'kg' ? 'metric' : 'imperial'
                          const converted = convertWeight(Number(weightValue), fromSys, toSys)
                          setWeightValue(Number(converted.toFixed(1)))
                          setWeightUnit(unit)
                        }}
                      >
                        <SelectTrigger className="h-10 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lb">pounds (lb)</SelectItem>
                          <SelectItem value="kg">kilograms (kg)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(() => {
                      // Healthy range indicator (if breed infobox has average weight)
                      const breed = (() => {
                        if (formData.breedId) {
                          return allBreedArticles.find((a) => a.id === formData.breedId)
                        }
                        if (formData.breed) {
                          return allBreedArticles.find((a) => a.title.toLowerCase() === formData.breed.toLowerCase())
                        }
                        return undefined
                      })()
                      const avgKg = (() => {
                        if (!breed?.breedData) return undefined
                        const male = breed.breedData.maleAvgWeightKg
                        const female = breed.breedData.femaleAvgWeightKg
                        if (formData.gender === 'male' && male) return male
                        if (formData.gender === 'female' && female) return female
                        if (male && female) return (male + female) / 2
                        return male || female
                      })()
                      if (!avgKg || weightValue === '') return null
                      const valueKg = weightUnit === 'kg' ? Number(weightValue) : convertWeight(Number(weightValue), 'imperial', 'metric')
                      const low = avgKg * 0.85
                      const high = avgKg * 1.15
                      const status = valueKg >= low && valueKg <= high ? 'green' : (valueKg >= avgKg * 0.75 && valueKg <= avgKg * 1.25 ? 'yellow' : 'red')
                      const toDisplay = (kg: number) => weightUnit === 'kg' ? kg : convertWeight(kg, 'metric', 'imperial')
                      const lowDisp = toDisplay(low)
                      const highDisp = toDisplay(high)
                      const unitLabel = weightUnit
                      return (
                        <div className="text-xs mt-2 flex items-center gap-2">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          <span className="text-muted-foreground">Healthy range for this breed:</span>
                          <span className="font-medium">
                            {formatNumber(lowDisp, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}–{formatNumber(highDisp, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {unitLabel}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="color" tooltip="Describe your pet's appearance. Max 200 characters.">
                      <Palette className="h-4 w-4" />
                      Color / Markings
                    </LabelWithTooltip>
                    <div className="relative">
                      <Textarea
                        id="color"
                        value={formData.color}
                        onChange={(e) => handleFieldChange('color', e.target.value.slice(0, 200))}
                        placeholder={'e.g., "Black and white tuxedo", "Golden retriever with white chest patch", "Tabby with orange stripes"'}
                        rows={3}
                        className="pr-14"
                      />
                      <span className="absolute bottom-2 right-2 text-[11px] text-muted-foreground">{charCount(formData.color)}/200</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip 
                      htmlFor="adoptionDate"
                      tooltip="The date when you adopted your pet. Celebrate adoption anniversaries!"
                    >
                      <Calendar className="h-4 w-4" />
                      Adoption Date
                    </LabelWithTooltip>
                    <Input
                      id="adoptionDate"
                      type="date"
                      value={formData.adoptionDate}
                      onChange={(e) => handleFieldChange("adoptionDate", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="spayedNeutered"
                      checked={formData.spayedNeutered}
                      onChange={(e) => handleFieldChange("spayedNeutered", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <LabelWithTooltip 
                      htmlFor="spayedNeutered"
                      tooltip="Indicates if your pet has been spayed or neutered. Important for health records."
                    >
                      <Shield className="h-4 w-4" />
                      Spayed/Neutered
                    </LabelWithTooltip>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="dislikes" tooltip="Helps caregivers/pet sitters know potential triggers.">
                    Dislikes
                  </LabelWithTooltip>
                  <div className="relative">
                    <Textarea
                      id="dislikes"
                      rows={3}
                      value={formData.dislikes || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dislikes: e.target.value.slice(0, 300) }))}
                      placeholder="Loud noises, vacuum cleaner, baths, car rides"
                      className="pr-14"
                    />
                    <span className="absolute bottom-2 right-2 text-[11px] text-muted-foreground">{Array.from(formData.dislikes || '').length}/300</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="specialNeeds" tooltip="Important for emergencies: meds, mobility aids, sensory issues, etc.">
                    Special Needs
                  </LabelWithTooltip>
                  <div className="relative">
                    <Textarea
                      id="specialNeeds"
                      rows={4}
                      value={formData.specialNeeds}
                      onChange={(e) => handleFieldChange('specialNeeds', e.target.value.slice(0, 500))}
                      placeholder="Requires daily medication for arthritis, needs ramp for stairs, hearing impaired — approach slowly"
                      className="pr-14"
                    />
                    <span className="absolute bottom-2 right-2 text-[11px] text-muted-foreground">{charCount(formData.specialNeeds)}/500</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="allergies" tooltip="Select common allergies and assign severity. Add rare allergies with the custom field.">
                    <AlertCircle className="h-4 w-4" /> Allergies & Severity
                  </LabelWithTooltip>
                  <div className="flex flex-wrap gap-2">
                    {['Chicken','Beef','Dairy','Wheat','Corn','Soy','Flea allergies','Environmental allergies'].map((name) => {
                      const selected = formData.allergies.some((a) => a.toLowerCase() === name.toLowerCase())
                      return (
                        <button
                          key={name}
                          type="button"
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${selected ? 'bg-primary text-primary-foreground border-transparent' : 'border-input hover:bg-accent'}`}
                          onClick={() => {
                            const exists = formData.allergies.some((a) => a.toLowerCase() === name.toLowerCase())
                            if (exists) {
                              const next = formData.allergies.filter((a) => a.toLowerCase() !== name.toLowerCase())
                              const severities = { ...formData.allergySeverities }
                              delete severities[name]
                              setFormData({ ...formData, allergies: next, allergySeverities: severities })
                            } else {
                              setFormData({ ...formData, allergies: [...formData.allergies, name], allergySeverities: { ...formData.allergySeverities, [name]: 'mild' } })
                            }
                          }}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add custom allergy (e.g., Lamb)"
                      value={(formData as any)._customAllergy || ''}
                      onChange={(e) => setFormData((prev) => ({ ...(prev as any), _customAllergy: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = ((formData as any)._customAllergy || '').trim()
                          if (val) {
                            const exists = formData.allergies.some((a) => a.toLowerCase() === val.toLowerCase())
                            if (!exists) setFormData({ ...formData, allergies: [...formData.allergies, val], allergySeverities: { ...formData.allergySeverities, [val]: 'mild' }, _customAllergy: '' } as any)
                          }
                        }
                      }}
                      className="max-w-sm"
                    />
                    <Button type="button" onClick={() => {
                      const val = ((formData as any)._customAllergy || '').trim()
                      if (!val) return
                      const exists = formData.allergies.some((a) => a.toLowerCase() === val.toLowerCase())
                      if (!exists) setFormData({ ...formData, allergies: [...formData.allergies, val], allergySeverities: { ...formData.allergySeverities, [val]: 'mild' }, _customAllergy: '' } as any)
                    }}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  {formData.allergies.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {formData.allergies.map((name) => {
                        const sev = formData.allergySeverities[name] || 'mild'
                        const color = sev === 'severe' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : sev === 'moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        return (
                          <div key={name} className={`flex items-center justify-between p-2 rounded ${color}`}>
                            <div className="flex items-center gap-2 text-xs font-medium">
                              {name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Select value={sev} onValueChange={(v: 'mild'|'moderate'|'severe') => setFormData((prev) => ({ ...prev, allergySeverities: { ...prev.allergySeverities, [name]: v } }))}>
                                <SelectTrigger className="h-8 w-[130px] bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mild">Mild</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="severe">Severe</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button type="button" variant="ghost" size="icon" onClick={() => {
                                const next = formData.allergies.filter((a) => a.toLowerCase() !== name.toLowerCase())
                                const severities = { ...formData.allergySeverities }
                                delete severities[name]
                                setFormData({ ...formData, allergies: next, allergySeverities: severities })
                              }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="bio"
                    tooltip="Write a short biography about your pet. Share their personality, likes, and quirks!"
                  >
                    Bio
                  </LabelWithTooltip>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                    placeholder="Tell us about your pet's personality, likes, and quirks..."
                    rows={4}
                    className={`resize-none ${errors.bio ? "border-destructive" : ""}`}
                  />
                  {errors.bio && <ErrorText>{errors.bio}</ErrorText>}
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/1000 characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Controls
            </CardTitle>
            <CardDescription>Decide who can view or interact with this pet profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor="privacyVisibility"
                tooltip="Choose who is allowed to view this pet's profile, photos, and activity."
              >
                <Eye className="h-4 w-4" />
                Profile Visibility
              </LabelWithTooltip>
              <PrivacySelector
                value={formData.privacyVisibility}
                onChange={(value) => handleFieldChange("privacyVisibility", value)}
              />
              <p className="text-xs text-muted-foreground">
                Followers-only makes this pet visible to people who already follow you. Private keeps the profile for you only.
              </p>
            </div>

            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor="privacyInteractions"
                tooltip="Control who can follow, react to, or otherwise engage with this pet."
              >
                <Lock className="h-4 w-4" />
                Interaction Access
              </LabelWithTooltip>
              <PrivacySelector
                value={formData.privacyInteractions}
                onChange={(value) => handleFieldChange("privacyInteractions", value)}
              />
              <p className="text-xs text-muted-foreground">
                Limit interactions to existing followers or keep them private if you want to manage engagement tightly.
              </p>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements & Milestones
              </CardTitle>
              <CardDescription>Celebrate your pet&apos;s standout moments and special recognitions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.achievements.length > 0 ? (
                formData.achievements.map((achievement, index) => (
                  <Card key={achievement.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Achievement {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAchievement(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <LabelWithTooltip
                            htmlFor={`achievement-title-${achievement.id}`}
                            tooltip='Give this achievement a memorable title. For example: "Agility Champion".'
                          >
                            Title
                          </LabelWithTooltip>
                          <Input
                            id={`achievement-title-${achievement.id}`}
                            value={achievement.title}
                            onChange={(e) => updateAchievement(index, "title", e.target.value)}
                            placeholder="e.g., Therapy Dog Certified"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip
                            htmlFor={`achievement-icon-${achievement.id}`}
                            tooltip="Use an emoji or short symbol to represent this achievement."
                          >
                            Icon
                          </LabelWithTooltip>
                          <Input
                            id={`achievement-icon-${achievement.id}`}
                            value={achievement.icon}
                            onChange={(e) => updateAchievement(index, "icon", e.target.value)}
                            placeholder="🏆"
                            className="h-10"
                            maxLength={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip
                            htmlFor={`achievement-date-${achievement.id}`}
                            tooltip="When did your pet earn this achievement? Use an approximate date if needed."
                          >
                            Earned Date
                          </LabelWithTooltip>
                          <Input
                            id={`achievement-date-${achievement.id}`}
                            type="date"
                            value={achievement.earnedAt}
                            onChange={(e) => updateAchievement(index, "earnedAt", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <LabelWithTooltip tooltip="Helps group achievements on the profile.">
                            Category
                          </LabelWithTooltip>
                          <Select
                            value={achievement.type || "milestone"}
                            onValueChange={(value: AchievementCategory) => updateAchievement(index, "type", value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ACHIEVEMENT_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">{option.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <LabelWithTooltip
                            htmlFor={`achievement-description-${achievement.id}`}
                            tooltip="Share what made this moment special. Include details like scores, milestones, or people involved."
                          >
                            Description
                          </LabelWithTooltip>
                          <Textarea
                            id={`achievement-description-${achievement.id}`}
                            value={achievement.description}
                            onChange={(e) => updateAchievement(index, "description", e.target.value)}
                            placeholder="Describe what your pet accomplished and why it matters."
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-dashed bg-muted/40 px-3 py-3">
                            <div>
                              <p className="text-sm font-medium">Feature as special highlight</p>
                              <p className="text-xs text-muted-foreground">
                                Highlighted achievements appear more prominently on the pet profile.
                              </p>
                            </div>
                            <Switch
                              checked={Boolean(achievement.highlight)}
                              onCheckedChange={(value) => updateAchievement(index, "highlight", value)}
                              aria-label="Toggle highlight for this achievement"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No achievements yet. Add milestones or badges to share your pet&apos;s story.
                </div>
              )}
              <Button type="button" variant="outline" onClick={addAchievement} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Achievement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

          {/* Personality Tab - Continue with remaining tabs */}
          {/* Due to length limits, I'll continue in a follow-up message if needed */}
          {/* For now, I'll add the submit buttons and remaining structure */}
          
          {/* Personality Tab */}
          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Personality Traits
                </CardTitle>
                <CardDescription>Rate your pet's personality characteristics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="energyLevel"
                    tooltip="Rate your pet's energy level from 1 (very calm) to 5 (very energetic)."
                  >
                    <Zap className="h-4 w-4" />
                    Energy Level (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.energyLevel.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, energyLevel: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="friendliness"
                    tooltip="Rate how friendly and social your pet is with people and other animals."
                  >
                    <Heart className="h-4 w-4" />
                    Friendliness (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.friendliness.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, friendliness: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="playfulness"
                    tooltip="How playful is your pet? Rate from 1 (not very playful) to 5 (very playful)."
                  >
                    <Gamepad2 className="h-4 w-4" />
                    Playfulness (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.playfulness.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, playfulness: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="trainability"
                    tooltip="How easy is your pet to train? Rate from 1 (difficult) to 5 (very easy)."
                  >
                    <GraduationCap className="h-4 w-4" />
                    Trainability (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.trainability.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, trainability: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="independence"
                    tooltip="How independent is your pet? Rate from 1 (needs constant attention) to 5 (very independent)."
                  >
                    <Target className="h-4 w-4" />
                    Independence (1-5)
                  </LabelWithTooltip>
                  <Select
                    value={formData.personality.independence.toString()}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        personality: { ...formData.personality, independence: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 },
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="traits"
                    tooltip="Select up to 10 traits that best describe your pet. Add your own custom traits if needed."
                  >
                    Personality & Temperament (max {MAX_TRAITS})
                  </LabelWithTooltip>

                  {/* Predefined trait chips */}
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TRAITS.map((t) => {
                      const selected = formData.personality.traits.some((v) => v.toLowerCase() === t.label.toLowerCase())
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleTrait(t.label)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? `${t.color} border-transparent` : 'border-input hover:bg-accent'} ${formData.personality.traits.length >= MAX_TRAITS && !selected ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-pressed={selected}
                          disabled={formData.personality.traits.length >= MAX_TRAITS && !selected}
                          title={t.warn ? 'Aggressive — consider adding context' : t.label}
                        >
                          <span className="inline-flex items-center gap-1">
                            {t.warn && <AlertTriangle className="h-3 w-3" />}
                            {t.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom trait input */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add custom trait (e.g., Water-loving)"
                      value={(formData as any)._customTrait || ''}
                      onChange={(e) => setFormData((prev) => ({ ...(prev as any), _customTrait: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = ((formData as any)._customTrait || '').trim()
                          if (val) {
                            addTrait(val)
                            setFormData((prev) => ({ ...(prev as any), _customTrait: '' }))
                          }
                        }
                      }}
                      disabled={formData.personality.traits.length >= MAX_TRAITS}
                      className="max-w-sm"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const val = ((formData as any)._customTrait || '').trim()
                        if (val) {
                          addTrait(val)
                          setFormData((prev) => ({ ...(prev as any), _customTrait: '' }))
                        }
                      }}
                      disabled={formData.personality.traits.length >= MAX_TRAITS}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Tip: Select up to {MAX_TRAITS} traits. Add unique traits with the custom field.</p>

                  {/* Selected traits display */}
                  {formData.personality.traits.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.personality.traits.map((trait) => {
                        const preset = PREDEFINED_TRAITS.find((t) => t.label.toLowerCase() === trait.toLowerCase())
                        const color = preset?.color || 'bg-secondary text-secondary-foreground'
                        return (
                          <span key={trait} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                            {preset?.warn && <AlertTriangle className="h-3 w-3" />}
                            {trait}
                            <button type="button" onClick={() => removeTrait(trait)} className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5" aria-label={`Remove ${trait}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos & Gallery Tab */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Primary Photo
                </CardTitle>
                <CardDescription>Upload a square photo (500x500px minimum). This will be your pet's main profile photo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-[200px] h-[200px] rounded-lg overflow-hidden bg-muted border flex items-center justify-center">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Primary" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No primary photo</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button type="button" variant="outline" onClick={() => document.getElementById('pet-primary-upload')?.click()}>
                        Choose Photo
                      </Button>
                      {formData.avatar && (
                        <Button type="button" variant="outline" onClick={() => setIsPrimaryEditorOpen(true)}>
                          Edit & Crop
                        </Button>
                      )}
                      {formData.avatar && (
                        <Button type="button" variant="ghost" onClick={() => setFormData((p) => ({ ...p, avatar: undefined }))}>
                          Remove
                        </Button>
                      )}
                    </div>
                    {primaryUploadProgress > 0 && primaryUploadProgress < 100 && (
                      <div className="space-y-1 w-full max-w-sm">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Uploading primary photo…</span>
                          <span aria-live="polite">{primaryUploadProgress}%</span>
                        </div>
                        <Progress value={primaryUploadProgress} />
                      </div>
                    )}
                    <input id="pet-primary-upload" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      // open editor for supported formats, otherwise direct upload
                      openPrimaryEditorFromFile(file)
                      e.currentTarget.value = ''
                    }} />
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or HEIC up to 10MB.</p>
                  </div>
                  {errors.avatar && (
                    <div className="text-sm text-destructive">{errors.avatar}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Avatar Editor */}
            {isPrimaryEditorOpen && tempPrimarySrc && (
              <AvatarEditor
                imageSrc={tempPrimarySrc}
                isOpen={isPrimaryEditorOpen}
                onClose={() => { setIsPrimaryEditorOpen(false); setTempPrimarySrc('') }}
                onSave={handlePrimaryCroppedSave}
                minWidth={500}
                minHeight={500}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Upload More Photos
                </CardTitle>
                <CardDescription>Up to {maxPhotos} photos per pet. Drag to reorder; first photo becomes primary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('pet-gallery-upload')?.click()} disabled={!canAddMorePhotos}>
                    Select Photos
                  </Button>
                  {!canAddMorePhotos && (
                    <span className="text-xs text-muted-foreground">Maximum reached</span>
                  )}
                </div>
                <input id="pet-gallery-upload" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden" onChange={(e) => { if (e.target.files) handleAdditionalFiles(e.target.files); e.currentTarget.value = '' }} />

                {/* Upload queue */}
                {uploadingItems.length > 0 && (
                  <div className="space-y-2">
                    {uploadingItems.map((it) => (
                      <div key={it.id} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted overflow-hidden flex items-center justify-center">
                          {it.preview ? <img src={it.preview} alt="preview" className="h-full w-full object-cover" /> : <span className="text-[10px] text-muted-foreground">img</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="truncate">{it.name}</span>
                            <span>{it.progress}%</span>
                          </div>
                          <Progress value={it.progress} />
                          {it.error && <p className="text-xs text-destructive mt-1">{it.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gallery grid with drag-and-drop */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.photos.map((url, idx) => (
                      <div key={url} className="border rounded-lg p-2 space-y-2 bg-card" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(idx))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const from = Number(e.dataTransfer.getData('text/plain')); if (!Number.isNaN(from)) movePhoto(from, idx) }}>
                        <div className="aspect-square rounded overflow-hidden relative">
                          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">Primary</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => movePhoto(idx, 0)}>Set Primary</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removePhoto(idx)}>Remove</Button>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`caption-${idx}`} className="text-xs">Caption</Label>
                          <Input id={`caption-${idx}`} value={formData.photoCaptions[url] || ''} onChange={(e) => setFormData((prev) => ({ ...prev, photoCaptions: { ...prev.photoCaptions, [url]: e.target.value.slice(0, 120) } }))} placeholder='e.g., "First day home!"' />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Identification Tab */}
          <TabsContent value="id" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" /> Microchip & Identification
                </CardTitle>
                <CardDescription>Identification details to help with recovery and vet visits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="microchipId" tooltip="Optional but recommended. Typically a 15-digit number.">
                      Microchip ID
                    </LabelWithTooltip>
                    <Input
                      id="microchipId"
                      inputMode="numeric"
                      pattern="\\d*"
                      value={formData.microchipId}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        handleFieldChange('microchipId', val)
                      }}
                      placeholder="15-digit number"
                      className={`h-10 ${errors.microchipId ? 'border-destructive' : ''}`}
                    />
                    {errors.microchipId && <ErrorText>{errors.microchipId}</ErrorText>}
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="microchipCompany" tooltip="Select the microchip manufacturer.">
                      Microchip Company
                    </LabelWithTooltip>
                    <Select
                      value={formData.microchipCompany || ''}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, microchipCompany: value }))}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Avid','HomeAgain','AKC Reunite','PetLink','24PetWatch','Other'].map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.microchipCompany === 'Other' && (
                      <div className="mt-2">
                        <Input
                          placeholder="Enter company name"
                          value={formData.microchipCompanyOther || ''}
                          onChange={(e) => {
                            setFormData((prev) => ({ ...prev, microchipCompanyOther: e.target.value }))
                            const err = validateField('microchipCompanyOther', e.target.value)
                            setErrors((prev) => ({ ...prev, microchipCompanyOther: err }))
                          }}
                          className={`${errors.microchipCompanyOther ? 'border-destructive' : ''}`}
                        />
                        {errors.microchipCompanyOther && <ErrorText>{errors.microchipCompanyOther}</ErrorText>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="registrationStatus" tooltip="Is the microchip registered in a recovery database?">
                      Registration Status
                    </LabelWithTooltip>
                    <Select
                      value={formData.microchipRegistrationStatus || 'unknown'}
                      onValueChange={(value: 'registered' | 'not_registered' | 'unknown') => setFormData((prev) => ({ ...prev, microchipRegistrationStatus: value }))}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="not_registered">Not Registered</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <LabelWithTooltip htmlFor="collarTagId" tooltip="Custom identifier engraved on your pet's collar tag.">
                      Collar Tag ID
                    </LabelWithTooltip>
                    <Input
                      id="collarTagId"
                      value={formData.collarTagId || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, collarTagId: e.target.value }))}
                      placeholder="e.g., REX-2025"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="microchipCert" tooltip="Upload a PDF or image of the official microchip certificate.">
                    Microchip Certificate
                  </LabelWithTooltip>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button type="button" variant="outline" onClick={() => document.getElementById('microchip-cert-input')?.click()}>
                      Choose File
                    </Button>
                    {formData.microchipCertificateUrl && (
                      <a href={formData.microchipCertificateUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                        View current certificate
                      </a>
                    )}
                  </div>
                  <input
                    id="microchip-cert-input"
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const { uploadFileWithProgress } = await import('@/lib/utils/upload-signed')
                        const res = await uploadFileWithProgress({ file, folder: 'pets/docs' })
                        setFormData((prev) => ({ ...prev, microchipCertificateUrl: res.url }))
                      } catch (err: any) {
                        alert(err?.message || 'Failed to upload certificate')
                      } finally {
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">Accepted: PDF, JPG, PNG. Max 10MB.</p>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="policyNumberIdTab" tooltip="Optional policy number for quick reference during vet visits.">
                    Insurance Policy Number
                  </LabelWithTooltip>
                  <Input
                    id="policyNumberIdTab"
                    value={formData.insurance.policyNumber}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, policyNumber: e.target.value } })}
                    placeholder="Policy number"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Favorite Things
                </CardTitle>
                <CardDescription>What your pet loves most</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="fav-toys" tooltip="List toys separated by commas (max 200 chars). Examples: Squeaky ball, rope toy, laser pointer">
                    <Gamepad2 className="h-4 w-4" /> Favorite Toys
                  </LabelWithTooltip>
                  <div className="relative">
                    <Input
                      id="fav-toys"
                      value={((formData as any)._toysText) ?? (formData.favoriteThings.toys.join(', '))}
                      onChange={(e) => {
                        const text = e.target.value.slice(0, 200)
                        setFormData((prev) => {
                          const parts = text.split(',').map((s) => s.trim()).filter(Boolean)
                          return { ...prev, favoriteThings: { ...prev.favoriteThings, toys: parts }, _toysText: text } as any
                        })
                      }}
                      placeholder="Squeaky ball, rope toy, laser pointer"
                      className="h-10 pr-14"
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">{Array.from((((formData as any)._toysText) ?? (formData.favoriteThings.toys.join(', ')))).length}/200</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="activities" tooltip="Select your pet's favorite activities. Add custom ones if needed.">
                    <Activity className="h-4 w-4" /> Favorite Activities
                  </LabelWithTooltip>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      'Playing fetch', 'Going for walks', 'Swimming', 'Cuddling', 'Chasing toys', 'Watching TV', 'Sunbathing', 'Exploring', 'Running', 'Hiding', 'Climbing', 'Playing with other pets',
                    ].map((label) => {
                      const checked = formData.favoriteThings.activities.some((a) => a.toLowerCase() === label.toLowerCase())
                      return (
                        <label key={label} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(formData.favoriteThings.activities)
                              if (e.target.checked) next.add(label)
                              else next.delete(label)
                              setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, activities: Array.from(next) } })
                            }}
                          />
                          <span>{label}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add custom activity (e.g., Agility)"
                      value={(formData as any)._customActivity || ''}
                      onChange={(e) => setFormData((prev) => ({ ...(prev as any), _customActivity: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = ((formData as any)._customActivity || '').trim()
                          if (val) {
                            const exists = formData.favoriteThings.activities.some((a) => a.toLowerCase() === val.toLowerCase())
                            if (!exists) setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, activities: [...formData.favoriteThings.activities, val] }, _customActivity: '' } as any)
                          }
                        }
                      }}
                      className="max-w-sm"
                    />
                    <Button type="button" onClick={() => {
                      const val = ((formData as any)._customActivity || '').trim()
                      if (!val) return
                      const exists = formData.favoriteThings.activities.some((a) => a.toLowerCase() === val.toLowerCase())
                      if (!exists) setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, activities: [...formData.favoriteThings.activities, val] }, _customActivity: '' } as any)
                    }}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="places"
                    tooltip="Where does your pet love to be?"
                  >
                    <Home className="h-4 w-4" />
                    Favorite Places
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.favoriteThings.places}
                    onChange={(value) => setFormData({ ...formData, favoriteThings: { ...formData.favoriteThings, places: value } })}
                    placeholder="Add favorite places"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="fav-treats" tooltip="List favorite treats separated by commas (max 200 chars). Examples: Peanut butter, carrots, dental chews">
                    <Apple className="h-4 w-4" /> Favorite Treats
                  </LabelWithTooltip>
                  <div className="relative">
                    <Input
                      id="fav-treats"
                      value={((formData as any)._treatsText) ?? (formData.favoriteThings.foods.join(', '))}
                      onChange={(e) => {
                        const text = e.target.value.slice(0, 200)
                        setFormData((prev) => {
                          const parts = text.split(',').map((s) => s.trim()).filter(Boolean)
                          return { ...prev, favoriteThings: { ...prev.favoriteThings, foods: parts }, _treatsText: text } as any
                        })
                      }}
                      placeholder="Peanut butter, carrots, dental chews"
                      className="h-10 pr-14"
                    />
                    <span className="absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">{Array.from((((formData as any)._treatsText) ?? (formData.favoriteThings.foods.join(', ')))).length}/200</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diet Tab */}
          <TabsContent value="diet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Diet & Nutrition
                </CardTitle>
                <CardDescription>Feeding information and dietary preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="foodBrand"
                    tooltip="The brand of food you feed your pet."
                  >
                    Food Brand
                  </LabelWithTooltip>
                  <Input
                    id="foodBrand"
                    value={formData.dietInfo.foodBrand}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, foodBrand: e.target.value } })}
                    placeholder="e.g., Blue Buffalo, Royal Canin"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="foodType"
                    tooltip="Type of food (e.g., Dry Kibble, Wet Food, Raw Diet)."
                  >
                    Food Type
                  </LabelWithTooltip>
                  <Input
                    id="foodType"
                    value={formData.dietInfo.foodType}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, foodType: e.target.value } })}
                    placeholder="e.g., Dry Kibble (Adult Large Breed)"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="portionSize"
                    tooltip="How much food does your pet eat per day?"
                  >
                    Portion Size
                  </LabelWithTooltip>
                  <Input
                    id="portionSize"
                    value={formData.dietInfo.portionSize}
                    onChange={(e) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, portionSize: e.target.value } })}
                    placeholder="e.g., 3 cups per day"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="feedingSchedule"
                    tooltip="Schedule when you feed your pet throughout the day."
                  >
                    Feeding Schedule
                  </LabelWithTooltip>
                  <div className="space-y-2">
                    {formData.dietInfo.feedingSchedule.map((schedule, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={schedule}
                          onChange={(e) => updateFeedingSchedule(index, e.target.value)}
                          placeholder="e.g., 8:00 AM - 1.5 cups"
                          className="h-10"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeFeedingSchedule(index)}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addFeedingSchedule} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feeding Time
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="treats"
                    tooltip="What treats does your pet enjoy?"
                  >
                    Treats
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.dietInfo.treats}
                    onChange={(value) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, treats: value } })}
                    placeholder="Add treats"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="restrictions"
                    tooltip="Any dietary restrictions or foods to avoid."
                  >
                    <AlertCircle className="h-4 w-4" />
                    Dietary Restrictions
                  </LabelWithTooltip>
                  <ArrayTagInput
                    value={formData.dietInfo.restrictions}
                    onChange={(value) => setFormData({ ...formData, dietInfo: { ...formData.dietInfo, restrictions: value } })}
                    placeholder="Add dietary restrictions"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Veterinarian Information
                </CardTitle>
                <CardDescription>Your pet's veterinary clinic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="clinicName"
                    tooltip="Name of your pet's veterinary clinic."
                  >
                    Clinic Name
                  </LabelWithTooltip>
                  <Input
                    id="clinicName"
                    value={formData.vetInfo.clinicName}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, clinicName: e.target.value } })}
                    placeholder="Veterinary clinic name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="veterinarianName"
                    tooltip="Your pet's primary veterinarian."
                  >
                    Veterinarian Name
                  </LabelWithTooltip>
                  <Input
                    id="veterinarianName"
                    value={formData.vetInfo.veterinarianName}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, veterinarianName: e.target.value } })}
                    placeholder="Dr. Name, DVM"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="vetPhone"
                    tooltip="Veterinary clinic phone number."
                  >
                    <Phone className="h-4 w-4" />
                    Phone
                  </LabelWithTooltip>
                  <Input
                    id="vetPhone"
                    value={formData.vetInfo.phone}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, phone: e.target.value } })}
                    placeholder="(555) 123-4567"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="vetAddress"
                    tooltip="Veterinary clinic address."
                  >
                    <MapPin className="h-4 w-4" />
                    Address
                  </LabelWithTooltip>
                  <Input
                    id="vetAddress"
                    value={formData.vetInfo.address}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, address: e.target.value } })}
                    placeholder="Clinic address"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="emergencyContact"
                    tooltip="24/7 emergency contact for your pet."
                  >
                    Emergency Contact
                  </LabelWithTooltip>
                  <Input
                    id="emergencyContact"
                    value={formData.vetInfo.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, vetInfo: { ...formData.vetInfo, emergencyContact: e.target.value } })}
                    placeholder="24/7 Emergency line"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Insurance Information
                </CardTitle>
                <CardDescription>Pet insurance policy details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="provider"
                    tooltip="Your pet insurance provider."
                  >
                    Insurance Provider
                  </LabelWithTooltip>
                  <Input
                    id="provider"
                    value={formData.insurance.provider}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, provider: e.target.value } })}
                    placeholder="Insurance company name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="policyNumber"
                    tooltip="Your pet insurance policy number."
                  >
                    Policy Number
                  </LabelWithTooltip>
                  <Input
                    id="policyNumber"
                    value={formData.insurance.policyNumber}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, policyNumber: e.target.value } })}
                    placeholder="Policy number"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="coverage"
                    tooltip="Coverage details of your pet insurance."
                  >
                    Coverage
                  </LabelWithTooltip>
                  <Input
                    id="coverage"
                    value={formData.insurance.coverage}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, coverage: e.target.value } })}
                    placeholder="Coverage details"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <LabelWithTooltip 
                    htmlFor="expiryDate"
                    tooltip="When does your pet insurance expire?"
                  >
                    <Calendar className="h-4 w-4" />
                    Expiry Date
                  </LabelWithTooltip>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.insurance.expiryDate}
                    onChange={(e) => setFormData({ ...formData, insurance: { ...formData.insurance, expiryDate: e.target.value } })}
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Vaccinations
                </CardTitle>
                <CardDescription>Vaccination history and records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.vaccinations.map((vaccination, index) => (
                  <Card key={vaccination.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Vaccination {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeVaccination(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Vaccine Name</Label>
                          <Input
                            value={vaccination.name}
                            onChange={(e) => updateVaccination(index, "name", e.target.value)}
                            placeholder="e.g., Rabies, DHPP"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date Given</Label>
                          <Input
                            type="date"
                            value={vaccination.date}
                            onChange={(e) => updateVaccination(index, "date", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Next Due Date</Label>
                          <Input
                            type="date"
                            value={vaccination.nextDue || ""}
                            onChange={(e) => updateVaccination(index, "nextDue", e.target.value || undefined)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Veterinarian</Label>
                          <Input
                            value={vaccination.veterinarian || ""}
                            onChange={(e) => updateVaccination(index, "veterinarian", e.target.value || undefined)}
                            placeholder="Dr. Name"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Batch Number</Label>
                          <Input
                            value={vaccination.batchNumber || ""}
                            onChange={(e) => updateVaccination(index, "batchNumber", e.target.value || undefined)}
                            placeholder="Batch number"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addVaccination} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vaccination
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications
                </CardTitle>
                <CardDescription>Current and past medications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.medications.map((medication, index) => (
                  <Card key={medication.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Medication {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeMedication(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Medication Name</Label>
                          <Input
                            value={medication.name}
                            onChange={(e) => updateMedication(index, "name", e.target.value)}
                            placeholder="e.g., Heartgard Plus"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Dosage</Label>
                          <Input
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                            placeholder="e.g., 51-100 lbs tablet"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Purpose</Label>
                          <Input
                            value={medication.purpose || ''}
                            onChange={(e) => updateMedication(index, 'purpose', e.target.value)}
                            placeholder="e.g., Heartworm prevention"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Input
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                            placeholder="e.g., Once monthly"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={medication.startDate}
                            onChange={(e) => updateMedication(index, "startDate", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={medication.endDate || ""}
                            onChange={(e) => updateMedication(index, "endDate", e.target.value || undefined)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prescribed By</Label>
                          <Input
                            value={medication.prescribedBy || ""}
                            onChange={(e) => updateMedication(index, "prescribedBy", e.target.value || undefined)}
                            placeholder="Dr. Name"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={medication.notes || ""}
                            onChange={(e) => updateMedication(index, "notes", e.target.value || undefined)}
                            placeholder="Additional notes"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addMedication} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Pre-existing Conditions
                </CardTitle>
                <CardDescription>Select relevant conditions and add diagnosis details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {COMMON_CONDITIONS.map((label) => {
                    const selected = hasCondition(label)
                    return (
                      <label key={label} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) addCondition(label)
                            else {
                              const c = formData.conditions.find((x) => x.name.toLowerCase() === label.toLowerCase())
                              if (c) removeCondition(c.id)
                            }
                          }}
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add other condition (e.g., Hypothyroidism)"
                    value={(formData as any)._customCondition || ''}
                    onChange={(e) => setFormData((prev) => ({ ...(prev as any), _customCondition: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = ((formData as any)._customCondition || '').trim()
                        if (val) {
                          addCondition(val)
                          setFormData((prev) => ({ ...(prev as any), _customCondition: '' }))
                        }
                      }
                    }}
                    className="max-w-sm"
                  />
                  <Button type="button" onClick={() => {
                    const val = ((formData as any)._customCondition || '').trim()
                    if (!val) return
                    addCondition(val)
                    setFormData((prev) => ({ ...(prev as any), _customCondition: '' }))
                  }}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {formData.conditions.length > 0 && (
                  <div className="space-y-3">
                    {formData.conditions.map((cond, i) => (
                      <Card key={cond.id} className="border-l-4 border-amber-400">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold">{cond.name}</h4>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCondition(cond.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Date Diagnosed</Label>
                              <Input
                                type="date"
                                value={cond.diagnosedAt || ''}
                                onChange={(e) => updateCondition(cond.id, 'diagnosedAt', e.target.value)}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Notes</Label>
                              <Textarea
                                rows={2}
                                value={cond.notes || ''}
                                onChange={(e) => updateCondition(cond.id, 'notes', e.target.value)}
                                placeholder="Additional details, flare-up patterns, vet recommendations"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Records
                </CardTitle>
                <CardDescription>Medical history and checkups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.healthRecords.map((record, index) => (
                  <Card key={record.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Health Record {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeHealthRecord(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={record.date}
                            onChange={(e) => updateHealthRecord(index, "date", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={record.type}
                            onValueChange={(value) => updateHealthRecord(index, "type", value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checkup">Checkup</SelectItem>
                              <SelectItem value="illness">Illness</SelectItem>
                              <SelectItem value="injury">Injury</SelectItem>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Title</Label>
                          <Input
                            value={record.title}
                            onChange={(e) => updateHealthRecord(index, "title", e.target.value)}
                            placeholder="e.g., Annual Wellness Exam"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={record.description}
                            onChange={(e) => updateHealthRecord(index, "description", e.target.value)}
                            placeholder="Record details"
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Veterinarian</Label>
                          <Input
                            value={record.veterinarian || ""}
                            onChange={(e) => updateHealthRecord(index, "veterinarian", e.target.value || undefined)}
                            placeholder="Dr. Name"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addHealthRecord} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Health Record
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bio & Story Tab */}
          <TabsContent value="bio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Bio & Story
                </CardTitle>
                <CardDescription>Tell your pet's story (how you met, rescue story, funny quirks, favorite memories)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="bioRich" tooltip="Supports bold, italic, emoji, line breaks, @mentions and #hashtags. Max 1000 characters (plain text).">
                    Pet Bio
                  </LabelWithTooltip>
                  <div className="space-y-1">
                    <BlockEditor
                      content={formData.bio || ''}
                      onChange={(html) => {
                        // derive plain text length for 1000 char limit
                        const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
                        const limited = Array.from(text).slice(0, 1000).join('')
                        // If exceeded, trim and also trim html to prevent runaway
                        const overLimit = Array.from(text).length > 1000
                        setFormData((prev) => ({ ...prev, bio: overLimit ? limited : text }))
                      }}
                      placeholder="Write your pet's story... Use @ to mention friends and # for hashtags like #rescuedog"
                    />
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      <span>{charCount(formData.bio || '')}/1000</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="text-sm font-medium">Public Profile</div>
                      <div className="text-xs text-muted-foreground">Make this pet visible to others</div>
                    </div>
                    <Switch
                      checked={formData.privacyVisibility === 'public'}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, privacyVisibility: checked ? 'public' : 'private' }))}
                    />
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="text-sm font-medium">Featured Pet</div>
                      <div className="text-xs text-muted-foreground">Highlight this pet on your profile</div>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(formData.isFeatured)}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Review & Submit
                </CardTitle>
                <CardDescription>Check your details before creating the pet profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Name</div>
                    <div className="font-medium">{formData.name || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Species / Breed</div>
                    <div className="font-medium">{formData.species}{formData.breed ? ` • ${formData.breed}` : ''}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Gender & Age</div>
                    <div className="font-medium capitalize">{formData.gender || 'unknown'}{formData.age ? ` • ${formData.age}y` : ''}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Color / Markings</div>
                    <div className="font-medium">{formData.color || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Microchip</div>
                    <div className="font-medium">{formData.microchipId || '—'}{formData.microchipCompany ? ` • ${formData.microchipCompany}` : ''}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Vet Clinic</div>
                    <div className="font-medium">{formData.vetInfo.clinicName || '—'}{formData.vetInfo.phone ? ` • ${formData.vetInfo.phone}` : ''}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Allergies</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.allergies.length > 0 ? formData.allergies.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">{a} ({formData.allergySeverities[a] || 'mild'})</span>
                    )) : <span className="text-sm">—</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Medications</div>
                  <div className="text-sm">{formData.medications.length} item(s)</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Conditions</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.conditions.length > 0 ? formData.conditions.map((c) => (
                      <span key={c.id} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">{c.name}</span>
                    )) : <span className="text-sm">—</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Photos</div>
                  <div className="flex items-center gap-2">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Primary" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                    {formData.photos.length > 1 && (
                      <span className="text-xs text-muted-foreground">+{formData.photos.length - 1} more</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Visibility</div>
                  <div className="text-sm capitalize">{formData.privacyVisibility}</div>
                </div>
                <div className="text-xs text-muted-foreground">When ready, click “Create Pet” to finish.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Training Progress
                </CardTitle>
                <CardDescription>Skills and training milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.trainingProgress.map((training, index) => (
                  <Card key={training.id} className="border-l-4 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">Training {index + 1}</h4>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTrainingProgress(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Skill</Label>
                          <Input
                            value={training.skill}
                            onChange={(e) => updateTrainingProgress(index, "skill", e.target.value)}
                            placeholder="e.g., Basic Obedience"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select
                            value={training.level}
                            onValueChange={(value) => updateTrainingProgress(index, "level", value)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="mastered">Mastered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Started At</Label>
                          <Input
                            type="date"
                            value={training.startedAt}
                            onChange={(e) => updateTrainingProgress(index, "startedAt", e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Completed At</Label>
                          <Input
                            type="date"
                            value={training.completedAt || ""}
                            onChange={(e) => updateTrainingProgress(index, "completedAt", e.target.value || undefined)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={training.notes || ""}
                            onChange={(e) => updateTrainingProgress(index, "notes", e.target.value || undefined)}
                            placeholder="Training notes"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addTrainingProgress} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Record
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Buttons */}
        <div className="mt-6 pt-6">
          <FormActions
            onCancel={onCancel}
            submitLabel={mode === "create" ? "Create Pet" : "Save All Changes"}
            submittingLabel={mode === "create" ? "Creating..." : "Saving..."}
            isSubmitting={isSubmitting}
            fullWidth
            align="right"
          />
        </div>
      </form>
    </TooltipProvider>
  )
}
