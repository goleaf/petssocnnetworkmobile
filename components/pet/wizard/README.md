# Pet Creation Wizard Components

This directory contains the step components for the pet profile creation wizard.

## Step 1: Basic Information

The `Step1BasicInfo` component handles the first step of pet profile creation, collecting essential information about the pet.

### Features

- **Pet Name Input**: Unicode and emoji support with real-time character counter (2-50 characters)
- **Species Selection**: Dropdown with 11 species options, each with emoji icons
- **Breed Autocomplete**: For dogs and cats, fetches 300+ breeds from database with photos
- **Gender Selection**: Radio buttons for Male, Female, Unknown
- **Spayed/Neutered**: Checkbox with informative tooltip
- **Color & Markings**: Textarea with 200 character limit
- **Weight Input**: Number input with lbs/kg unit selector and automatic conversion
- **Healthy Weight Indicator**: Color-coded indicator (green/yellow/red) when breed data available
- **Birth Date Picker**: Calendar picker with age calculation
- **Approximate Age**: Alternative input for years and months when exact date unknown
- **Adoption Date**: Optional calendar picker with "time with you" calculation

### Usage

```tsx
import { Step1BasicInfo } from "@/components/pet/wizard/step1-basic-info"

function MyWizard() {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    spayedNeutered: false,
    weightUnit: "lbs" as const,
  })

  const [errors, setErrors] = useState({})

  return (
    <Step1BasicInfo
      formData={formData}
      onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
      errors={errors}
    />
  )
}
```

### Props

```typescript
interface Step1BasicInfoProps {
  formData: Step1FormData
  onChange: (data: Partial<Step1FormData>) => void
  errors?: Record<string, string>
}

interface Step1FormData {
  name: string
  species: string
  breedId?: string
  breed?: string
  gender?: "male" | "female" | "unknown"
  spayedNeutered: boolean
  color?: string
  markings?: string
  weight?: string
  weightUnit: "lbs" | "kg"
  birthday?: Date
  approximateAge?: {
    years?: number
    months?: number
  }
  adoptionDate?: Date
}
```

### Validation

The component displays inline validation errors passed via the `errors` prop:

```typescript
const errors = {
  name: "Pet name must be at least 2 characters",
  species: "Please select a species"
}
```

### API Dependencies

The component requires the `/api/breeds` endpoint to fetch breed data:

```
GET /api/breeds?species=dog
GET /api/breeds?species=cat
```

Response format:
```json
{
  "breeds": [
    {
      "id": "uuid",
      "name": "Golden Retriever",
      "species": "dog",
      "photoUrl": "https://...",
      "averageWeight": "55-75 lbs"
    }
  ],
  "count": 100
}
```

### Accessibility

- All form fields have proper labels
- Required fields marked with asterisk (*)
- Keyboard navigation supported
- Screen reader friendly
- WCAG 2.1 AA compliant color contrast
- Tooltip for additional information

### Styling

The component uses Tailwind CSS and shadcn/ui components. Custom styles are defined in `app/globals.css`:

```css
label.required::after {
  content: " *";
  color: var(--destructive);
}
```

### Testing

Unit tests are located at `tests/active/components/pet/wizard/step1-basic-info.test.tsx`

Run tests:
```bash
npm run test -- tests/active/components/pet/wizard/step1-basic-info.test.tsx
```

### Example

See `step1-basic-info.example.tsx` for a complete working example with validation and state management.

## Requirements Covered

This component implements the following requirements from the pet-profile-system spec:

- **2.1**: Pet name input with Unicode/emoji support and 2-50 character validation
- **2.2**: Real-time character counter for name field
- **2.3**: Species dropdown with 11 options
- **2.4**: Breed autocomplete for Dog/Cat with 300+ breeds
- **2.5**: Breed photo display in autocomplete suggestions
- **2.6**: Free text breed input for other species
- **2.7**: Gender radio buttons (Male, Female, Unknown)
- **2.8**: Spayed/neutered checkbox with tooltip
- **2.9**: Color/markings textarea with 200 character limit
- **2.10**: Weight input with unit selector and automatic conversion
- **2.10**: Healthy weight range display with color indicators
- **2.10**: Birth date picker with age calculation
- **2.10**: Approximate age fallback option
- **2.10**: Adoption date picker with "time with you" display


## Step 2: Photos & Gallery

The `Step2Photos` component handles photo upload, editing, and gallery management for pet profiles.

### Features

- **Drag-and-Drop Upload**: Visual drop zone with active state feedback
- **Multi-File Upload**: Support for up to 20 photos per pet
- **File Validation**: Type, size, and count validation with error messages
- **Primary Photo**: Required primary photo with automatic selection
- **Gallery Management**: Drag-and-drop reordering with visual feedback
- **Photo Captions**: Optional captions up to 200 characters
- **Photo Editing**: Modal editor with real-time preview
  - Rotation (90° increments)
  - Brightness adjustment (50-150%)
  - Contrast adjustment (50-150%)
  - Filters: None, Vintage, Black & White, Warm, Cool
- **Upload Progress**: Individual progress bars for each photo
- **Memory Management**: Proper cleanup of object URLs

### Usage

```tsx
import { Step2Photos } from "@/components/pet/wizard/step2-photos"

function MyWizard() {
  const [formData, setFormData] = useState({
    photos: [],
    primaryPhotoId: undefined,
  })

  const [errors, setErrors] = useState({})

  return (
    <Step2Photos
      formData={formData}
      onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
      errors={errors}
    />
  )
}
```

### Props

```typescript
interface Step2PhotosProps {
  formData: Step2FormData
  onChange: (data: Partial<Step2FormData>) => void
  errors?: Record<string, string>
}

interface Step2FormData {
  photos: PhotoData[]
  primaryPhotoId?: string
}

interface PhotoData {
  id: string
  file: File
  preview: string
  caption?: string
  uploadProgress?: number
  uploadError?: string
  isUploading?: boolean
  isPrimary?: boolean
  brightness?: number
  contrast?: number
  rotation?: number
  filter?: "none" | "vintage" | "bw" | "warm" | "cool"
}
```

### Validation

File validation rules:
- **Allowed types**: JPEG, JPG, PNG, WebP, HEIC
- **Maximum size**: 10MB per photo
- **Maximum count**: 20 photos per pet
- **Primary photo**: At least one photo required

Error handling:
```typescript
const errors = {
  photos: "At least one photo is required"
}
```

### Dependencies

The component requires the following packages:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --legacy-peer-deps
```

### Photo Editing

The photo editor modal provides:

1. **Rotation Controls**
   - -90° and +90° buttons
   - Visual rotation preview
   - Reset button

2. **Brightness Slider**
   - Range: 50-150%
   - Real-time preview
   - Default: 100%

3. **Contrast Slider**
   - Range: 50-150%
   - Real-time preview
   - Default: 100%

4. **Filter Options**
   - None (default)
   - Vintage (sepia + desaturate)
   - Black & White (grayscale)
   - Warm (sepia + saturate)
   - Cool (hue-rotate + desaturate)

### Drag-and-Drop

The gallery supports drag-and-drop reordering:
- Pointer sensor for mouse/touch
- Keyboard sensor for accessibility
- Visual feedback during drag
- Smooth animations
- Works on mobile and desktop

### Accessibility

- Keyboard navigation for drag-and-drop
- ARIA labels for interactive elements
- Focus management in modal
- Screen reader friendly error messages
- Alt text for images
- Semantic HTML structure

### Responsive Design

**Mobile (< 640px):**
- 1 column gallery grid
- Touch-friendly drag-and-drop
- Full-width upload zone

**Tablet (640px - 1024px):**
- 2 column gallery grid
- Optimized touch targets

**Desktop (> 1024px):**
- 3 column gallery grid
- Hover interactions
- Larger preview images

### Memory Management

The component properly manages object URLs:

```typescript
// Create preview
const preview = URL.createObjectURL(file)

// Cleanup on removal
URL.revokeObjectURL(photo.preview)
```

### Integration with Photo Service

The component prepares photos for upload but does not handle actual server upload. The photo data can be processed using the photo service:

```typescript
import { uploadPhoto } from "@/lib/services/photo-service"

// Process photo for upload
const result = await uploadPhoto({
  file: photo.file,
  petId: "pet-id",
  caption: photo.caption,
  isPrimary: photo.isPrimary,
})
```

### Testing

Unit tests should cover:
- File validation logic
- Filter style generation
- Photo reordering logic
- Caption validation

Integration tests should cover:
- File upload flow
- Drag-and-drop reordering
- Photo editing and saving
- Primary photo selection

### Example

```tsx
import { Step2Photos } from "@/components/pet/wizard/step2-photos"
import { useState } from "react"

function PhotoUploadExample() {
  const [formData, setFormData] = useState({
    photos: [],
    primaryPhotoId: undefined,
  })

  const handleChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async () => {
    // Process photos for upload
    for (const photo of formData.photos) {
      // Upload to server
      await uploadPhotoToServer(photo)
    }
  }

  return (
    <div>
      <Step2Photos
        formData={formData}
        onChange={handleChange}
        errors={{}}
      />
      <button onClick={handleSubmit}>
        Upload Photos
      </button>
    </div>
  )
}
```

## Requirements Covered

This component implements the following requirements from the pet-profile-system spec:

- **3.1**: Primary photo upload with required validation
- **3.2**: Image cropping tool for 500x500px square format (via editing)
- **3.3**: Drag-and-drop zone for photo uploads
- **3.4**: Multi-file upload supporting up to 20 photos
- **3.5**: Individual progress bars for each uploading photo
- **3.6**: Gallery grid with drag-and-drop reordering
- **3.7**: Caption input for each photo
- **3.8**: Photo editing tools: crop, rotate, brightness, contrast
- **3.9**: Filter options: vintage, black & white, warm, cool
- Display file format and size validation errors


## Step 6: Bio & Review

The `Step6BioReview` component handles the final step of pet profile creation, allowing users to write their pet's story, configure privacy settings, and review all entered information before submission.

### Features

- **Rich Text Bio Editor**
  - 1000 character limit with real-time counter
  - Support for **bold** (`**text**`) and _italic_ (`_text_`) formatting
  - Emoji support 🐾
  - @mentions and #hashtags highlighting
  - Live preview showing formatted text
  - Formatting toolbar with Bold and Italic buttons

- **Privacy Settings**
  - Profile visibility selector with three options:
    - Public (🌐) - Anyone can view
    - Followers Only (👥) - Only followers can view
    - Private (🔒) - Only owner can view
  - Visual indicators with icons and color-coded backgrounds
  - Clear descriptions for each privacy level

- **Featured Pet Checkbox**
  - Option to mark pet as featured on user's main profile
  - Sparkles icon (✨) for visual appeal
  - Helpful description for users with multiple pets

- **Review Summary**
  - Comprehensive review of all 5 previous steps
  - Organized cards showing:
    - Step 1: Basic Information (name, species, breed, gender, weight, birthday)
    - Step 2: Photos (primary photo status, additional photos count)
    - Step 3: Personality (traits, special needs)
    - Step 4: Identification (microchip, collar tag, insurance)
    - Step 5: Medical Information (vet clinic, allergies, medications, conditions)
  - Edit buttons on each section to jump back to specific steps
  - Icons for visual organization

- **Confirmation Dialog**
  - Alert dialog before final submission
  - Shows pet name, species, breed, and visibility setting
  - Prevents accidental submissions
  - Clear "Yes, Create Profile" confirmation button

- **Submit Button**
  - Large, prominent "Create Profile" button
  - Loading state with spinner during submission
  - Disabled when required fields are missing
  - Heart icon for emotional connection

### Usage

```tsx
import { Step6BioReview } from "@/components/pet/wizard/step6-bio-review"

function MyWizard() {
  const [formData, setFormData] = useState({
    bio: "",
    isFeatured: false,
    privacy: {
      visibility: "public" as const,
      interactions: "public" as const,
    },
  })

  const [allFormData, setAllFormData] = useState({
    // Complete data from all steps
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditStep = (step: number) => {
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/pets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allFormData),
      })

      if (response.ok) {
        const { petId, slug } = await response.json()
        router.push(`/pet/${username}/${slug}`)
      }
    } catch (error) {
      console.error("Failed to create pet:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Step6BioReview
      formData={formData}
      allFormData={allFormData}
      onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
      onEditStep={handleEditStep}
      onSubmit={handleSubmit}
      errors={errors}
      isSubmitting={isSubmitting}
    />
  )
}
```

### Props

```typescript
interface Step6BioReviewProps {
  formData: Step6FormData
  allFormData: any // Complete form data from all steps
  onChange: (data: Partial<Step6FormData>) => void
  onEditStep: (step: number) => void
  onSubmit: () => void
  errors?: Record<string, string>
  isSubmitting?: boolean
}

interface Step6FormData {
  bio?: string
  isFeatured?: boolean
  privacy?: PetPrivacySettings
}

interface PetPrivacySettings {
  visibility: "public" | "followers-only" | "private"
  interactions: "public" | "followers-only" | "private"
  sections?: {
    photos?: "public" | "followers-only" | "private"
    health?: "public" | "followers-only" | "private"
    documents?: "public" | "followers-only" | "private"
    posts?: "public" | "followers-only" | "private"
  }
}
```

### Bio Formatting

The bio editor supports simple markdown-style formatting:

**Bold Text:**
```
**Max** is a friendly dog
```
Renders as: **Max** is a friendly dog

**Italic Text:**
```
He is _very_ energetic
```
Renders as: He is _very_ energetic

**Mentions:**
```
Owned by @johndoe
```
Renders with blue highlighting: @johndoe

**Hashtags:**
```
Loves #fetch and #swimming
```
Renders with blue highlighting: #fetch #swimming

**Emoji:**
```
Max is the best 🐕
```
Renders as-is with emoji support

### Privacy Levels

**Public:**
- Anyone can view the profile
- Profile appears in search results
- Visible to all users and guests
- Icon: 🌐 Globe
- Color: Green

**Followers Only:**
- Only approved followers can view
- Profile hidden from search for non-followers
- Requires follow request approval
- Icon: 👥 Users
- Color: Blue

**Private:**
- Only the owner can view
- Profile completely hidden from others
- Not visible in search
- Icon: 🔒 Lock
- Color: Orange

### Review Summary

The review summary displays condensed information from all previous steps:

**Step 1 - Basic Information:**
- Name, Species, Breed
- Gender, Weight
- Birthday or approximate age

**Step 2 - Photos:**
- Primary photo upload status
- Count of additional photos

**Step 3 - Personality:**
- Selected personality traits
- Special needs (if any)

**Step 4 - Identification:**
- Microchip ID
- Collar tag ID
- Insurance policy number

**Step 5 - Medical Information:**
- Vet clinic name
- Count of allergies
- Count of medications
- Count of conditions

Each section includes an "Edit" button that calls `onEditStep(stepNumber)` to navigate back to that step.

### Validation

The component validates:
- Bio length (max 1000 characters)
- Required fields from previous steps (e.g., pet name)
- Privacy settings are valid enum values

Error handling:
```typescript
const errors = {
  bio: "Bio must be 1000 characters or less"
}
```

### Confirmation Dialog

Before submission, a confirmation dialog displays:
- Pet name
- Species and breed
- Selected privacy level
- Reassurance that editing is possible after creation

The dialog prevents accidental submissions and gives users a final chance to review key information.

### Accessibility

- Proper label associations for all form fields
- Keyboard navigation support
- Focus management in dialogs
- Screen reader friendly text
- ARIA labels for interactive elements
- Color contrast compliance (WCAG 2.1 AA)
- Semantic HTML structure

### Responsive Design

**Mobile (< 640px):**
- Single column review cards
- Stacked form elements
- Full-width buttons
- Touch-friendly targets

**Tablet (640px - 1024px):**
- Two column review grid
- Optimized spacing

**Desktop (> 1024px):**
- Two column review grid
- Expanded card layouts
- Hover interactions

### Integration with API

The component prepares data for submission but does not handle the actual API call. The parent component should handle submission:

```typescript
const handleSubmit = async () => {
  const response = await fetch("/api/pets/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Step 1 data
      name: allFormData.name,
      species: allFormData.species,
      // ... other fields
      
      // Step 6 data
      bio: formData.bio,
      isFeatured: formData.isFeatured,
      privacy: formData.privacy,
    }),
  })

  if (response.ok) {
    const { petId, slug } = await response.json()
    // Redirect to new profile
    router.push(`/pet/${username}/${slug}`)
  }
}
```

### Testing

Unit tests should cover:
- Bio character limit enforcement
- Formatting insertion logic
- Privacy setting updates
- Review summary data generation
- Validation logic

Integration tests should cover:
- Navigation to previous steps via edit buttons
- Form data persistence across step changes
- Submission flow with confirmation
- Error handling and display

E2E tests should cover:
- Complete wizard flow ending at Step 6
- Bio formatting and preview
- Privacy setting selection
- Review summary accuracy
- Confirmation dialog interaction
- Successful profile creation

### Example

See `step6-bio-review.example.tsx` for complete working examples including:
- Integration in wizard
- Bio formatting examples
- Privacy settings examples
- Review summary structure
- Confirmation dialog usage

## Requirements Covered

This component implements the following requirements from the pet-profile-system spec:

- **7.1**: Rich text editor for pet bio with 1000 character limit
- **7.2**: Support for bold, italic, emoji, line breaks, @mentions, and #hashtags
- **7.3**: Public profile toggle for visibility control
- **7.4**: Featured pet checkbox for users with multiple pets
- **7.5**: Review summary displaying all entered information
- **7.6**: Confirmation dialog before final submission
- **Additional**: Edit buttons to jump back to specific steps from review

---

## Common Patterns

All wizard step components follow these patterns:

### State Management
```typescript
const [formData, setFormData] = useState<StepFormData>({})

const handleChange = (updates: Partial<StepFormData>) => {
  setFormData(prev => ({ ...prev, ...updates }))
}
```

### Error Display
```typescript
{errors.fieldName && (
  <p className="text-sm text-red-500">{errors.fieldName}</p>
)}
```

### Character Counters
```typescript
<span className={cn(
  "text-muted-foreground",
  length > maxLength * 0.9 && "text-orange-500",
  length === maxLength && "text-red-500"
)}>
  {length}/{maxLength}
</span>
```

### Responsive Grids
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Content */}
</div>
```

## Related Files

- `lib/schemas/pet-schema.ts` - Zod validation schemas
- `lib/services/pet-service.ts` - Pet CRUD operations
- `lib/services/photo-service.ts` - Photo management
- `app/api/pets/create/route.ts` - API endpoint
- `.kiro/specs/pet-profile-system/requirements.md` - Detailed requirements
- `.kiro/specs/pet-profile-system/design.md` - Design documentation
- `.kiro/specs/pet-profile-system/tasks.md` - Implementation tasks

## Future Enhancements

Potential improvements across all steps:
- Auto-save drafts to localStorage
- Progress persistence across sessions
- Step validation indicators
- Inline help tooltips
- Template suggestions
- AI-powered content generation
- Multi-language support
- Voice input for bio
- Batch photo upload optimization
- Advanced photo editing (filters, effects)
- Integration with vet systems
- Health record imports
- Social sharing during creation
