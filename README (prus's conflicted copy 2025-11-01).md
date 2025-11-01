# PawSocial - Pet Social Network Mobile App

A modern, mobile-first social network for pet lovers built with Next.js, React, and TailwindCSS.

## 🚀 Quick Start

### Prerequisites
- Node.js v21.7.3 or higher
- pnpm v10.20.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/goleaf/petssocnnetworkmobile.git
cd petssocnnetworkmobile

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Android App

PawSocial is a **Progressive Web App (PWA)** that can be installed on Android devices!

### Install as Android App

1. **Deploy to hosting** (Vercel, Netlify, etc.)
2. **Open on Android Chrome** 
3. **Tap "Add to Home Screen"** or **"Install"**
4. **Launch like a native app**

See [doc/ANDROID-APP.md](./doc/ANDROID-APP.md) for complete Android deployment guide and native app setup options.

## ✨ Features

### 🐾 Pet Profiles
- Complete pet profiles with photos and health records
- Vaccination tracking
- Medical history
- Personality traits and training progress
- Pet friends and followers

### 📝 Blog Posts
- Long-form storytelling
- Markdown editor with preview
- Cover images
- Tags and hashtags
- Reactions and comments
- Privacy controls

### 🐾 Feed Posts
- Quick updates from pets
- Automatic hashtag extraction
- Real-time reactions
- Privacy settings

### 📚 Wiki Articles
- Comprehensive pet care guides
- Searchable knowledge base
- Categories: Care, Health, Training, Nutrition
- Multiple species support

### 👥 Social Features
- Follow/unfollow users and pets
- Social feed with filtering
- Notifications
- Search across all content
- Group discussions

### 🏠 Shelters
- Shelter directory
- Verified shelters
- Sponsorship information
- Location-based search

### 🔍 Advanced Search
- Search users, pets, posts, wiki, hashtags
- Filters by species, location, breed
- Sort by relevance, date, popularity

### ⚙️ Settings & Privacy
- Granular privacy controls
- Notification preferences
- Profile customization
- Content visibility settings

### 👮 Admin Features
- Content moderation
- User management
- Report handling

## 🛠️ Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Utility-first CSS
- **Radix UI** - Accessible components
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Jest** - Testing framework

## 📁 Project Structure

```
petssocnnetworkmobile/
├── app/                    # Next.js app directory
│   ├── dashboard/         # User dashboard
│   ├── blog/              # Blog posts
│   ├── wiki/              # Pet care wiki
│   ├── groups/            # Community groups
│   ├── shelters/          # Animal shelters
│   └── ...                # Other pages
├── components/            # React components
│   ├── auth/             # Authentication
│   ├── groups/           # Group features
│   ├── ui/               # UI components
│   └── ...               # Other components
├── lib/                   # Utilities and types
├── public/               # Static assets
├── styles/               # Global styles
├── doc/                  # Documentation files
└── ...                   # Config files
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 🏗️ Building for Production

```bash
# Build application
pnpm build

# Start production server
pnpm start
```

## 📱 Mobile Features

- **Responsive Design** - Mobile-first approach
- **Touch-friendly** - Optimized for touch interactions
- **PWA Ready** - Installable on Android and iOS
- **Offline Capable** - Service worker ready
- **Fast Performance** - Optimized for mobile networks

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Samsung Internet
- All Chromium-based mobile browsers

## 📄 Documentation

All documentation is in the `doc/` folder:

- [Installation Guide](./doc/INSTALLATION.md) - Detailed setup instructions
- [Features List](./doc/FEATURES.md) - Complete feature documentation
- [Android App Guide](./doc/ANDROID-APP.md) - Android deployment
- [Changelog](./doc/CHANGELOG.md) - Version history
- [Deployment Summary](./doc/DEPLOYMENT-SUMMARY.md) - Quick deployment guide
- [Final Summary](./doc/FINAL-SUMMARY.md) - Project overview

## 🤝 Contributing

Contributions welcome! Please follow the coding standards in `.cursorrules`.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ for pet lovers everywhere**
