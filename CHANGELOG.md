# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed
- Removed `/explore` page and all related routes
  - Deleted explore page (`/app/explore/page.tsx`)
  - Deleted hashtag pages (`/app/explore/hashtag/[tag]/page.tsx`)
  - Deleted explore loading page
  - Removed explore navigation link from main navigation
  - Removed Compass icon import (no longer needed)
  - Updated all hashtag links to point to search page instead (`/search?q=#hashtag&tab=blogs`)

### Changed
- Hashtag links now redirect to search page instead of explore page
  - All `/explore/hashtag/[tag]` links replaced with `/search?q=#hashtag&tab=blogs`
  - Hashtags can still be discovered through the search functionality

### Fixed
- Updated navigation test to remove explore reference

## [Previous]

Initial release of the Pet Social Network Mobile App.

