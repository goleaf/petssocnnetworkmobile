# Audit Log System

A resilient audit logging system for tracking all admin actions in the application.

## Features

- **Generic audit logging**: Track any admin action with a single function
- **Automatic fallback queue**: If database write fails, entries are queued for retry
- **Timestamp preservation**: Queued entries preserve their original timestamp
- **Comprehensive querying**: Search by actor, target, action, or date range

## Usage

### Basic Usage

```typescript
import { writeAudit } from '@/lib/audit';

// Log an admin action
const result = await writeAudit({
  actorId: 'user_123',
  action: 'approve',
  targetType: 'blog_post',
  targetId: 'post_456',
  reason: 'Verified content meets guidelines',
  metadata: { autoApproved: false }
});

if (result.success) {
  if (result.queued) {
    console.log('Audit entry queued for later processing');
  } else {
    console.log('Audit entry logged successfully');
  }
}
```

### Parameters

- `actorId` (required): User/admin ID who performed the action
- `action` (required): Action type (e.g., "create", "update", "delete", "approve", "reject")
- `targetType` (required): Type of entity affected (e.g., "blog_post", "article", "user", "place")
- `targetId` (required): ID of the affected entity
- `reason` (optional): Reason for the action
- `metadata` (optional): Additional context as JSON object

### Querying Audit Logs

```typescript
import {
  getAuditLogsByActor,
  getAuditLogsByTarget,
  getAuditLogsByAction,
  searchAuditLogs
} from '@/lib/audit';

// Get all actions by a specific admin
const adminActions = await getAuditLogsByActor('user_123', 50);

// Get all actions affecting a specific entity
const entityHistory = await getAuditLogsByTarget('blog_post', 'post_456');

// Get all actions of a specific type
const approvals = await getAuditLogsByAction('approve');

// Advanced search with filters
const results = await searchAuditLogs({
  actorId: 'user_123',
  action: 'delete',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
}, 100);
```

### Processing Queued Entries

If the database was unavailable and entries were queued, process them periodically:

```typescript
import { processAuditQueue } from '@/lib/audit';

// Process queued entries (call this periodically via cron or background worker)
const processedCount = await processAuditQueue();
console.log(`Processed ${processedCount} queued audit entries`);
```

## Database Schema

### audit_logs Table

- `id`: Unique identifier (UUID)
- `actorId`: User/admin who performed the action
- `action`: Action type
- `targetType`: Type of entity affected
- `targetId`: ID of the affected entity
- `reason`: Optional reason for the action
- `metadata`: Additional context (JSONB)
- `createdAt`: Timestamp of the action

### audit_queue Table

Fallback queue table with same structure plus:
- `attempts`: Number of retry attempts
- `lastAttempt`: Timestamp of last retry attempt

## Migration

Run the migration to create the audit tables:

```bash
# If using Prisma migrations
npx prisma migrate dev --name add_audit_logs

# Or run the SQL migration directly
psql $DATABASE_URL < prisma/migrations/003_audit_logs.sql
```

## Examples

### Approving a Blog Post

```typescript
await writeAudit({
  actorId: currentUser.id,
  action: 'approve',
  targetType: 'blog_post',
  targetId: postId,
  reason: 'Content reviewed and verified',
  metadata: { reviewer: currentUser.name }
});
```

### Deleting Content

```typescript
await writeAudit({
  actorId: currentUser.id,
  action: 'delete',
  targetType: 'article',
  targetId: articleId,
  reason: 'Violates community guidelines',
  metadata: { 
    violationType: 'spam',
    reportedBy: ['user_1', 'user_2']
  }
});
```

### Updating User Permissions

```typescript
await writeAudit({
  actorId: adminUser.id,
  action: 'update',
  targetType: 'user',
  targetId: userId,
  reason: 'Promoted to moderator',
  metadata: { 
    previousRole: 'user',
    newRole: 'moderator'
  }
});
```

## Resilience

The audit system is designed to be resilient:

1. **Primary write**: Attempts to write directly to `audit_logs` table
2. **Fallback queue**: If primary write fails, entries are queued in `audit_queue`
3. **Automatic retry**: Queued entries are processed when database is available
4. **Max attempts**: Entries exceeding max attempts (5) are automatically cleaned up

This ensures audit logs are never lost, even during database outages.

