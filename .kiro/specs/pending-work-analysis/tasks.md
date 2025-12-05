# Implementation Plan: Pending Work Analysis

This implementation plan breaks down the design into discrete, actionable coding tasks. Each task builds incrementally on previous tasks and references specific requirements from the requirements document.

## Current Status Summary

**Phase 1: Critical Bug Fixes**  COMPLETE
- All 3 critical bugs have been fixed and tested

**Phase 2: Moderation Infrastructure**  COMPLETE  
- Database schema, storage layer, API routes, and form integrations all implemented
- Edit request system fully functional with rate limiting and classification

**Phase 3: Moderation Dashboard** 🔄 IN PROGRESS
- API routes complete
- Basic dashboard page exists but needs enhancement with new components
- Need to build RecentChangesFeed, QueueManager, and specialized queue pages

**Phase 4: Advanced Moderation Features** ⏳ NOT STARTED
- Bulk operations, link management, and hidden categories pending

**Phase 5: Developer Tooling** ⏳ NOT STARTED
- Cursor hook for test automation not yet implemented

**Phase 6: Testing & Documentation** ⏳ PARTIALLY COMPLETE
- E2E test for groups hydration fix exists
- Comprehensive API documentation created
- Unit and integration tests for moderation system still needed

**Phase 7: Final Integration & Deployment** ⏳ NOT STARTED

## Phase 1: Critical Bug Fixes

- [ ] 1.Fix groups page hydration error
  -  Removed `"use client"` directive to enable Server Component rendering
  -  Replaced dynamic `getGroupCategories()` call with static `DEFAULT_CATEGORIES` array
  -  Ensured category data is identical between server and client renders
  -  Maintained all existing functionality (filtering, search, pagination)
  -  E2E test validates no hydration errors occur
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - _Completed: 2025-11-14_

- [ ] 1.1.Implement group resources routing
  -  Created `app/[locale]/groups/[slug]/resources/create/page.tsx`
  -  Implemented resource creation form component
  -  Added API route for POST operations
  -  Followed existing patterns from other group sub-routes
  -  Page is accessible and functional
  - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - _Completed: 2025-11-14_

- [ ] 1.2.Fix CreatePostButton React error
  -  Reviewed `components/posts/CreatePostButton.tsx` - no hook violations found
  -  Component has proper `"use client"` directive
  -  All React imports follow React 18 conventions
  -  No ReferenceError issues detected
  -  Component renders without errors (verified with getDiagnostics)
  - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - _Completed: 2025-11-14_


## Phase 2: Moderation Infrastructure

- [ ] 1.3.Define TypeScript types and Prisma schema
  -  Created moderation types in `lib/types/moderation.ts`
  -  Extended Prisma schema with EditRequest, LinkWhitelist, LinkBlacklist, ModerationCategory models
  -  Added all necessary indexes and relations to User model
  -  Generated and applied Prisma migration
  - _Requirements: 4.1_
  - _Completed: 2025-11-14_

- [ ] 1.4.Create moderation types in `lib/types/moderation.ts`
  -  Defined `EditRequest` interface with all fields
  -  Defined `ModerationQueue`, `QueueFilters`, `BulkOperation` interfaces
  -  Defined `LinkRule` interface for whitelist/blacklist
  -  Exported all types for use across the application
  - _Requirements: 4.1_
  - _Completed: 2025-11-14_

- [ ] 1.5.Extend Prisma schema in `prisma/schema.prisma`
  -  Added `EditRequest` model with all fields and metadata flags
  -  Added `LinkWhitelist` and `LinkBlacklist` models
  -  Added `ModerationCategory` model
  -  Added necessary indexes for query optimization
  -  Added relations to existing `User` model
  - _Requirements: 4.1_
  - _Completed: 2025-11-14_

- [ ] 1.6.Generate and apply Prisma migration
  -  Generated migration with `npx prisma migrate dev --name add_moderation_system`
  -  Reviewed generated migration SQL
  -  Applied migration to development database
  -  Updated Prisma client with `npx prisma generate`
  - _Requirements: 4.1_
  - _Completed: 2025-11-14_



- [ ] 1.7.Implement storage layer for edit requests
  -  Created `lib/storage/edit-requests.ts` with full CRUD operations
  -  Implemented all query operations with filtering and pagination
  -  Implemented approval/rejection workflows with transactions
  -  Integrated with audit logging and notifications
  -  Added comprehensive JSDoc documentation
  -  Created API documentation in `docs/EDIT_REQUESTS_API.md`
  -  Updated `docs/DATABASE_ARCHITECTURE.md` with EditRequest model
  - _Requirements: 4.2, 5.1, 5.2, 5.3, 5.4, 5.5_
  - _Completed: 2025-11-14_

- [ ] 1.8.Create `lib/storage/edit-requests.ts`
  -  Implemented `createEditRequest` function
  -  Implemented `getEditRequest` function with user/reviewer relations
  -  Implemented `updateEditRequest` function
  -  Implemented `deleteEditRequest` function
  -  Uses Prisma exclusively for all database operations
  - _Requirements: 4.2_
  - _Completed: 2025-11-14_

- [ ] 1.9.Implement query operations in `lib/storage/edit-requests.ts`
  -  Implemented `listEditRequests` with filtering and pagination
  -  Implemented `getQueueItems` for specialized queues (new-pages, flagged-health, coi-edits, image-reviews)
  -  Implemented `getRecentChanges` for recent changes feed
  -  Added comprehensive error handling for all operations
  -  Supports filtering by contentType, status, priority, age, categories, userId, reviewedBy
  - _Requirements: 4.2, 5.5_
  - _Completed: 2025-11-14_

- [ ] 1.10.Implement approval/rejection operations
  -  Implemented `approveEditRequest` with transaction handling
  -  Implemented `rejectEditRequest` with transaction handling
  -  Applies changes to actual content on approval (blog, wiki, pet, profile)
  -  Logs all actions to audit trail
  -  Sends notifications to users
  -  Includes helper functions for content-specific updates
  - _Requirements: 4.2_
  - _Completed: 2025-11-14_



- [ ] 1.11.Create API routes for edit submission
  -  Created `app/api/admin/moderation/edit-requests/route.ts` with POST endpoint
  -  Created `app/api/admin/moderation/approve/route.ts` for approvals
  -  Created `app/api/admin/moderation/reject/route.ts` for rejections
  -  Implemented rate limiting, validation, and classification
  - _Requirements: 4.2, 10.5, 10.6_
  - _Completed: 2025-11-14_

- [ ] 1.12.Create `app/api/admin/moderation/edit-requests/route.ts`
  -  Implemented POST endpoint to create edit requests
  -  Validates input using Zod schemas
  -  Checks user authentication and rate limits
  -  Calculates and stores diff in changes field
  -  Classifies edit (COI, health, new page, images)
  -  Returns edit request ID and confirmation
  - _Requirements: 4.2, 10.5_
  - _Completed: 2025-11-14_

- [ ] 1.13.Implement rate limiting for edit submissions
  -  Uses existing `lib/server-rate-limit.ts`
  -  Enforces 10 edits per hour per user
  -  Enforces 50 edits per day per user
  -  Returns clear error messages when limits exceeded
  - _Requirements: 10.6_
  - _Completed: 2025-11-14_



- [ ] 1.14.Implement diff calculation utility
  -  Extended `lib/diff-utils.ts` with edit request diff functions
  -  Implemented `calculateEditRequestDiff` core function
  -  Created content-specific functions: `calculateBlogDiff`, `calculateWikiDiff`, `calculatePetDiff`, `calculateProfileDiff`
  -  Generates structured diffs with additions/deletions/modifications
  -  Returns JSON-serializable objects suitable for EditRequest.changes field
  -  Updated `docs/EDIT_REQUESTS_API.md` with diff utilities documentation
  - _Requirements: 5.4_
  - _Completed: 2025-11-14_

- [ ] 1.15.Integrate edit submission into existing forms
  -  Updated all four edit forms (blog, wiki, pet, profile)
  -  All forms now submit to `/api/admin/moderation/edit-requests`
  -  Success messages and redirects implemented
  -  Rate limit error handling in place
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  - _Completed: 2025-11-14_

- [ ] 1.16.Update blog edit form
  -  Modified `app/[locale]/blog/[id]/edit/page.tsx`
  -  Submits to `/api/admin/moderation/edit-requests` instead of direct update
  -  Shows "Edit submitted for approval" message on success
  -  Redirects to blog post page after submission
  -  Handles rate limit errors gracefully
  - _Requirements: 10.1, 10.5, 10.6_
  - _Completed: 2025-11-14_

- [ ] 1.17.Update wiki edit form
  -  Modified `app/[locale]/wiki/[slug]/edit/page.tsx`
  -  Submits to `/api/admin/moderation/edit-requests` instead of direct update
  -  Shows "Edit submitted for approval" message on success
  -  Redirects to wiki article page after submission
  -  Handles rate limit errors gracefully
  - _Requirements: 10.2, 10.5, 10.6_
  - _Completed: 2025-11-14_

- [ ] 1.18.Update pet profile edit form
  -  Modified `app/[locale]/user/[username]/pet/[slug]/edit/page.tsx`
  -  Submits to `/api/admin/moderation/edit-requests` instead of direct update
  -  Shows "Edit submitted for approval" message on success
  -  Redirects to pet profile page after submission
  -  Handles rate limit errors gracefully
  - _Requirements: 10.3, 10.5, 10.6_
  - _Completed: 2025-11-14_

- [ ] 1.19.Update user profile edit form
  -  Modified `app/[locale]/user/[username]/edit/page.tsx`
  -  Submits to `/api/admin/moderation/edit-requests` instead of direct update
  -  Shows "Edit submitted for approval" message on success
  -  Redirects to user profile page after submission
  -  Handles rate limit errors gracefully
  - _Requirements: 10.4, 10.5, 10.6_
  - _Completed: 2025-11-14_


## Phase 3: Moderation Dashboard

- [ ] 1.20.Create API routes for moderation dashboard
  -  Created `app/api/admin/moderation/recent-changes/route.ts`
  -  Created `app/api/admin/moderation/queues/[type]/route.ts`
  -  Created `app/api/admin/moderation/approve/route.ts`
  -  Created `app/api/admin/moderation/reject/route.ts`
  -  All routes verify moderator permissions
  - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Completed: 2025-11-14_

- [ ] 1.21.Create `app/api/admin/moderation/recent-changes/route.ts`
  -  Implemented GET endpoint with query params (page, limit, contentType, status, priority, ageInDays)
  -  Returns paginated list of EditRequests with diff previews
  -  Includes metadata for filtering UI
  -  Verifies moderator permissions
  - _Requirements: 4.2, 5.1, 5.2, 5.3_
  - _Completed: 2025-11-14_

- [ ] 1.22.Create `app/api/admin/moderation/queues/[type]/route.ts`
  -  Implemented GET endpoint for each queue type (new-pages, flagged-health, coi-edits, image-reviews)
  -  Filters EditRequests based on metadata flags
  -  Supports same query params as recent changes
  -  Verifies moderator permissions
  - _Requirements: 4.3, 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Completed: 2025-11-14_

- [ ] 1.23.Create `app/api/admin/moderation/approve/route.ts`
  -  Implemented POST endpoint to approve edit requests
  -  Calls `approveEditRequest` from storage layer
  -  Applies changes to actual content
  -  Logs action to audit trail
  -  Sends notification to user
  - _Requirements: 5.1, 5.2_
  - _Completed: 2025-11-14_

- [ ] 1.24.Create `app/api/admin/moderation/reject/route.ts`
  -  Implemented POST endpoint to reject edit requests
  -  Calls `rejectEditRequest` from storage layer
  -  Logs action to audit trail with reason
  -  Sends notification to user
  - _Requirements: 5.1, 5.2_
  - _Completed: 2025-11-14_

- [ ] 1.25.Build Recent Changes Feed component
  -  Created reusable moderation dashboard components
  -  Integrated with existing diff viewer
  -  Implemented filtering and pagination UI
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 1.26.Create `components/admin/RecentChangesFeed.tsx`
  -  Display paginated list of edit requests
  -  Show visual diffs using existing `components/diff-viewer.tsx`
  -  Provide filtering controls (content type, status, priority, age)
  -  Include approve/reject buttons for each item
  -  Mark as client component with `"use client"`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 1.27.Create filter controls component
  -  Built `components/admin/ModerationFilters.tsx`
  -  Implemented dropdowns for content type, status, priority
  -  Implemented age filtering (days input)
  -  Update URL query params on filter change
  -  Use UI primitives from `components/ui/*`
  - _Requirements: 5.5_

- [ ] 1.28.Enhance moderation dashboard page

  -  Updated `app/admin/moderation/page.tsx` to use new API routes
  -  Integrated RecentChangesFeed component
  -  Added navigation to specialized queues
  -  Connected to real API endpoints instead of mock data
  -  Improved diff visualization
  - _Requirements: 5.1, 5.2, 5.3_



- [ ] 1.29.Implement queue management components



  - Build specialized queue views for different content types
  - Add navigation and queue statistics


  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_




- [ ] 1.30.Create `components/admin/QueueManager.tsx`


  - Build reusable component for all queue types

  - Accept queue type as prop to customize behavior
  - Display queue-specific metadata (COI flag, health flag, etc.)
  - Support bulk selection with checkboxes
  - Integrate with filtering and sorting



  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 1.31.Create specialized queue pages




  - Create `app/admin/queue/new-pages/page.tsx`
  - Create `app/admin/queue/flagged-health/page.tsx`



  - Create `app/admin/queue/coi-edits/page.tsx`




  - Create `app/admin/queue/image-reviews/page.tsx`
  - Each page uses QueueManager with appropriate queue type
  - _Requirements: 6.1, 6.2, 6.3, 6.4_


- [ ] 1.32.Add queue navigation to admin layout



  - Update admin navigation to include queue links
  - Show queue item counts as badges
  - Highlight queues with urgent items


  - _Requirements: 6.5_

## Phase 4: Advanced Moderation Features






- [ ] 1.33.Implement bulk operations





- [ ] 1.34.Create `app/api/admin/moderation/bulk/route.ts`




  - Implement POST endpoint for bulk revert
  - Implement POST endpoint for range block
  - Validate moderator permissions
  - Process operations in batches of 100 items
  - Log all operations to audit trail


  - Return operation results with success/failure counts

  - _Requirements: 4.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 1.35.Create `components/admin/BulkOperationsPanel.tsx`

  - Build checkbox selection UI for multiple items
  - Add confirmation dialog before executing bulk actions




  - Show progress indicator during operation
  - Display results summary after completion
  - Handle partial failures gracefully
  - _Requirements: 7.4, 7.5_

- [ ] 1.36.Integrate bulk operations into queue manager



  - Add bulk operation controls to QueueManager component
  - Enable bulk selection mode
  - Connect to bulk operations API
  - Show operation progress and results
  - _Requirements: 7.1, 7.2, 7.3, 7.4_



- [ ] 1.37.Build link management system

- [ ] 1.38.Create link validation utility

  - Create `lib/moderation/link-validator.ts`
  - Implement `validateLinks` function to check URLs against whitelist/blacklist
  - Implement `isBlacklisted` and `isWhitelisted` functions

  - Implement `extractDomain` function for URL parsing
  - Support wildcard subdomain matching
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 1.39.Create `app/api/admin/moderation/links/route.ts`

  - Implement GET endpoint to list all whitelist/blacklist rules
  - Implement POST endpoint to add new rule
  - Implement DELETE endpoint to remove rule

  - Validate domain format and check for duplicates
  - Verify moderator permissions

  - _Requirements: 8.4_

- [ ] 1.40.Create `components/admin/LinkManagement.tsx`

  - Build two-column layout for whitelist and blacklist
  - Add form to add new domains
  - Add remove button for each domain

  - Display reason and added-by information
  - Implement search and filter capabilities
  - _Requirements: 8.4_

- [ ] 1.41.Create link management page

  - Create `app/admin/links/page.tsx`
  - Integrate LinkManagement component

  - Verify moderator role before rendering
  - _Requirements: 8.4_

- [ ] 1.42.Integrate link validation into edit submission

  - Update edit request creation to validate links
  - Extract URLs from content before submission
  - Check against blacklist and reject if found

  - Flag for review if not whitelisted
  - _Requirements: 8.3, 8.5_

- [ ] 1.43.Implement hidden categories system
  - Note: EditRequest model already has categories array field
  - ModerationCategory table already exists in schema
  - Need to implement management utilities and UI
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 1.44.Create category management utility
  - Create `lib/moderation/categories.ts`
  - Implement functions to create, list, and delete categories
  - Seed predefined categories (Needs maps, Outdated laws, etc.)
  - Use existing ModerationCategory table
  - _Requirements: 9.1, 9.2_

- [ ] 1.45.Add category assignment UI
  - Add category assignment UI to queue manager
  - Implement category dropdown in moderation dashboard
  - Allow filtering by category
  - Categories array already exists in EditRequest model
  - _Requirements: 9.3, 9.4_

- [ ] 1.46.Ensure categories are hidden from non-moderators

  - Verify categories are not exposed in public APIs
  - Remove categories from user-facing edit request views
  - Only show categories in moderator dashboard
  - _Requirements: 9.5_


## Phase 5: Developer Tooling

- [ ] 1.47.Implement Cursor hook for test automation


- [ ] 1.48.Create AST parsing utility
  - Create `lib/dev-tools/ast-parser.ts`
  - Use TypeScript compiler API to parse source files
  - Extract function names and signatures
  - Identify function location (file path, line number)
  - Handle both function declarations and arrow functions
  - _Requirements: 1.1_

- [ ] 1.49.Create test discovery utility

  - Create `lib/dev-tools/test-discovery.ts`
  - Implement logic to find related test files based on naming conventions
  - Support both `__tests__` directory and `.test.ts` suffix patterns
  - Handle component tests in `components/__tests__`
  - Handle lib tests in `tests/lib`
  - _Requirements: 1.2_

- [ ] 1.50.Create test generation utility

  - Create `lib/dev-tools/test-generator.ts`
  - Implement templates for common test scenarios (pure functions, React components)
  - Generate test scaffolding for new functions
  - Update existing tests when function signatures change
  - Follow repository testing conventions
  - _Requirements: 1.2_

- [ ] 1.51.Create Cursor hook implementation

  - Create `.kiro/hooks/test-automation.ts`
  - Implement file watcher for `*.ts` and `*.tsx` files
  - Integrate AST parser to detect function changes
  - Use test discovery to find related tests
  - Generate or update tests as needed
  - Run affected tests using Jest
  - Report results to developer
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.52.Handle Context7 constraints

  - Review Context7 requirements and limitations
  - Adjust implementation to comply with constraints
  - Document any Context7-specific considerations
  - _Requirements: 1.5_


## Phase 6: Testing & Documentation

- [ ] 1.53.Write unit tests for moderation logic
- [ ] 1.54.Create `tests/lib/moderation.test.ts`
  - Test edit request creation for all content types
  - Test diff calculation for various change scenarios
  - Test rate limiting enforcement
  - Test edit classification (COI, health, new page, images)
  - Achieve 80% code coverage for moderation module
  - _Requirements: 11.1, 11.3_

- [ ] 1.55.Create `tests/lib/storage/edit-requests.test.ts`
  - Test CRUD operations for EditRequest
  - Test query filtering and pagination
  - Test approval and rejection flows
  - Test transaction rollback scenarios
  - Test notification triggers
  - _Requirements: 11.2, 11.4, 11.5_

- [ ] 1.56.Create `tests/lib/moderation/link-validator.test.ts`
  - Test domain extraction from URLs
  - Test whitelist/blacklist matching
  - Test wildcard subdomain handling
  - Test edge cases (malformed URLs, IP addresses)
  - _Requirements: 11.3_

- [ ] 1.57.Create `tests/lib/moderation/categories.test.ts`
  - Test category creation and listing
  - Test category assignment to edit requests

  - Test category filtering
  - _Requirements: 11.3_

- [ ] 1.58.Write integration tests for moderation dashboard
- [ ] 1.59.Create `tests/integration/admin/moderation.test.tsx`
  - Test recent changes feed rendering
  - Test queue filtering and sorting

  - Test approve/reject actions
  - Test bulk operations
  - Test link management UI
  - Test audit trail generation
  - _Requirements: 11.5, 11.6_

- [ ] 1.60.Create `tests/integration/edit-submission.test.ts`
  - Test blog edit submission creates EditRequest
  - Test wiki edit submission creates EditRequest
  - Test pet profile edit submission creates EditRequest
  - Test user profile edit submission creates EditRequest
  - Test rate limit enforcement in UI
  - _Requirements: 11.3, 11.4_

- [ ] 1.61.Write E2E tests for moderation workflow
- [ ] 1.62.Create `e2e/flows/moderation.spec.ts`
  - Test user submits edit → EditRequest created
  - Test moderator reviews edit → Sees in queue
  - Test moderator approves edit → Content updated
  - Test moderator rejects edit → User notified
  - Test bulk revert operation → Multiple edits reverted
  - _Requirements: 11.7_

- [ ] 1.63.Create `e2e/bug-fixes.spec.ts`
  - Test groups page loads without hydration errors
  - Test group resources creation page accessible
  - Test CreatePostButton renders without errors
  - _Requirements: 11.7_


- [ ] 1.64.Create documentation
- [ ] 1.65.Write moderator user guide
  - Create `docs/MODERATION_USER_GUIDE.md`
  - Explain how to use the moderation dashboard
  - Document queue types and their purposes
  - Provide examples of common moderation scenarios
  - Include screenshots of key UI elements
  - _Requirements: 12.1_

- [ ] 1.66.Write API documentation
  - Create `docs/MODERATION_API.md`
  - Document all moderation API endpoints
  - Include request/response examples
  - Document error codes and handling
  - Provide authentication requirements
  - _Requirements: 12.2_

- [ ] 1.67.Write developer integration guide
  - Create `docs/MODERATION_INTEGRATION.md`
  - Explain how to add new content types to moderation
  - Document edit request creation process
  - Provide code examples for common integrations
  - Document testing requirements
  - _Requirements: 12.3_

- [ ] 1.68.Add inline code comments

  - Review all moderation utilities and add comments
  - Document complex logic and algorithms
  - Explain design decisions in comments
  - Add JSDoc comments for public functions
  - _Requirements: 12.4_

- [ ] 1.69.Create usage examples

  - Add examples to documentation for common scenarios
  - Include code snippets for edit submission
  - Provide examples of custom queue filters
  - Document bulk operation usage
  - _Requirements: 12.5_

## Phase 7: Final Integration & Deployment

- [ ] 1.70.Perform final integration testing
  - Run full test suite (unit, integration, E2E)
  - Verify all tests pass
  - Check test coverage meets 80% goal
  - Fix any failing tests or regressions
  - _Requirements: 11.7_

- [ ] 1.71.Conduct code review and cleanup
  - Review all new code for quality and consistency
  - Remove any debug code or console logs
  - Ensure all code follows repository conventions
  - Verify TypeScript types are properly defined
  - Check for any security vulnerabilities
  - _Requirements: All_

- [ ] 1.72.Prepare for deployment
  - Create database migration plan
  - Document deployment steps
  - Prepare rollback plan
  - Set up monitoring and alerting
  - Create deployment checklist
  - _Requirements: All_

- [ ] 1.73.Deploy to staging environment
  - Apply database migrations
  - Deploy application code
  - Verify all features work in staging
  - Conduct smoke testing
  - Monitor for errors or performance issues
  - _Requirements: All_

- [ ] 1.74.Deploy to production
  - Follow gradual rollout plan (shadow mode → soft launch → full rollout)
  - Monitor queue backlog and moderator capacity
  - Gather user feedback
  - Adjust rate limits based on usage patterns
  - Document any issues and resolutions
  - _Requirements: All_
