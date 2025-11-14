# Implementation Plan

## 1. Admin Analytics Dashboard - Data Collection Infrastructure

- [ ] 1.1 Create analytics event tracking schema and database models
  - Add `AnalyticsEvent`, `DailyMetrics`, and `CohortRetention` models to Prisma schema
  - Generate Prisma client and run migrations
  - _Requirements: 2.1, 2.5_

- [ ] 1.2 Implement event logging service
  - Create `lib/analytics/events.ts` with functions to log user registration, post creation, comment creation, like addition, and pet profile creation events
  - Ensure events are logged within 1 second of occurrence
  - Add error handling and retry logic
  - _Requirements: 2.1_

- [ ] 1.3 Build hourly aggregation job
  - Create `lib/analytics/aggregation.ts` with `aggregateDailyMetrics()` function
  - Implement logic to compute DAU, WAU, MAU, post counts, comment counts, and like counts from raw events
  - Add job scheduling using existing queue system in `lib/queue/`
  - _Requirements: 2.2, 2.5_

- [ ] 1.4 Build nightly retention cohort computation job
  - Implement `computeRetentionCohorts()` function in `lib/analytics/aggregation.ts`
  - Calculate D1, D7, and D30 retention rates for each signup cohort
  - Store results in `CohortRetention` table
  - _Requirements: 2.3_

- [ ] 1.5 Add aggregation job error handling and alerting
  - Implement retry logic with exponential backoff (up to 3 attempts)
  - Add administrator alerting on final failure
  - _Requirements: 2.4_

## 2. Admin Analytics Dashboard - UI Components

- [x] 2.1 Create analytics dashboard layout and routing
  - `app/admin/analytics/page.tsx` exists with tabs for moderation, wiki, search, and community
  - _Requirements: 1.1_

- [ ] 2.2 Enhance analytics dashboard with platform metrics
  - Extend existing `app/admin/analytics/page.tsx` to add overview, content, and retention tabs
  - Create `components/admin/MetricCard.tsx` for displaying KPI values
  - Create `components/admin/TimeSeriesChart.tsx` for line and bar charts
  - Use existing date picker components for date selection
  - _Requirements: 1.1, 1.2_

- [ ] 2.3 Implement overview metrics API and page
  - Create `app/api/admin/analytics/overview/route.ts` to fetch DAU, WAU, MAU, new registrations, and churn rates
  - Add overview tab to existing `app/admin/analytics/page.tsx` to display overview metrics
  - Ensure metrics update within 2 seconds of date range change
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2.4 Implement content metrics API and page
  - Create `app/api/admin/analytics/content/route.ts` to fetch posts per day, comments per day, and average likes per post
  - Add content tab to existing `app/admin/analytics/page.tsx` to display content metrics
  - _Requirements: 1.4_

- [ ] 2.5 Implement moderation metrics API and page
  - Create `app/api/admin/analytics/moderation-metrics/route.ts` to fetch reports per day, auto-removed vs moderator-removed ratio, and average resolution time
  - Enhance existing moderation tab in `app/admin/analytics/page.tsx` with warning indicators for resolution times exceeding 24 hours
  - Add filtering by content type
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2.6 Verify and enhance CSV export functionality
  - Check if `lib/utils/analytics-data.ts` exists and has `exportToCSV` function
  - If not, create CSV export functionality for analytics data
  - Add export button to analytics dashboard
  - _Requirements: 1.5_

## 3. Multi-Language Support - Core Infrastructure

- [x] 3.1 i18n routing infrastructure exists
  - `i18n/routing.ts` and `i18n/request.ts` exist with locale handling
  - `app/[locale]/` directory structure exists for locale-based routing
  - _Requirements: 4.1, 4.4_

- [x] 3.2 Translation file structure exists
  - `messages/en.json` and `messages/de.json` exist with translations
  - _Requirements: 4.3, 4.4_

- [ ] 3.3 Expand translation support to additional locales
  - Add `messages/lt.json` (Lithuanian) and `messages/ru.json` (Russian)
  - Translate all existing keys from `messages/en.json` to new locales
  - _Requirements: 4.1, 4.3_

- [ ] 3.4 Add language and timezone preferences to user model
  - Update Prisma schema to add `language` and `timezone` fields to User model (currently missing from schema)
  - Generate Prisma client and run migrations
  - _Requirements: 4.2_

- [x] 3.5 Translation utilities exist
  - `lib/i18n/` directory has formatting, hooks, languages, navigation, and regions utilities
  - _Requirements: 4.5, 5.5_

- [ ] 3.6 Enhance translation hooks for dynamic content
  - Review and enhance existing `lib/i18n/hooks.ts` to support dynamic content insertion for usernames, pet names, and dates
  - Ensure language change applies immediately without page reload
  - _Requirements: 4.5, 5.5, 6.5_

## 4. Multi-Language Support - UI Integration

- [ ] 4.1 Add language selector to user settings
  - Create language selection component in `components/settings/LanguageSelector.tsx` using existing `lib/i18n/languages.ts`
  - Add language selector to `app/[locale]/settings/language/page.tsx` (if not exists, create it)
  - Persist language preference to user profile on change
  - _Requirements: 6.1, 6.2_

- [ ] 4.2 Add language selector for guest users
  - Add language selector to website header/navigation for unauthenticated users
  - Store guest language preference in cookie with 365-day expiration
  - _Requirements: 6.2, 6.3_

- [ ] 4.3 Expand translation coverage
  - Review existing translations in `messages/en.json` and `messages/de.json`
  - Add missing translations for navigation elements, form labels, buttons, and error messages
  - Update components to use translation keys where hardcoded strings still exist
  - _Requirements: 4.3_

- [ ] 4.4 Implement localized notifications
  - Update `lib/notifications.ts` to use user's language preference from database
  - Add notification translation keys to all locale files
  - Translate notification types: likes, comments, followers, messages, appointment reminders
  - _Requirements: 5.1, 5.2_

- [ ] 4.5 Implement localized emails
  - Create email templates for each supported language (en, de, lt, ru)
  - Translate welcome emails, password resets, and security alerts
  - Update email sending logic to select template based on user language preference
  - _Requirements: 5.3_

## 5. Mobile Application - Authentication and Core Setup

- [x] 5.1 Android project structure exists
  - `mobile/android/` directory exists with Capacitor configuration
  - Android build system configured in `capacitor.config.ts`
  - Push notifications plugin configured
  - _Requirements: 7.1_

- [ ] 5.2 Initialize iOS project
  - Run `npx cap add ios` to create iOS project structure
  - Configure iOS build settings and dependencies
  - Update `capacitor.config.ts` to include iOS configuration
  - _Requirements: 7.1_

- [ ] 5.3 Implement secure token storage
  - Create iOS `TokenManager` class using Keychain Services API
  - Create Android `TokenManager` class using Android Keystore
  - Implement token save, retrieve, and delete methods
  - _Requirements: 7.2_

- [ ] 5.4 Build authentication API client
  - Create shared API client for login, register, token refresh, and password reset
  - Implement request/response models matching backend API at `app/api/auth/`
  - Add error handling and network retry logic
  - _Requirements: 7.1, 7.3_

- [ ] 5.5 Build login and registration screens
  - Create iOS login and registration views using SwiftUI
  - Create Android login and registration screens using Jetpack Compose
  - Implement form validation and error display
  - Add 1-second delay after failed authentication
  - _Requirements: 7.1, 7.5_

- [ ] 5.6 Implement authentication state management
  - Create authentication state manager to persist login state across app restarts
  - Implement automatic token refresh logic
  - Add logout functionality that clears tokens and session
  - _Requirements: 7.4_

## 6. Mobile Application - Feed and Content

- [ ] 6.1 Build feed API client
  - Create API client for fetching feed, liking posts, commenting, and sharing
  - Implement pagination support
  - _Requirements: 8.1_

- [ ] 6.2 Create feed screen with infinite scroll
  - Build iOS feed view with infinite scrolling
  - Build Android feed screen with infinite scrolling
  - Implement pull-to-refresh functionality
  - _Requirements: 8.1, 8.2_

- [ ] 6.3 Implement post interaction features
  - Add like, comment, and share buttons to feed items
  - Implement post detail view with full comments
  - Add navigation from feed to post detail on tap
  - _Requirements: 8.3, 8.5_

- [ ] 6.4 Add image loading and caching
  - Implement progressive image loading for feed images
  - Add image caching for offline viewing
  - _Requirements: 8.4_

## 7. Mobile Application - Pet Profile Management

- [ ] 7.1 Build pet profile API client
  - Create API client for CRUD operations on pet profiles
  - Implement photo upload functionality
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 7.2 Create pet profile list screen
  - Build iOS pet list view
  - Build Android pet list screen
  - Display all pets associated with user account
  - _Requirements: 9.4_

- [ ] 7.3 Create pet profile creation and edit screens
  - Build iOS pet form view with fields for name, species, breed, birthdate, and photos
  - Build Android pet form screen with same fields
  - Support multiple photo uploads from camera or photo library
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 7.4 Implement pet profile deletion
  - Add delete functionality with confirmation prompt
  - _Requirements: 9.5_

## 8. Mobile Application - Push Notifications

- [ ] 8.1 Set up Firebase Cloud Messaging
  - Configure FCM for iOS and Android projects
  - Add FCM dependencies to both platforms
  - Add `google-services.json` to Android project
  - Add `GoogleService-Info.plist` to iOS project
  - Initialize FCM in app startup code
  - _Requirements: 10.1_

- [ ] 8.2 Implement device token registration
  - Request notification permissions on app install for both platforms
  - Send device token to backend API on permission approval
  - Add `DeviceToken` and `NotificationPreference` models to Prisma schema
  - Generate Prisma client and run migrations
  - Create API endpoint `app/api/notifications/register-device/route.ts` to receive tokens
  - _Requirements: 10.1_

- [ ] 8.3 Build push notification service
  - Create `lib/notifications/push.ts` with FCM integration using Firebase Admin SDK
  - Extend existing `lib/notifications.ts` to support push notifications
  - Implement notification sending for likes, comments, followers, messages, and appointment reminders
  - Ensure notifications are delivered within 30 seconds
  - Add error handling and retry logic
  - _Requirements: 10.2, 10.5_

- [ ] 8.4 Implement notification handling
  - Add notification tap handlers to navigate to relevant screens in both iOS and Android
  - Implement deep linking for post, message, and appointment screens
  - Verify deep linking configuration in Android manifest
  - Add URL scheme handling for iOS
  - _Requirements: 10.3_

- [ ] 8.5 Create notification preferences UI
  - Build notification settings screen in mobile app for both platforms
  - Allow users to toggle each notification type (likes, comments, followers, messages, appointments)
  - Sync preferences with backend via API
  - Create API endpoint `app/api/notifications/preferences/route.ts`
  - _Requirements: 10.4_

## 9. Third-Party API and Developer Portal

- [ ] 9.1 Design and implement REST API endpoints
  - Create versioned API routes under `/api/v1/`
  - Implement endpoints for reading pet profiles, posts, and activities
  - Return appropriate HTTP status codes and error messages
  - _Requirements: 11.1, 11.4, 11.5_

- [ ] 9.2 Implement OAuth2 and API key authentication
  - Create API authentication middleware
  - Support both OAuth2 and API key authentication methods
  - _Requirements: 11.2_

- [ ] 9.3 Implement rate limiting
  - Create rate limiting middleware with 1000 requests per hour per application limit
  - Store rate limit counters in Redis
  - Return 429 status code when limit exceeded
  - _Requirements: 11.3_

- [ ] 9.4 Implement API scopes and permissions
  - Define scopes: read:pets, write:posts, read:activities, write:appointments
  - Add scope validation middleware
  - Reject unauthorized requests with HTTP 403
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 9.5 Add API request logging
  - Log all API requests with timestamp, application ID, endpoint, and response status
  - Store logs for audit purposes
  - _Requirements: 13.5_

- [ ] 9.6 Build developer portal application registration
  - Create developer portal UI at `/developer`
  - Implement application registration form
  - Generate and display API keys and client credentials
  - _Requirements: 12.1, 12.2_

- [ ] 9.7 Build developer portal dashboard
  - Display API usage statistics and rate limit status
  - Show request counts and error rates
  - _Requirements: 12.3_

- [ ] 9.8 Create interactive API documentation
  - Build API documentation page with example requests and responses
  - Add interactive API explorer
  - _Requirements: 12.4_

- [ ] 9.9 Implement API key management
  - Add functionality to regenerate API keys
  - Add functionality to revoke application access
  - Allow users to review and revoke third-party access from account settings
  - _Requirements: 12.5, 13.4_

## 10. Security Enhancements - Two-Factor Authentication

- [ ] 10.1 Add 2FA fields to User model
  - Update Prisma schema to add `twoFactorSecret`, `twoFactorEnabled`, and `backupCodes` fields to User model (currently missing)
  - Generate Prisma client and run migrations
  - _Requirements: 14.1_

- [ ] 10.2 Implement TOTP generation and verification
  - Create `lib/auth/totp.ts` with TOTP generation and validation functions using `otplib` or similar library
  - Support Google Authenticator and Authy compatibility (standard TOTP RFC 6238)
  - Implement QR code generation for setup
  - _Requirements: 14.1_

- [ ] 10.3 Build 2FA setup flow
  - Create 2FA setup page at `app/[locale]/settings/security/two-factor/page.tsx`
  - Display QR code for TOTP setup using generated secret
  - Generate and display 10 single-use backup codes
  - Require TOTP confirmation before activation
  - Store encrypted backup codes in database
  - _Requirements: 14.2, 14.3_

- [ ] 10.4 Add 2FA verification to login flow
  - Update login API to check for 2FA enabled status
  - Create 2FA verification step after password verification
  - Support both TOTP code and backup code usage
  - Invalidate used backup codes
  - _Requirements: 14.4_

- [ ] 10.5 Implement 2FA disable functionality
  - Create 2FA disable page at `app/[locale]/settings/security/two-factor/disable/page.tsx`
  - Require password and valid TOTP code for disabling
  - Clear 2FA secret and backup codes from database
  - _Requirements: 14.5_

## 11. Security Enhancements - Session Management

- [x] 11.1 Session tracking exists
  - Session model in Prisma schema has deviceType, browser, ip, city, country, and lastActivityAt fields
  - `lib/actions/sessions.ts` exists for session management
  - _Requirements: 15.1_

- [ ] 11.2 Build active sessions UI
  - Create account security settings page at `app/[locale]/settings/security/sessions/page.tsx`
  - Display all active sessions with device type, browser, location, and last activity
  - Show current session indicator
  - Add individual session termination buttons
  - _Requirements: 15.2_

- [ ] 11.3 Implement session termination
  - Verify and enhance "log out from other devices" functionality in `lib/actions/sessions.ts`
  - Invalidate all sessions except current within 5 seconds
  - Add API endpoint for session termination
  - _Requirements: 15.3_

- [ ] 11.4 Add session expiration logic
  - Implement automatic session expiration after 30 days of inactivity in authentication middleware
  - Limit users to maximum of 10 concurrent sessions (remove oldest when limit exceeded)
  - Add cleanup job to remove expired sessions
  - _Requirements: 15.4, 15.5_

## 12. Security Enhancements - Suspicious Login Detection

- [ ] 12.1 Implement login location tracking
  - Store country and device information for each login
  - Detect new countries and new devices
  - _Requirements: 16.1, 16.2_

- [ ] 12.2 Build security alert system
  - Send email and push notification alerts for logins from new countries within 1 minute
  - Send email alerts for logins from new devices within 1 minute
  - Include "This wasn't me" link for immediate account locking
  - _Requirements: 16.1, 16.2, 16.3_

- [ ] 12.3 Create login history tracking
  - Store successful and failed login attempts for past 90 days
  - Display login history in account security settings
  - _Requirements: 16.4_

- [ ] 12.4 Implement brute force protection
  - Track failed login attempts per account
  - Lock account for 30 minutes after 5 failed attempts within 15 minutes
  - _Requirements: 16.5_

## 13. AI-Powered Content Moderation

- [ ] 13.1 Integrate content moderation API
  - Set up AWS Rekognition or similar ML service for image/video analysis
  - Set up Perspective API or OpenAI Moderation API for text analysis
  - Configure API credentials and rate limits
  - _Requirements: 17.1_

- [ ] 13.2 Implement automated content analysis
  - Create `lib/moderation/analyze.ts` with image, video, and text analysis functions
  - Classify content into categories: nudity, violence, hate speech, spam, safe
  - Return confidence scores for each category
  - Complete analysis within 10 seconds
  - Add error handling and fallback logic
  - _Requirements: 17.1, 17.2, 17.5_

- [ ] 13.3 Build automatic content action logic
  - Auto-hide content with confidence score above 90% for harmful categories
  - Add content to moderation queue for scores between 50% and 90%
  - Notify users when content is auto-hidden with appeal option
  - Update content status in database
  - _Requirements: 17.3, 17.4_

- [x] 13.4 Moderation queue models exist
  - `ModerationQueue` model exists in Prisma schema with autoFlagged and autoReason fields
  - _Requirements: 17.4_

## 14. Content Moderation - Moderator Interface

- [x] 14.1 Moderator review interface exists
  - `app/admin/moderation-queue/page.tsx` exists with moderation queue display
  - _Requirements: 18.1, 18.4_

- [ ] 14.2 Enhance queue filtering for AI moderation
  - Extend existing moderation queue page to add filters for AI confidence score and category
  - Add filters for content type, category, confidence score, and submission date
  - Display AI confidence scores and detected categories in queue items
  - _Requirements: 18.2_

- [ ] 14.3 Add AI moderation action controls
  - Extend existing moderation actions to support AI-flagged content
  - Implement approve, reject, and escalate actions for AI-detected content
  - Add optional notes field for moderator decisions
  - Record all decisions with timestamp and moderator ID in ModerationActionLog
  - Update content visibility based on moderator decision
  - _Requirements: 18.3, 18.5_

## 15. Content Moderation - Feedback Loop

- [ ] 15.1 Store moderator decisions as training data
  - Create `ModerationTrainingData` model in Prisma schema
  - Save moderator decisions with content, AI prediction, and human label
  - Store in structured format for model retraining
  - _Requirements: 19.1_

- [ ] 15.2 Track moderation accuracy metrics
  - Create `lib/moderation/metrics.ts` to calculate false positive and false negative rates
  - Calculate metrics for each category by comparing AI predictions to moderator decisions
  - Display metrics in admin analytics dashboard
  - Alert administrators when false positive rate exceeds 20%
  - _Requirements: 19.2, 19.3_

- [ ] 15.3 Build threshold adjustment interface
  - Create admin page at `app/admin/moderation/thresholds/page.tsx`
  - Allow adjusting confidence thresholds per category (auto-hide and queue thresholds)
  - Store thresholds in database or configuration
  - _Requirements: 19.4_

- [ ] 15.4 Implement training data export
  - Create export functionality for labeled training data
  - Support CSV and JSON formats suitable for model retraining
  - Add export button to admin moderation dashboard
  - Include content, AI scores, moderator labels, and timestamps
  - _Requirements: 19.5_

## 16. Real-Time Communication - WebRTC Infrastructure

- [ ] 16.1 Set up WebRTC signaling server
  - Implement WebSocket server for WebRTC signaling using Socket.IO or native WebSockets
  - Handle offer, answer, and ICE candidate exchange
  - Create signaling API routes or WebSocket handlers
  - _Requirements: 22.3_

- [ ] 16.2 Configure TURN servers
  - Set up TURN servers for NAT traversal (use Twilio, Xirsys, or self-hosted coturn)
  - Configure TURN server credentials and URLs
  - Add TURN configuration to WebRTC peer connection setup
  - _Requirements: 22.2_

- [ ] 16.3 Implement WebRTC peer connection logic
  - Create `lib/rtc/connection.ts` with peer connection setup
  - Handle media stream acquisition and transmission
  - Implement ICE candidate gathering and exchange
  - Add connection state monitoring
  - _Requirements: 22.1_

- [ ] 16.4 Add media permissions handling
  - Request camera and microphone permissions before calls
  - Handle permission denial gracefully with user-friendly messages
  - Provide fallback options (voice-only if camera denied)
  - _Requirements: 22.4_

- [ ] 16.5 Implement connection error handling
  - Display error message when call fails to connect within 30 seconds
  - Allow retry functionality
  - Handle network disconnections and reconnection logic
  - _Requirements: 22.5_

## 17. Real-Time Communication - Call Features

- [ ] 17.1 Build call initiation UI
  - Add call button to direct message conversations in web app
  - Create call invitation modal with accept/decline options
  - Send push notification to recipient for incoming calls
  - _Requirements: 20.1, 20.2_

- [ ] 17.2 Implement call modes and controls
  - Support voice-only and video calling modes
  - Add in-call controls: mute, speaker toggle, camera switch, end call
  - Allow switching between voice and video during active call
  - Create in-call UI component with video display
  - _Requirements: 20.3, 20.4_

- [ ] 17.3 Add adaptive quality logic
  - Monitor network conditions during calls using WebRTC stats
  - Automatically switch to voice-only when video quality degrades
  - Display connection quality indicator to users
  - _Requirements: 20.5_

- [ ] 17.4 Create call history tracking
  - Add `Call` model to Prisma schema with caller, callee, startTime, duration, callType fields
  - Record call metadata when calls start and end
  - Display call history in message interface
  - Generate Prisma client and run migrations
  - _Requirements: 21.1, 21.2_

- [ ] 17.5 Implement call blocking and DND
  - Check user block list before allowing incoming calls
  - Honor Do Not Disturb settings from user preferences
  - Limit call duration to 4 hours with automatic end
  - Add call rejection reasons (blocked, DND, busy)
  - _Requirements: 21.3, 21.4, 21.5_

## 18. Augmented Reality Features

- [ ] 18.1 Set up AR frameworks
  - Integrate ARKit for iOS (requires iOS project from task 5.2)
  - Integrate ARCore for Android
  - Add AR dependencies to both platforms
  - Configure AR capabilities in project settings
  - _Requirements: 23.1_

- [ ] 18.2 Implement AR camera mode
  - Create AR camera view accessible from post composer in mobile apps
  - Implement face and body detection for filter placement using ARKit/ARCore
  - Add AR session management and lifecycle handling
  - _Requirements: 23.1, 23.2_

- [ ] 18.3 Create initial AR filter set
  - Design and implement at least 10 AR filters (pet ears, noses, accessories, etc.)
  - Include 2D stickers, 3D objects, and visual effects
  - Limit individual asset size to 5MB
  - Create filter metadata and configuration files
  - _Requirements: 23.3, 24.5_

- [ ] 18.4 Build AR content capture
  - Allow photo and video capture with applied AR effects
  - Enable direct posting to feed from AR camera
  - Save captured content to device gallery
  - _Requirements: 23.5_

- [ ] 18.5 Create AR filter library UI
  - Organize filters into themed packs (Birthday, Halloween, Vet Visit, etc.)
  - Build filter browsing and preview interface in mobile apps
  - Implement on-demand download and local caching
  - Add filter search and favorites
  - _Requirements: 24.1, 24.2, 24.4_

- [ ] 18.6 Optimize AR performance
  - Maintain at least 24 FPS on devices from past 4 years
  - Detect device capabilities and disable AR on unsupported devices
  - Optimize 3D models to under 10,000 triangles
  - Use texture compression (ASTC for iOS, ETC2 for Android)
  - Implement automatic quality reduction when FPS drops below 15
  - Add performance monitoring and logging
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

## 19. Pet Health and Activity Tracking

- [ ] 19.1 Create activity logging models
  - Add `PetActivityLog` model to Prisma schema (currently missing)
  - Support activity types: walks, meals, playtime, vet visits
  - Store timestamp, duration, notes, and photo attachments
  - Generate Prisma client and run migrations
  - _Requirements: 26.1, 26.2, 26.5_

- [ ] 19.2 Build activity logging UI
  - Create activity log form component in `components/pet/ActivityLogForm.tsx`
  - Add activity timeline to existing pet profile page
  - Display chronological timeline of activities per pet
  - Implement edit and delete functionality
  - Add photo upload support for activities
  - _Requirements: 26.1, 26.3, 26.4_

- [ ] 19.3 Implement health reminder system
  - Add `PetHealthReminder` model to Prisma schema (currently missing)
  - Support reminder types: vaccinations, deworming, medications, checkups
  - Store due date, recurrence pattern, and completion status
  - Generate Prisma client and run migrations
  - _Requirements: 27.1_

- [ ] 19.4 Build reminder notification logic
  - Create `lib/pets/reminders.ts` with reminder notification functions
  - Integrate with existing notification system in `lib/notifications.ts`
  - Send push notification and email 7 days before due date
  - Send reminder on due date at 9:00 AM in user's timezone
  - Add scheduled job to check and send reminders
  - _Requirements: 27.2, 27.3_

- [ ] 19.5 Create reminder management UI
  - Create reminder component in `components/pet/HealthReminders.tsx`
  - Display upcoming and overdue reminders on pet profile page
  - Allow marking reminders as completed or snoozed
  - Add reminder creation and editing forms
  - _Requirements: 27.4, 27.5_

- [ ] 19.6 Build activity analytics
  - Create `lib/pets/activity-analytics.ts` with analytics functions
  - Calculate average daily walk duration per pet
  - Generate weekly activity summaries with week-over-week comparison
  - Display activity trends using line charts (reuse chart components)
  - Identify and highlight significant pattern changes (>50% change)
  - _Requirements: 28.1, 28.2, 28.3, 28.4_

- [ ] 19.7 Implement activity data export
  - Create CSV export functionality for activity data
  - Add export button to pet profile activity section
  - Include all activity fields in export
  - _Requirements: 28.5_

## 20. Wearable Device Integration

- [ ] 20.1 Design wearable API endpoints
  - Create API endpoints at `app/api/wearables/activity/route.ts` for receiving activity data
  - Support activity types: steps, sleep duration, location tracking, heart rate
  - Implement authentication for wearable devices (API keys or OAuth)
  - Add rate limiting for wearable API endpoints
  - _Requirements: 29.1, 29.3_

- [ ] 20.2 Implement automatic activity log creation
  - Create activity logs from wearable data with source attribution
  - Merge manual and automatic logs into unified timeline
  - Prevent duplicate entries for same time period
  - Add data validation and sanitization
  - _Requirements: 29.2, 29.4_

- [ ] 20.3 Build wearable integration management UI
  - Create integration settings page at `app/[locale]/settings/integrations/page.tsx`
  - Display connected wearable devices
  - Allow users to disconnect wearables
  - Provide option to delete imported data on disconnect
  - Show last sync timestamp
  - _Requirements: 29.5_

## 21. Service Provider Integration - Discovery and Profiles

- [ ] 21.1 Create service provider database models
  - Add `ServiceProvider` model to Prisma schema (currently missing)
  - Store name, services offered, location (lat/lng), hours, contact info, photos, and verification status
  - Add service types: veterinarian, groomer, trainer, sitter, shelter
  - Generate Prisma client and run migrations
  - _Requirements: 30.1, 30.3_

- [ ] 21.2 Build service provider directory
  - Create searchable directory page at `app/[locale]/services/page.tsx`
  - Implement filters for service type, location, rating, and price range
  - Calculate and display distance from user location (check if geo utilities exist, create if needed)
  - Display average rating and review count
  - Add map view option for providers
  - _Requirements: 30.1, 30.2, 30.4, 30.5_

- [ ] 21.3 Create service provider profile pages
  - Build profile page at `app/[locale]/services/[id]/page.tsx`
  - Display all provider information (name, services, location, hours, contact)
  - Show photo gallery
  - Display reviews and ratings section
  - Add booking button
  - _Requirements: 30.3_

## 22. Service Provider Integration - Appointments

- [ ] 22.1 Create appointment database models
  - Add `ServiceAppointment` model to Prisma schema (currently missing)
  - Store user, provider, pet, service type, date/time, status, and notes
  - Add status types: pending, confirmed, cancelled, completed
  - Generate Prisma client and run migrations
  - _Requirements: 31.1_

- [ ] 22.2 Build appointment booking flow
  - Create booking page at `app/[locale]/services/[id]/book/page.tsx`
  - Display available time slots based on provider availability
  - Allow pet selection from user's pets
  - Create appointment with pending status on booking
  - Send confirmation notifications to user and provider using existing notification system
  - _Requirements: 31.1, 31.2, 31.3_

- [ ] 22.3 Create appointment management UI
  - Create appointments page at `app/[locale]/appointments/page.tsx`
  - Display upcoming and past appointments in user account
  - Allow cancellation at least 24 hours before scheduled time
  - Show appointment details and status
  - Add calendar view option
  - _Requirements: 31.4, 31.5_

## 23. Service Provider Integration - Reviews

- [ ] 23.1 Create review database models
  - Add `ServiceProviderReview` model to Prisma schema (currently missing)
  - Store rating (1-5 stars), text feedback, user, provider, appointment, and timestamp
  - Add helpful votes counter
  - Generate Prisma client and run migrations
  - _Requirements: 32.1_

- [ ] 23.2 Build review submission UI
  - Create review form component in `components/services/ReviewForm.tsx`
  - Add review submission to provider profile page
  - Prevent multiple reviews within 30 days for same provider
  - Apply content moderation to review text using existing moderation system
  - Allow photo uploads with reviews
  - _Requirements: 32.1, 32.4, 32.5_

- [ ] 23.3 Display reviews on provider profiles
  - Add reviews section to provider profile page
  - Show all reviews in reverse chronological order
  - Calculate and display average rating
  - Add rating distribution chart
  - Allow sorting by most recent, highest rated, lowest rated
  - _Requirements: 32.2, 32.3_

## 24. Service Provider Dashboard

- [ ] 24.1 Create service provider registration flow
  - Build registration form at `app/[locale]/provider/register/page.tsx`
  - Set initial status to "pending verification"
  - Require business documentation upload using existing upload utilities
  - Collect business license, insurance, certifications
  - _Requirements: 34.1, 34.2_

- [ ] 24.2 Build service provider dashboard
  - Create dashboard at `app/[locale]/provider/dashboard/page.tsx`
  - Allow profile configuration: services, pricing, hours, photos
  - Display key metrics: appointments, reviews, revenue
  - _Requirements: 33.1, 33.2_

- [ ] 24.3 Implement availability management
  - Create availability configuration UI in provider dashboard
  - Allow setting working hours by day of week
  - Allow blocking specific dates for vacations/holidays
  - Support recurring availability patterns
  - _Requirements: 33.3_

- [ ] 24.4 Build appointment management for providers
  - Add appointments section to provider dashboard
  - Display incoming appointment requests
  - Provide accept and decline actions
  - Send notifications for new appointments, cancellations, and upcoming appointments
  - Add calendar view for appointments
  - _Requirements: 33.4, 33.5_

- [ ] 24.5 Create provider verification admin interface
  - Build admin page at `app/admin/providers/page.tsx`
  - Display submitted documentation with preview
  - Provide approve and reject actions with notes
  - Only show verified providers in public search
  - Send confirmation email on verification
  - Track verification status and history
  - _Requirements: 34.2, 34.3, 34.4, 34.5_
