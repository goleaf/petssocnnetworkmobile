# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
  - Account deletion with 30-day grace period and restore capability
  - Privacy settings for profile visibility, contact information, and online status
  - Granular privacy controls for tagging, mentions, and messaging
  - User blocking and muting system with relationship management
  - Comprehensive notification settings with channel preferences (push, email, SMS, in-app)
  - Email digest options (real-time, hourly, daily, weekly)
  - Quiet hours configuration with critical notification exceptions
  - Search and indexing controls for profile discoverability
  - Database models: EmailVerification, Session, BlockedUser, MutedUser
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
