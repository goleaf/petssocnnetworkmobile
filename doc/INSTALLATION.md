# Installation Guide

## Project Overview
PawSocial is a Next.js-based pet social network application built with React, TypeScript, and TailwindCSS.

## Prerequisites
- Node.js v21.7.3 or higher
- pnpm v10.20.0 or higher (or npm/yarn)
- Modern web browser

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd petssocnnetworkmobile
```

### 2. Install Dependencies
The project uses pnpm as the package manager. If you don't have pnpm installed:
```bash
npm install -g pnpm
```

Then install project dependencies:
```bash
pnpm install
```

### 3. Run the Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production
```bash
pnpm build
```

### 5. Start Production Server
```bash
pnpm start
```

## Project Structure

```
petssocnnetworkmobile/
├── app/                    # Next.js app directory with routes
│   ├── dashboard/         # User dashboard
│   ├── blog/              # Blog posts
│   ├── feed/              # Social feed
│   ├── wiki/              # Pet care wiki
│   ├── shelters/          # Animal shelters
│   └── ...
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...
├── lib/                   # Utility libraries
├── public/               # Static assets
├── styles/               # Global styles
├── package.json          # Dependencies
├── next.config.mjs       # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── postcss.config.mjs    # PostCSS configuration
```

## Key Technologies

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Current Status

✅ Dependencies installed successfully
✅ Development server running on http://localhost:3000
✅ All packages installed via pnpm (279 packages)
✅ TailwindCSS configured with PostCSS
✅ TypeScript configured and working

## Demo Access

The application uses mock data for demonstration. You can sign in with any email from the mock data (e.g., `sarah@example.com`) with any password to explore the features.

## Next Steps

1. Open http://localhost:3000 in your browser
2. Explore the different pages (Blog, Wiki, Shelters, etc.)
3. Sign in to access the dashboard
4. Customize the application according to your needs


