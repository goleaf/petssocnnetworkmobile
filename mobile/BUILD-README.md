# Android APK Build Guide

## Setup Complete ✅

All infrastructure for generating Android APK has been set up:

1. ✅ **Capacitor installed** - @capacitor/core, @capacitor/cli, @capacitor/android
2. ✅ **Capacitor configured** - capacitor.config.ts with appId: com.pawsocial.app
3. ✅ **Android platform added** - Located in `mobile/android/`
4. ✅ **Icons configured** - App icons copied to all mipmap folders
5. ✅ **Build scripts added** - `build:android`, `apk:debug`, `apk:release`
6. ✅ **Next.js configured** - Static export enabled in next.config.mjs

## Current Issue ⚠️

The Next.js build fails with static export due to dynamic routes:
- Error: "TypeError: generate is not a function"
- Reason: Next.js 16 App Router requires `generateStaticParams()` for all dynamic routes in static export
- Problem: Dynamic routes are client components using localStorage, which can't use server-side generateStaticParams

## Dynamic Routes Affected

The following dynamic routes need attention:
- `app/blog/[id]/page.tsx`
- `app/groups/[slug]/page.tsx`
- `app/profile/[username]/page.tsx`
- `app/wiki/[slug]/page.tsx`
- `app/user/[username]/**/*.tsx`
- `app/pet/[id]/page.tsx`
- `app/shelters/[id]/page.tsx`
- `app/blog/tag/[tag]/page.tsx`
- `app/groups/category/[categorySlug]/page.tsx`

## Solutions

### Option 1: Convert to Server Components (Recommended for Production)

Convert dynamic route pages to server components that:
1. Export `generateStaticParams()` returning empty array `[]`
2. Import and render client components for interactive parts
3. Handle client-side data fetching in child components

Example structure:
```typescript
// app/blog/[id]/page.tsx (Server Component)
export function generateStaticParams() {
  return []
}

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  return <BlogPostClient params={params} />
}
```

### Option 2: Pre-generate Known Routes

If you have a limited set of known routes (users, pets, posts), generate them:
```typescript
export async function generateStaticParams() {
  const posts = getBlogPosts() // From your data source
  return posts.map(post => ({ id: post.id }))
}
```

### Option 3: Use Catch-All Routes

Convert dynamic routes to catch-all routes that handle routing client-side:
- `app/blog/[...slug]/page.tsx` instead of `app/blog/[id]/page.tsx`

### Option 4: Alternative Build Method

Use Next.js standalone build + manual static extraction:
1. Remove `output: 'export'` from next.config.mjs
2. Build normally: `pnpm build`
3. Use a tool to extract static files from `.next` folder
4. Copy to `out` directory for Capacitor

## Build Commands

Once the build issue is resolved:

```bash
# Build Next.js and sync with Capacitor
pnpm run build:android

# Build debug APK
pnpm run apk:debug

# Build release APK (unsigned)
pnpm run apk:release
```

APK files will be generated at:
- Debug: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `mobile/android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Signing APK for Production

To create a signed APK for Google Play Store:

1. Generate a keystore:
```bash
keytool -genkey -v -keystore pawsocial-release.keystore -alias pawsocial -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `mobile/android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../pawsocial-release.keystore')
            storePassword 'your-password'
            keyAlias 'pawsocial'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Next Steps

1. Resolve static export issue using one of the solutions above
2. Test build: `pnpm run build:android`
3. Build APK: `pnpm run apk:debug`
4. Test on Android device
5. Sign and publish to Google Play Store

## Android Project Location

The Android project is in: `mobile/android/`

You can open it in Android Studio:
```bash
cd mobile/android
# Open in Android Studio or use Capacitor CLI
npx cap open android
```

