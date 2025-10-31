# Pet Social Network Mobile App

A comprehensive social network platform for pet owners and enthusiasts, built with Next.js 16, React 19, and TypeScript.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/andrejprus-projects/v0-pet-social-network)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/rpzv0eK6R0X)

## Overview

Pet Social Network is a full-featured social media platform designed specifically for pet owners. Share your pet's journey, connect with other pet enthusiasts, discover helpful articles, and manage your pet's health records all in one place.

## Features

### 🐾 Pet Profiles
- Comprehensive pet profiles with health records, vaccinations, medications
- Training progress tracking
- Personality traits and achievements
- Photo galleries
- Privacy controls

### 📝 Content Creation
- **Feed Posts**: Quick updates created directly from the feed
- **Blog Posts**: Longer-form content with cover images, tags, and hashtags
- **Wiki Articles**: Educational articles with categories and subcategories
- Shared form components with real-time validation
- Draft saving functionality

### 👥 Social Features
- Follow/unfollow users and pets
- Multiple reaction types (like, love, laugh, wow, sad, angry)
- Comments with nested replies
- Share posts and articles
- Privacy settings (public, private, followers-only)

### 🔍 Discovery
- Comprehensive search across users, pets, posts, and articles
- Tag and hashtag exploration
- Category filtering
- Trending posts sidebar

### 📚 Wiki System
- Educational articles organized by category
- Species-specific filtering
- View counts and engagement metrics
- Category-based navigation

### 🎨 User Experience
- Modern TailwindCSS design
- Responsive mobile-first layout
- Dark mode support
- Loading states and error handling
- Tooltips and helpful guidance
- Real-time form validation

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **State Management**: Zustand
- **UI Components**: Radix UI (shadcn/ui)
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

### Demo Credentials
- Username: `sarahpaws`
- Password: `password123`

## Project Structure

```
petssocnnetworkmobile/
├── app/                    # Next.js App Router pages
│   ├── blog/              # Blog posts pages
│   ├── wiki/              # Wiki articles pages
│   ├── user/              # User profile pages
│   ├── feed/              # Feed pages
│   └── ...
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── auth/              # Authentication components
│   ├── blog-form.tsx      # Shared blog form
│   ├── pet-form.tsx       # Shared pet form
│   └── wiki-form.tsx      # Shared wiki form
├── lib/                   # Utilities and business logic
│   ├── auth.ts            # Authentication logic
│   ├── storage.ts         # Data persistence
│   ├── types.ts           # TypeScript types
│   └── utils/             # Utility functions
└── public/                # Static assets
```

## Key Features in Detail

### Shared Form Components
All create/edit forms use shared components with:
- Real-time validation
- Tooltips on form labels
- Success/error messages with auto-dismiss
- Loading spinners
- Character counters
- Organized tabbed interfaces

### Feed vs Blog Posts
- **Feed Posts**: Quick updates with hashtag support, created from the feed
- **Blog Posts**: Longer-form content with titles, cover images, and rich formatting

### Profile Tabs
User profiles display content in organized tabs:
- Feed Posts: Quick updates
- Blog Posts: Longer articles
- Pets: Pet profiles
- About: Profile details

## Development

### Code Quality
- TypeScript strict mode
- ESLint for linting
- Comprehensive component structure
- Reusable UI components

### Styling Guidelines
- TailwindCSS only (no Bootstrap)
- Mobile-first responsive design
- Consistent design system
- Accessible components

## Documentation

- [Features List](./FEATURES.md) - Comprehensive feature documentation
- [Changelog](./CHANGELOG.md) - Version history and changes

## Deployment

This project is deployed on Vercel and automatically syncs with v0.app deployments.

**Live Site**: [https://vercel.com/andrejprus-projects/v0-pet-social-network](https://vercel.com/andrejprus-projects/v0-pet-social-network)

## Contributing

This project uses:
- Shared form components for consistency
- Real-time validation for better UX
- Comprehensive error handling
- Mobile-first responsive design

## License

This project is part of a pet social network platform.

---

*Built with ❤️ for pet lovers*
