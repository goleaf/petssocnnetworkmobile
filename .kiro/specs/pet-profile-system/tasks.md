# Implementation Plan

- [x] 1. Set up database schema and migrations
  - Create PetPhoto model in Prisma schema with fields for URL, thumbnail, caption, tags, and ordering
  - Create PetTimelineEvent model with fields for type, title, description, date, photos, and visibility
  - Add new fields to existing Pet model: slug, coverPhoto, markings, weightHistory, microchipCertificateUrl, insurancePolicyNumber, photoCaptions, photoTags, primaryPhotoIndex
  - Add photoUrl field to Breed model for autocomplete display
  - Create database indexes for pet lookups (owner_id, slug, species), photo queries (pet_id, is_primary), and timeline queries (pet_id with date DESC)
  - Run migrations and verify schema changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 1.1. Implement core pet service layer
  - Create lib/services/pet-service.ts with CRUD operations for pets
  - Implement createPet function with validation using Zod schema
  - Implement getPetById, getPetBySlug, updatePet, and deletePet functions
  - Add slug generation utility using pet name and owner username
  - Implement privacy checking utilities in lib/utils/pet-privacy.ts
  - Create canViewPet, canEditPet, canFollowPet helper functions
  - Add pet statistics calculation (followers, posts, photos count)
  - _Requirements: 1.1, 1.4, 1.5, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 1.2. Implement photo service and upload handling
  - Create lib/services/photo-service.ts for photo management
  - Implement photo upload with file validation (type, size, dimensions)
  - Add image processing: resize to multiple sizes (thumbnail 150x150, medium 800x800, large 1600x1600)
  - Implement WebP conversion with JPEG fallback
  - Add EXIF data stripping (except orientation)
  - Create photo deletion and reordering functions
  - Implement caption and tag management for photos
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 1.3. Create API routes for pet management
  - Implement POST /api/pets/create endpoint with request validation
  - Implement GET /api/pets/[id] endpoint with privacy checks
  - Implement PATCH /api/pets/[id] endpoint for updates
  - Implement DELETE /api/pets/[id] endpoint with cascade deletion
  - Add POST /api/pets/[id]/photo endpoint for photo uploads
  - Add DELETE /api/pets/[id]/photo/[photoId] endpoint
  - Implement PATCH /api/pets/[id]/photos/reorder endpoint
  - Add rate limiting to all endpoints (10 req/min for uploads, 20 req/min for updates)
  - _Requirements: 1.1, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.6, 8.8_

- [x] 1.4. Build Step 1: Basic Information component
  - Create components/pet/wizard/step1-basic-info.tsx component
  - Implement pet name input with Unicode support, emoji support, and 2-50 character validation
  - Add real-time character counter for name field
  - Create species dropdown with options: Dog, Cat, Bird, Rabbit, Guinea Pig, Hamster, Fish, Reptile, Horse, Farm Animal, Other
  - Implement breed autocomplete for Dog/Cat species with 300+ breeds from database
  - Add breed photo display in autocomplete suggestions
  - Create free text breed input for other species
  - Add gender radio buttons (Male, Female, Unknown)
  - Implement spayed/neutered checkbox with tooltip
  - Add color/markings textarea with 200 character limit
  - Create weight input with unit selector (lbs/kg) and automatic conversion
  - Display healthy weight range with color indicators (green/yellow/red) when breed data available
  - Implement birth date picker with "Approximate age" fallback option
  - Add age calculation and display (X years, Y months old)
  - Create adoption date picker with "With you for X months" display
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 1.5. Build Step 2: Photos & Gallery component
  - Create components/pet/wizard/step2-photos.tsx component
  - Implement primary photo upload with required validation
  - Add image cropping tool for 500x500px square format
  - Create drag-and-drop zone for photo uploads
  - Implement multi-file upload supporting up to 20 photos
  - Add individual progress bars for each uploading photo
  - Create gallery grid with drag-and-drop reordering
  - Implement caption input for each photo
  - Add photo editing tools: crop, rotate, brightness, contrast
  - Create filter options: vintage, black & white, warm, cool
  - Display file format and size validation errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 1.6. Build Step 3: Personality & Temperament component
  - Create components/pet/wizard/step3-personality.tsx component
  - Implement personality trait selector with pre-defined options as chips
  - Add traits: Friendly, Shy, Energetic, Calm, Playful, Curious, Protective, Independent, Affectionate, Vocal, Quiet, Intelligent, Stubborn, Loyal, Anxious, Confident, Gentle, Aggressive, Good with Kids, Good with Other Pets
  - Limit trait selection to maximum 10 traits
  - Add custom trait text input for unique personalities
  - Create favorite activities checkboxes with common options
  - Implement favorite treats text input (200 chars)
  - Add favorite toys text input (200 chars)
  - Create dislikes textarea (300 chars)
  - Implement special needs textarea (500 chars) with helper text
  - Display selected traits as colored tags below selector
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 1.7. Build Step 4: Identification component
  - Create components/pet/wizard/step4-identification.tsx component
  - Implement microchip ID input with 15-digit validation
  - Add microchip company dropdown (Avid, HomeAgain, AKC Reunite, PetLink, 24PetWatch, Other)
  - Create registration status selector (Registered, Not Registered, Unknown)
  - Implement microchip certificate upload (PDF/image)
  - Add collar tag ID text input
  - Create insurance policy number input field
  - Display validation errors for incorrect microchip format
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 1.8. Build Step 5: Medical Information component
  - Create components/pet/wizard/step5-medical.tsx component
  - Implement vet clinic name and contact text inputs
  - Create allergies multi-select with common options as chips
  - Add custom allergy text input
  - Implement severity selector for each allergy (Mild, Moderate, Severe) with color coding
  - Create medication list with add/remove functionality
  - Add medication fields: name, dosage, frequency, purpose, start date
  - Display medications as expandable cards
  - Implement pre-existing conditions checkboxes with common conditions
  - Add custom condition text input
  - Create date diagnosed and notes fields for each condition
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 1.9. Build Step 6: Bio & Review component
  - Create components/pet/wizard/step6-bio-review.tsx component
  - Implement rich text editor for pet bio (1000 character limit)
  - Add support for bold, italic, emoji, line breaks, @mentions, #hashtags
  - Create public profile toggle for visibility control
  - Add featured pet checkbox for users with multiple pets
  - Implement review summary displaying all entered information
  - Create confirmation dialog before final submission
  - Add edit buttons to jump back to specific steps from review
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 1.10. Build pet creation wizard shell
  - Create components/pet/pet-creation-wizard.tsx main component
  - Implement step indicator showing progress (1-6 with checkmarks)
  - Add step navigation with Next, Back, Save Draft buttons
  - Create step validation before allowing progression
  - Implement localStorage persistence for draft saving (auto-save every 30 seconds)
  - Add draft restoration on modal reopen
  - Create modal dialog wrapper with close confirmation
  - Implement form state management across all steps
  - Add error summary display at top of form
  - Handle final submission and redirect to new pet profile
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.6_

- [x] 1.11. Create pet profile page layout
  - Create app/[locale]/pet/[username]/[petSlug]/page.tsx
  - Implement hero section with cover photo banner
  - Add profile photo overlay (200x200px circular) in bottom-left of cover
  - Display pet name as large heading with species emoji
  - Show age and breed below name
  - Add "Owned by @username" with clickable link
  - Implement follow button for other users
  - Create share button with shareable link generation
  - Add verified pet badge display (if applicable)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 1.12. Implement pet profile stats bar
  - Create components/pet/pet-stats-bar.tsx component
  - Display followers count with icon
  - Show photos count with icon
  - Display posts count with icon
  - Show age with birthday icon
  - Make stats clickable to navigate to respective sections
  - Add responsive layout (horizontal on desktop, grid on mobile)
  - _Requirements: 8.5, 8.6_

- [x] 1.13. Build About tab with information cards
  - Create components/pet/about-tab.tsx component
  - Implement Physical Stats card with weight, color, neutered status
  - Add weight history line chart if multiple entries exist
  - Display healthy weight range indicator
  - Create Personality card with trait chips organized by category
  - Add favorites list with icons for treats, toys, activities
  - Implement Medical Summary card with allergies, medications, conditions
  - Display birthday notification when within 30 days
  - Add copy button for microchip ID
  - Show medication dosage schedules
  - Display condition management status (Controlled, Under Treatment, Monitoring)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 1.14. Build Photos tab with gallery
  - Create components/pet/photos-tab.tsx component
  - Implement responsive grid layout (3 columns desktop, 2 tablet, 1 mobile)
  - Add lightbox viewer on photo click
  - Implement navigation arrows in lightbox
  - Create slideshow mode with auto-advance
  - Display photo captions in lightbox
  - Add photo download option (if allowed by privacy settings)
  - Implement lazy loading for photos
  - _Requirements: 9.3, 9.4_

- [ ] 1.15. Build Health tab
  - Create components/pet/health-tab.tsx component
  - Display vet records in chronological order
  - Show vaccination history with next due dates
  - List current medications with schedules
  - Display weight tracking chart
  - Show medical history timeline
  - Add edit functionality for pet owners
  - Implement privacy checks for sensitive health data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.6_

- [ ] 1.16. Build Documents tab
  - Create components/pet/documents-tab.tsx component
  - Display uploaded documents in list/grid view
  - Show document types: adoption papers, pedigree certificates, insurance documents, vet receipts
  - Add document upload functionality for owners
  - Implement document preview for images/PDFs
  - Add download buttons for documents
  - Show upload date and file size
  - _Requirements: 9.7_

- [ ] 1.17. Implement pet timeline component
  - Create components/pet/pet-timeline.tsx component
  - Display events in reverse chronological order
  - Show automatic events: "Added to family", "First vet visit", "Completed vaccinations", "Birthday celebrations"
  - Allow manual event creation for owners
  - Display event types: New accomplishment, Health update, New friend
  - Show event date, description, and optional photos
  - Implement reactions (hearts) for timeline entries
  - Add comments section for each entry
  - Create pagination for timeline (load 20 events at a time)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 1.18. Implement tabbed content navigation
  - Create components/pet/pet-tabs.tsx component
  - Add tabs: About, Photos, Posts, Health, Documents
  - Set About as default view
  - Implement tab switching with URL hash updates
  - Add keyboard navigation for tabs
  - Show active tab indicator
  - Lazy load tab content on first view
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 1.19. Add "Add New Pet" button to dashboard
  - Update dashboard page to include prominent "Add New Pet" button
  - Add paw icon to button
  - Show incentive message "Add your first furry friend!" for users with no pets
  - Display illustration for first-time pet addition
  - Open pet creation wizard modal on click
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 1.20. Implement pet follow/unfollow functionality
  - Create API endpoint POST /api/pets/[id]/follow
  - Implement follow button on pet profile page
  - Update follower count in real-time
  - Add notification to pet owner when followed
  - Implement unfollow functionality
  - Update UI optimistically while request processes
  - _Requirements: 8.7, 8.8_

- [ ] 1.21. Implement privacy controls for pet profiles
  - Create components/pet/privacy-settings.tsx component
  - Add visibility selector (Public, Followers-only, Private)
  - Implement interaction permissions selector
  - Create privacy preview showing what others see
  - Add privacy settings to wizard Step 6
  - Enforce privacy checks in all API endpoints
  - Display privacy badges on pet cards
  - _Requirements: 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ] 1.22. Implement responsive design and mobile optimization
  - Test all components on mobile devices (< 640px)
  - Optimize wizard for mobile with bottom sheet on small screens
  - Ensure touch-friendly tap targets (minimum 44x44px)
  - Test photo upload on mobile devices
  - Optimize image loading for cellular connections
  - Test gallery swipe gestures on mobile
  - Verify all forms work with mobile keyboards
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 1.23. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation for wizard
  - Add focus management for modal dialogs
  - Create skip links for main content sections
  - Ensure color contrast meets WCAG AA standards
  - Add screen reader announcements for dynamic content
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - Implement focus trap in modal
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.1, 9.2, 9.3, 9.4_

- [ ] 1.24. Add error handling and validation
  - Implement client-side validation for all form fields
  - Add server-side validation using Zod schemas
  - Create user-friendly error messages
  - Implement retry logic for failed uploads
  - Add error boundaries for component failures
  - Display validation errors inline below fields
  - Show error summary at top of form
  - Implement draft recovery after errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 1.25. Write unit tests for pet services
  - Test PetService CRUD operations
  - Test PhotoService upload and processing
  - Test privacy checking utilities
  - Test slug generation
  - Test validation schemas
  - Test error handling
  - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [ ] 1.26. Write component tests
  - Test PetCreationWizard step navigation
  - Test form validation in each step
  - Test photo upload component
  - Test pet profile page rendering
  - Test privacy enforcement in UI
  - Test timeline component
  - Test tab navigation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 1.27. Write E2E tests for critical flows
  - Test complete pet creation flow (all 6 steps)
  - Test photo upload and gallery management
  - Test pet profile viewing with different privacy settings
  - Test follow/unfollow functionality
  - Test timeline event creation
  - Test responsive behavior on mobile
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 1.28. Implement inline editing infrastructure
  - Create components/pet/inline-edit-wrapper.tsx component with hover-to-edit functionality
  - Add edit icon display in top-right corner of editable sections
  - Implement QuickEditModal component for inline form editing
  - Add pre-fill logic for current data in edit forms
  - Implement validation matching Profile_Creation_Flow rules
  - Add save and cancel buttons with unsaved changes confirmation
  - Create success notification "Pet profile updated!" with animation
  - Implement optimistic UI updates without page reload
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 1.29. Build quick-edit shortcuts
  - Implement inline name editing with Enter to save and Escape to cancel
  - Create WeightLogModal component with date picker and number input
  - Add automatic weight history tracking on weight log
  - Implement birthdate editor for age/birthday updates
  - Create photo manager modal for primary photo changes
  - Add upload, delete, and reorder functionality to photo manager
  - _Requirements: 12.7, 12.8, 12.9, 12.10_

- [ ] 1.30. Implement bulk photo management
  - Create BulkPhotoManager component with multi-select checkboxes
  - Add actions toolbar that appears when photos are selected
  - Implement "Delete selected" with confirmation dialog showing count
  - Add "Set as primary" functionality for single photo selection
  - Create "Download selected" feature with ZIP file generation
  - Implement "Add captions" editor for selected photos
  - Add drag-and-drop reordering with auto-save
  - Display upload progress bars for new photos
  - Show storage usage indicator "X of 20 photos uploaded"
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

- [ ] 1.31. Build pet switcher navigation
  - Create PetSwitcher component as dropdown in navigation
  - Display all user's pets with small profile photos and names
  - Add count badge showing total number of pets
  - Implement navigation to selected pet's profile on click
  - Add "Add Another Pet" button at bottom of list
  - Highlight current pet with checkmark or colored background
  - Add search box for users with 10+ pets
  - Implement sort options: Recently Added, Alphabetical, Species, Age
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ] 1.32. Create pet comparison feature
  - Build PetComparison component with grid layout
  - Allow selection of up to 4 pets for comparison
  - Display each pet's photo, key stats, breed, and age
  - Show health status: vaccination status, active medications, upcoming appointments
  - Add activity level graph for each pet
  - Implement "Export as PDF" button for comparison report
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 1.33. Implement per-pet notification system
  - Create PetNotificationSettings component
  - Add independent notification toggles for each pet
  - Implement health reminders: medication, vet appointments, vaccinations
  - Add birthday reminders: 7 days before and on birthday
  - Create weight tracking reminders: monthly prompts
  - Add activity reminders: encourage posting photos/updates
  - Include pet's photo and name in all notifications
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 1.34. Add species-specific fields for dogs
  - Create SpeciesFieldsRenderer component for dynamic field rendering
  - Add breed group selector: Sporting, Hound, Working, Terrier, Toy, Non-Sporting, Herding, Mixed
  - Implement AKC/Kennel Club registration number input for purebreds
  - Add training level selector: Not trained, Basic obedience, Advanced, Certified therapy/service dog
  - Create socialization selector: Good with dogs, Selective, Prefers to be alone
  - Add exercise needs selector: Low, Moderate, High, Very High with recommended minutes
  - Implement grooming requirements selector: Low, Moderate, High-maintenance
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 1.35. Add species-specific fields for cats
  - Add indoor/outdoor status selector: Fully indoor, Indoor/outdoor, Outdoor only
  - Implement declawed status checkbox
  - Add litter box trained checkbox
  - Create scratching post preference selector: Carpet, Sisal, Cardboard, Wood
  - Add favorite hiding spots text field
  - Implement breed type selector: Domestic shorthair, Domestic longhair, Purebred
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [ ] 1.36. Add species-specific fields for birds
  - Add bird species selector: Parrot, Parakeet, Cockatiel, Canary, Finch, Macaw, Cockatoo, Other
  - Implement wingspan measurement input field
  - Add talking ability selector: Can speak, Learning, Whistles only, Quiet species
  - Create diet type selector: Seeds, Pellets, Mixed, Fresh foods
  - Add cage size input with required dimensions
  - Implement flight status selector: Fully flighted, Clipped wings, Disabled
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

- [ ] 1.37. Add species-specific fields for reptiles
  - Add reptile species selector: Lizard, Snake, Turtle, Tortoise, Gecko, Iguana, Other
  - Implement enclosure type selector: Terrarium, Aquarium, Outdoor habitat
  - Add temperature inputs: basking temp, ambient temp, night temp
  - Create humidity requirements input as percentage range
  - Add feeding schedule selector: Daily, Weekly, Bi-weekly
  - Implement live food preference selector: Crickets, Mealworms, Mice, None
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ] 1.38. Add species-specific fields for small animals
  - Add housing type selector: Cage, Hutch, Free-roam, Custom setup
  - Implement bonded pairs linking to other pet profiles
  - Add handling preference selector: Loves being held, Tolerates briefly, Prefers no handling
  - Create diet fields: hay type, pellet brand, fresh veggie favorites
  - Add exercise routine fields: playtime duration, supervised/unsupervised
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ] 1.39. Add species-specific fields for fish
  - Add tank size input in gallons or liters
  - Implement tank type selector: Freshwater, Saltwater, Brackish
  - Create water parameters inputs: pH, temperature range, ammonia, nitrite, nitrate
  - Add tank mates text field with compatibility notes
  - Implement feeding schedule: times per day and food type
  - Add equipment fields: filter type, heater, lights, air pump
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [ ] 1.40. Add species-specific fields for horses
  - Add stable/barn location fields: name and address
  - Implement discipline selector: Dressage, Jumping, Western, Trail riding, Racing, Companion, Other
  - Add training level selector: Green broke, Trained, Advanced, Competing
  - Create tack preferences fields: saddle type, bridle type, bit type
  - Add farrier schedule selector: Every 6/8/10 weeks
  - Implement exercise fields: daily turnout hours, riding frequency
  - Add dietary needs fields: grain type, supplements, hay quality
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

- [ ] 1.41. Build health dashboard component
  - Create HealthDashboard component in components/pet/health/
  - Display vaccination status with green checkmark or red warning
  - Show next vet appointment date with countdown in days
  - Display active medications count with "View all" link
  - Add weight trend indicator: gaining/stable/losing with arrow icon
  - Show recent health events timeline from last 6 months
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ] 1.42. Implement vaccination tracking system
  - Create VaccinationTracker component
  - Add vaccination form with vaccine name dropdown: Rabies, DHPP/FVRCP, Bordetella, Leptospirosis, Lyme, Canine Influenza, Feline Leukemia, custom
  - Implement fields: date administered, administered by, next due date, batch/lot number
  - Add vaccination certificate upload (photo/PDF)
  - Create vaccination history table sorted by date
  - Implement color-coded status: Green (Current), Yellow (Due Soon), Red (Overdue)
  - Build automatic reminder system: 30 days, 14 days, 7 days, day before, day of
  - Add action buttons: Schedule Appointment, Mark as Completed, Remind Me Later
  - Create weekly email summary for multiple upcoming vaccinations
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8_

- [ ] 1.43. Build medication management system
  - Create MedicationManager component
  - Add medication form with autocomplete from common pet medications
  - Implement fields: name, dosage with unit selector, frequency, times, start/end date, purpose, prescribing vet
  - Add frequency options: Once daily, Twice daily, Three times daily, Every X hours, As needed, Weekly, Monthly
  - Create multiple time pickers for daily doses
  - Add refill tracking: pills remaining counter, auto-calculate refill date
  - Implement prescription upload (photo/PDF)
  - Build medication reminder system with notifications at scheduled times
  - Create adherence calendar: green (on time), yellow (late), red (missed), grey (not due)
  - Display weekly adherence percentage
  - Add missed dose alerts if not marked within 2 hours
  - Implement dose logging: timestamp, administered by, notes
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8, 26.9, 26.10_

- [ ] 1.44. Create weight tracking system
  - Build WeightTracker component
  - Add weight entry form: date, weight with unit selector, optional photo, notes
  - Create line graph with date on X-axis and weight on Y-axis
  - Shade healthy weight range in green on graph (from breed data)
  - Add trend line showing gaining/losing direction
  - Implement event annotations: "Started diet", "Increased exercise", "Changed food", "After surgery"
  - Add export graph as image functionality
  - Create rapid weight loss alert (5%+ in 1 month)
  - Add weight outside healthy range alert with recommendations
  - Display positive reinforcement for healthy weight maintenance
  - Implement weight goal setting with target, timeline, and progress percentage
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8, 27.9, 27.10_

- [ ] 1.45. Implement vet visit logging
  - Create VetVisitLogger component
  - Add vet visit form with clinic name auto-suggest from previous visits
  - Implement fields: visit date, vet name, reason, diagnosis, treatment, cost, next appointment
  - Add reason dropdown: Annual checkup, Vaccination, Illness, Injury, Follow-up, Emergency, Grooming, Dental, Surgery, Other
  - Allow multiple document uploads: vet report, test results, X-rays, invoices
  - Auto-create reminder when next appointment is scheduled
  - Display visit history timeline with expandable details
  - Add filters by visit type and date range
  - Implement export to PDF functionality for medical history
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7_

- [ ] 1.46. Build health incident logging system
  - Create HealthIncidentLogger component
  - Add incident form with date/time picker
  - Implement symptom selector: Vomiting, Diarrhea, Limping, Coughing, Sneezing, Loss of appetite, Lethargy, Excessive scratching, Lumps/bumps, Behavioral changes, Other
  - Add severity slider: Mild, Moderate, Severe, Emergency
  - Create actions taken checkboxes: Monitored, Home remedy, Called vet, Emergency vet visit, Given medication
  - Add outcome/resolution text field
  - Implement photo and video attachment
  - Display incident history log with pattern tracking
  - Add sharing functionality for vet appointments
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7_

- [ ] 1.47. Create wellness goal tracking
  - Build WellnessGoalTracker component
  - Add goal creation form with type selector: Weight management, Exercise, Training milestones, Behavioral improvements
  - Implement weight goal fields: target weight and timeline
  - Add exercise goal fields: daily steps/minutes
  - Create training goal options: learn command, complete class, earn certification
  - Add behavioral goal options: reduce anxiety, stop destructive behavior, improve socialization
  - Display progress dashboard: description, dates, progress percentage, milestones
  - Show motivational messages and badges when goals are reached
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7_

- [ ] 1.48. Implement document management system
  - Create DocumentManager component
  - Add folder structure: Medical Records, Adoption/Purchase Papers, Insurance, Pedigree/Registration, Training Certificates, Photos & Videos, Other
  - Implement drag-and-drop file upload
  - Support file types: PDF, DOCX, XLSX, images (JPG, PNG), videos (MP4, MOV)
  - Enforce limits: 50MB per file, 500MB total per pet
  - Create embedded document viewer using PDF.js for PDFs
  - Add image lightbox for photos
  - Implement download and share buttons
  - Create shareable link generation: 24-hour expiration, optional password protection
  - Add document metadata editing: filename, description, date, tags
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8_

- [ ] 1.49. Add document search and filtering
  - Implement search box for documents by name/description/tags
  - Add filters: document type, date range, size
  - Create sort options: Date added, Name, Size, Type, Recently viewed
  - Build smart collections: Recent documents (last 30 days), Expiring soon, Needs attention
  - _Requirements: 31.9, 31.10_

- [ ] 1.50. Create document expiration tracking
  - Add expiration date field for time-sensitive documents
  - Implement reminder system: 60 days, 30 days, 1 week, day of expiration
  - Flag expired documents in red with "EXPIRED" badge
  - Add renewal prompt with upload option
  - _Requirements: 32.1, 32.2, 32.3, 32.4_

- [ ] 1.51. Implement granular privacy controls
  - Create PrivacyControls component
  - Add profile visibility selector: Public, Friends Only, Private, Hidden
  - Implement per-section privacy: Photos, Health records, Documents, Posts
  - Add toggles for vet details and breeder info visibility
  - Create privacy preview showing what others see
  - Enforce privacy checks in all API endpoints
  - Display privacy badges on pet cards
  - _Requirements: 33.1, 33.2, 33.3, 7.3, 7.4_

- [ ] 1.52. Build shareable link system
  - Implement shareable link generation with options
  - Add link types: public, password-protected, time-limited
  - Create permission levels: view only, view and comment, view and contribute
  - Support use cases: pet sitter, potential adopters, vet, family members
  - _Requirements: 33.4, 33.5_

- [ ] 1.53. Create co-owner management system
  - Build CoOwnerManager component
  - Implement invitation system via email or username
  - Add permission customization: Full access, Health records only, Photos only, View only
  - Create activity log showing who made what changes
  - Display co-owner scenarios: shared custody, family care, professional caregivers
  - _Requirements: 34.1, 34.2, 34.3, 34.4, 34.5_

- [ ] 1.54. Implement profile analytics dashboard
  - Create ProfileAnalytics component
  - Build profile views graph: daily views over 30 days
  - Show unique vs returning visitors
  - Display views by source: direct link, search, profile, posts
  - Add follower growth chart over time
  - Create geographic distribution map by countries/regions
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5_

- [ ] 1.55. Add photo and post analytics
  - Display most viewed, liked, and commented photos
  - Calculate engagement rate per photo
  - Show photo reach (unique users who saw each photo)
  - Create best time to post heatmap (hourly activity)
  - Display post analytics: engagement metrics, total reach, engagement rate
  - Show trending posts with rapid engagement growth
  - Add audience insights: demographics of engaged users
  - _Requirements: 35.6, 35.7, 35.8, 35.9_

- [ ] 1.56. Create API endpoints for inline editing
  - Implement PATCH /api/pets/[id]/quick-edit endpoint for field updates
  - Add validation matching creation flow rules
  - Return updated pet object with optimistic update support
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 1.57. Create API endpoints for weight tracking
  - Implement POST /api/pets/[id]/weight endpoint
  - Add GET /api/pets/[id]/weight-history endpoint
  - Create weight alert checking logic
  - Return trend analysis with each entry
  - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8, 27.9, 27.10_

- [ ] 1.58. Create API endpoints for vaccinations
  - Implement POST /api/pets/[id]/vaccinations endpoint
  - Add GET /api/pets/[id]/vaccinations endpoint with status calculation
  - Create vaccination reminder scheduling system
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8_

- [ ] 1.59. Create API endpoints for medications
  - Implement POST /api/pets/[id]/medications endpoint
  - Add POST /api/pets/[id]/medications/[medId]/doses endpoint for logging doses
  - Create GET /api/pets/[id]/medications endpoint with adherence calculation
  - Build medication reminder scheduling system
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8, 26.9, 26.10_

- [ ] 1.60. Create API endpoints for vet visits
  - Implement POST /api/pets/[id]/vet-visits endpoint
  - Add GET /api/pets/[id]/vet-visits endpoint with filtering
  - Create appointment reminder scheduling
  - Add PDF export functionality for medical history
  - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7_

- [ ] 1.61. Create API endpoints for health incidents
  - Implement POST /api/pets/[id]/incidents endpoint
  - Add GET /api/pets/[id]/incidents endpoint with pattern analysis
  - Create incident sharing functionality for vet appointments
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7_

- [ ] 1.62. Create API endpoints for wellness goals
  - Implement POST /api/pets/[id]/goals endpoint
  - Add PATCH /api/pets/[id]/goals/[goalId]/progress endpoint
  - Create GET /api/pets/[id]/goals endpoint with progress calculation
  - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7_

- [ ] 1.63. Create API endpoints for documents
  - Implement POST /api/pets/[id]/documents endpoint with multipart upload
  - Add GET /api/pets/[id]/documents endpoint with search and filtering
  - Create DELETE /api/pets/[id]/documents/[docId] endpoint
  - Add document sharing endpoint with token generation
  - Implement expiration reminder scheduling
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8, 31.9, 31.10, 32.1, 32.2, 32.3, 32.4_

- [ ] 1.64. Create API endpoints for co-owners
  - Implement POST /api/pets/[id]/co-owners endpoint for invitations
  - Add PATCH /api/pets/[id]/co-owners/[coOwnerId] endpoint for permission updates
  - Create DELETE /api/pets/[id]/co-owners/[coOwnerId] endpoint
  - Add activity log tracking for co-owner changes
  - _Requirements: 34.1, 34.2, 34.3, 34.4, 34.5_

- [ ] 1.65. Create API endpoints for analytics
  - Implement GET /api/pets/[id]/analytics endpoint with time range parameter
  - Add profile view tracking on each pet profile page load
  - Create analytics data aggregation queries
  - Build geographic distribution calculation
  - Add photo and post engagement metrics calculation
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9_

- [ ] 1.66. Create API endpoint for pet comparison
  - Implement POST /api/pets/compare endpoint
  - Accept array of pet IDs (up to 4)
  - Return comparison data with stats, health info, activity levels
  - Add PDF export functionality
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 1.67. Create API endpoints for shareable links
  - Implement POST /api/pets/[id]/share endpoint with options
  - Add GET /api/pets/share/[token] endpoint with password validation
  - Track access count and last accessed timestamp
  - Enforce expiration dates
  - _Requirements: 33.4, 33.5_

- [ ] 1.68. Update database schema for health tracking
  - Create Vaccination model in Prisma schema
  - Create Medication and MedicationDose models
  - Create WeightEntry model
  - Create VetVisit model
  - Create HealthIncident model
  - Create WellnessGoal model
  - Add indexes for efficient querying
  - Run migrations and verify schema
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 25.1, 25.2, 25.3, 25.4, 25.5, 26.1, 26.2, 26.3, 26.4, 26.5, 27.1, 27.2, 27.3, 28.1, 28.2, 28.3, 29.1, 29.2, 29.3, 30.1, 30.2, 30.3_

- [ ] 1.69. Update database schema for documents and collaboration
  - Create PetDocument model in Prisma schema
  - Create CoOwner model
  - Create PetShare model for shareable links
  - Create ProfileView model for analytics tracking
  - Add indexes for efficient querying
  - Run migrations and verify schema
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8, 31.9, 31.10, 32.1, 32.2, 32.3, 32.4, 34.1, 34.2, 34.3, 34.4, 34.5, 35.1, 35.2, 35.3, 35.4, 35.5_

- [ ] 1.70. Update database schema for species-specific data
  - Create SpeciesSpecificData model with flexible JSON field
  - Add indexes for petId lookups
  - Run migrations and verify schema
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 21.1, 21.2, 21.3, 21.4, 21.5, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

- [ ] 1.71. Implement notification scheduling system
  - Create notification service for vaccination reminders
  - Add medication reminder scheduling with daily notifications
  - Implement birthday reminder system
  - Create weight tracking reminder scheduler
  - Add activity reminder system
  - Build email summary for multiple upcoming tasks
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 25.6, 25.7, 25.8, 26.6, 26.7, 26.8, 26.9_

- [ ] 1.72. Integrate species-specific fields into creation wizard
  - Update Step 1 to conditionally render species-specific fields
  - Add validation for species-specific required fields
  - Store species-specific data in SpeciesSpecificData table
  - Display species-specific fields in profile About tab
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 21.1, 21.2, 21.3, 21.4, 21.5, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

- [ ] 1.73. Update Health tab with new tracking features
  - Integrate HealthDashboard component
  - Add VaccinationTracker to Health tab
  - Add MedicationManager to Health tab
  - Add WeightTracker with graph to Health tab
  - Add VetVisitLogger to Health tab
  - Add HealthIncidentLogger to Health tab
  - Add WellnessGoalTracker to Health tab
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 25.1, 25.2, 25.3, 25.4, 25.5, 26.1, 26.2, 26.3, 26.4, 26.5, 27.1, 27.2, 27.3, 28.1, 28.2, 28.3, 29.1, 29.2, 29.3, 30.1, 30.2, 30.3_

- [ ] 1.74. Add analytics tab to pet profile
  - Create new Analytics tab in pet profile navigation
  - Integrate ProfileAnalytics component
  - Add photo analytics section
  - Add post analytics section
  - Restrict access to profile owner only
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9_

- [ ] 1.75. Implement file storage for documents
  - Set up cloud storage bucket for pet documents
  - Create upload service with file validation
  - Implement virus scanning for uploaded files
  - Add file compression for large documents
  - Create signed URL generation for secure access
  - Implement automatic cleanup for expired shares
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8_

- [ ] 1.76. Add rate limiting for new endpoints
  - Implement rate limiting for weight logging: 20 req/min
  - Add rate limiting for vaccination logging: 10 req/min
  - Add rate limiting for medication logging: 20 req/min
  - Add rate limiting for document uploads: 5 req/min
  - Add rate limiting for analytics requests: 10 req/min
  - _Requirements: 27.1, 25.1, 26.1, 31.1, 35.1_

- [ ] 1.77. Implement caching for analytics data
  - Add Redis caching for profile view counts
  - Cache follower growth data with 1-hour TTL
  - Cache photo engagement metrics with 30-minute TTL
  - Implement cache invalidation on new data
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9_

- [ ] 1.78. Add background jobs for reminders
  - Create daily job to check vaccination due dates
  - Add hourly job for medication reminders
  - Create daily job for birthday reminders
  - Add monthly job for weight tracking reminders
  - Create weekly job for email summaries
  - Implement job for document expiration checks
  - _Requirements: 16.2, 16.3, 16.4, 16.5, 25.6, 25.7, 25.8, 26.6, 26.7, 26.8, 32.2_

- [ ] 1.79. Write unit tests for health tracking services
  - Test vaccination service CRUD operations
  - Test medication service with dose logging
  - Test weight tracking with trend analysis
  - Test vet visit service
  - Test health incident logging
  - Test wellness goal tracking
  - Test reminder scheduling logic
  - _Requirements: 25.1, 25.2, 25.3, 26.1, 26.2, 26.3, 27.1, 27.2, 27.3, 28.1, 28.2, 28.3, 29.1, 29.2, 29.3, 30.1, 30.2, 30.3_

- [ ] 1.80. Write unit tests for document and collaboration services
  - Test document upload and storage
  - Test document search and filtering
  - Test shareable link generation and validation
  - Test co-owner invitation and permissions
  - Test activity log tracking
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8, 31.9, 31.10, 33.4, 33.5, 34.1, 34.2, 34.3, 34.4, 34.5_

- [ ] 1.81. Write unit tests for analytics services
  - Test profile view tracking
  - Test follower growth calculation
  - Test photo engagement metrics
  - Test post analytics
  - Test geographic distribution calculation
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9_

- [ ] 1.82. Write component tests for new features
  - Test inline editing components
  - Test bulk photo manager
  - Test pet switcher navigation
  - Test pet comparison component
  - Test species-specific field rendering
  - Test health tracking components
  - Test document manager
  - Test privacy controls
  - Test co-owner manager
  - Test analytics dashboard
  - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 14.1, 14.2, 14.3, 15.1, 15.2, 15.3, 17.1, 18.1, 19.1, 20.1, 21.1, 22.1, 23.1, 24.1, 25.1, 26.1, 27.1, 28.1, 29.1, 30.1, 31.1, 33.1, 34.1, 35.1_

- [ ] 1.83. Write E2E tests for inline editing
  - Test quick name edit with Enter/Escape
  - Test weight logging modal
  - Test photo manager modal
  - Test bulk photo operations
  - Test edit confirmation dialogs
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

- [ ] 1.84. Write E2E tests for multiple pet management
  - Test pet switcher navigation
  - Test pet comparison feature
  - Test per-pet notification settings
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 1.85. Write E2E tests for health tracking
  - Test complete vaccination logging flow
  - Test medication management with reminders
  - Test weight tracking with graph
  - Test vet visit logging
  - Test health incident logging
  - Test wellness goal creation and tracking
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8, 26.1, 26.2, 26.3, 26.4, 26.5, 26.6, 26.7, 26.8, 26.9, 26.10, 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7, 27.8, 27.9, 27.10, 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7_

- [ ] 1.86. Write E2E tests for document management
  - Test document upload flow
  - Test document search and filtering
  - Test document sharing with password
  - Test expiration reminders
  - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.8, 31.9, 31.10, 32.1, 32.2, 32.3, 32.4_

- [ ] 1.87. Write E2E tests for privacy and collaboration
  - Test granular privacy settings
  - Test shareable link generation and access
  - Test co-owner invitation flow
  - Test co-owner permissions enforcement
  - Test activity log tracking
  - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.5, 34.1, 34.2, 34.3, 34.4, 34.5_

- [ ] 1.88. Write E2E tests for species-specific fields
  - Test dog-specific fields in creation wizard
  - Test cat-specific fields
  - Test bird-specific fields
  - Test reptile-specific fields
  - Test small animal fields
  - Test fish-specific fields
  - Test horse-specific fields
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 21.1, 21.2, 21.3, 21.4, 21.5, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_

- [ ] 1.89. Optimize performance for new features
  - Implement lazy loading for health tracking components
  - Add pagination for vaccination and medication lists
  - Optimize document search with database indexes
  - Implement virtual scrolling for large document lists
  - Add debouncing for search inputs
  - Optimize analytics queries with aggregation
  - _Requirements: 25.1, 26.1, 27.1, 28.1, 31.9, 35.1_

- [ ] 1.90. Add accessibility features for new components
  - Add ARIA labels to health tracking forms
  - Implement keyboard navigation for document manager
  - Add screen reader support for analytics charts
  - Ensure color contrast for health status indicators
  - Add focus management for inline editing modals
  - _Requirements: 12.1, 24.1, 25.1, 26.1, 27.1, 31.1, 35.1_

- [ ] 1.91. Create user documentation for new features
  - Write guide for inline editing
  - Document health tracking features
  - Create document management tutorial
  - Write privacy and sharing guide
  - Document co-owner collaboration features
  - Create analytics interpretation guide
  - _Requirements: All new requirements 12-35_
