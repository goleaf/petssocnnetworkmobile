# Social Graph Features Implementation

## Overview

This document describes the implementation of social graph features including follow suggestions, mutes, blocks, close friends, and contact import functionality.

## Features Implemented

### 1. Follow Suggestions (`getFollowSuggestions()`)

**Endpoint**: `GET /api/social/get-follow-suggestions?userId={userId}`

**Features**:
- **Mutual connections**: Suggests users based on shared followers/following
- **Group overlap**: Suggests users who are members of the same groups
- **Co-commenters**: Suggests users who have commented on the same posts
- Combines with existing friend suggestion logic (location, interests, pets, etc.)

**Scoring**:
- Mutual connections: +15 base + 3 per mutual
- Group overlap: +12 base + 4 per shared group
- Co-commenters: +10 base + 2 per shared post (max 20)
- Plus existing friend suggestion scores

**Filters**:
- Excludes users already being followed
- Excludes blocked users (bidirectional)
- Excludes muted users
- Excludes users who blocked/muted the current user
- Respects privacy settings (searchable)

### 2. Mute User (`muteUser()`)

**Endpoint**: `POST /api/social/mute-user`

**Request Body**:
```json
{
  "userId": "string",
  "targetUserId": "string",
  "action": "mute" | "unmute"
}
```

**Behavior**:
- Soft block: User's content is hidden from muted user
- One-way: Muting someone doesn't affect their ability to see your content
- Doesn't unfollow users (unlike blocking)
- Can be undone with `unmute` action

**Storage**: `user.mutedUsers: string[]`

### 3. Block User (`blockUser()`)

**Endpoint**: `POST /api/social/block-user`

**Request Body**:
```json
{
  "userId": "string",
  "targetUserId": "string",
  "action": "block" | "unblock"
}
```

**Behavior**:
- Hard block: Bidirectional content hiding
- Automatically unfollows both ways
- Removes mutual interactions (likes, reactions, comments)
- Can be undone with `unblock` action

**Storage**: `user.blockedUsers: string[]`

### 4. Close Friends (`setCloseFriends()`)

**Endpoint**: `POST /api/social/set-close-friends`

**Request Body**:
```json
{
  "userId": "string",
  "closeFriendIds": ["string"]
}
```

**Use Case**: Post visibility control
- Posts can be set to "close-friends" privacy
- Only users in close friends list can see these posts
- Used for more intimate sharing

**Storage**: `user.closeFriends: string[]`

### 5. Import Contacts (`importContacts()`)

**Endpoint**: `POST /api/social/import-contacts`

**Request Body**:
```json
{
  "userId": "string",
  "contacts": [
    {
      "email": "string (optional)",
      "phone": "string (optional)",
      "name": "string (optional)"
    }
  ]
}
```

**Behavior**:
- Matches contacts by email or phone number
- Returns matched users and suggestions
- Filters out already-followed, blocked, or muted users
- Optional feature for discovering friends

**Response**:
```json
{
  "success": true,
  "imported": 5,
  "totalContacts": 10,
  "suggestions": [
    {
      "user": { ... },
      "reason": "Found John Doe (from contacts)"
    }
  ]
}
```

## Storage Functions

### New Functions in `lib/storage.ts`:

1. **`muteUser(userId, muteUserId)`**: Add user to muted list
2. **`unmuteUser(userId, unmuteUserId)`**: Remove user from muted list
3. **`setCloseFriends(userId, closeFriendIds)`**: Set close friends list
4. **`importContacts(userId, contacts)`**: Import and match contacts

### Updated Functions:

- **`blockUser()`**: Now uses `normalizeUser()` for consistency
- **`unblockUser()`**: Now uses `normalizeUser()` for consistency

## Utility Functions

### New File: `lib/social-graph.ts`

1. **`getEffectiveFollowerCount(userId)`**: Count followers excluding blocked/muted
2. **`getEffectiveFollowingCount(userId)`**: Count following excluding blocked/muted
3. **`canUserSeeContent(viewerId, authorId)`**: Check visibility based on blocks/mutes
4. **`getCloseFriends(userId)`**: Get close friends User objects
5. **`isCloseFriend(userId, friendId)`**: Check if user is in close friends list
6. **`canViewPost(viewerId, authorId, privacy)`**: Check post visibility including close-friends privacy

## Type Updates

### Updated `lib/types.ts`:

```typescript
export interface User {
  // ... existing fields
  blockedUsers?: string[] // Existing
  mutedUsers?: string[] // NEW: Soft block list
  closeFriends?: string[] // NEW: Close friends list
}
```

## Privacy Levels

Posts now support:
- `"public"`: Everyone can see
- `"private"`: Only author
- `"followers-only"`: Only followers
- `"close-friends"`: Only close friends list (NEW)

## Usage Examples

### Get Follow Suggestions

```typescript
const response = await fetch(
  `/api/social/get-follow-suggestions?userId=${currentUserId}`
)
const { suggestions } = await response.json()
// suggestions: [{ user, score, reasons, mutualCount, sharedGroups, coCommentCount }]
```

### Mute a User

```typescript
await fetch("/api/social/mute-user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: currentUserId,
    targetUserId: userIdToMute,
    action: "mute"
  })
})
```

### Set Close Friends

```typescript
await fetch("/api/social/set-close-friends", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: currentUserId,
    closeFriendIds: [friendId1, friendId2, friendId3]
  })
})
```

### Import Contacts

```typescript
const contacts = [
  { email: "friend@example.com", name: "Friend Name" },
  { phone: "+1234567890", name: "Another Friend" }
]

const response = await fetch("/api/social/import-contacts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: currentUserId,
    contacts
  })
})

const { suggestions } = await response.json()
```

## Testing

Test file created: `app/api/social/__tests__/get-follow-suggestions.test.ts`

To run tests:
```bash
pnpm test app/api/social
```

## Notes

- All functions use localStorage for persistence (client-side only)
- Mutes are one-way (you don't see their content, but they can see yours)
- Blocks are bidirectional (neither sees the other's content)
- Close friends list is used for post privacy settings
- Contact import is optional and requires user consent
- All endpoints validate input and return appropriate error messages

## Next Steps

1. Create UI components for:
   - Follow suggestions display
   - Mute/block management interface
   - Close friends selector
   - Contact import flow

2. Update existing components to:
   - Use effective follower/following counts
   - Respect mute/block settings
   - Support "close-friends" privacy level

3. Add tests for:
   - All API endpoints
   - Storage functions
   - Utility functions

