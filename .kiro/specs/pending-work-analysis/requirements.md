# Requirements Document: Pending Work Analysis

## Introduction

This document analyzes all pending work items (TODOs) across the Pet Social Network codebase and organizes them by module. The analysis is based on existing documentation files (todo.md, docs/todo.md, tasks.md) and the PROGRESS-SUMMARY.md which tracks completed and remaining features.

## Glossary

- **System**: The Pet Social Network Mobile Application
- **Moderation Dashboard**: Admin interface for reviewing and approving content edits
- **Edit Request**: A proposed change to content (blog, wiki, pet, user profile) awaiting moderator approval
- **Cursor Hook**: An automation tool that detects function edits and updates related tests
- **Hydration Mismatch**: A React error where server-rendered HTML differs from client-rendered HTML
- **Context7**: A constraint or tool mentioned for the Cursor hook implementation
- **COI**: Conflict of Interest - edits that may have bias
- **Bulk Operations**: Actions performed on multiple items simultaneously

## Requirements

### Requirement 1: Cursor Hook Automation

**User Story:** As a developer, I want an automated hook that detects function edits and updates related tests, so that I can maintain test coverage without manual intervention.

#### Acceptance Criteria

1. WHEN a developer edits a function, THE System SHALL detect the change and identify related test files
2. WHEN related tests are identified, THE System SHALL update or prompt for test updates following repository naming conventions
3. WHEN tests are updated, THE System SHALL execute the relevant test suite automatically
4. IF test failures occur, THEN THE System SHALL report failures and attempt fixes where possible
5. WHERE Context7 usage is required, THE System SHALL adhere to Context7 constraints during implementation

### Requirement 2: Groups Page Hydration Fix

**User Story:** As a user, I want the groups page to load without errors, so that I can browse and interact with community groups.

#### Acceptance Criteria

1. WHEN a user navigates to `/groups`, THE System SHALL render the page without hydration mismatches
2. WHEN the page loads, THE System SHALL align category loading between server and client rendering
3. WHEN the fix is implemented, THE System SHALL pass local build validation
4. WHEN the fix is deployed, THE System SHALL include regression test coverage to prevent future occurrences

### Requirement 3: Group Resources Routing

**User Story:** As a group member, I want to create resources for my group, so that I can share helpful content with other members.

#### Acceptance Criteria

1. WHEN a user navigates to `/groups/[slug]/resources/create`, THE System SHALL display the resource creation page
2. WHEN the routing issue is diagnosed, THE System SHALL implement the missing page or handler
3. WHEN the fix is complete, THE System SHALL include a regression test to prevent similar routing issues
4. WHEN tests are executed, THE System SHALL pass all relevant routing tests

### Requirement 4: Moderation Infrastructure

**User Story:** As a developer, I want core moderation infrastructure in place, so that moderators can review and approve content changes.

#### Acceptance Criteria

1. THE System SHALL define TypeScript types for moderation and reviewer tools in `lib/types.ts`
2. THE System SHALL provide API routes for the recent changes feed with filtering and pagination
3. THE System SHALL provide API routes for backlog queues (new pages, flagged health, COI edits, image reviews)
4. THE System SHALL provide API routes for bulk operations (revert, range blocks)
5. THE System SHALL ensure all API routes follow repository authentication and authorization patterns

### Requirement 5: Recent Changes Feed with Diff Previews

**User Story:** As a moderator, I want to view recent changes with visual diffs, so that I can quickly review what was modified.

#### Acceptance Criteria

1. WHEN a moderator accesses the recent changes feed, THE System SHALL display a paginated list of recent edits
2. WHEN viewing an edit, THE System SHALL display a visual diff showing additions and deletions
3. WHEN the moderator applies filters, THE System SHALL update the feed to show only matching edits
4. THE System SHALL calculate diffs using the existing diff calculation logic from `lib/moderation.ts`
5. THE System SHALL support filtering by content type, status, priority, and age

### Requirement 6: Backlog Queues

**User Story:** As a moderator, I want separate queues for different types of content requiring review, so that I can prioritize my moderation work effectively.

#### Acceptance Criteria

1. THE System SHALL provide a new pages queue at `/admin/queue/new-pages` for reviewing newly created content
2. THE System SHALL provide a flagged health edits queue at `/admin/queue/flagged-health` for reviewing health-related edits
3. THE System SHALL provide a COI edits queue at `/admin/queue/coi-edits` for reviewing potential conflict of interest edits
4. THE System SHALL provide an image reviews queue at `/admin/queue/image-reviews` for reviewing uploaded images
5. WHEN viewing any queue, THE System SHALL display queue-specific management components with filtering and sorting

### Requirement 7: Bulk Operations

**User Story:** As a moderator, I want to perform actions on multiple items at once, so that I can efficiently handle abuse waves or mass reverts.

#### Acceptance Criteria

1. THE System SHALL provide bulk revert functionality to undo multiple edits simultaneously
2. THE System SHALL provide range block functionality to block multiple users or IP ranges during abuse waves
3. THE System SHALL provide API endpoints for all bulk operations with proper authorization checks
4. THE System SHALL provide a UI for selecting and executing bulk operations with confirmation dialogs
5. WHEN bulk operations are executed, THE System SHALL log all actions in the audit trail

### Requirement 8: Link Management

**User Story:** As a moderator, I want to manage allowed and blocked links, so that I can prevent spam and malicious content.

#### Acceptance Criteria

1. THE System SHALL provide a link whitelist system for pre-approved domains
2. THE System SHALL provide a link blacklist system for blocked domains
3. THE System SHALL validate links in content against whitelist and blacklist during submission
4. THE System SHALL provide a link management UI at `/admin/links` for adding and removing domains
5. THE System SHALL automatically detect and flag suspicious links in user-submitted content

### Requirement 9: Hidden Categories for Internal Triage

**User Story:** As a moderator, I want to assign internal categories to content, so that I can organize and prioritize moderation work.

#### Acceptance Criteria

1. THE System SHALL provide a category system for internal triage purposes
2. THE System SHALL support hidden categories such as "Needs maps", "Outdated laws", and custom categories
3. THE System SHALL provide a category assignment UI accessible only to moderators
4. THE System SHALL allow filtering queue items by assigned categories
5. WHEN categories are assigned, THE System SHALL not display them to non-moderator users

### Requirement 10: Edit Integration

**User Story:** As a content creator, I want my edits to be submitted for approval, so that content quality is maintained through moderation.

#### Acceptance Criteria

1. WHEN a user edits a blog post at `/blog/[id]/edit`, THE System SHALL create an edit request instead of directly updating
2. WHEN a user edits a wiki article at `/wiki/[slug]/edit`, THE System SHALL create an edit request instead of directly updating
3. WHEN a user edits a pet profile at `/user/[username]/pet/[slug]/edit`, THE System SHALL create an edit request instead of directly updating
4. WHEN a user edits their profile at `/user/[username]/edit`, THE System SHALL create an edit request instead of directly updating
5. WHEN an edit is submitted, THE System SHALL display "Edit submitted for approval" message and redirect to content page
6. WHEN a user exceeds rate limits (10 edits/hour or 50 edits/day), THE System SHALL display the rate limit reason and prevent submission

### Requirement 11: Comprehensive Testing

**User Story:** As a developer, I want comprehensive test coverage for moderation features, so that I can confidently deploy changes without regressions.

#### Acceptance Criteria

1. THE System SHALL include unit tests for edit request creation in `__tests__/lib/moderation.test.ts`
2. THE System SHALL include unit tests for storage operations (CRUD) in `__tests__/lib/storage-edit-requests.test.ts`
3. THE System SHALL include unit tests for filtering logic, pagination, and rate limiting
4. THE System SHALL include unit tests for approval flow, rejection flow, and notification triggers
5. THE System SHALL include integration tests for the moderation dashboard in `__tests__/app/admin/moderation.test.tsx`
6. THE System SHALL include tests for audit trail generation
7. WHEN tests are executed, THE System SHALL achieve minimum 80% code coverage for moderation modules

### Requirement 12: Documentation

**User Story:** As a team member, I want comprehensive documentation for moderation features, so that I can understand and use the system effectively.

#### Acceptance Criteria

1. THE System SHALL provide a user guide for moderators explaining how to use the moderation dashboard
2. THE System SHALL provide API documentation for all moderation endpoints
3. THE System SHALL provide an integration guide for developers adding new content types to moderation
4. THE System SHALL maintain inline code comments for all moderation utilities
5. THE System SHALL include usage examples in documentation for common moderation scenarios

### Requirement 13: CreatePostButton React Error Fix

**User Story:** As a user, I want the post creation button to work without errors, so that I can create new posts.

#### Acceptance Criteria

1. WHEN the CreatePostButton component is rendered, THE System SHALL not throw a React ReferenceError
2. WHEN the component uses React hooks, THE System SHALL align with React 18 import conventions
3. WHEN the build process runs, THE System SHALL complete without errors related to CreatePostButton
4. THE System SHALL ensure proper hook usage following React rules of hooks
