# Admin System Setup Guide

This document explains how to set up and use the admin system for the Pet Social Network.

## Overview

The admin system provides:
- **Dashboard**: Overview of platform KPIs and metrics
- **Moderation**: Reports inbox and content queues
- **Wiki Governance**: Flagged revisions review and approval
- **Users & Roles**: User directory and role management
- **Analytics**: Platform analytics (coming soon)
- **Feature Flags**: Feature toggle management (coming soon)
- **Operations**: System health monitoring (coming soon)

## Prerequisites

1. **Database Setup**: Run Prisma migrations to create admin tables
2. **Environment Variables**: Configure admin dev user (optional, for development)

## Setup Steps

### 1. Database Migration

If using Prisma, run migrations to create the admin tables:

```bash
npx prisma generate
npx prisma migrate dev --name add_admin_models
```

The following models will be created:
- `AuditLog` - Immutable audit trail
- `ModerationReport` - User reports on content
- `ModerationAction` - Actions taken on reports
- `ExpertProfile` - Expert verification profiles
- `FlaggedRevision` - Wiki revisions flagged for review

### 2. Environment Variables

Add to `.env.local` for development:

```bash
# Optional: Dev admin user for testing
# Format: ADMIN_DEV_USER=user-id,email@example.com,Admin|Moderator
ADMIN_DEV_USER=dev-uid,admin@example.com,Admin|Moderator
```

**Note**: In production, use your actual authentication system. The admin system integrates with the existing `getCurrentUser()` from `lib/auth-server.ts`.

### 3. Access Admin Panel

Navigate to `/admin` in your browser. You'll be redirected to login if not authenticated.

**Required Roles**:
- `Admin` - Full access
- `Moderator` - Moderation and wiki review
- `ContentManager` - Content management (limited)

## Admin Routes

### Dashboard
- **URL**: `/admin`
- **Description**: Overview of platform KPIs
- **Access**: Admin, Moderator, ContentManager

### Moderation Reports
- **URL**: `/admin/moderation/reports`
- **Description**: Review and act on user reports
- **Access**: Admin, Moderator
- **Actions**: Approve, Reject, Warn, Mute, Suspend

### Moderation Queues
- **URL**: `/admin/moderation/queues`
- **Description**: Content queues for different types
- **Access**: Admin, Moderator
- **Status**: Placeholder (to be implemented)

### Wiki Revisions
- **URL**: `/admin/wiki/revisions`
- **Description**: Review flagged wiki revisions
- **Access**: Admin, Moderator, Expert
- **Actions**: Approve, Request Changes

### Users & Roles
- **URL**: `/admin/users`
- **Description**: User directory with role display
- **Access**: Admin, Moderator, ContentManager

### Analytics
- **URL**: `/admin/analytics`
- **Description**: Platform analytics (coming soon)
- **Access**: Admin, Moderator

### Feature Flags
- **URL**: `/admin/settings/flags`
- **Description**: Feature flag management (coming soon)
- **Access**: Admin

### Operations
- **URL**: `/admin/settings/ops`
- **Description**: System operations dashboard (coming soon)
- **Access**: Admin

## API Endpoints

### Reports

#### List Reports
```
GET /api/admin/moderation/reports?status=open
```

#### Create Report
```
POST /api/admin/moderation/reports
Body: { reporterId, subjectType, subjectId, reason }
```

#### Act on Report
```
POST /api/admin/moderation/reports/[id]/action
Body: { action: 'approve'|'reject'|'warn'|'mute'|'suspend', reason?: string }
```

### Wiki Revisions

#### Approve Revision
```
POST /api/admin/wiki/revisions/[id]/approve
```

#### Request Changes
```
POST /api/admin/wiki/revisions/[id]/request-changes
Body: { comment: string }
```

## Role Mapping

The admin system uses extended roles (`Admin`, `Moderator`, `Expert`, `ContentManager`, `OrgRep`) that map to your existing `UserRole` types:

- `admin` → `['Admin']`
- `moderator` → `['Moderator']`
- `user` → `[]`

This mapping happens in `lib/auth/session.ts`.

## Testing

### Manual Testing

1. **Access Admin Panel**:
   - Login as an admin user
   - Navigate to `/admin`
   - Verify dashboard loads

2. **Create a Report**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/moderation/reports \
     -H "Content-Type: application/json" \
     -d '{
       "reporterId": "user-123",
       "subjectType": "post",
       "subjectId": "post-456",
       "reason": "Spam content"
     }'
   ```

3. **Review Reports**:
   - Navigate to `/admin/moderation/reports`
   - Verify report appears in table
   - Click "Review" to see details

4. **Act on Report**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/moderation/reports/[id]/action \
     -H "Content-Type: application/json" \
     -d '{
       "action": "approve",
       "reason": "Reviewed and approved"
     }'
   ```

### Automated Tests

Run the test suite:

```bash
pnpm test __tests__/lib/auth/roles.test.ts
```

## Troubleshooting

### "Forbidden" Error

- Check that your user has the required role (`admin` or `moderator`)
- Verify session is valid (check cookies)
- Ensure `getCurrentUser()` returns a user with proper role

### Database Errors

- Ensure Prisma migrations have been run
- Check `DATABASE_URL` in `.env.local`
- Verify Prisma client is generated: `npx prisma generate`

### Pages Not Loading

- Check that route group `(admin)` is properly configured
- Verify `app/(admin)/admin/layout.tsx` exists
- Ensure `RequireRole` component is working correctly

## Next Steps

1. **Wire KPIs to Database**: Update `lib/admin/kpis.ts` to query actual data
2. **Implement Content Queues**: Add functionality to moderation queues page
3. **Add Analytics**: Implement analytics dashboard
4. **Feature Flags**: Add feature flag management system
5. **Expand Tests**: Add more comprehensive test coverage

## Security Notes

- All admin routes are protected by `RequireRole` component
- API endpoints check roles server-side
- Audit logs are written for all admin actions
- CSRF tokens are generated for admin session API

## Support

For issues or questions, refer to:
- `PROJECT_ANALYSIS.md` - Project overview
- `TODO.md` - Task list and priorities
- Code comments in admin components

