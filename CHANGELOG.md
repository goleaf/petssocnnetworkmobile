# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

- **Feed Posts System**
  - Feed posts separated from blog posts
  - Feed post creation directly from home feed
  - Automatic hashtag extraction from feed post content
  - Profile page tabs: Feed Posts and Blog Posts
  - Separate stats display for feed posts and blog posts

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

- **Error Pages Improvements**
  - Custom 404 page with helpful suggestions and icons
  - Error boundary pages with troubleshooting tips
  - Consistent responsive design
  - Better user guidance

- **Utilities**
  - Emoticon replacer utility for comments

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
