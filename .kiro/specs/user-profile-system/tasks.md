# Implementation Plan

- [ ] 1.Set up database schema and migrations
  - The User type already exists in lib/types.ts with most required fields (username, email, fullName, dateOfBirth, avatar, coverPhoto, bio, location, privacy settings, etc.)
  - Privacy settings are embedded in the User type rather than a separate model
  - Username history tracking exists via usernameHistory array in User type
  - Blocked/restricted users tracked via blockedUsers and restrictedUsers arrays in User type
  - Note: Using in-memory storage (lib/storage-server.ts) rather than Prisma - no database migrations needed
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 1.1.Create TypeScript types and interfaces
  - User interface already exists in lib/types.ts with comprehensive profile fields
  - Privacy settings embedded in User type with all required visibility controls
  - ProfileAnalytics types exist in lib/profile-analytics.ts and lib/profile-audience.ts
  - Username change tracking exists via usernameHistory in User type
  - Note: Types are already defined and in use across the codebase
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_

- [ ] 1.2.Implement profile data service layer
  - Profile CRUD operations exist in lib/storage-server.ts (getServerUserById, updateServerUser, getServerUsers)
  - Privacy rule application exists in lib/utils/privacy.ts (canViewProfile, canViewProfileSection, canViewUserScopedProperty)
  - Profile completion calculation exists in lib/utils/profile-compute.ts (computeProfileCompletionForServer)
  - Profile overview service exists in lib/utils/profile-overview.ts (getProfileOverview, calculateProfileCompletionPercent)
  - Note: Services are already implemented and functional
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 1.3.Create Zod validation schemas
  - Created lib/validations/profile-schemas.ts with comprehensive validation
  - Implemented profileBasicInfoSchema with fullName (2-100 chars, letters/spaces/hyphens/apostrophes only), displayName (1-50 chars), username (3-20 chars alphanumeric), dateOfBirth (age 13+), gender validation with custom option
  - Implemented profileBioSchema with 1000 char limit, max 10 hashtags, interests array (max 30 items, 30 chars each)
  - Implemented profileContactSchema with email, phone (international format), website URL, social media format validation (Instagram, Twitter, TikTok, YouTube, Facebook)
  - Implemented location fields in profileContactSchema: country, state, city, timezone (IANA format)
  - Implemented privacySettingsSchema with all visibility levels (profileVisibility, field visibility, contact privacy controls)
  - Implemented usernameChangeSchema with password requirement
  - Implemented emailChangeSchema with password requirement
  - Implemented phoneVerificationSchema and otpVerificationSchema for phone verification flow
  - Implemented blockUserSchema and restrictUserSchema for user blocking/restricting
  - All schemas use strict mode and provide detailed error messages
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 12.3, 12.4_

- [ ] 1.4.Build profile display components
- [ ] 1.5.Create ProfileHeader component
  - ProfileHeader already exists at components/profile/ProfileHeader.tsx
  - Displays profile photo, cover photo, username, display name, location
  - Shows follower/following/posts counts
  - Has hover overlays for photo changes (owner only)
  - Supports verification badge display
  - Note: Component is complete and functional
  - _Requirements: 1.3, 1.4, 1.5, 11.4, 13.6_

- [ ] 1.6.Create ProfileCompletionWidget component  COMPLETED
  - Built components/profile/profile-completion-widget.tsx with full implementation
  - Circular progress indicator with SVG animation showing percentage
  - Color-coded progress: red (<30%), yellow (30-60%), green (60-100%)
  - Interactive checklist showing all items with checkmarks/X marks
  - Clickable items navigate to corresponding sections (basic-info, about-me, contact, pets)
  - Motivational text changes based on completion level
  - Completion message displayed at 100% with celebration emoji
  - Contextual tips for incomplete profiles based on percentage range
  - Weighted calculation: avatar (10%), cover (5%), bio (15%), location (5%), birthday (5%), phoneVerified (10%), emailVerified (10%), interests (10%), hasPet (20%), contactInfo (5%), socialLinks (5%)
  - Comprehensive test coverage in tests/active/components/profile-completion-widget.test.tsx
  - Documentation in components/profile/README.md
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 1.7.Create VerificationBadge component
  - Build components/profile/verification-badge.tsx
  - Display blue checkmark icon for verified users (use CheckCircle2 from lucide-react)
  - Add tooltip showing "Verified account" on hover using Tooltip component from @/components/ui/tooltip
  - Support different badge types (verified, premium) with different colors
  - Make badge size configurable (small, medium, large)
  - _Requirements: 13.6_

- [ ] 1.8.Build profile editing page and tab container
  - Create app/[locale]/settings/profile/page.tsx (following existing settings pattern in app/[locale]/settings/)
  - Implement tabbed interface with 5 tabs: Basic Info, About Me, Contact, Preferences, Privacy using Tabs component from @/components/ui/tabs
  - Integrate existing tab components: BasicInfoTab, AboutMeTab, ContactTab, PreferencesTab, PrivacyTab
  - Manage form state across all tabs using React state or React Hook Form
  - Implement save/cancel buttons with unsaved changes warning dialog
  - Add loading states using Skeleton components and error handling with toast notifications
  - Connect to existing API route at /api/users/[userId]/profile (GET and PUT handlers already exist)
  - Fetch current user data on mount and populate form fields
  - Show success toast on save, error toast on failure
  - _Requirements: 1.1, 1.2_

- [ ] 1.9.Enhance BasicInfoTab component
- [ ] 1.10.Enhance basic info form fields
  - Update components/profile/edit-tabs/basic-info-tab.tsx (already exists with fullName, occupation, bio, dateOfBirth, gender)
  - Add character counter to Full Name input showing "X/100 characters" below the field
  - Add client-side validation using profileBasicInfoSchema from lib/validations/profile-schemas.ts
  - Add Display Name input field (1-50 chars, emoji support) with character counter
  - Add Username input with 3-20 char limit (alphanumeric + underscore/hyphen)
  - Implement real-time username availability check using debounced API call to /api/users/[userId]/username (POST with check action)
  - Display CheckCircle icon when available, XCircle icon with "Username taken" when unavailable
  - Show info message "You can change username once every 30 days" below username field
  - Use existing Input component from @/components/ui/input
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 1.11.Enhance date of birth and gender fields
  - Date of Birth picker already exists as date input
  - Add age calculation function and display calculated age next to date picker (e.g., "Age: 25")
  - Add Checkbox "Show age on profile" below date picker
  - Add Checkbox "Show only month/day (hide year)" for birthday privacy
  - Add validation to ensure age is 13+ with error message "You must be at least 13 years old"
  - Update Gender dropdown to include: Male, Female, Non-binary, Custom, Prefer not to say
  - When "Custom" is selected, show text input for custom gender (max 50 chars)
  - Use Select component from @/components/ui/select
  - _Requirements: 2.6, 2.7_

- [ ] 1.12.Enhance AboutMeTab component with rich text editor
- [ ] 1.13.Set up TipTap rich text editor for bio
  - Update components/profile/edit-tabs/about-me-tab.tsx (currently has Textarea for aboutMe field)
  - Install TipTap if not already: @tiptap/react @tiptap/starter-kit @tiptap/extension-link
  - Replace textarea with TipTap editor component
  - Add toolbar with buttons: Bold, Italic, Underline, Strike, BulletList, OrderedList, Link
  - Add emoji picker button using emoji-picker-react or similar library
  - Implement 1000 character limit using CharacterCount extension
  - Display live character counter below editor showing "XXX/1000 characters"
  - Turn counter red when >= 950 characters
  - Use existing Card and CardContent components for layout
  - _Requirements: 3.1, 3.2_

- [ ] 1.14.Implement @mention functionality  COMPLETED
  - Component already exists at components/profile/mention-autocomplete.tsx
  - Integrated into AboutMeTab with textareaRef prop
  - Triggers dropdown on @ symbol showing users
  - Displays profile photos and usernames in dropdown
  - Implements keyboard navigation (up/down arrows, enter to select)
  - Inserts clickable mention link on selection
  - Note: Works with textarea, may need adaptation for TipTap editor
  - _Requirements: 3.3, 3.4_

- [ ] 1.15.Implement #hashtag functionality
  - Create components/profile/hashtag-autocomplete.tsx following pattern from mention-autocomplete.tsx
  - Trigger dropdown on # symbol showing trending hashtags
  - Fetch trending hashtags from API or use predefined list
  - Auto-link hashtags to search results (/search?q=%23{tag})
  - Validate maximum of 10 hashtags per bio in validation schema
  - Display hashtags in blue color (#3B82F6)
  - _Requirements: 3.5, 3.6_

- [ ] 1.16.Implement URL auto-detection
  - Add URL detection regex to bio processing
  - Auto-convert URLs to clickable links with http/https validation
  - Truncate long URLs to domain + "..." in display (e.g., "example.com...")
  - Add target="_blank" and rel="noopener noreferrer" to links
  - Can be implemented as TipTap extension or post-processing
  - _Requirements: 3.7, 3.8_

- [ ] 1.17.Enhance interests and hobbies section
  - AboutMeTab already has TagInput component for interests
  - Create predefined interests list: Training & Behavior, Pet Photography, Grooming & Styling, Pet Fashion, Veterinary Care, Nutrition & Diet, Exercise & Fitness, Pet Travel, Breeding, Shows & Competitions, Pet Rescue, Pet Products & Reviews, DIY Pet Projects, Pet Technology, Pet Psychology, Alternative Medicine, Agility Training, Service Animals, Therapy Animals, Wildlife Rehabilitation, Exotic Pets, Aquatic Pets, Reptile Care, Avian Care
  - Add multi-select Combobox component from @/components/ui/combobox for predefined interests
  - Display selected interests as colored Badge components with X button to remove
  - Allow custom interest input via TagInput (press enter to add, max 30 chars each)
  - Enforce maximum of 30 total interests with validation
  - Use profileBioSchema validation from lib/validations/profile-schemas.ts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 1.18.Enhance ContactTab component
- [ ] 1.19.Add email and phone verification UI
  - Update components/profile/edit-tabs/contact-tab.tsx (check if it exists, create if not)
  - Add email display with verified checkmark icon (CheckCircle2) or "Unverified - Click to verify" link
  - Create Dialog component for email change with new email input and current password field
  - Add phone number input with international format using react-phone-number-input or similar
  - Add country code dropdown for phone numbers
  - Create OTP verification dialog for phone number changes
  - Use existing Dialog component from @/components/ui/dialog
  - Connect to email verification API endpoints (may need to create)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 1.20.Add website and social media fields
  - Check if ContactTab exists, create if not following pattern from BasicInfoTab
  - Add Website URL input with validation (http/https required)
  - Add social media inputs: Instagram, Twitter, TikTok, YouTube, Facebook
  - Validate format for each platform using profileContactSchema from lib/validations/profile-schemas.ts
  - Display with respective platform icons (Instagram, Twitter, Youtube, Facebook from lucide-react)
  - Use Input component from @/components/ui/input
  - _Requirements: 5.5, 5.6_

- [ ] 1.21.Implement location fields
  - Add Country dropdown with searchable list using Combobox component
  - Add State/Region dropdown that populates based on selected country
  - Add City input with CityAutocomplete component (check if exists at @/components/ui/city-autocomplete)
  - Add timezone selector with auto-detection using Intl.DateTimeFormat().resolvedOptions().timeZone
  - Add Select component for manual timezone override with IANA timezone list
  - Add privacy toggle "Show exact city" vs "Show only country/region" using Switch component
  - Use existing location API integration if available
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.22.Add languages section
  - Create multi-select Combobox for languages (English, Spanish, French, German, Chinese, Japanese, etc.)
  - Add proficiency level Select for each language: Native, Fluent, Conversational, Basic, Learning
  - Display selected languages as Badge components with proficiency level
  - Add "Other" option with text input for unlisted languages
  - Store as array of objects: { language: string, proficiency: string }
  - Use profileContactSchema validation from lib/validations/profile-schemas.ts
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.23.Enhance PreferencesTab component
  - Check if components/profile/edit-tabs/preferences-tab.tsx exists, create if not
  - Add Relationship Status Select with options: Single, In a relationship, Married, It's complicated, Prefer not to say
  - Add Display Preferences section with Select components:
    - Timestamp format: Relative (2 hours ago), Absolute (Jan 1, 2024 3:00 PM), Both
    - Date format: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
    - Time format: 12-hour, 24-hour
  - Add Content Preferences section:
    - Preferred languages multi-select
    - Auto-translate toggle Switch
    - Content filtering level Select: Off, Moderate, Strict
  - Add Notification Preferences section (or link to existing notifications settings)
  - Use Card, Select, Switch components from @/components/ui
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.24.Enhance PrivacyTab component
- [ ] 1.25.Build profile visibility controls
  - Check if components/profile/edit-tabs/privacy-tab.tsx exists, create if not
  - Add profile visibility RadioGroup with options: Public, Friends Only, Private, Custom
  - Show explanation text and icon for each option using Alert component
  - Public: "Anyone can see your profile"
  - Friends Only: "Only people you follow who follow you back"
  - Private: "Only approved followers can see"
  - Custom: "Advanced settings below"
  - Use RadioGroup component from @/components/ui/radio-group
  - _Requirements: 9.1_

- [ ] 1.26.Implement granular privacy toggles
  - Add individual privacy Select dropdowns for each field:
    - Profile photo: Everyone, Friends, Only Me
    - Cover photo: Everyone, Friends, Only Me
    - Email: Everyone, Friends, Only Me, Never
    - Phone: Everyone, Friends, Only Me, Never
    - Birthday: Everyone, Friends, Only Me, Hide Year
    - Age: Everyone, Friends, Only Me
    - Location: Exact City, State Only, Country Only, Hidden
    - Joined date: Everyone, Friends, Only Me
    - Last active: Everyone, Friends, Only Me, Hidden
  - Implement auto-save on change using debounced API call to /api/user/privacy (PUT)
  - Show loading Spinner next to field while saving
  - Show CheckCircle icon on successful save
  - Use Select component from @/components/ui/select
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 1.27.Add contact privacy controls
  - Add "Who can send me messages" Select: Everyone, Friends, Friends of Friends, Only people I follow, No one
  - Add "Who can tag me in posts" Select: Everyone, Friends, Only Me, No one
  - Add "Who can see my friends/followers list" Select: Everyone, Friends, Only Me
  - Add "Who can see who I'm following" Select: Everyone, Friends, Only Me
  - Add "Who can see my liked posts" Select: Everyone, Friends, Only Me
  - Use same auto-save pattern as 11.2
  - Group in Card with title "Contact & Interaction Privacy"
  - _Requirements: 9.6_

- [ ] 1.28.Build blocking and restricting UI
  - Create "Blocked Accounts" section with Card component
  - Fetch blocked users list from API (may need to create endpoint)
  - Display each blocked user with Avatar, username, and Unblock Button
  - Implement unblock functionality calling API endpoint (may need to create)
  - Create "Restricted Accounts" section with Card component
  - Display each restricted user with Avatar, username, and Unrestrict Button
  - Implement restrict/unrestrict functionality
  - Show confirmation Dialog before unblocking/unrestricting
  - Use Avatar, Button, Dialog components from @/components/ui
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_


- [ ] 1.29.Implement photo upload and management
- [ ] 1.30.Create ProfilePhotoUpload component
  - Check if ProfileHeader component exists at components/profile/ProfileHeader.tsx or components/profile/profile-header.tsx
  - If photo upload exists, verify it has modal UI with options: Upload New Photo, Take Photo (mobile), Choose from existing, Remove Photo, Cancel
  - If not, create ProfilePhotoUpload component with Dialog containing upload options
  - Implement file picker accepting image/jpeg, image/png, image/webp, image/heic with max 10MB
  - Connect to API route at /api/users/[userId]/profile-photo (POST)
  - Show upload progress bar using Progress component
  - Display success/error toast notifications
  - Use Dialog, Button, Progress components from @/components/ui
  - _Requirements: 7.1, 7.2_

- [ ] 1.31.Build PhotoCropModal component
  - Create components/profile/photo-crop-modal.tsx
  - Install react-easy-crop: npm install react-easy-crop
  - Implement Dialog with react-easy-crop component
  - Add circular crop overlay for profile photos (use cropShape="round")
  - Add zoom Slider (100%-300% scale) using Slider component from @/components/ui/slider
  - Drag-to-reposition is built into react-easy-crop
  - Add rotation buttons (90° increments) using Button components
  - Add brightness/contrast adjustment Sliders (optional enhancement)
  - Show preview at multiple sizes: large (200x200), medium (100x100), small (50x50)
  - Add Apply and Cancel buttons
  - Return cropped image blob to parent component
  - _Requirements: 7.3_

- [ ] 1.32.Implement client-side image processing
  - Check if lib/utils/upload.ts exists with uploadProfilePhoto function
  - If not, create upload utility functions
  - Implement upload progress tracking using XMLHttpRequest or fetch with progress events
  - Add client-side image compression using browser-image-compression or canvas API
  - Compress images to under 2MB before upload while maintaining quality
  - Show Progress component during upload
  - Handle errors: file too large, invalid type, network error
  - Display error toast on failure
  - Note: Server-side processing with Sharp exists at /api/users/[userId]/profile-photo
  - _Requirements: 7.4_

- [ ] 1.33.Create cover photo upload component
  - Similar to 12.1 but for cover photos
  - Create CoverPhotoUpload component or add to ProfileHeader
  - Accept larger files (max 15MB)
  - Use rectangular crop overlay maintaining 3:1 aspect ratio
  - Connect to API route at /api/users/[userId]/cover-photo (POST)
  - Show upload progress and success/error notifications
  - _Requirements: 8.1, 8.2_

- [ ] 1.34.Build backend API routes for profile data  COMPLETED
- [ ] 1.35.Implement GET /api/users/[userId]/profile  COMPLETED
  - Route exists at app/api/users/[userId]/profile/route.ts
  - Fetches profile data from storage using getServerUserById
  - Applies privacy rules using buildProfileResponse and canViewProfileSection
  - Returns only visible fields based on privacy settings
  - Includes profile photo URLs with multiple sizes (deriveAvatarSizes)
  - Includes cover photo URLs with multiple sizes (deriveCoverSizes)
  - Calculates age if birthday is visible (formatBirthday, computeAge)
  - Includes follower/following/posts counts
  - Implements caching with setCached (1 hour TTL)
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 1.36.Implement PUT /api/users/[userId]/profile  COMPLETED
  - PUT handler exists in app/api/users/[userId]/profile/route.ts
  - Validates authentication (must be profile owner)
  - Checks uniqueness constraints for username and email
  - Requires password for sensitive changes (username, email, phone)
  - Updates storage using updateServerUser
  - Invalidates cached profile data with deleteCached
  - Broadcasts profile update event via broadcastEvent
  - Logs changes to audit trail (console.log for demo)
  - Returns updated profile object using buildProfileResponse
  - Validates: fullName (1-100 chars), bio (<=1000 chars), website (valid URL), interests (<=50 items), languages (<=30 items)
  - _Requirements: 15.5, 15.6, 15.7_

- [ ] 1.37.Implement GET /api/users/[userId]/profile/completion
  - Create app/api/users/[userId]/profile/completion/route.ts
  - Import computeProfileCompletionForServer from lib/utils/profile-compute.ts
  - Fetch user data using getServerUserById
  - Calculate profile completion percentage
  - Return JSON: { percentage: number, missingFields: string[] }
  - List missing fields: profilePhoto, coverPhoto, bio, location, birthday, phoneVerified, emailVerified, interests, pets, contactInfo, socialLinks
  - Only accessible by profile owner (check authentication)
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 1.38.Build backend API routes for photo management
- [ ] 1.39.Implement POST /api/users/[userId]/profile-photo
  - Check if route exists at app/api/users/[userId]/profile-photo/route.ts
  - If not, create POST handler accepting multipart/form-data with image file
  - Validate authentication (must be profile owner)
  - Validate file type (image/jpeg, image/png, image/webp, image/heic) and size (max 10MB)
  - Install Sharp if not already: npm install sharp
  - Use Sharp library to generate 5 size variants: original (max 1000x1000), large (400x400), medium (200x200), small (100x100), thumbnail (50x50)
  - Save to local filesystem at public/uploads/profiles/{userId}/ with filenames: original.jpg, large.jpg, medium.jpg, small.jpg, thumbnail.jpg
  - Update user record with profilePhotoUrl using updateServerUser
  - Archive old profile photo to public/uploads/archive/profiles/{userId}-{timestamp}.jpg
  - Return JSON with URLs for all sizes: { original, large, medium, small, thumbnail }
  - Broadcast update event via broadcastEvent
  - Optional: Add image moderation using AWS Rekognition or similar
  - _Requirements: 7.5, 7.6, 7.7, 15.8_

- [ ] 1.40.Implement DELETE /api/users/[userId]/profile-photo
  - Check if DELETE handler exists in app/api/users/[userId]/profile-photo/route.ts
  - If not, create DELETE handler
  - Validate authentication (must be profile owner)
  - Archive old photo to public/uploads/archive/profiles/{userId}-{timestamp}.jpg
  - Generate default avatar SVG with user's first initial using canvas or SVG template
  - Set profilePhotoUrl to default avatar URL or null
  - Update user record using updateServerUser
  - Return JSON with default avatar URL
  - _Requirements: 15.9_

- [ ] 1.41.Implement POST /api/users/[userId]/cover-photo
  - Check if route exists at app/api/users/[userId]/cover-photo/route.ts
  - If not, create POST handler similar to profile-photo
  - Accept larger files (max 15MB)
  - Generate 4 size variants maintaining 3:1 aspect ratio: original (max 2000x667), large (1200x400), medium (900x300), small (600x200)
  - Save to local filesystem at public/uploads/covers/{userId}/
  - Update user record with coverPhotoUrl
  - Archive old cover photo
  - Return JSON with URLs for all sizes
  - Broadcast update event
  - Optional: Apply gradient overlay for text readability
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 1.42.Implement DELETE /api/users/[userId]/cover-photo
  - Check if DELETE handler exists in app/api/users/[userId]/cover-photo/route.ts
  - If not, create DELETE handler
  - Validate authentication
  - Archive old cover photo to public/uploads/archive/covers/{userId}-{timestamp}.jpg
  - Set coverPhotoUrl to null
  - Update user record
  - Return success JSON
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 1.43.Implement username management system  MOSTLY COMPLETED
- [ ] 1.44.Create POST /api/users/[userId]/username (check availability)  COMPLETED
  - Route exists at app/api/users/[userId]/username/route.ts (POST handler)
  - Accepts newUsername and password in request body
  - Validates username format with USERNAME_REGEX (/^[a-zA-Z0-9_-]{3,20}$/)
  - Checks availability using serverUsernameExists
  - Checks if reserved within 30 days using isUsernameReservedWithinDays
  - Enforces 30-day cooldown (THIRTY_DAYS_MS)
  - Validates password against stored user password
  - Updates username using updateServerUser
  - Adds to usernameHistory array
  - Calls addServerUsernameHistory for global tracking
  - Revalidates paths for old and new username
  - Returns { success: true, newUsername } or error with daysLeft
  - Note: This endpoint combines check and change functionality
  - _Requirements: 2.4, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 1.45.Create separate GET /api/users/[userId]/username/check endpoint (optional)
  - If needed for real-time availability checking without password
  - Create GET handler in app/api/users/[userId]/username/route.ts or separate check/route.ts
  - Accept username as query parameter
  - Check availability using serverUsernameExists
  - Check if reserved using isUsernameReservedWithinDays
  - Return { available: boolean, message?: string }
  - Add rate limiting to prevent abuse
  - Note: Current POST endpoint requires password, so separate check endpoint may be useful
  - _Requirements: 2.4, 12.1, 12.2_

- [ ] 1.46.Implement username redirect logic
  - Create middleware in middleware.ts or app/user/[username]/page.tsx
  - Check if username exists in current users
  - If not found, query username history using getServerUsernameHistory or similar
  - If found in history and within 30 days, redirect to new username URL
  - Show Alert banner: "This user recently changed their username from @oldname to @newname"
  - Use Alert component from @/components/ui/alert
  - After 30 days, username becomes available (already handled by isUsernameReservedWithinDays)
  - _Requirements: 12.6_

- [ ] 1.47.Create GET /api/users/[userId]/username/history
  - Create app/api/users/[userId]/username/history/route.ts
  - Validate authentication (must be profile owner or admin)
  - Fetch user using getServerUserById
  - Return user.usernameHistory array
  - Format: Array<{ userId: string, previousUsername: string, newUsername: string, changedAt: string }>
  - Sort by changedAt descending (most recent first)
  - Return JSON: { history: [...] }
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 1.48.Build verification system (Future Enhancement)
  - Note: Verification system is a separate feature that can be implemented later
  - User type already has isVerified, verificationBadgeType, and verifiedAt fields
  - Badge display already supported in ProfileHeader component
  - When implementing, will need:
    - VerificationRequestForm component
    - POST /api/users/[userId]/verification/request endpoint
    - GET /api/users/[userId]/verification/status endpoint
    - Admin approval/rejection endpoints
    - Email notifications
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 1.49.Implement privacy and blocking API endpoints
- [ ] 1.50.Create GET /api/users/[userId]/privacy
  - Check if app/api/user/privacy/route.ts exists (note: may be /api/user/privacy not /api/users/[userId]/privacy)
  - If not, create app/api/users/[userId]/privacy/route.ts
  - Validate authentication (must be profile owner)
  - Fetch user using getServerUserById
  - Return user.privacy object with all privacy settings
  - Format: { profileVisibility, profilePhotoVisibility, coverPhotoVisibility, emailVisibility, phoneVisibility, birthdayVisibility, ageVisibility, locationVisibility, joinedDateVisibility, lastActiveVisibility, whoCanMessage, whoCanTag, friendsListVisibility, followingListVisibility, likedPostsVisibility }
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 1.51.Implement PUT /api/users/[userId]/privacy
  - Create PUT handler in app/api/users/[userId]/privacy/route.ts
  - Validate authentication (must be profile owner)
  - Parse request body with privacy settings
  - Validate privacy levels using privacySettingsSchema from lib/validations/profile-schemas.ts
  - Update user.privacy object using updateServerUser
  - Invalidate cached profile data using deleteCached
  - Broadcast privacy update event via broadcastEvent
  - Return updated privacy settings
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 1.52.Implement POST /api/users/[userId]/block
  - Create app/api/users/[userId]/block/route.ts or app/api/social/block-user/route.ts
  - Validate authentication
  - Accept targetUserId in request body
  - Validate targetUserId exists using getServerUserById
  - Add targetUserId to user.blockedUsers array using updateServerUser
  - Remove targetUserId from followers/following if present
  - Prevent blocked user from viewing profile (enforced in privacy checks)
  - Return success JSON
  - _Requirements: 10.1, 10.2_

- [ ] 1.53.Implement POST /api/users/[userId]/unblock
  - Create app/api/users/[userId]/unblock/route.ts or add to block route
  - Validate authentication
  - Accept targetUserId in request body
  - Remove targetUserId from user.blockedUsers array using updateServerUser
  - Return success JSON
  - _Requirements: 10.1, 10.2_

- [ ] 1.54.Implement POST /api/users/[userId]/restrict
  - Create app/api/users/[userId]/restrict/route.ts
  - Validate authentication
  - Accept targetUserId in request body
  - Add targetUserId to user.restrictedUsers array using updateServerUser
  - Restricted users' comments hidden from others but visible to them (enforced in comment rendering logic)
  - Return success JSON
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 1.55.Implement POST /api/users/[userId]/unrestrict
  - Create app/api/users/[userId]/unrestrict/route.ts or add to restrict route
  - Validate authentication
  - Accept targetUserId in request body
  - Remove targetUserId from user.restrictedUsers array using updateServerUser
  - Return success JSON
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 1.56.Build profile analytics system
- [ ] 1.57.Implement POST /api/users/[userId]/analytics/track-view
  - Create app/api/users/[userId]/analytics/track-view/route.ts
  - Accept referrer in request body (optional)
  - Get viewer ID from getCurrentUser (null if not authenticated)
  - Get IP address from request headers (x-forwarded-for or x-real-ip)
  - Check if lib/profile-views-cache.ts exists with incrementProfileViewCached
  - If not, create simple tracking: store in user.profileViews array or separate analytics table
  - Deduplicate views within 24-hour window per viewer
  - Store: viewerId, ipAddress (hashed for privacy), referrer, timestamp
  - Return success JSON
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 1.58.Create GET /api/users/[userId]/analytics/views
  - Create app/api/users/[userId]/analytics/views/route.ts
  - Validate authentication (must be profile owner)
  - Accept period query param: 7d, 30d, 90d, all (default: 30d)
  - Check if lib/profile-views-cache.ts exists with getProfileViewsHourlySeries
  - Check if lib/profile-analytics.ts exists with getProfileStats
  - If not, implement basic analytics: query profile views, aggregate by date
  - Calculate: totalViews, uniqueVisitors, returningVisitors
  - Generate time-series data: Array<{ date: string, count: number }>
  - Calculate top referring sources: Array<{ source: string, count: number }>
  - Return JSON: { totalViews, uniqueVisitors, returningVisitors, byDay: [...], referrers: [...] }
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 1.59.Implement GET /api/users/[userId]/analytics/engagement
  - Create app/api/users/[userId]/analytics/engagement/route.ts
  - Validate authentication (must be profile owner)
  - Check if lib/profile-analytics.ts exists with getProfileActions
  - If not, implement basic engagement tracking
  - Calculate followers gained this week: compare current followers with 7 days ago
  - Calculate followers gained this month: compare current followers with 30 days ago
  - Count messages received (if messaging system exists)
  - Track clicks: profilePhotoViews, coverPhotoViews, bioLinkClicks, websiteClicks, socialLinkClicks
  - Return JSON: { followersGainedWeek, followersGainedMonth, messagesReceived, profilePhotoViews, coverPhotoViews, bioLinkClicks, websiteClicks, socialLinkClicks: { instagram, twitter, etc. } }
  - _Requirements: 14.4_

- [ ] 1.60.Create GET /api/users/[userId]/analytics/audience
  - Create app/api/users/[userId]/analytics/audience/route.ts
  - Validate authentication (must be profile owner)
  - Check if lib/profile-audience.ts exists with getFollowerDemographics, getFollowerActivityHeatmap, getFollowerGrowthSeries
  - If not, implement basic audience analytics
  - Fetch all followers using getServerUserById for each follower ID
  - Calculate gender distribution: { male: X, female: Y, other: Z }
  - Calculate age distribution: { '13-17': X, '18-24': Y, '25-34': Z, '35-44': A, '45+': B }
  - Determine top locations: Array<{ location: string, count: number }>
  - Generate follower growth time-series: Array<{ date: string, count: number }>
  - Calculate best time to post: 24x7 heatmap of follower activity (if activity data exists)
  - Return JSON: { genderDistribution, ageDistribution, topLocations, followerGrowth, bestTimeToPost }
  - _Requirements: 14.5, 14.6_

- [ ] 1.61.Build analytics dashboard components
- [ ] 1.62.Create ProfileAnalyticsDashboard component
  - Component already exists at components/profile/profile-insights.tsx (ProfileInsights)
  - Displays profile views chart with line graph
  - Shows total lifetime views counter
  - Displays unique vs returning visitors breakdown
  - Shows top referring sources list
  - Uses Recharts for visualization
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 1.63.Create AudienceInsights component
  - Component already exists at components/profile/audience-insights.tsx
  - Displays follower demographics pie charts (gender, age)
  - Shows top locations list
  - Displays follower growth line graph with milestones
  - Shows "Best time to post" hourly heatmap
  - Uses Recharts for visualization
  - _Requirements: 14.5, 14.6_

- [ ] 1.64.Implement real-time updates with WebSocket
  - WebSocket infrastructure already exists (lib/server/sse.ts with broadcastEvent)
  - Profile update events already broadcast (profilePhotoUpdated, coverPhotoUpdated)
  - Photo upload completion already broadcasts events
  - Note: Verification badge updates could be added when verification system is implemented
  - _Requirements: 7.7, 13.2_

- [ ] 1.65.Set up AWS S3 and CloudFront integration
  - S3 integration already exists (lib/scalability/s3-storage.ts with getS3Client)
  - Profile images uploaded to S3 with organized path structure
  - Cover images uploaded to S3 with organized path structure
  - Archive functionality exists for deleted photos
  - Note: CloudFront CDN could be added as enhancement, currently using S3 URLs directly
  - _Requirements: 7.5, 7.6, 8.3, 14.1, 14.3_

- [ ] 1.66.Implement image moderation integration
  - Integrate AWS Rekognition or similar image moderation API
  - Scan uploaded images for inappropriate content
  - Reject uploads that fail moderation
  - Log moderation results for audit
  - Implement fallback for API failures (allow upload, manual review later)
  - _Requirements: 7.5_

- [ ] 1.67.Add caching layer
  - Caching layer already exists (lib/scalability/cache-layer.ts with setCached, getCached, deleteCached)
  - Profile data cached with TTL
  - Cache invalidation on profile updates already implemented
  - Profile views cached hourly (lib/profile-views-cache.ts)
  - Note: Redis integration could be added as optional upgrade
  - _Requirements: 15.1_

- [ ] 1.68.Implement email verification flow
  - Create email change modal with password verification
  - Send verification email with 24-hour expiration token
  - Create email verification endpoint
  - Send notification to old email when changed
  - Update email verification status using emailVerification field in User type
  - Note: Email verification infrastructure exists (lib/email-verification-store.ts)
  - _Requirements: 5.2, 5.3_

- [ ] 1.69.Implement phone verification flow
  - Create phone change modal with international format
  - Send OTP to new phone number
  - Create OTP verification endpoint
  - Update phone verification status using phoneVerified field in User type
  - _Requirements: 5.4_

- [ ] 1.70.Add location API integration
  - CityAutocomplete component already exists (components/ui/city-autocomplete.tsx)
  - City autocomplete functionality already implemented
  - Country dropdown already exists in ContactTab
  - Timezone auto-detection could be added as enhancement
  - Note: Using free/open location data sources
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 1.71.Implement audit logging
  - Audit logging infrastructure already exists (AuditLog model in Prisma schema)
  - Profile changes logged via audit trail in /api/users/[userId]/profile
  - Username changes logged via addServerUsernameHistory
  - Photo uploads and deletions logged
  - Note: System is functional and logging key events
  - _Requirements: 15.7_

- [ ] 1.72.Add rate limiting
  - Rate limiting infrastructure already exists (lib/rate-limit.ts, lib/server-rate-limit.ts)
  - PROFILE_UPDATE rate limit already defined (3 updates per minute)
  - Username change cooldown already enforced (30 days)
  - 429 Too Many Requests responses already implemented
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 1.73.Implement profile completion calculation
  - Function already exists: computeProfileCompletionForServer in lib/utils/profile-compute.ts
  - Weighted completion percentage already calculated
  - Profile photo (10%), Cover photo (5%), Bio (15%), Location (5%), Birthday (5%), Phone verified (10%), Email verified (10%), Interests (10%), At least one pet (20%), Contact info (5%), Social links (5%)
  - Completion percentage updated on profile changes
  - Note: ProfileCompletionWidget component still needs to be created
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 1.74.Wire up all components and routes
  - Create profile edit page at app/[locale]/settings/profile/page.tsx following pattern from app/[locale]/settings/
  - Import and integrate all tab components: BasicInfoTab, AboutMeTab, ContactTab, PreferencesTab, PrivacyTab
  - Implement Tabs component from @/components/ui/tabs with 5 tabs
  - Fetch current user data on mount using GET /api/users/[userId]/profile
  - Manage form state across all tabs using React state or React Hook Form
  - Implement save functionality calling PUT /api/users/[userId]/profile
  - Connect photo upload components to POST /api/users/[userId]/profile-photo and cover-photo
  - Connect username change to POST /api/users/[userId]/username
  - Connect privacy settings to PUT /api/users/[userId]/privacy
  - Connect analytics dashboard to GET /api/users/[userId]/analytics/* endpoints
  - Add loading states using Skeleton components
  - Add error handling with toast notifications
  - Add unsaved changes warning dialog
  - Ensure all data flows correctly from UI to API to storage and back
  - Test all user flows end-to-end manually or with E2E tests
  - _Requirements: All requirements_

---

## Implementation Status Summary

###  Completed Components & Infrastructure
- ProfileCompletionWidget with full implementation and tests
- MentionAutocomplete for @mentions in bio
- BasicInfoTab, AboutMeTab with basic structure
- Profile API routes (GET/PUT /api/users/[userId]/profile)
- Username management API (POST /api/users/[userId]/username)
- Validation schemas (lib/validations/profile-schemas.ts)
- Profile analytics utilities (lib/profile-analytics.ts, lib/profile-audience.ts)
- Profile insights components (ProfileInsights, AudienceInsights)

### 🚧 Needs Implementation
- Profile edit page (app/[locale]/settings/profile/page.tsx)
- VerificationBadge component
- PhotoCropModal with react-easy-crop
- HashtagAutocomplete for #hashtags
- ContactTab, PreferencesTab, PrivacyTab components
- Photo upload API routes (profile-photo, cover-photo)
- Privacy API routes (GET/PUT /api/users/[userId]/privacy)
- Blocking/restricting API routes
- Analytics API routes (track-view, views, engagement, audience)
- Username redirect logic for old usernames
- TipTap rich text editor integration for bio
- Email/phone verification flows

### 📝 Key Implementation Notes
1. Use Prisma exclusively for database operations (see docs/DATABASE_ARCHITECTURE.md)
2. Follow existing patterns in app/[locale]/settings/ for profile edit page
3. Use components from @/components/ui for consistent UI
4. Implement validation using Zod schemas from lib/validations/profile-schemas.ts
5. Use local filesystem storage (public/uploads/) for photos with Sharp processing
6. Apply privacy rules using existing canViewProfileSection utility
7. Broadcast updates via broadcastEvent for real-time UI updates
8. Add comprehensive error handling and loading states
