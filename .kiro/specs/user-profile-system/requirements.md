# Requirements Document

## Introduction

This document specifies requirements for a comprehensive user profile system that enables users to create, customize, and manage their personal profiles with extensive privacy controls. The system provides profile information management, photo uploads with editing capabilities, granular privacy settings, username management, verification badges, and profile analytics. The goal is to create a rich, engaging profile experience that balances self-expression with privacy and security.

**Database Architecture**: This system uses Prisma ORM exclusively for all database operations. All data persistence must go through Prisma Client (`@/lib/prisma`). Direct PostgreSQL queries or other database libraries are not permitted. See `docs/DATABASE_ARCHITECTURE.md` for details.

## Glossary

- **Profile_System**: The complete user profile management subsystem including data storage, UI components, and API endpoints
- **Profile_Owner**: The authenticated user who owns and can edit a specific profile
- **Profile_Viewer**: Any user (authenticated or anonymous) attempting to view another user's profile
- **Profile_Photo**: The circular avatar image displayed at 200x200px representing the user
- **Cover_Photo**: The rectangular banner image displayed at 1200x400px at the top of the profile
- **Privacy_Setting**: A configurable rule that controls visibility of specific profile data fields
- **Verification_Badge**: A visual indicator (checkmark icon) displayed next to usernames of verified accounts
- **Profile_Completion**: A percentage metric (0-100%) indicating how many profile fields have been filled
- **Username_Change_Cooldown**: A 30-day period during which a user cannot change their username after a previous change
- **Profile_Analytics**: Statistical data about profile views, engagement, and audience demographics
- **Rich_Text_Editor**: A text input component supporting formatting, mentions, hashtags, and emojis
- **Mention**: A reference to another user in text using @username format that creates a clickable link
- **Hashtag**: A topic tag in text using #keyword format that creates a clickable search link
- **CDN**: Content Delivery Network used for serving profile images with low latency
- **Image_Moderation_API**: An external service that scans uploaded images for inappropriate content

## Requirements

### Requirement 1

**User Story:** As a user, I want to view and edit my profile information in an organized interface, so that I can easily manage my personal details without feeling overwhelmed.

#### Acceptance Criteria

1. WHEN the Profile_Owner navigates to the profile edit page, THE Profile_System SHALL display a tabbed interface containing five tabs labeled "Basic Info", "About Me", "Contact", "Preferences", and "Privacy"
2. WHEN the Profile_Owner clicks on any tab, THE Profile_System SHALL load and display the corresponding form content within 500 milliseconds
3. THE Profile_System SHALL display the profile header section containing Profile_Photo at 200x200 pixels, Cover_Photo at 1200x400 pixels, username in @username format, display name, location with pin icon, joined date in "Member since Month Year" format, and counts for followers, following, and posts
4. WHEN the Profile_Viewer hovers over the Profile_Photo, THE Profile_System SHALL display a "Change Photo" overlay with camera icon
5. WHEN the Profile_Viewer hovers over the Cover_Photo, THE Profile_System SHALL display a "Change Cover" overlay

### Requirement 2

**User Story:** As a user, I want to enter and validate my basic information with real-time feedback, so that I can ensure my profile data is correct and meets requirements before saving.

#### Acceptance Criteria

1. WHEN the Profile_Owner enters text in the Full Name field, THE Profile_System SHALL enforce a character limit between 2 and 100 characters and display a real-time character counter
2. WHEN the Profile_Owner enters text in the Full Name field, THE Profile_System SHALL validate that the input contains no numeric digits or special characters except hyphens and apostrophes, and SHALL display an error message if validation fails
3. WHEN the Profile_Owner enters text in the Username field, THE Profile_System SHALL enforce a character limit between 3 and 20 characters containing only alphanumeric characters, underscores, and hyphens
4. WHEN the Profile_Owner types in the Username field, THE Profile_System SHALL perform an availability check with 300 millisecond debouncing and SHALL display a checkmark icon when the username is available or an X icon with "Username taken" message when unavailable
5. WHEN the Profile_Owner attempts to change their username, THE Profile_System SHALL display a warning message "You can change username once every 30 days" and SHALL display the number of days remaining in the Username_Change_Cooldown period if applicable
6. WHEN the Profile_Owner selects a date of birth, THE Profile_System SHALL calculate the age and SHALL display an error message "You must be at least 13 years old" if the calculated age is less than 13 years
7. WHEN the Profile_Owner selects "Custom" in the Gender dropdown, THE Profile_System SHALL display a text input field accepting up to 50 characters for custom gender entry

### Requirement 3

**User Story:** As a user, I want to write a rich bio with formatting, mentions, and hashtags, so that I can express myself creatively and connect my profile to other users and topics.

#### Acceptance Criteria

1. WHEN the Profile_Owner edits the bio field, THE Profile_System SHALL provide a Rich_Text_Editor with toolbar buttons for bold, italic, underline, strikethrough, bullet list, numbered list, link insertion, and emoji picker
2. WHEN the Profile_Owner enters text in the bio field, THE Profile_System SHALL enforce a 1000 character limit and SHALL display a live character counter that turns red when 950 characters are reached
3. WHEN the Profile_Owner types the @ symbol in the bio field, THE Profile_System SHALL display a dropdown showing followers and friends with profile photos and usernames
4. WHEN the Profile_Owner selects a user from the mention dropdown, THE Profile_System SHALL insert a Mention that renders as a clickable link to that user's profile highlighted in blue
5. WHEN the Profile_Owner types the # symbol in the bio field, THE Profile_System SHALL display a dropdown showing trending hashtags
6. WHEN the Profile_Owner includes a Hashtag in the bio, THE Profile_System SHALL auto-link the Hashtag to search results and SHALL enforce a maximum of 10 hashtags per bio
7. WHEN the Profile_Owner enters a URL in the bio field, THE Profile_System SHALL automatically convert the URL to a clickable link with http or https validation
8. WHEN the Profile_System displays a URL in the bio, THE Profile_System SHALL truncate long URLs to show only the domain followed by "..." and SHALL open links in a new tab with rel="noopener noreferrer" attribute

### Requirement 4

**User Story:** As a user, I want to select my interests from predefined categories and add custom interests, so that the system can recommend relevant content and connect me with like-minded users.

#### Acceptance Criteria

1. THE Profile_System SHALL provide a multi-select interface displaying predefined interests including Training & Behavior, Pet Photography, Grooming & Styling, Pet Fashion, Veterinary Care, Nutrition & Diet, Exercise & Fitness, Pet Travel, Breeding, Shows & Competitions, Pet Rescue, Pet Products & Reviews, DIY Pet Projects, Pet Technology, Pet Psychology, Alternative Medicine, Agility Training, Service Animals, Therapy Animals, Wildlife Rehabilitation, Exotic Pets, Aquatic Pets, Reptile Care, and Avian Care
2. WHEN the Profile_Owner selects an interest, THE Profile_System SHALL display the selection as a colored tag with an X button for removal
3. WHEN the Profile_Owner types a custom interest and presses enter, THE Profile_System SHALL add the custom interest as a new tag with a maximum length of 30 characters
4. THE Profile_System SHALL enforce a maximum of 30 total interests per profile
5. WHEN the Profile_Owner saves interests, THE Profile_System SHALL use the selected interests for content recommendation algorithms and user matching

### Requirement 5

**User Story:** As a user, I want to add and verify my contact information securely, so that I can be reached through multiple channels while maintaining control over who sees this information.

#### Acceptance Criteria

1. WHEN the Profile_Owner views the email field, THE Profile_System SHALL display the current email address with a verified checkmark icon if verified or a "Unverified - Click to verify" link if not verified
2. WHEN the Profile_Owner clicks "Change Email", THE Profile_System SHALL display a modal with fields for new email and current password, and SHALL send a verification email to the new address with a 24-hour expiration token
3. WHEN the Profile_Owner changes their email, THE Profile_System SHALL send a notification email to the old email address informing them of the change
4. WHEN the Profile_Owner clicks "Add/Change Phone", THE Profile_System SHALL display a modal with an international phone input including country code flag dropdown and SHALL send an OTP to the new number for verification
5. WHEN the Profile_Owner enters a website URL, THE Profile_System SHALL validate the format requires http or https protocol and SHALL display the URL as a clickable link with an external link icon on the profile
6. WHEN the Profile_Owner enters social media handles, THE Profile_System SHALL validate the format for each platform (Instagram, Twitter, TikTok, YouTube, Facebook) and SHALL display each with the respective platform icon

### Requirement 6

**User Story:** As a user, I want to specify my location with different levels of detail, so that I can connect with nearby users while controlling how much location information I share.

#### Acceptance Criteria

1. WHEN the Profile_Owner selects a country, THE Profile_System SHALL populate the State/Region dropdown with subdivisions for that country using an API call
2. WHEN the Profile_Owner types in the City field, THE Profile_System SHALL provide autocomplete suggestions for cities in the selected country and region using a location API
3. THE Profile_System SHALL auto-detect the timezone based on the browser and SHALL provide a manual override dropdown showing all IANA timezone identifiers
4. WHEN the Profile_Owner toggles location privacy, THE Profile_System SHALL provide options to "Show exact city" or "Show only country/region"
5. THE Profile_System SHALL use the stored timezone for displaying timestamps and scheduling events relative to the user's local time

### Requirement 7

**User Story:** As a user, I want to upload and edit my profile photo with cropping and adjustment tools, so that I can present myself exactly how I want to appear on the platform.

#### Acceptance Criteria

1. WHEN the Profile_Owner clicks the Profile_Photo, THE Profile_System SHALL display a modal with options for "Upload New Photo", "Take Photo", "Choose from existing photos", "Remove Photo", and "Cancel"
2. WHEN the Profile_Owner selects "Upload New Photo", THE Profile_System SHALL open a file picker accepting image/jpeg, image/png, image/webp, and image/heic formats with a maximum file size of 10 megabytes
3. WHEN the Profile_Owner uploads a photo, THE Profile_System SHALL display a cropping interface with a circular crop overlay, zoom slider (100%-300% scale), drag-to-reposition functionality, and rotation buttons in 90-degree increments
4. WHEN the Profile_Owner applies the crop, THE Profile_System SHALL display a progress bar showing upload percentage and SHALL compress the image client-side to under 2 megabytes while maintaining quality
5. WHEN the Profile_System receives the uploaded photo, THE Profile_System SHALL validate file type and size, SHALL scan for inappropriate content using an Image_Moderation_API, and SHALL generate five size variants: original (max 1000x1000), large (400x400), medium (200x200), small (100x100), and thumbnail (50x50)
6. WHEN the Profile_System processes the photo, THE Profile_System SHALL store all variants in cloud storage with CDN distribution and SHALL update the user record with the CDN URL of the large version
7. WHEN the photo upload completes successfully, THE Profile_System SHALL update the Profile_Photo across the entire UI without page reload and SHALL display a success notification "Profile photo updated!"

### Requirement 8

**User Story:** As a user, I want to upload and customize my cover photo, so that I can personalize my profile page with a banner image that represents my interests.

#### Acceptance Criteria

1. WHEN the Profile_Owner uploads a Cover_Photo, THE Profile_System SHALL accept image files up to 15 megabytes in size
2. WHEN the Profile_Owner crops the Cover_Photo, THE Profile_System SHALL maintain a 3:1 aspect ratio and SHALL allow vertical repositioning when the image height exceeds 400 pixels
3. WHEN the Profile_System processes the Cover_Photo, THE Profile_System SHALL generate four size variants: original (max 2000x667), large (1200x400), medium (900x300), and small (600x200)
4. WHEN the Profile_System displays the Cover_Photo, THE Profile_System SHALL apply a gradient overlay to ensure text readability

### Requirement 9

**User Story:** As a user, I want granular control over who can see each piece of my profile information, so that I can share different levels of detail with different audiences while maintaining my privacy.

#### Acceptance Criteria

1. THE Profile_System SHALL provide profile visibility options: "Public - Anyone can see my profile", "Friends Only - Only people I follow who follow me back", "Private - Only approved followers can see", and "Custom - Advanced settings"
2. THE Profile_System SHALL provide individual privacy toggles for Profile_Photo, Cover_Photo, email, phone number, birthday, age, location, joined date, and last active status with options: Everyone, Friends, Only Me, or Never
3. WHEN the Profile_Owner sets birthday visibility to "Everyone/Hide Year", THE Profile_System SHALL display only the month and day without the year
4. WHEN the Profile_Owner sets location visibility, THE Profile_System SHALL provide options: Exact City, State/Region Only, Country Only, or Hidden
5. WHEN the Profile_Owner changes any privacy setting, THE Profile_System SHALL save the change immediately via AJAX call and SHALL display a loading spinner followed by a success checkmark
6. THE Profile_System SHALL provide contact privacy controls for "Who can send me messages", "Who can tag me in posts", "Who can see my friends/followers list", "Who can see who I'm following", and "Who can see my liked posts" with options: Everyone, Friends, Friends of Friends, Only people I follow, or No one

### Requirement 10

**User Story:** As a user, I want to block or restrict other users, so that I can control who can interact with me and see my content without those users knowing they've been restricted.

#### Acceptance Criteria

1. THE Profile_System SHALL provide a "Blocked Accounts" list displaying blocked users with profile photos, usernames, and "Unblock" buttons
2. WHEN a user is blocked, THE Profile_System SHALL prevent the blocked user from viewing the Profile_Owner's profile, sending messages, or interacting with the Profile_Owner's content
3. THE Profile_System SHALL provide a "Restricted Accounts" list for soft-blocking where restricted users are not notified of their status
4. WHEN a user is restricted, THE Profile_System SHALL hide their comments from other users while keeping comments visible to the restricted user
5. WHEN a restricted user comments, THE Profile_System SHALL allow the Profile_Owner to approve individual comments to make them visible to others 

### Requirement 11

**User Story:** As a user, I want to see my profile completion percentage with actionable suggestions, so that I am motivated to complete my profile and understand what information is missing.

#### Acceptance Criteria

1. THE Profile_System SHALL calculate Profile_Completion percentage with weighted values: Profile_Photo (10%), Cover_Photo (5%), bio (15%), location (5%), birthday (5%), phone verified (10%), email verified (10%), interests (10%), at least one pet added (20%), contact info (5%), and social links (5%)
2. WHEN the Profile_Owner views the profile edit page, THE Profile_System SHALL display a circular progress indicator showing the Profile_Completion percentage with color coding: red below 30%, yellow 30-60%, and green 60-100%
3. THE Profile_System SHALL display a checklist of incomplete items with checkmarks for completed items and X marks for incomplete items, where each item is clickable to navigate to the corresponding section
4. WHEN the Profile_Viewer views a public profile, THE Profile_System SHALL display a profile strength badge: "Bronze" (0-30% complete), "Silver" (31-60%), "Gold" (61-85%), or "Platinum" (86-100%) as a small icon next to the username

### Requirement 12

**User Story:** As a user, I want to change my username with appropriate safeguards, so that I can update my identity while preventing abuse and maintaining a history of changes.

#### Acceptance Criteria

1. THE Profile_System SHALL enforce a Username_Change_Cooldown of 30 days between username changes
2. WHEN the Profile_Owner attempts to change their username during the Username_Change_Cooldown, THE Profile_System SHALL display the remaining days until the next change is allowed
3. WHEN the Profile_Owner requests a username change, THE Profile_System SHALL display a confirmation modal stating "Are you sure? This action can only be done once every 30 days. Your previous username '@oldname' will be available for others to claim." and SHALL require password entry for verification
4. WHEN the Profile_System processes a username change, THE Profile_System SHALL validate the password, SHALL check username availability, SHALL verify the Username_Change_Cooldown has elapsed, SHALL update the username in the users table, and SHALL create an entry in the username_history table
5. WHEN a Profile_Viewer visits a profile URL with an old username within 30 days of the change, THE Profile_System SHALL redirect to the new username URL and SHALL display a banner "This user recently changed their username from @oldname to @newname"
6. WHEN 30 days have elapsed since a username change, THE Profile_System SHALL make the old username available for other users to claim

### Requirement 13

**User Story:** As a notable user or organization, I want to request verification for my account, so that my followers can trust that my profile is authentic and not an impersonation.

#### Acceptance Criteria

1. WHEN a user has 10,000 or more followers, THE Profile_System SHALL display a "Request Verification" button in profile settings
2. WHEN the Profile_Owner clicks "Request Verification", THE Profile_System SHALL display a form requesting full legal name, reason for verification (500 character limit), government-issued ID photo upload (front and back), proof of notability upload, and optional business documents
3. WHEN the Profile_System receives a verification request, THE Profile_System SHALL add the submission to a moderation queue for manual review
4. WHEN a moderator approves a verification request, THE Profile_System SHALL add a Verification_Badge to the user profile, SHALL require both email and phone verification, and SHALL send a congratulations email
5. WHEN a moderator rejects a verification request, THE Profile_System SHALL send an email with the rejection reason and SHALL allow resubmission after 90 days
6. WHEN a user is verified, THE Profile_System SHALL display a blue checkmark Verification_Badge next to the username throughout the application

### Requirement 14

**User Story:** As a user, I want to see analytics about my profile performance, so that I can understand who is viewing my profile and how to optimize my engagement.

#### Acceptance Criteria

1. THE Profile_System SHALL display Profile_Analytics showing daily profile views over the last 30 days as a line graph with hover tooltips
2. THE Profile_System SHALL calculate and display total lifetime profile views, unique visitors count, and returning visitors count
3. THE Profile_System SHALL track and display top referring sources showing how users found the profile: search, direct link, from post, or from another profile
4. THE Profile_System SHALL display engagement metrics including followers gained this week and month, messages received count, profile photo views, cover photo views, bio link clicks, website clicks, and social media link clicks per platform
5. THE Profile_System SHALL provide audience insights including follower demographics with pie charts for gender distribution and age range distribution, top locations of followers by country and city, and a line graph showing follower growth over time with milestone markers
6. THE Profile_System SHALL calculate and display "Best time to post" as an hourly heatmap showing when followers are most active online

### Requirement 15

**User Story:** As a developer integrating with the profile system, I want RESTful API endpoints with proper authentication and privacy enforcement, so that I can retrieve and update profile data programmatically while respecting user privacy settings.

#### Acceptance Criteria

1. WHEN a client calls GET /api/users/{userId}/profile, THE Profile_System SHALL return profile data with privacy rules applied based on the requesting user's relationship to the Profile_Owner
2. WHEN an unauthenticated client calls GET /api/users/{userId}/profile, THE Profile_System SHALL return only fields marked as public in Privacy_Setting
3. WHEN the Profile_Owner calls GET /api/users/{userId}/profile for their own profile, THE Profile_System SHALL return all fields including private data and Profile_Analytics
4. THE Profile_System SHALL include in the GET response: userId, username, displayName, fullName, email, phoneNumber, bio, profilePhotoUrl with multiple sizes, coverPhotoUrl with multiple sizes, location, birthday, age, gender, interests array, languages array, socialLinks object, websiteUrl, joinedAt timestamp, isVerified boolean, verificationBadgeType, profileCompletionPercentage, lastActiveAt timestamp, followersCount, followingCount, postsCount, and stats object
5. WHEN a client calls PUT /api/users/{userId}/profile, THE Profile_System SHALL validate authentication to ensure the requester is the Profile_Owner
6. WHEN the Profile_System processes a PUT request, THE Profile_System SHALL validate each field based on length, format, and uniqueness rules, SHALL check password for sensitive changes, SHALL apply rate limiting on username changes, and SHALL update the database transactionally
7. WHEN a profile update succeeds, THE Profile_System SHALL invalidate cached profile data, SHALL broadcast a profile update event via WebSocket, and SHALL log all changes with field name, old value, new value, timestamp, and IP address
8. WHEN a client calls POST /api/users/{userId}/profile-photo, THE Profile_System SHALL validate file type and size, SHALL scan for inappropriate content, SHALL generate multiple size variants, SHALL store in cloud storage, and SHALL return CDN URLs for all sizes
9. WHEN a client calls DELETE /api/users/{userId}/profile-photo, THE Profile_System SHALL set profilePhotoUrl to null, SHALL generate a default avatar with the user's first initial, and SHALL archive the old photo for 30 days before permanent deletion
