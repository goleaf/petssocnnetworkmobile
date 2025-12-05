# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Docs & Tooling
- Expanded root `README.md` with project layout, testing workflow (type/lint, Jest, Playwright), OpenSpec/Kiro guardrails, and mobile/Capacitor sync references
- Introduced Kiro automation hooks and steerings covering database, API, frontend, config, mobile sync, and spec governance (MCP-first workflows)

### Added
- **Recent Changes Feed Component**
  - Reusable React component for displaying edit requests with visual diffs
  - Paginated feed with customizable page size (default: 10 items)
  - Advanced filtering by content type, status, priority, and age
  - Inline approve/reject actions with loading states
  - Expandable/collapsible diff viewer integration
  - Metadata badges for COI, health flags, new pages, and images
  - Responsive card-based layout with TailwindCSS
  - Error handling with user-friendly messages
  - Empty state display when no items match filters
  - REST API endpoint at `/api/admin/moderation/recent-changes`
  - Role-based access control (moderator required)
  - Comprehensive parameter validation
  - Full test coverage in `tests/active/components/admin/RecentChangesFeed.test.tsx`
  - Complete documentation in `docs/RECENT_CHANGES_FEED.md`
- **Email Change Modal**
  - Secure email change dialog with password verification
  - Current email display (read-only) for reference
  - New email input with format validation
  - Password field for security verification
  - Real-time validation with user-friendly error messages
  - Success state with confirmation message showing new email
  - Loading states during submission with spinner
  - Automatic modal close after successful change
  - Clean state reset when modal closes
  - Prevents changing to the same email address
  - Integrated with ContactTab for seamless user experience

- **User Mention System**
  - Mention other users in profile bio using @username syntax
  - Real-time autocomplete dropdown triggered by @ symbol
  - Search and filter followers and friends for mentions
  - Visual user list with profile photos and usernames
  - Keyboard navigation support (Arrow keys, Enter, Tab, Escape)
  - Clickable mention links that navigate to user profiles
  - Mentions highlighted in blue throughout the application
  - Debounced search queries to optimize performance
  - Automatic cursor positioning after mention insertion
  - Excludes blocked and muted users from mention suggestions
  - Prioritizes mutual friends in search results
  - User search API endpoint with privacy-aware filtering
  - Comprehensive test coverage for mention components

- **Account Settings Type System**
  - Comprehensive TypeScript types for account security and privacy management
  - Privacy settings types with granular visibility controls for profile, email, phone, birthday, age, location, and online status
  - Content visibility settings for pets, posts, followers, and following lists
  - Interaction permission types for tagging, mentions, and review requirements
  - Search and discoverability controls including search indexing and recommendations
  - Messaging privacy settings with read receipts, typing indicators, and forwarding permissions
  - Notification settings with multi-channel preferences (in-app, push, email, SMS, digest)
  - Notification frequency options (real-time, hourly, daily, weekly) and priority thresholds
  - Quiet hours configuration with day-of-week scheduling and critical notification exceptions
  - Session management types with device information, geolocation, and activity tracking
  - Email change request types with verification workflow support
  - Password change request types with security validation
  - Account deletion types with reason tracking and grace period support
  - All types exported from `lib/types/settings.ts` for use across the application

- **Profile Completion Widget**
  - Visual widget showing profile completion percentage with circular progress indicator
  - Color-coded progress: red (0-30%), yellow (31-60%), green (61-100%)
  - Interactive checklist of incomplete profile items with checkmarks and X marks
  - Clickable navigation to relevant profile sections
  - Motivational messages based on completion level
  - Weighted completion calculation: profile photo (10%), cover photo (5%), bio (15%), location (5%), birthday (5%), phone verified (10%), email verified (10%), interests (10%), at least one pet (20%), contact info (5%), social links (5%)
  - Completion message and tips for incomplete profiles
  - Fully tested component with comprehensive test coverage

- **Account Settings & Security**
  - Email change functionality with verification tokens and 24-hour expiration
  - Password change with complexity requirements and session invalidation
  - Active session management with device tracking, location, and IP address
  - Account deletion with 30-day grace period and restore capability using secure tokens
  - Improved account deletion now stores restore tokens in database with automatic expiration
  - Account deletion properly revokes all active sessions in database and clears session cookies
  - Deletion scheduling stores date and reason directly in user record for better tracking
  - Privacy settings for profile visibility, contact information, and online status
  - Granular privacy controls for tagging, mentions, and messaging
  - User blocking and muting system with relationship management
  - Comprehensive notification settings with channel preferences (push, email, SMS, in-app)
  - Email digest options (real-time, hourly, daily, weekly)
  - Quiet hours configuration with critical notification exceptions
  - Search and indexing controls for profile discoverability
  - Database models: EmailVerification, Session, BlockedUser, MutedUser, DeletionRestoreToken
  - Enhanced User model with privacy, notification settings, and deletion scheduling
- **Post Embeds**
  - Share dialog with link copying and iframe embed generation
  - Dedicated `/embed/post/[id]` route for lightweight external embeds
- **Shared Form Components**
  - `PetForm`: Unified component for creating and editing pets
    - Real-time validation with error messages
    - Tooltips on form labels
    - Success/error messages with auto-dismiss
    - Loading spinner during submission
    - Organized tabs: Basic, Personality, Favorites, Diet, Health, Training
    - Dynamic fields for health records, vaccinations, medications, training progress
  - `BlogForm`: Unified component for creating and editing blog posts
    - Real-time validation with error messages
    - Tooltips on form labels
    - Cover image upload with dimension validation (1280x720px minimum, 16:9 ratio)
    - Markdown editor with preview mode
    - TagInput components for tags and hashtags
    - Auto-extract hashtags from content
    - Draft auto-save functionality
  - `WikiForm`: Unified component for creating and editing wiki articles
    - Real-time validation with error messages
    - Tooltips on form labels
    - Dynamic subcategory selection based on category
    - Species multi-select with visual selection
    - Cover image URL with preview
    - Markdown editor with preview mode
- **Direct Messaging Enhancements**
  - New `/messages` inbox with conversation list and responsive chat layout
  - Media sharing for direct messages (images, videos, documents) with previews and download links
  - Attachment safeguards with per-file size limits and multi-file support
  - Message archive view with active/archived toggles, unread counts, and one-click archive management
  - Global message search now surfaces archived threads with highlighted results and deep-link scrolling
  - Local read receipt tracking to highlight unread conversations

- **Feed Posts System**
  - Feed posts separated from blog posts
  - Feed post creation directly from home feed
  - Automatic hashtag extraction from feed post content
  - Profile page tabs: Feed Posts and Blog Posts
  - Separate stats display for feed posts and blog posts
- **Direct Message Search**
  - Global message search panel with keyword highlighting
  - Filters for conversation, sender, date range, and unread status
  - Sort results by relevance, newest, or oldest and jump directly into the thread

- **User Profile Enhancements**
  - User pets page (`/user/[username]/pets`)
    - Search and filter pets
    - Group by species
    - Sort by name, age, or date
    - Edit and delete controls
  - User posts page (`/user/[username]/posts`)
    - Search posts
    - Group by dates
    - Filter and sort options
    - Control buttons

- **Wiki Article Management**
  - Create wiki articles (`/wiki/create`)
  - Edit wiki articles (`/wiki/[slug]/edit`)
  - Automatic slug generation from title
  - Owner-only editing

- **Reusable UI Components**
  - `EditButton`: Blue gradient button for edit actions
  - `CreateButton`: Green gradient button for create/write actions
  - `DeleteButton`: Red gradient button for delete actions
  - `Tooltip`: Beautiful tooltip component with animations
- **Group Discussions**
  - Topic threads now display persistent context tags
  - Topics index includes a context filter to organize conversations by theme

- **Error Pages Improvements**
  - Custom 404 page with helpful suggestions and icons
  - Error boundary pages with troubleshooting tips
  - Consistent responsive design
  - Better user guidance

- **Utilities**
  - Emoticon replacer utility for comments
- **Message Privacy**
  - Added end-to-end encryption controls for direct messages in privacy settings

### Changed
- Blog create and edit pages now use shared `BlogForm` component
- Pet create and edit pages now use shared `PetForm` component
- Wiki create and edit pages now use shared `WikiForm` component
- Feed posts are now saved as `FeedPost` type instead of `BlogPost`
- Profile page stats separated: Feed Posts and Blog Posts
- Stats cards on home feed link to profile with appropriate tab
- Button components updated with gradient backgrounds
- Tabs component enhanced with hover effects and animations
- Dropdown menu items with destructive variant use gradient backgrounds

### Fixed
- **Groups Page Hydration Error** (2025-11-14)
  - Fixed React hydration mismatch on `/groups` page
  - Replaced dynamic category loading with static `DEFAULT_CATEGORIES` array
  - Removed unnecessary `"use client"` directive to enable Server Component rendering
  - Ensures identical category data between server and client renders
  - All 10 group categories (Dogs, Cats, Birds, Rabbits, Hamsters, Fish, Training, Health, Adoption, Nutrition) now load without errors
  - E2E test validates no hydration errors occur
- React.Children.only error when using EditButton with Link component
- React Hooks order violation in UserPetsPage
- Feed post creation now properly saves as FeedPost type
- Profile page correctly displays feed posts and blog posts separately

### Removed
- Removed `/explore` page and all related routes
  - Deleted explore page (`/app/explore/page.tsx`)
  - Deleted hashtag pages (`/app/explore/hashtag/[tag]/page.tsx`)
  - Deleted explore loading page
  - Removed explore navigation link from main navigation
  - Removed Compass icon import (no longer needed)
  - Updated all hashtag links to point to search page instead (`/search?q=#hashtag&tab=blogs`)

## [Previous]

Initial release of the Pet Social Network Mobile App.
