# Groups & Forums System - Design Document

## Overview

This design document outlines the comprehensive Groups & Forums System for the pet social platform. The system enables users to create, discover, join, and participate in vibrant communities with advanced features including events, challenges, analytics, moderation tools, and monetization.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Next.js App Router + React Components)                    │
│  - app/api/groups/* (REST API endpoints)                    │
│  - components/groups/* (UI components)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  - lib/actions/groups.ts (Server Actions)                   │
│  - lib/groups-service.ts (Business logic)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                     Data Access Layer                        │
│  - lib/server/groups-repository.ts (Database operations)    │
│  - lib/prisma.ts (Prisma Client)                           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                     Database Layer                           │
│  PostgreSQL + Prisma ORM                                    │
│  - groups, group_memberships, group_posts, etc.            │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

**Decision 1: Comprehensive Database Schema**
- **Rationale**: Support all features from basic groups to advanced gamification
- **Impact**: 20+ tables covering groups, memberships, posts, events, challenges, achievements, wiki, subscriptions
- **Benefit**: Scalable foundation for community features

**Decision 2: REST API + Server Actions Hybrid**
- **Rationale**: REST for queries, Server Actions for mutations
- **Implementation**: GET endpoints for data fetching, Server Actions for state changes
- **Benefit**: Type-safe mutations with progressive enhancement

**Decision 3: Real-Time WebSocket Integration**
- **Rationale**: Immediate updates for group activity
- **Implementation**: Channel-based subscriptions for groups, events, moderation
- **Benefit**: Live engagement and instant notifications

**Decision 4: Caching Strategy**
- **Rationale**: Performance at scale with frequent reads
- **Implementation**: Redis for hot data, incremental updates, TTL-based invalidation
- **Benefit**: Sub-second response times for large groups

## Database Schema

### Core Group Tables


```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  name_lowercase VARCHAR(100) UNIQUE NOT NULL,
  tagline VARCHAR(500),
  description TEXT,
  rules TEXT,
  
  -- Categorization
  primary_category VARCHAR(50) NOT NULL,
  tags TEXT[],
  
  -- Appearance
  icon_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  color_theme VARCHAR(7),
  
  -- Privacy
  group_type VARCHAR(20) DEFAULT 'public',
  content_visibility VARCHAR(20) DEFAULT 'members',
  member_list_visibility VARCHAR(20) DEFAULT 'members',
  
  -- Join settings
  join_approval VARCHAR(20) DEFAULT 'automatic',
  who_can_invite VARCHAR(20) DEFAULT 'anyone',
  
  -- Stats (denormalized)
  members_count INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  active_members_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Settings (JSONB for flexibility)
  posting_settings JSONB DEFAULT '{"who_can_post": "all_members", "require_approval": false, "slow_mode_seconds": 0, "allowed_types": ["text", "photo", "video", "link", "poll", "event"], "max_media": 10}'::JSONB,
  moderation_settings JSONB DEFAULT '{"automod_rules": [], "warning_system": "enabled", "public_mod_log": false}'::JSONB,
  event_settings JSONB DEFAULT '{"enabled": true, "who_can_create": "all_members", "require_approval": false}'::JSONB,
  
  INDEX idx_groups_category(primary_category),
  INDEX idx_groups_type(group_type),
  INDEX idx_groups_created(created_at DESC),
  INDEX idx_groups_members(members_count DESC),
  INDEX idx_groups_name_search(to_tsvector('english', name || ' ' || description)),
  INDEX idx_groups_tags GIN(tags)
);


CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role
  role VARCHAR(50) DEFAULT 'member',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Contribution stats
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reactions_given_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  
  -- Settings
  notification_settings JSONB DEFAULT '{"posts": true, "comments": false, "events": true, "announcements": true}'::JSONB,
  
  is_pinned BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMP,
  
  UNIQUE(group_id, user_id),
  INDEX idx_memberships_group(group_id, joined_at DESC),
  INDEX idx_memberships_user(user_id, joined_at DESC),
  INDEX idx_memberships_role(group_id, role),
  INDEX idx_memberships_active(group_id, last_active_at DESC)
);


-- Additional core tables (see full schema in requirements document)
-- group_roles, group_join_requests, group_invitations, group_posts, group_collections
-- group_events, event_rsvps, group_polls, poll_votes, group_resources
-- group_activity, group_warnings, group_bans, moderation_actions
-- group_challenges, challenge_participants, group_achievements, user_achievements
-- group_wiki_pages, wiki_page_revisions, group_analytics, group_subscriptions
```

## API Endpoints

### Group Management

**POST /api/groups** - Create group
- Accepts: JSON with all group configuration settings
- Validates: name uniqueness, category validity, privacy consistency, user permissions
- Returns: Created group object with groupId and URLs

**GET /api/groups** - Discover groups
- Query params: q, category, tags, type, size, activity, location, sort, limit, offset
- Returns: Array of groups with basic info, relevance score, preview posts, join status
- Applies: Privacy rules, personalized recommendations

**GET /api/groups/{groupId}** - Get group details
- Returns: Full group details, user's membership status, pending requests, permissions
- Applies: Access control based on privacy settings

**PUT /api/groups/{groupId}/settings** - Update settings
- Validates: Requester is admin, settings are valid
- Processes: Updates group, invalidates cache, sends notifications, logs changes

### Membership Management

**POST /api/groups/{groupId}/join** - Join/request to join
- Logic: Auto-join for public, create request for private, reject for invite-only
- Returns: Membership object or request object

**POST /api/groups/{groupId}/members/{userId}/approve** - Approve join request
- Validates: Requester is admin, request exists
- Creates: Membership record, sends notifications

**DELETE /api/groups/{groupId}/members/{userId}** - Remove member
- Validates: Permissions, cannot remove higher-ranked member
- Processes: Removes membership, decrements count, handles content

**POST /api/groups/{groupId}/members/{userId}/role** - Change role
- Validates: Admin permission, role hierarchy
- Updates: Membership role, sends notification, logs change

### Content Management

**POST /api/groups/{groupId}/posts** - Create post
- Accepts: text, mediaIds, petTags, location, collectionId, pollOptions, eventData
- Validates: Member permission, content rules, rate limits
- Processes: Creates post, applies AutoMod, broadcasts to feed

**GET /api/groups/{groupId}/posts** - Get posts
- Query params: collection, sort, limit, cursor
- Returns: Array of posts with engagement data, pinned posts at top

### Event Management

**POST /api/groups/{groupId}/events** - Create event
- Accepts: All event data (title, description, datetime, location, rsvpSettings)
- Validates: Permission, future datetime, valid location
- Creates: Event record, posts announcement, sends notifications

**POST /api/groups/{groupId}/events/{eventId}/rsvp** - RSVP to event
- Accepts: status (going/interested/cant_go), guestCount, petInfo
- Validates: Event exists, deadline not passed, capacity check
- Creates: RSVP record, updates attendance count, sends notifications

### Analytics

**GET /api/groups/{groupId}/analytics** - Get analytics
- Validates: Requester is admin/mod
- Query params: timeRange, metrics
- Returns: Member stats, engagement stats, content stats, trends

### Moderation

**POST /api/groups/{groupId}/moderate** - Perform moderation action
- Validates: Mod permission, valid action, reason provided
- Processes: Executes action, logs in mod log, sends notifications, updates violation history

## Caching Strategy

### Cache Keys and TTLs

```typescript
const CACHE_KEYS = {
  group: (id: string) => `group:${id}`,                    // TTL: 10 min
  groupMembers: (id: string) => `group:${id}:members`,     // TTL: 5 min
  userGroups: (userId: string) => `user:${userId}:groups`, // TTL: 10 min
  groupFeed: (id: string) => `group:${id}:posts:feed`,     // TTL: 2 min
  groupStats: (id: string) => `group:${id}:stats`,         // TTL: 1 hour
  modQueue: (id: string) => `group:${id}:mod_queue`,       // TTL: 1 min
};
```

### Cache Invalidation

- Group details: Invalidate on any setting update or admin/mod change
- Membership: Invalidate on join/leave/role change
- User's groups: Invalidate when user joins/leaves any group
- Posts feed: Invalidate on new post or pin/unpin action
- Stats: Update incrementally with INCR/DECR, full recalc daily
- Mod queue: Invalidate immediately when items added or resolved

## Real-Time WebSocket Events

### Group Activity Channel: `group:{groupId}`

All members subscribe when viewing group. Broadcasts:
- `new_post` - New post published (includes post object)
- `post_pinned` - Post pinned to top
- `new_event` - Event created
- `member_joined` - New member (shows welcome notification)
- `announcement` - Admin announcement (priority notification)

### Moderation Channel: `group:{groupId}:moderation`

Admins and moderators subscribe. Broadcasts:
- `new_report` - Content reported (needs review)
- `new_join_request` - User requesting to join
- `automod_action` - AutoMod flagged content
- `appeal_submitted` - User appealed warning/ban

### Event Updates Channel: `event:{eventId}`

Event attendees subscribe. Broadcasts:
- `new_rsvp` - Someone RSVPed (updates attendee list)
- `event_updated` - Details changed (time/location)
- `check_in` - Attendee checked in

## Background Jobs

### Scheduled Jobs

1. **Daily Analytics Computation** (midnight)
   - Calculates previous day's metrics for each group
   - Stores in group_analytics table
   - Generates insights for admins

2. **Hourly Auto-Promotion** 
   - Checks members against auto-promotion criteria
   - Promotes eligible members to higher roles
   - Sends congratulations notifications

3. **Event Reminders** (hourly)
   - Finds events starting in next 1 hour → sends reminders to "going" attendees
   - Finds events starting in 24 hours → sends to all RSVPs

4. **Weekly Inactive Member Cleanup**
   - Identifies members inactive for X days
   - Sends re-engagement email
   - Optionally removes after extended inactivity

5. **Daily Recurring Event Creation** (midnight)
   - Checks for recurring events needing new instance
   - Creates next occurrence based on recurrence rule

6. **Hourly Challenge Progress Tracking**
   - Updates participant progress based on recent activity
   - Checks for completions, awards badges/points
   - Sends progress notifications

7. **Content Moderation Scan** (every 10 minutes)
   - Scans recent posts/comments for rule violations
   - Flags suspicious content for review
   - Tracks spam patterns

## Performance Optimization

### Database Indexes

```sql
-- Primary lookups
CREATE INDEX idx_groups_slug ON groups(name_lowercase);
CREATE INDEX idx_groups_owner ON groups(created_by_user_id);

-- Discovery and search
CREATE INDEX idx_groups_category ON groups(primary_category);
CREATE INDEX idx_groups_type ON groups(group_type);
CREATE INDEX idx_groups_tags ON groups USING GIN(tags);
CREATE INDEX idx_groups_search ON groups USING GIN(to_tsvector('english', name || ' ' || description));

-- Membership queries
CREATE INDEX idx_members_user ON group_memberships(user_id);
CREATE INDEX idx_members_group_status ON group_memberships(group_id, status);
CREATE INDEX idx_members_group_role ON group_memberships(group_id, role);

-- Activity queries
CREATE INDEX idx_posts_group_created ON group_posts(group_id, created_at DESC);
CREATE INDEX idx_events_group_date ON group_events(group_id, start_datetime);
```

### Query Optimization

- Use eager loading for related data (include members, posts, events in single query)
- Cursor-based pagination for large result sets
- Database aggregations instead of loading all records
- Prepared statements for frequently executed queries

## Security Considerations

### Access Control

**Group Visibility Rules:**
- Public: Discoverable, content visible to all
- Private: Discoverable, content visible to members only
- Hidden: Not discoverable, content visible to members only

**Permission Checks:**
```typescript
async function checkPermission(
  groupId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const member = await getMembership(groupId, userId);
  if (!member || member.status !== 'active') return false;
  if (member.status === 'banned') return false;
  
  // Check role-based permissions
  return hasPermission(member.role, permission);
}
```

### Rate Limiting

```typescript
const RATE_LIMITS = {
  createGroup: { max: 5, window: '1h' },
  joinGroup: { max: 20, window: '1h' },
  createPost: { max: 10, window: '1h' },
  createEvent: { max: 5, window: '1d' },
  createPoll: { max: 10, window: '1d' },
};
```

### Input Validation

- Strip HTML from user input (except allowed tags)
- Validate URLs before storing
- Sanitize file uploads
- Validate image dimensions and file sizes
- Use Zod schemas for all API inputs

## Testing Strategy

### Unit Tests
- Group creation validation
- Membership role permissions
- Join approval logic
- AutoMod rule matching
- Event RSVP capacity handling
- Challenge progress calculation

### Integration Tests
- Complete group creation flow
- Join request and approval flow
- Moderation workflow
- Event lifecycle (create, RSVP, reminders, check-ins)
- Challenge participation (join, progress, complete, reward)

### Performance Tests
- Large group with 10K members
- High-activity group with 1000 posts/day
- Concurrent moderation (multiple mods)
- Event with 500 RSVPs

### E2E Tests
- User discovers and joins group
- User participates (posts, comments, RSVPs)
- Admin moderates group
- Group reaches milestones

## Migration Strategy

### Phase 1: Schema and Repository
- Add Prisma schema models
- Create repository layer
- Write unit tests

### Phase 2: API Implementation
- Create REST endpoints
- Implement Server Actions
- Add validation and error handling

### Phase 3: Real-Time and Jobs
- Implement WebSocket channels
- Create background jobs
- Add notification integration

### Phase 4: Testing and Optimization
- Complete test suite
- Performance optimization
- Caching implementation

### Phase 5: Deployment
- Staging deployment
- Load testing
- Production rollout

## Success Criteria

- ✅ All 20 requirements implemented and tested
- ✅ API response times < 500ms (p95)
- ✅ Support 10K+ members per group
- ✅ Real-time updates with < 1s latency
- ✅ 80%+ test coverage
- ✅ Zero data loss during operations
- ✅ Comprehensive documentation

## Future Enhancements

- Advanced search with Elasticsearch
- AI-powered content recommendations
- Video streaming for events
- Multi-language support
- Mobile app integration
- Advanced analytics with ML insights
