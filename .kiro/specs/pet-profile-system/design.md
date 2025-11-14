# Design Document

## Overview

The Pet Profile System is a comprehensive feature enabling users to create, manage, and showcase detailed profiles for their pets. The system consists of a multi-step creation wizard, rich profile display pages, photo galleries, health tracking, and social features. This design leverages existing infrastructure including the Prisma schema, storage utilities, and UI component library while introducing new components and data models specific to pet profiles.

### Key Design Principles

1. **Progressive Disclosure**: Multi-step wizard prevents overwhelming users with all fields at once
2. **Mobile-First**: Responsive design optimized for mobile devices where most pet photos are captured
3. **Privacy-Aware**: Granular privacy controls for pet profiles separate from user profiles
4. **Accessibility**: WCAG 2.1 AA compliant with screen reader support and keyboard navigation
5. **Performance**: Lazy loading, image optimization, and efficient data fetching
6. **Extensibility**: Modular architecture allowing future enhancements (e.g., vet integrations)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Pet Creation Wizard  │  Pet Profile Page  │  Pet Gallery   │
│  (Multi-step Modal)   │  (Display)         │  (Lightbox)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  /api/pets/create     │  /api/pets/[id]    │  /api/pets/    │
│  /api/pets/[id]/photo │  /api/pets/[id]/   │  [id]/timeline │
│                       │  health            │                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  PetService  │  PhotoService  │  HealthService  │  Timeline  │
│              │                │                 │  Service   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM  │  Storage (lib/storage.ts)  │  File Storage   │
└─────────────────────────────────────────────────────────────┘
```


### Data Flow

1. **Pet Creation Flow**:
   - User clicks "Add New Pet" → Opens multi-step modal
   - Each step validates and stores data in component state
   - Final submission sends complete pet object to `/api/pets/create`
   - API validates, creates database record, returns pet ID
   - Client redirects to new pet profile page

2. **Pet Profile Display Flow**:
   - User navigates to `/pet/[username]/[petSlug]`
   - Server fetches pet data, owner data, and related content
   - Privacy checks determine visible sections
   - Client renders profile with tabbed content
   - Real-time updates via storage listeners

3. **Photo Upload Flow**:
   - User selects photos → Client-side validation (size, format)
   - Upload to `/api/pets/[id]/photo` with progress tracking
   - Server processes image (resize, optimize, generate thumbnails)
   - Store URLs in pet record, return optimized URLs
   - Client updates gallery display

## Components and Interfaces

### Core Components

#### 1. PetCreationWizard Component

**Location**: `components/pet/pet-creation-wizard.tsx`

**Purpose**: Multi-step modal for creating new pet profiles

**Props**:
```typescript
interface PetCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (petId: string) => void
  userId: string
}
```

**State Management**:
```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  petData: Partial<PetFormData>
  errors: Record<string, string>
  isSubmitting: boolean
}
```

**Sub-components**:
- `Step1BasicInfo`: Name, species, breed, physical characteristics
- `Step2Photos`: Photo upload with cropping and gallery management
- `Step3Personality`: Traits, preferences, special needs
- `Step4Identification`: Microchip, collar tags, insurance
- `Step5Medical`: Vet info, allergies, medications, conditions
- `Step6BioReview`: Bio editor and final review


#### 2. PetProfilePage Component

**Location**: `app/[locale]/pet/[username]/[petSlug]/page.tsx`

**Purpose**: Main pet profile display page

**Structure**:
```typescript
interface PetProfilePageProps {
  params: Promise<{ username: string; petSlug: string }>
}
```

**Sections**:
- Hero section with cover photo and profile photo
- Stats bar (followers, posts, photos, age)
- Tabbed content (About, Photos, Posts, Health, Documents)
- Timeline/activity feed
- Follow button and share functionality

#### 3. PetPhotoGallery Component

**Location**: `components/pet/pet-photo-gallery.tsx`

**Purpose**: Grid display of pet photos with lightbox

**Props**:
```typescript
interface PetPhotoGalleryProps {
  photos: PetPhoto[]
  onPhotoClick: (index: number) => void
  columns?: { mobile: number; tablet: number; desktop: number }
  allowReorder?: boolean
  onReorder?: (newOrder: string[]) => void
}

interface PetPhoto {
  url: string
  caption?: string
  uploadedAt: string
  isPrimary: boolean
}
```

#### 4. PetHealthCard Component

**Location**: `components/pet/pet-health-card.tsx`

**Purpose**: Display health information in organized cards

**Props**:
```typescript
interface PetHealthCardProps {
  pet: Pet
  canEdit: boolean
  onUpdate?: (healthData: Partial<Pet>) => void
}
```

**Sub-sections**:
- Allergies with severity indicators
- Current medications with dosage schedules
- Pre-existing conditions with management status
- Weight history chart
- Vaccination records


#### 5. PetTimelineComponent

**Location**: `components/pet/pet-timeline.tsx`

**Purpose**: Chronological display of pet milestones and activities

**Props**:
```typescript
interface PetTimelineProps {
  petId: string
  events: TimelineEvent[]
  canAddEvents: boolean
  onAddEvent?: (event: Partial<TimelineEvent>) => void
}

interface TimelineEvent {
  id: string
  petId: string
  type: 'milestone' | 'health' | 'achievement' | 'social'
  title: string
  description: string
  date: string
  photos?: string[]
  reactions: Record<ReactionType, string[]>
  comments: Comment[]
}
```

### API Endpoints

#### POST /api/pets/create

**Purpose**: Create a new pet profile

**Request Body**:
```typescript
interface CreatePetRequest {
  name: string
  species: string
  breed?: string
  breedId?: string
  gender?: 'male' | 'female'
  birthday?: string
  weight?: string
  color?: string
  spayedNeutered?: boolean
  adoptionDate?: string
  microchipId?: string
  microchipCompany?: string
  microchipRegistrationStatus?: 'registered' | 'not_registered' | 'unknown'
  collarTagId?: string
  allergies?: string[]
  allergySeverities?: Record<string, 'mild' | 'moderate' | 'severe'>
  medications?: Medication[]
  conditions?: Array<{ name: string; diagnosedAt?: string; notes?: string }>
  personality?: PersonalityTraits
  favoriteThings?: FavoriteThings
  specialNeeds?: string
  dislikes?: string
  vetInfo?: VetInfo
  insurance?: InsuranceInfo
  bio?: string
  privacy?: PetPrivacySettings
  isFeatured?: boolean
}
```

**Response**:
```typescript
interface CreatePetResponse {
  success: boolean
  petId: string
  slug: string
  message: string
}
```


#### POST /api/pets/[id]/photo

**Purpose**: Upload and manage pet photos

**Request**: Multipart form data with photo file

**Query Parameters**:
- `isPrimary`: boolean - Set as primary profile photo
- `caption`: string - Optional photo caption

**Response**:
```typescript
interface UploadPhotoResponse {
  success: boolean
  photoUrl: string
  thumbnailUrl: string
  optimizedUrl: string
}
```

#### GET /api/pets/[id]

**Purpose**: Fetch pet profile data

**Response**:
```typescript
interface GetPetResponse {
  pet: Pet
  owner: User
  stats: {
    followers: number
    posts: number
    photos: number
  }
  canEdit: boolean
  canFollow: boolean
  isFollowing: boolean
}
```

#### PATCH /api/pets/[id]

**Purpose**: Update pet profile

**Request Body**: Partial<Pet>

**Response**:
```typescript
interface UpdatePetResponse {
  success: boolean
  pet: Pet
  message: string
}
```

#### GET /api/pets/[id]/timeline

**Purpose**: Fetch pet timeline events

**Query Parameters**:
- `limit`: number (default: 20)
- `offset`: number (default: 0)
- `type`: 'milestone' | 'health' | 'achievement' | 'social' | 'all'

**Response**:
```typescript
interface GetTimelineResponse {
  events: TimelineEvent[]
  hasMore: boolean
  total: number
}
```


## Data Models

### Extended Pet Model

The existing `Pet` interface in `lib/types.ts` already contains most required fields. We'll extend it with additional properties:

```typescript
// Extensions to existing Pet interface
interface PetExtensions {
  // Profile display
  slug: string // URL-friendly identifier
  coverPhoto?: string // Hero banner image
  
  // Physical characteristics (enhanced)
  markings?: string // Detailed appearance description
  weightHistory?: Array<{ date: string; weight: number; unit: 'lbs' | 'kg' }>
  
  // Identification (enhanced)
  microchipCertificateUrl?: string
  insurancePolicyNumber?: string
  
  // Photos (enhanced)
  photos: string[] // Array of photo URLs
  photoCaptions?: Record<string, string> // URL -> caption mapping
  photoTags?: Record<string, string[]> // URL -> pet IDs tagged
  primaryPhotoIndex?: number // Index of primary photo in photos array
  
  // Social features
  followers: string[] // User IDs following this pet
  followRequests?: string[] // Pending follow requests
  
  // Timeline
  timelineEvents?: TimelineEvent[]
  
  // Stats (computed)
  stats?: {
    totalPosts: number
    totalPhotos: number
    profileViews: number
    lastActive: string
  }
}
```

### TimelineEvent Model

```typescript
interface TimelineEvent {
  id: string
  petId: string
  type: 'added_to_family' | 'vet_visit' | 'vaccination' | 'birthday' | 
        'achievement' | 'health_update' | 'new_friend' | 'custom'
  title: string
  description: string
  date: string // ISO timestamp
  photos?: string[]
  relatedPetId?: string // For "new friend" events
  reactions: Record<ReactionType, string[]> // User IDs who reacted
  comments: Comment[]
  visibility: PrivacyLevel
  createdAt: string
  updatedAt: string
}
```


### Breed Database Schema

Leverage existing `Breed` model in Prisma schema:

```prisma
model Breed {
  id          String   @id @default(uuid())
  name        String   @unique
  species     String   // dog, cat, bird, etc.
  description String?
  characteristics Json? // Breed characteristics
  averageWeight String?
  averageLifespan String?
  temperament String[]
  origin      String?
  photoUrl    String? // Add breed photo for autocomplete
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([species])
  @@index([name])
  @@map("breeds")
}
```

### PetPhoto Model (New)

```prisma
model PetPhoto {
  id          String   @id @default(uuid())
  petId       String
  url         String
  thumbnailUrl String?
  optimizedUrl String?
  caption     String?
  taggedPetIds String[] // Pet IDs tagged in photo
  uploadedAt  DateTime @default(now())
  isPrimary   Boolean  @default(false)
  order       Int      @default(0)
  
  @@index([petId])
  @@index([isPrimary])
  @@map("pet_photos")
}
```

### PetTimelineEvent Model (New)

```prisma
model PetTimelineEvent {
  id          String   @id @default(uuid())
  petId       String
  type        String   // milestone, health, achievement, social, custom
  title       String
  description String
  date        DateTime
  photos      String[]
  relatedPetId String?
  visibility  String   @default("public")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([petId])
  @@index([date])
  @@index([type])
  @@map("pet_timeline_events")
}
```


## Error Handling

### Validation Errors

**Client-Side Validation**:
- Real-time validation as user types
- Display inline error messages below fields
- Prevent step progression until current step is valid
- Show error summary at top of form if multiple errors

**Server-Side Validation**:
- Validate all inputs using Zod schemas
- Return structured error responses:

```typescript
interface ValidationError {
  field: string
  message: string
  code: 'required' | 'invalid_format' | 'too_long' | 'too_short' | 'invalid_value'
}

interface ErrorResponse {
  success: false
  error: string
  validationErrors?: ValidationError[]
}
```

### Upload Errors

**Photo Upload Error Handling**:
- File too large: Show size limit and suggest compression
- Invalid format: List accepted formats (JPEG, PNG, WebP, HEIC)
- Network error: Retry mechanism with exponential backoff
- Server error: Display user-friendly message with retry option

**Error Recovery**:
- Save form state to localStorage every 30 seconds
- Offer to restore unsaved data on page reload
- Allow partial saves (draft mode)

### Privacy Errors

**Access Denied Scenarios**:
- User not logged in: Redirect to login with return URL
- Insufficient permissions: Show privacy notice with follow button
- Pet not found: Display 404 page with search suggestions
- Owner account deleted: Show archived profile notice


## Testing Strategy

### Unit Tests

**Component Tests** (Jest + React Testing Library):
- `PetCreationWizard`: Test step navigation, validation, form submission
- `PetProfilePage`: Test data display, privacy checks, tab switching
- `PetPhotoGallery`: Test photo display, lightbox, reordering
- `PetHealthCard`: Test data rendering, edit mode, updates
- `PetTimeline`: Test event display, reactions, comments

**Service Tests**:
- `PetService`: Test CRUD operations, validation, privacy checks
- `PhotoService`: Test upload, resize, optimization, deletion
- `HealthService`: Test medication tracking, vaccination reminders
- `TimelineService`: Test event creation, filtering, pagination

**Utility Tests**:
- `pet-url.ts`: Test slug generation, URL parsing
- `pet-privacy.ts`: Test privacy checks for various scenarios
- `pet-validation.ts`: Test input validation rules

### Integration Tests

**API Route Tests**:
- Test complete request/response cycles
- Test authentication and authorization
- Test error handling and edge cases
- Test rate limiting and abuse prevention

**Database Tests**:
- Test Prisma queries and mutations
- Test transaction handling
- Test cascade deletes and updates
- Test index performance

### End-to-End Tests (Playwright)

**Critical User Flows**:
1. Create new pet profile (all 6 steps)
2. Upload and manage photos
3. View pet profile (own and others)
4. Edit pet information
5. Add timeline events
6. Follow/unfollow pets
7. Privacy settings enforcement

**Test Scenarios**:
```typescript
test('User can create complete pet profile', async ({ page }) => {
  // Navigate to dashboard
  // Click "Add New Pet"
  // Fill Step 1: Basic Info
  // Upload photos in Step 2
  // Select personality traits in Step 3
  // Enter microchip info in Step 4
  // Add medical info in Step 5
  // Write bio and review in Step 6
  // Submit and verify redirect to new profile
})

test('Privacy settings are enforced', async ({ page }) => {
  // Create pet with private visibility
  // Log out
  // Attempt to view pet profile
  // Verify access denied message
  // Log in as follower
  // Verify can view profile
})
```


### Performance Tests

**Load Testing**:
- Test photo upload with multiple concurrent users
- Test profile page load time with large photo galleries
- Test timeline pagination with thousands of events
- Test breed autocomplete with 300+ breeds

**Metrics to Track**:
- Time to First Byte (TTFB) < 200ms
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1
- Photo upload time < 5s for 10MB image

## UI/UX Design Patterns

### Multi-Step Wizard Pattern

**Step Indicator**:
```
[1] Basic Info → [2] Photos → [3] Personality → [4] ID → [5] Medical → [6] Review
 ✓                                                                        ●
```

**Navigation**:
- "Next" button: Validates current step, advances to next
- "Back" button: Returns to previous step without validation
- "Save Draft" button: Saves progress, closes modal
- Step numbers clickable only for completed steps

**Progress Persistence**:
- Auto-save to localStorage every 30 seconds
- Restore on modal reopen
- Clear on successful submission

### Photo Upload UX

**Drag-and-Drop Zone**:
```
┌─────────────────────────────────────┐
│  📷  Drag photos here or click to   │
│      browse                          │
│                                      │
│  Accepts: JPEG, PNG, WebP, HEIC     │
│  Max size: 10MB per photo           │
│  Max photos: 20                     │
└─────────────────────────────────────┘
```

**Upload Progress**:
```
photo1.jpg  [████████████████░░░░] 80%  Cancel
photo2.jpg  [████████████████████] 100% ✓
photo3.jpg  [██░░░░░░░░░░░░░░░░░░] 10%  Cancel
```

**Gallery Management**:
- Grid layout with drag handles
- Primary photo has star badge
- Hover shows edit/delete buttons
- Click opens lightbox viewer


### Profile Display Layout

**Hero Section**:
```
┌────────────────────────────────────────────────────────┐
│                                                         │
│              [Cover Photo Banner]                       │
│                                                         │
│  ┌────┐                                                │
│  │ 🐕 │  Max                                           │
│  │    │  Golden Retriever • 3 years old               │
│  └────┘  Owned by @johndoe                            │
│                                                         │
│  [Follow] [Share]                                      │
└────────────────────────────────────────────────────────┘
```

**Stats Bar**:
```
┌────────────────────────────────────────────────────────┐
│  👥 245        📸 89         📝 34         🎂 3 years  │
│  Followers     Photos       Posts         Age          │
└────────────────────────────────────────────────────────┘
```

**Tabbed Content**:
```
┌────────────────────────────────────────────────────────┐
│ [About] [Photos] [Posts] [Health] [Documents]          │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Physical Stats Card    Personality Card               │
│  ┌──────────────┐      ┌──────────────┐              │
│  │ Weight: 65lb │      │ 🎾 Playful   │              │
│  │ Color: Gold  │      │ 💖 Friendly  │              │
│  │ Neutered: ✓  │      │ ⚡ Energetic │              │
│  └──────────────┘      └──────────────┘              │
│                                                         │
│  Medical Summary Card                                  │
│  ┌──────────────────────────────────────┐            │
│  │ ⚠️ Allergies: Chicken (Moderate)     │            │
│  │ 💊 Medications: Arthritis meds daily │            │
│  │ 🏥 Conditions: Hip dysplasia         │            │
│  └──────────────────────────────────────┘            │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

**Mobile (< 640px)**:
- Single column layout
- Stacked stats
- Simplified hero section
- Bottom sheet for modals

**Tablet (640px - 1024px)**:
- Two column layout
- Grid stats bar
- Side-by-side cards

**Desktop (> 1024px)**:
- Three column layout
- Expanded hero section
- Modal dialogs
- Sidebar navigation


## Accessibility Considerations

### Keyboard Navigation

**Wizard Navigation**:
- Tab: Move between form fields
- Shift+Tab: Move backwards
- Enter: Submit current step / activate button
- Escape: Close modal (with confirmation if unsaved changes)
- Arrow keys: Navigate between steps in step indicator

**Photo Gallery**:
- Tab: Focus on photos in order
- Enter/Space: Open lightbox
- Arrow keys: Navigate in lightbox
- Escape: Close lightbox

### Screen Reader Support

**ARIA Labels**:
```typescript
// Step indicator
<div role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={6}>
  <span aria-label={`Step ${currentStep} of 6: ${stepTitle}`}>

// Photo upload
<div role="button" aria-label="Upload pet photos. Drag and drop or click to browse">

// Gallery
<img alt={`${petName} - ${caption || 'Photo ' + index}`} />

// Stats
<div aria-label={`${followers} followers`}>
```

**Live Regions**:
```typescript
// Upload progress
<div aria-live="polite" aria-atomic="true">
  Uploading photo 2 of 5: 45% complete
</div>

// Form errors
<div role="alert" aria-live="assertive">
  Please correct the following errors before continuing
</div>
```

### Color Contrast

**WCAG AA Compliance**:
- Text: 4.5:1 contrast ratio minimum
- Large text (18pt+): 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio
- Focus indicators: 3:1 contrast ratio

**Color-Blind Friendly**:
- Don't rely solely on color for information
- Use icons + text for severity indicators
- Provide patterns/textures in addition to colors

### Focus Management

**Modal Focus Trap**:
- Focus first input when modal opens
- Trap focus within modal
- Return focus to trigger element on close

**Skip Links**:
- "Skip to main content"
- "Skip to pet information"
- "Skip to photo gallery"


## Security Considerations

### Input Validation

**Client-Side**:
- Sanitize all text inputs to prevent XSS
- Validate file types and sizes before upload
- Limit character counts to prevent DoS
- Use Zod schemas for type safety

**Server-Side**:
- Re-validate all inputs (never trust client)
- Sanitize HTML in bio/description fields
- Validate image files (magic bytes, not just extension)
- Rate limit API endpoints

### Authorization

**Pet Ownership**:
- Verify user owns pet before allowing edits
- Check co-owner permissions for shared pets
- Validate privacy settings on every request

**Privacy Enforcement**:
```typescript
function canViewPet(pet: Pet, viewer: User | null): boolean {
  // Public pets: anyone can view
  if (pet.privacy.visibility === 'public') return true
  
  // Private pets: only owner and co-owners
  if (pet.privacy.visibility === 'private') {
    return viewer?.id === pet.ownerId || 
           pet.coOwners?.some(co => co.userId === viewer?.id)
  }
  
  // Followers-only: owner, co-owners, and followers
  if (pet.privacy.visibility === 'followers-only') {
    return viewer?.id === pet.ownerId ||
           pet.coOwners?.some(co => co.userId === viewer?.id) ||
           pet.followers.includes(viewer?.id)
  }
  
  return false
}
```

### Data Protection

**Sensitive Information**:
- Encrypt microchip IDs at rest
- Mask insurance policy numbers in UI
- Don't expose vet contact info to non-owners
- Redact medical details based on privacy settings

**File Storage**:
- Store uploaded files outside web root
- Generate unique, non-guessable filenames
- Implement signed URLs for private photos
- Set appropriate CORS headers

### Rate Limiting

**API Endpoints**:
- Photo upload: 10 requests per minute per user
- Pet creation: 5 requests per hour per user
- Profile updates: 20 requests per minute per user
- Timeline events: 30 requests per minute per user

**Abuse Prevention**:
- Implement CAPTCHA for suspicious activity
- Block repeated failed validation attempts
- Monitor for automated scraping
- Implement IP-based rate limiting


## Performance Optimization

### Image Optimization

**Upload Processing**:
1. Validate file (type, size, dimensions)
2. Generate multiple sizes:
   - Thumbnail: 150x150px (for cards)
   - Medium: 800x800px (for gallery)
   - Large: 1600x1600px (for lightbox)
   - Original: Stored but not served directly
3. Convert to WebP format (with JPEG fallback)
4. Strip EXIF data (except orientation)
5. Compress with quality=85

**Delivery**:
- Use CDN for image hosting
- Implement lazy loading for gallery
- Use `<picture>` element with srcset
- Serve WebP to supporting browsers
- Cache images with long TTL (1 year)

### Data Fetching

**Server-Side Rendering**:
- Pre-fetch pet data on server
- Include initial timeline events (first 10)
- Embed critical CSS inline
- Stream HTML as it's generated

**Client-Side Optimization**:
- Use SWR for data fetching with stale-while-revalidate
- Implement optimistic updates for likes/follows
- Prefetch linked profiles on hover
- Cache API responses in memory

**Pagination**:
- Timeline: Load 20 events at a time
- Photos: Load 30 photos per page
- Posts: Load 10 posts per page
- Implement infinite scroll with intersection observer

### Bundle Optimization

**Code Splitting**:
- Lazy load wizard modal (only when opened)
- Lazy load lightbox component
- Lazy load chart libraries (for weight history)
- Split vendor bundles

**Tree Shaking**:
- Import only used lodash functions
- Use modular date-fns imports
- Remove unused UI components
- Analyze bundle with webpack-bundle-analyzer


### Database Optimization

**Indexing Strategy**:
```sql
-- Pet lookups
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_slug ON pets(slug);
CREATE INDEX idx_pets_species ON pets(species);

-- Photo queries
CREATE INDEX idx_pet_photos_pet_id ON pet_photos(pet_id);
CREATE INDEX idx_pet_photos_primary ON pet_photos(pet_id, is_primary);

-- Timeline queries
CREATE INDEX idx_timeline_pet_date ON pet_timeline_events(pet_id, date DESC);
CREATE INDEX idx_timeline_type ON pet_timeline_events(pet_id, type);

-- Follower queries
CREATE INDEX idx_pet_followers ON pets USING GIN(followers);
```

**Query Optimization**:
- Use `select` to fetch only needed fields
- Implement cursor-based pagination for timeline
- Use database-level aggregations for stats
- Cache frequently accessed data (Redis)

**Connection Pooling**:
- Configure Prisma connection pool size
- Implement connection retry logic
- Monitor connection usage
- Set appropriate timeouts

## Monitoring and Analytics

### Key Metrics

**User Engagement**:
- Pet profile creation rate
- Average time to complete wizard
- Photo upload success rate
- Profile view counts
- Follow/unfollow rates

**Performance Metrics**:
- Page load time (P50, P95, P99)
- API response time
- Photo upload time
- Error rates by endpoint
- Cache hit rates

**Business Metrics**:
- Total pets created
- Active pet profiles (updated in last 30 days)
- Average photos per pet
- Timeline event creation rate
- User retention (return visits)

### Error Tracking

**Client-Side**:
- Use Sentry for error tracking
- Track failed API calls
- Monitor console errors
- Track unhandled promise rejections

**Server-Side**:
- Log all API errors with context
- Track validation failures
- Monitor database errors
- Alert on high error rates

### User Analytics

**Event Tracking**:
```typescript
// Track wizard progress
analytics.track('pet_wizard_step_completed', {
  step: 2,
  petId: 'temp-id',
  timeSpent: 45 // seconds
})

// Track photo uploads
analytics.track('pet_photo_uploaded', {
  petId: pet.id,
  photoCount: 5,
  uploadTime: 3.2 // seconds
})

// Track profile views
analytics.track('pet_profile_viewed', {
  petId: pet.id,
  viewerId: viewer?.id,
  referrer: document.referrer
})
```


## Migration Strategy

### Phase 1: Foundation (Week 1-2)

**Database Schema**:
1. Add new fields to existing Pet model
2. Create PetPhoto table
3. Create PetTimelineEvent table
4. Run migrations on staging environment
5. Backfill existing pet data

**Core Services**:
1. Implement PetService with CRUD operations
2. Implement PhotoService with upload/resize
3. Implement privacy checking utilities
4. Add API routes for pet management

### Phase 2: Creation Flow (Week 3-4)

**Wizard Implementation**:
1. Build wizard shell with step navigation
2. Implement Step 1: Basic Info
3. Implement Step 2: Photos
4. Implement Step 3: Personality
5. Implement Step 4: Identification
6. Implement Step 5: Medical
7. Implement Step 6: Bio & Review

**Integration**:
1. Add "Add New Pet" button to dashboard
2. Connect wizard to API
3. Implement form validation
4. Add progress persistence

### Phase 3: Profile Display (Week 5-6)

**Profile Page**:
1. Build hero section with cover/profile photos
2. Implement stats bar
3. Create About tab with info cards
4. Create Photos tab with gallery
5. Create Posts tab (integrate with existing posts)
6. Create Health tab
7. Create Documents tab

**Timeline**:
1. Implement timeline component
2. Add automatic events (adoption, birthday)
3. Allow manual event creation
4. Add reactions and comments

### Phase 4: Polish & Testing (Week 7-8)

**Refinement**:
1. Responsive design testing
2. Accessibility audit and fixes
3. Performance optimization
4. Error handling improvements

**Testing**:
1. Write unit tests
2. Write integration tests
3. Write E2E tests
4. User acceptance testing

**Documentation**:
1. API documentation
2. Component documentation
3. User guide
4. Admin guide

### Rollout Plan

**Beta Release**:
- Enable for 10% of users
- Monitor metrics and errors
- Gather user feedback
- Fix critical issues

**Gradual Rollout**:
- Week 1: 25% of users
- Week 2: 50% of users
- Week 3: 75% of users
- Week 4: 100% of users

**Rollback Plan**:
- Feature flag to disable new UI
- Fallback to existing pet profiles
- Database rollback scripts ready
- Communication plan for users


## Future Enhancements

### Inline Editing Components

#### 6. InlineEditWrapper Component

**Location**: `components/pet/inline-edit-wrapper.tsx`

**Purpose**: Wraps any editable section with hover-to-edit functionality

**Props**:
```typescript
interface InlineEditWrapperProps {
  canEdit: boolean
  onEdit: () => void
  children: React.ReactNode
  sectionName: string
}
```

#### 7. QuickEditModal Component

**Location**: `components/pet/quick-edit-modal.tsx`

**Purpose**: Modal for quick edits with pre-filled data

**Props**:
```typescript
interface QuickEditModalProps {
  isOpen: boolean
  onClose: () => void
  field: string
  currentValue: any
  onSave: (newValue: any) => Promise<void>
  validationSchema: ZodSchema
}
```

#### 8. WeightLogModal Component

**Location**: `components/pet/weight-log-modal.tsx`

**Purpose**: Quick weight logging with date picker

**Props**:
```typescript
interface WeightLogModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  onWeightLogged: (entry: WeightEntry) => void
}
```

#### 9. BulkPhotoManager Component

**Location**: `components/pet/bulk-photo-manager.tsx`

**Purpose**: Multi-select photo management with bulk actions

**Props**:
```typescript
interface BulkPhotoManagerProps {
  photos: PetPhoto[]
  onDelete: (photoIds: string[]) => Promise<void>
  onSetPrimary: (photoId: string) => Promise<void>
  onDownload: (photoIds: string[]) => Promise<Blob>
  onReorder: (newOrder: string[]) => Promise<void>
  onCaptionUpdate: (photoId: string, caption: string) => Promise<void>
}
```

### Multiple Pet Management Components

#### 10. PetSwitcher Component

**Location**: `components/pet/pet-switcher.tsx`

**Purpose**: Dropdown navigation for switching between pets

**Props**:
```typescript
interface PetSwitcherProps {
  pets: Pet[]
  currentPetId: string
  onPetSelect: (petId: string) => void
  onAddNew: () => void
}
```

#### 11. PetComparison Component

**Location**: `components/pet/pet-comparison.tsx`

**Purpose**: Side-by-side comparison of up to 4 pets

**Props**:
```typescript
interface PetComparisonProps {
  pets: Pet[]
  onExportPDF: () => Promise<void>
}
```

#### 12. PetNotificationSettings Component

**Location**: `components/pet/pet-notification-settings.tsx`

**Purpose**: Per-pet notification configuration

**Props**:
```typescript
interface PetNotificationSettingsProps {
  petId: string
  settings: NotificationSettings
  onUpdate: (settings: NotificationSettings) => Promise<void>
}

interface NotificationSettings {
  healthReminders: boolean
  birthdayReminders: boolean
  weightTrackingReminders: boolean
  activityReminders: boolean
}
```

### Species-Specific Components

#### 13. SpeciesFieldsRenderer Component

**Location**: `components/pet/species-fields-renderer.tsx`

**Purpose**: Dynamically renders species-specific fields based on selected species

**Props**:
```typescript
interface SpeciesFieldsRendererProps {
  species: string
  values: Record<string, any>
  onChange: (field: string, value: any) => void
  errors: Record<string, string>
}
```

### Health Tracking Components

#### 14. HealthDashboard Component

**Location**: `components/pet/health/health-dashboard.tsx`

**Purpose**: Overview of pet's health status

**Props**:
```typescript
interface HealthDashboardProps {
  petId: string
  vaccinationStatus: 'current' | 'due_soon' | 'overdue'
  nextAppointment?: Date
  activeMedications: number
  weightTrend: 'gaining' | 'stable' | 'losing'
  recentEvents: HealthEvent[]
}
```

#### 15. VaccinationTracker Component

**Location**: `components/pet/health/vaccination-tracker.tsx`

**Purpose**: Vaccination logging and reminder management

**Props**:
```typescript
interface VaccinationTrackerProps {
  petId: string
  vaccinations: Vaccination[]
  onAdd: (vaccination: Vaccination) => Promise<void>
  onUpdate: (id: string, vaccination: Partial<Vaccination>) => Promise<void>
}

interface Vaccination {
  id: string
  name: string
  dateAdministered: Date
  administeredBy: string
  nextDueDate: Date
  batchNumber?: string
  certificateUrl?: string
  status: 'current' | 'due_soon' | 'overdue'
}
```

#### 16. MedicationManager Component

**Location**: `components/pet/health/medication-manager.tsx`

**Purpose**: Medication tracking with dosage schedules

**Props**:
```typescript
interface MedicationManagerProps {
  petId: string
  medications: Medication[]
  onAdd: (medication: Medication) => Promise<void>
  onLogDose: (medId: string, timestamp: Date, notes?: string) => Promise<void>
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  times: string[]
  startDate: Date
  endDate?: Date
  purpose: string
  prescribingVet: string
  refillInfo?: {
    pillsRemaining: number
    refillDueDate: Date
  }
  adherence: {
    weeklyPercentage: number
    missedDoses: number
  }
}
```

#### 17. WeightTracker Component

**Location**: `components/pet/health/weight-tracker.tsx`

**Purpose**: Weight logging with visual graph and trend analysis

**Props**:
```typescript
interface WeightTrackerProps {
  petId: string
  entries: WeightEntry[]
  healthyRange?: { min: number; max: number }
  onAddEntry: (entry: WeightEntry) => Promise<void>
  onSetGoal: (goal: WeightGoal) => Promise<void>
}

interface WeightEntry {
  id: string
  date: Date
  weight: number
  unit: 'lbs' | 'kg'
  notes?: string
  photoUrl?: string
}

interface WeightGoal {
  targetWeight: number
  targetDate: Date
  currentProgress: number
}
```

#### 18. VetVisitLogger Component

**Location**: `components/pet/health/vet-visit-logger.tsx`

**Purpose**: Detailed vet visit record keeping

**Props**:
```typescript
interface VetVisitLoggerProps {
  petId: string
  visits: VetVisit[]
  onAdd: (visit: VetVisit) => Promise<void>
  onExportPDF: () => Promise<void>
}

interface VetVisit {
  id: string
  clinicName: string
  visitDate: Date
  vetName: string
  reason: string
  diagnosis: string
  treatment: string
  cost?: number
  nextAppointment?: Date
  documents: string[]
}
```

#### 19. HealthIncidentLogger Component

**Location**: `components/pet/health/health-incident-logger.tsx`

**Purpose**: Symptom and incident tracking

**Props**:
```typescript
interface HealthIncidentLoggerProps {
  petId: string
  incidents: HealthIncident[]
  onAdd: (incident: HealthIncident) => Promise<void>
}

interface HealthIncident {
  id: string
  dateTime: Date
  symptom: string
  severity: 'mild' | 'moderate' | 'severe' | 'emergency'
  actionsTaken: string[]
  outcome: string
  photos: string[]
  videos: string[]
}
```

#### 20. WellnessGoalTracker Component

**Location**: `components/pet/health/wellness-goal-tracker.tsx`

**Purpose**: Goal setting and progress tracking

**Props**:
```typescript
interface WellnessGoalTrackerProps {
  petId: string
  goals: WellnessGoal[]
  onAdd: (goal: WellnessGoal) => Promise<void>
  onUpdateProgress: (goalId: string, progress: number) => Promise<void>
}

interface WellnessGoal {
  id: string
  type: 'weight' | 'exercise' | 'training' | 'behavioral'
  description: string
  startDate: Date
  targetDate: Date
  currentProgress: number
  milestones: Milestone[]
}
```

### Document Management Components

#### 21. DocumentManager Component

**Location**: `components/pet/documents/document-manager.tsx`

**Purpose**: Organize and manage pet documents

**Props**:
```typescript
interface DocumentManagerProps {
  petId: string
  documents: PetDocument[]
  onUpload: (file: File, metadata: DocumentMetadata) => Promise<void>
  onDelete: (docId: string) => Promise<void>
  onShare: (docId: string, options: ShareOptions) => Promise<string>
}

interface PetDocument {
  id: string
  filename: string
  type: string
  folder: string
  size: number
  uploadDate: Date
  description?: string
  tags: string[]
  expirationDate?: Date
  url: string
}

interface ShareOptions {
  expiresIn: number
  password?: string
  permissionLevel: 'view' | 'download'
}
```

### Privacy and Collaboration Components

#### 22. PrivacyControls Component

**Location**: `components/pet/privacy-controls.tsx`

**Purpose**: Granular privacy settings management

**Props**:
```typescript
interface PrivacyControlsProps {
  petId: string
  settings: PrivacySettings
  onUpdate: (settings: PrivacySettings) => Promise<void>
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private' | 'hidden'
  sectionPrivacy: {
    photos: 'public' | 'friends' | 'private'
    health: 'public' | 'friends' | 'private'
    documents: 'public' | 'friends' | 'private'
    posts: 'public' | 'friends' | 'private'
  }
  showVetDetails: boolean
  showBreederInfo: boolean
}
```

#### 23. CoOwnerManager Component

**Location**: `components/pet/co-owner-manager.tsx`

**Purpose**: Manage co-owners and their permissions

**Props**:
```typescript
interface CoOwnerManagerProps {
  petId: string
  coOwners: CoOwner[]
  onInvite: (email: string, permissions: Permissions) => Promise<void>
  onUpdatePermissions: (coOwnerId: string, permissions: Permissions) => Promise<void>
  onRemove: (coOwnerId: string) => Promise<void>
}

interface CoOwner {
  id: string
  userId: string
  username: string
  permissions: Permissions
  addedDate: Date
}

interface Permissions {
  level: 'full' | 'health_only' | 'photos_only' | 'view_only'
  canEdit: boolean
  canDelete: boolean
  canInviteOthers: boolean
}
```

### Analytics Components

#### 24. ProfileAnalytics Component

**Location**: `components/pet/analytics/profile-analytics.tsx`

**Purpose**: Display engagement metrics and insights

**Props**:
```typescript
interface ProfileAnalyticsProps {
  petId: string
  timeRange: '7d' | '30d' | '90d' | '1y'
}

interface AnalyticsData {
  profileViews: {
    total: number
    unique: number
    returning: number
    bySource: Record<string, number>
    dailyViews: Array<{ date: string; views: number }>
  }
  followers: {
    total: number
    growth: Array<{ date: string; count: number }>
    geography: Record<string, number>
  }
  photos: {
    mostViewed: Array<{ photoId: string; views: number }>
    mostLiked: Array<{ photoId: string; likes: number }>
    engagementRate: number
    bestTimeToPost: Record<number, number>
  }
  posts: {
    totalReach: number
    engagementRate: number
    trending: Array<{ postId: string; engagement: number }>
  }
}
```

### Additional API Endpoints

#### POST /api/pets/[id]/weight

**Purpose**: Log weight entry

**Request Body**:
```typescript
interface LogWeightRequest {
  date: string
  weight: number
  unit: 'lbs' | 'kg'
  notes?: string
  photoId?: string
}
```

#### POST /api/pets/[id]/vaccinations

**Purpose**: Add vaccination record

**Request Body**:
```typescript
interface AddVaccinationRequest {
  name: string
  dateAdministered: string
  administeredBy: string
  nextDueDate: string
  batchNumber?: string
  certificateFileId?: string
}
```

#### POST /api/pets/[id]/medications

**Purpose**: Add medication

**Request Body**:
```typescript
interface AddMedicationRequest {
  name: string
  dosage: string
  frequency: string
  times: string[]
  startDate: string
  endDate?: string
  purpose: string
  prescribingVet: string
  refillInfo?: {
    pillsRemaining: number
    pillsPerDose: number
  }
}
```

#### POST /api/pets/[id]/medications/[medId]/doses

**Purpose**: Log medication dose

**Request Body**:
```typescript
interface LogDoseRequest {
  timestamp: string
  administeredBy: string
  notes?: string
}
```

#### POST /api/pets/[id]/vet-visits

**Purpose**: Add vet visit record

**Request Body**:
```typescript
interface AddVetVisitRequest {
  clinicName: string
  visitDate: string
  vetName: string
  reason: string
  diagnosis: string
  treatment: string
  cost?: number
  nextAppointmentDate?: string
  documentIds: string[]
}
```

#### POST /api/pets/[id]/incidents

**Purpose**: Log health incident

**Request Body**:
```typescript
interface LogIncidentRequest {
  dateTime: string
  symptom: string
  severity: 'mild' | 'moderate' | 'severe' | 'emergency'
  actionsTaken: string[]
  outcome: string
  photoIds: string[]
  videoIds: string[]
}
```

#### POST /api/pets/[id]/goals

**Purpose**: Create wellness goal

**Request Body**:
```typescript
interface CreateGoalRequest {
  type: 'weight' | 'exercise' | 'training' | 'behavioral'
  description: string
  targetDate: string
  targetValue?: number
}
```

#### POST /api/pets/[id]/documents

**Purpose**: Upload document

**Request**: Multipart form data

**Query Parameters**:
- `folder`: string - Document folder
- `description`: string - Optional description
- `tags`: string[] - Document tags
- `expirationDate`: string - Optional expiration date

#### POST /api/pets/[id]/co-owners

**Purpose**: Invite co-owner

**Request Body**:
```typescript
interface InviteCoOwnerRequest {
  email: string
  permissions: Permissions
}
```

#### GET /api/pets/[id]/analytics

**Purpose**: Fetch profile analytics

**Query Parameters**:
- `timeRange`: '7d' | '30d' | '90d' | '1y'
- `metrics`: string[] - Specific metrics to fetch

#### POST /api/pets/compare

**Purpose**: Generate pet comparison data

**Request Body**:
```typescript
interface CompareRequest {
  petIds: string[]
}
```

#### GET /api/pets/share/[token]

**Purpose**: Access shared pet profile via token

**Query Parameters**:
- `password`: string - Optional password for protected shares

### Extended Data Models

#### Vaccination Model

```prisma
model Vaccination {
  id              String   @id @default(uuid())
  petId           String
  name            String
  dateAdministered DateTime
  administeredBy  String
  nextDueDate     DateTime
  batchNumber     String?
  certificateUrl  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([petId])
  @@index([nextDueDate])
  @@map("vaccinations")
}
```

#### Medication Model

```prisma
model Medication {
  id              String   @id @default(uuid())
  petId           String
  name            String
  dosage          String
  frequency       String
  times           String[]
  startDate       DateTime
  endDate         DateTime?
  purpose         String
  prescribingVet  String
  refillInfo      Json?
  prescriptionUrl String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  doses           MedicationDose[]
  
  @@index([petId])
  @@index([startDate])
  @@map("medications")
}

model MedicationDose {
  id             String   @id @default(uuid())
  medicationId   String
  scheduledTime  DateTime
  actualTime     DateTime?
  administeredBy String?
  status         String   // given_on_time, given_late, missed, not_yet_due
  notes          String?
  createdAt      DateTime @default(now())
  
  medication     Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
  
  @@index([medicationId])
  @@index([scheduledTime])
  @@map("medication_doses")
}
```

#### WeightEntry Model

```prisma
model WeightEntry {
  id        String   @id @default(uuid())
  petId     String
  date      DateTime
  weight    Float
  unit      String   // lbs, kg
  notes     String?
  photoUrl  String?
  createdAt DateTime @default(now())
  
  @@index([petId])
  @@index([date])
  @@map("weight_entries")
}
```

#### VetVisit Model

```prisma
model VetVisit {
  id                String   @id @default(uuid())
  petId             String
  clinicName        String
  visitDate         DateTime
  vetName           String
  reason            String
  diagnosis         String
  treatment         String
  cost              Float?
  nextAppointment   DateTime?
  documents         String[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([petId])
  @@index([visitDate])
  @@map("vet_visits")
}
```

#### HealthIncident Model

```prisma
model HealthIncident {
  id            String   @id @default(uuid())
  petId         String
  dateTime      DateTime
  symptom       String
  severity      String   // mild, moderate, severe, emergency
  actionsTaken  String[]
  outcome       String
  photos        String[]
  videos        String[]
  createdAt     DateTime @default(now())
  
  @@index([petId])
  @@index([dateTime])
  @@map("health_incidents")
}
```

#### WellnessGoal Model

```prisma
model WellnessGoal {
  id              String   @id @default(uuid())
  petId           String
  type            String   // weight, exercise, training, behavioral
  description     String
  startDate       DateTime
  targetDate      DateTime
  targetValue     Float?
  currentProgress Float    @default(0)
  milestones      Json[]
  status          String   @default("active") // active, completed, abandoned
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([petId])
  @@index([status])
  @@map("wellness_goals")
}
```

#### PetDocument Model

```prisma
model PetDocument {
  id             String    @id @default(uuid())
  petId          String
  filename       String
  type           String
  folder         String
  size           Int
  url            String
  description    String?
  tags           String[]
  expirationDate DateTime?
  uploadedBy     String
  uploadedAt     DateTime  @default(now())
  
  @@index([petId])
  @@index([folder])
  @@index([expirationDate])
  @@map("pet_documents")
}
```

#### CoOwner Model

```prisma
model CoOwner {
  id          String   @id @default(uuid())
  petId       String
  userId      String
  permissions Json
  invitedBy   String
  invitedAt   DateTime @default(now())
  acceptedAt  DateTime?
  status      String   @default("pending") // pending, accepted, declined
  
  @@index([petId])
  @@index([userId])
  @@unique([petId, userId])
  @@map("co_owners")
}
```

#### PetShare Model

```prisma
model PetShare {
  id              String    @id @default(uuid())
  petId           String
  token           String    @unique
  createdBy       String
  expiresAt       DateTime
  password        String?
  permissionLevel String    // view, comment, contribute
  accessCount     Int       @default(0)
  lastAccessedAt  DateTime?
  createdAt       DateTime  @default(now())
  
  @@index([token])
  @@index([petId])
  @@index([expiresAt])
  @@map("pet_shares")
}
```

#### ProfileView Model

```prisma
model ProfileView {
  id        String   @id @default(uuid())
  petId     String
  viewerId  String?
  source    String?  // direct, search, profile, post
  ipAddress String?
  userAgent String?
  viewedAt  DateTime @default(now())
  
  @@index([petId])
  @@index([viewedAt])
  @@map("profile_views")
}
```

#### SpeciesSpecificData Model

```prisma
model SpeciesSpecificData {
  id        String   @id @default(uuid())
  petId     String   @unique
  species   String
  data      Json     // Flexible JSON for species-specific fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([petId])
  @@map("species_specific_data")
}
```

### Phase 2 Features (Post-MVP)

**Vet Integration**:
- Connect with vet clinic APIs
- Auto-import vaccination records
- Schedule appointments from profile
- Receive health reminders

**Advanced Media**:
- Video uploads for pet profiles
- 360° photo viewer
- AR try-on for pet accessories
- Photo albums and collections

**Gamification**:
- Profile completion badges
- Milestone achievements
- Leaderboards (most followed pets)
- Seasonal challenges

### Technical Debt Considerations

**Known Limitations**:
- Initial implementation uses localStorage for draft persistence (consider IndexedDB for larger data)
- Photo processing is synchronous (consider background jobs)
- Timeline pagination is offset-based (consider cursor-based)
- No real-time updates (consider WebSocket for live updates)

**Refactoring Opportunities**:
- Extract wizard logic into custom hook
- Create reusable form components
- Implement state machine for wizard flow
- Add comprehensive error boundaries

## Conclusion

This design provides a comprehensive foundation for the Pet Profile System, balancing user experience, performance, security, and maintainability. The modular architecture allows for incremental development and future enhancements while leveraging existing infrastructure and patterns in the codebase.

Key success factors:
- **User-Centric Design**: Multi-step wizard reduces cognitive load
- **Privacy-First**: Granular controls respect user preferences
- **Performance**: Optimized images and data fetching ensure fast load times
- **Accessibility**: WCAG 2.1 AA compliance ensures inclusivity
- **Scalability**: Efficient database design and caching support growth
- **Maintainability**: Clear separation of concerns and comprehensive testing

The phased rollout approach minimizes risk while gathering real-world feedback to inform future iterations.
