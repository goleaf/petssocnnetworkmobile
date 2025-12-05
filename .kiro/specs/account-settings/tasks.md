# Implementation Plan

**Database Note**: All database operations must use Prisma ORM exclusively. Import from `@/lib/prisma` or `@/lib/db`. See `docs/DATABASE_ARCHITECTURE.md` and `docs/QUICK_START_DATABASE.md` for patterns and examples.

- [x] 1.Set up database schema and migrations ✅ COMPLETED
  - ✅ Created Prisma schema extensions for EmailVerification, Session, BlockedUser, and MutedUser models
  - ✅ Added new fields to User model (passwordChangedAt, sessionInvalidatedAt, privacy JSON, notificationSettings JSON, searchIndexingEnabled, showInSearch, showInRecommendations, deletionScheduledAt, deletionReason)
  - ✅ Generated and ran Prisma migration (20251110050526_add_account_settings_models)
  - ✅ Created database indexes for performance (userId, token, email, expiresAt, deletionScheduledAt)
  - ✅ Updated documentation (CHANGELOG.md, FEATURES.md, DATABASE_ARCHITECTURE.md)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 9.1, 9.2, 10.1, 10.2, 11.1, 11.2, 12.1, 12.2, 13.1, 13.2, 14.1, 14.2_

- [x] 1.1.Implement TypeScript types and interfaces ✅ COMPLETED
  - ✅ Created lib/types/settings.ts with comprehensive type definitions
  - ✅ Implemented PrivacyLevel type with all visibility options (public, private, followers-only, friends-only, no-one)
  - ✅ Implemented PrivacySettings interface with profile visibility, content visibility, interaction permissions, search controls, and profile sections
  - ✅ Implemented MessagingPrivacySettings interface with message permissions, read receipts, typing indicators, and forwarding controls
  - ✅ Implemented NotificationSettings interface with channel preferences (in_app, push, email, sms, digest)
  - ✅ Implemented NotificationChannelPreference with frequency, priority threshold, and category filtering
  - ✅ Implemented QuietHoursSettings with time range, day selection, and critical notification exceptions
  - ✅ Implemented NotificationPreviewSettings for lock screen and preview controls
  - ✅ Implemented SessionInfo interface with device tracking, geolocation, and activity timestamps
  - ✅ Implemented EmailChangeRequest interface for email verification workflow
  - ✅ Implemented PasswordChangeRequest interface for password updates
  - ✅ Implemented AccountDeletionRequest interface with reason tracking
  - ✅ Exported all types from lib/types/index.ts
  - ✅ Updated documentation (CHANGELOG.md, FEATURES.md)
  - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 8.1, 8.2, 11.1, 11.2, 12.1, 13.1, 14.1_

- [x] 1.2.Create email change functionality
- [x] 1.3.Implement requestEmailChangeAction server action
  - Write server action in lib/actions/account.ts to handle email change requests
  - Validate current password using bcrypt compare
  - Check if new email is already in use
  - Generate cryptographically secure verification token (32 bytes)
  - Create EmailVerification record with 24-hour expiration
  - Send verification email to new address with token link
  - Send notification email to old address with cancellation link
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.4.Implement email verification endpoint
  - Create API route app/api/verify-email/route.ts to handle token verification
  - Validate token and check expiration
  - Update user email in database
  - Delete EmailVerification record
  - Send confirmation emails to both old and new addresses
  - _Requirements: 2.5_

- [x] 1.5.Implement email change cancellation endpoint
  - Create API route app/api/cancel-email-change/route.ts
  - Validate cancellation token
  - Delete EmailVerification record
  - Send confirmation email to original address
  - _Requirements: 2.4_

- [x] 1.6.Create email change dialog component
  - Build dialog UI with new email input, password input, and verification checkbox
  - Add email format validation
  - Add password requirement validation
  - Implement form submission with loading state
  - Display success/error messages
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.7.Create password change functionality
- [x] 1.8.Implement updatePasswordAction server action
  - Write server action in lib/actions/account.ts to handle password updates
  - Verify current password using bcrypt compare
  - Validate new password meets complexity requirements (8+ chars, uppercase, lowercase, number, special char)
  - Hash new password with bcrypt cost factor 12
  - Update user passwordHash and passwordChangedAt timestamp
  - Set sessionInvalidatedAt to current time
  - Revoke all sessions except current session
  - Send password change notification email
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.9.Create password change UI section
  - Build form with current password, new password, and confirm password inputs
  - Add show/hide toggle buttons for password fields
  - Implement real-time password strength meter (weak/fair/good/strong)
  - Add password match validation for confirm field
  - Display password requirements checklist
  - Add "Log out from all devices" button
  - _Requirements: 3.1, 3.2, 3.5_

- [x] 1.10.Implement session management ✅ COMPLETED
- [x] 1.11.Create session tracking on login
  - ✅ Modified login flow to create Session record in Prisma database
  - ✅ Installed and integrated ua-parser-js to parse User-Agent header
  - ✅ Extracted device name, OS, browser, and device type from User-Agent
  - ✅ Extracted IP address from request headers (x-forwarded-for, x-real-ip)
  - ✅ Implemented IP geolocation (simplified for localhost/private IPs)
  - ✅ Stored session with 7-day expiration in database
  - ✅ Updated both loginAction and verifyMagicLink to create database sessions
  - _Requirements: 4.1, 4.2_

- [x] 1.12.Implement getActiveSessionsAction server action
  - ✅ Migrated from in-memory session-store to Prisma database queries
  - ✅ Query Session table for non-revoked, non-expired sessions for current user
  - ✅ Mark current session with isCurrent flag
  - ✅ Return session list with device info, location, IP, and timestamps
  - ✅ Auto-create session in database if current token not found
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 1.13.Implement session logout actions
  - ✅ Migrated logoutSessionAction to use Prisma database
  - ✅ Migrated logoutAllOtherSessionsAction to use Prisma database
  - ✅ Update Session records to set revoked=true in database
  - ✅ Added user ownership validation before revoking sessions
  - _Requirements: 4.3, 4.4_

- [x] 1.14.Implement renameSessionDeviceAction ✅ COMPLETED
  - ✅ Migrated to use Prisma database for updating customName field
  - ✅ Validate user owns the session before allowing rename
  - ✅ Update session customName in database
  - ✅ Implemented in lib/actions/sessions.ts with full validation
  - ✅ Properly integrated with settings UI
  - _Requirements: 4.1_

- [x] 1.15.Create session management UI
  - ✅ Session management UI already implemented in app/[locale]/settings/page.tsx
  - ✅ Table displays device name, location, IP address, last activity, and action button
  - ✅ Inline editing for device names with save/cancel buttons
  - ✅ IP address masking with tooltip showing full IP on hover
  - ✅ Current session highlighted with "Current device" badge
  - ✅ "Remove Device" button for each session (disabled for current)
  - ✅ "Remove All Devices (except current)" button
  - ✅ Relative timestamps for last activity using RelativeTime component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 1.16.Implement account deletion
- [x] 1.17.Implement requestAccountDeletionAction server action
  - Write server action in lib/actions/account.ts to handle deletion requests
  - Verify password using bcrypt compare
  - Calculate deletion date (30 days from now)
  - Update user with deletionScheduledAt and deletionReason
  - Revoke all user sessions immediately
  - Generate restore token
  - Send confirmation email with restore link valid for 30 days
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 1.18.Create account deletion dialog component
  - Build multi-step modal (4 steps)
  - Step 1: Display data deletion list with "I understand" checkbox
  - Step 2: Reason selection dropdown with "Other" text input
  - Step 3: Password confirmation input
  - Step 4: Type "DELETE" confirmation input
  - Add step navigation with Back/Next buttons
  - Validate each step before allowing progression
  - Display final "Permanently Delete Account" button on step 4
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 1.19.Implement account restore endpoint
  - Create API route app/api/restore-account/route.ts
  - Validate restore token
  - Clear deletionScheduledAt and deletionReason fields
  - Send confirmation email
  - _Requirements: 5.5_

- [ ] 1.20.* 1.20. Create scheduled deletion job
  - Implement background job to permanently delete accounts after 30-day grace period
  - Query users where deletionScheduledAt is in the past
  - Delete user data (posts, comments, messages, pets, etc.)
  - Delete user account
  - _Requirements: 5.3_

- [x] 1.21.Implement privacy settings
- [x] 1.22.Create privacy service module
  - Write lib/services/privacy.ts with privacy management functions
  - Implement updatePrivacySettings to save privacy JSON to user record
  - Implement getPrivacySettings to retrieve and parse privacy JSON
  - Implement getDefaultPrivacySettings to return default values
  - Implement canViewProfile to check if viewer can access target user's profile based on privacy level
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.23.Create profile visibility UI section
  - Build radio button group for Public/Friends Only/Private options
  - Add descriptive text for each option
  - Implement immediate save on selection change 
  - Display visual confirmation on save
  - _Requirements: 6.1_

- [x] 1.24.Create granular privacy settings UI
  - Build privacy selectors for email, phone, birthday, age, location, and online status
  - Use existing PrivacySelector component with Everyone/Friends/Only Me options
  - Add toggle for "Show online status"
  - Implement auto-save with AJAX requests
  - Display success animation (green checkmark) on save
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 1.25.Create tagging and mentions privacy UI
  - Build dropdown for "Who can tag me" with privacy level options
  - Add toggle for "Review tags before showing on profile"
  - Build dropdown for "Who can mention me" with privacy level options
  - Add toggle for "Notification for tags"
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 1.26.Create messaging privacy UI
  - Build dropdown for "Who can send me messages" with privacy level options
  - Add toggle for "Read receipts"
  - Add toggle for "Typing indicators"
  - Add toggle for "Allow message forwarding"
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.27.Create search and indexing UI
  - Add toggle for "Allow search engines to index my profile"
  - Add toggle for "Show profile in user search"
  - Add toggle for "Show in recommendations"
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 1.28.Implement blocking and muting
- [x] 1.29.Create blocking service functions
  - Write blockUser function in lib/services/privacy.ts to create BlockedUser record
  - Write unblockUser function to delete BlockedUser record
  - Write muteUser function to create MutedUser record
  - Write unmuteUser function to delete MutedUser record
  - Implement logic to remove follower relationships on block
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 1.30.Create blocked users list UI
  - Build list displaying blocked users with avatar, username, and date blocked
  - Add search box to filter blocked users
  - Add "Unblock" button for each user
  - Display explanation text about blocking effects
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 1.31.Create muted users list UI
  - Build list displaying muted users with avatar and username
  - Add "Unmute" button for each user
  - Display explanation text about muting effects
  - _Requirements: 9.3_

- [x] 1.32.Implement bulk block functionality
  - Create UI to accept list of usernames (textarea)
  - Parse and validate usernames
  - Call blockUser for each username
  - Display success/error summary
  - _Requirements: 9.5_

- [x] 1.33.Implement notification settings
- [x] 1.34.Create notification service module
  - Write lib/services/notifications.ts with notification management functions
  - Implement getNotificationSettings to retrieve settings from user record
  - Implement updateNotificationSettings to save settings JSON
  - Implement getDefaultNotificationSettings to return default values
  - Implement shouldSendNotification to check if notification should be sent based on channel, category, priority, and quiet hours
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 1.35.Create notification categories UI
  - Build expandable cards for each category (Interactions, Social, Messages, Posts, Pets, Events, Marketplace, Community, System)
  - Add master toggle for each category to enable/disable all notifications
  - _Requirements: 11.1, 11.2_

- [x] 1.36.Create channel selection UI
  - Build individual toggles for Push, Email, SMS, and In-App for each notification type
  - Add "Instant" or "Daily Digest" option for email notifications
  - Display cost warning for SMS notifications
  - _Requirements: 11.3, 11.4, 11.5_

- [x] 1.37.Create email digest settings UI
  - Build radio button group for Real-time, Hourly, Daily, and Weekly options
  - Add time picker for daily digest preferred hour
  - Add day selector for weekly digest preferred day
  - Display note that security alerts are always sent immediately
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 1.38.Create quiet hours UI
  - Build time range pickers for start and end time
  - Add day selector checkboxes for Mon-Sun
  - Add toggle for "Allow critical notifications during quiet hours"
  - Display explanation of quiet hours behavior
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 1.39.Create notification preview settings UI
  - Add toggle for "Show notification previews"
  - Add toggle for "Show on lock screen"
  - Display explanation of privacy implications
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 1.40.Implement privacy enforcement
- [x] 1.41.Add privacy checks to profile viewing
  - Modify profile page to check canViewProfile before displaying content
  - Return 403 or redirect if viewer doesn't have permission
  - Apply privacy levels to profile sections (basics, statistics, friends, pets, activity)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 1.42.Add privacy checks to tagging
  - Modify tagging logic to validate privacy settings before creating tag
  - Check allowTagging privacy level against tagger's relationship
  - Queue tags for approval if "Review tags" is enabled
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 1.43.Add privacy checks to mentions
  - Modify mention logic to validate privacy settings before creating mention
  - Check allowMentions privacy level against mentioner's relationship
  - Suppress @mention links and notifications if set to "No One"
  - _Requirements: 7.3_

- [x] 1.44.Add privacy checks to messaging
  - Modify messaging logic to validate privacy settings before allowing message
  - Check whoCanMessage privacy level against sender's relationship
  - Reject messages if sender doesn't meet privacy requirements
  - _Requirements: 8.1_

- [x] 1.45.5 Filter blocked and muted content
  - Modify feed queries to exclude posts from blocked users
  - Modify feed queries to exclude posts from muted users
  - Prevent blocked users from viewing profile, sending messages, or creating tags
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 1.46.Implement search visibility controls
  - Add noindex meta tag to profile pages when searchIndexingEnabled is false
  - Exclude users from search results when showInSearch is false
  - Exclude users from recommendations when showInRecommendations is false
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [-] 1.47.Add validation and error handling
  - Implement email format validation using regex
  - Implement password strength validation with complexity requirements
  - Add error handling for unique constraint violations (email already exists)
  - Add error handling for invalid passwords
  - Add error handling for expired tokens
  - Add error handling for unauthorized access
  - Create consistent error response format
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2_

- [ ] 1.48.Implement security measures
  - Add rate limiting to email change requests (max 3 per hour)
  - Add rate limiting to password change attempts (max 5 per hour)
  - Add rate limiting to session creation (max 10 per hour)
  - Implement CSRF protection for all mutations
  - Use secure, httpOnly cookies for session tokens
  - Implement session expiration (7 days)
  - Track session activity and update lastActivityAt
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [ ] 1.49.Add monitoring and logging
  - Log all email change requests with userId and timestamp
  - Log all password changes with userId and timestamp
  - Log all session creation and revocation events
  - Log all account deletion requests
  - Log all privacy setting changes
  - Create metrics for email change success rate
  - Create metrics for password change success rate
  - Create metrics for session creation rate
  - Create metrics for account deletion rate
  - Set up alerts for high failure rates
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [ ] 1.50.Write integration tests
  - Test complete email change flow from request to verification
  - Test email change cancellation flow
  - Test password change with session invalidation
  - Test session listing and logout
  - Test account deletion scheduling and restore
  - Test privacy settings save and retrieval
  - Test blocking and unblocking users
  - Test notification settings save and retrieval
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5_
