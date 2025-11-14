# Moderation Rate Limiting

This module provides rate limiting functionality for edit submissions in the moderation system.

## Features

- **Hourly Limit**: 10 edits per hour per user
- **Daily Limit**: 50 edits per day per user
- **Clear Error Messages**: User-friendly messages with retry timing
- **Independent Tracking**: Each user is tracked separately

## Usage

### Checking Rate Limits

```typescript
import { checkEditSubmissionRateLimit } from '@/lib/server-rate-limit'

// Check if user can submit an edit
const result = checkEditSubmissionRateLimit(userId)

if (!result.allowed) {
  // User has exceeded rate limit
  console.log(`Rate limit exceeded. Retry in ${result.retryAfterMs}ms`)
  console.log(`Remaining edits: ${result.remaining}`)
}
```

### Generating Error Messages

```typescript
import { 
  createRateLimitErrorResponse,
  getRateLimitErrorMessage 
} from '@/lib/moderation/rate-limit-errors'

// For API responses
const errorResponse = createRateLimitErrorResponse(result.retryAfterMs, true)
// Returns:
// {
//   error: "You have exceeded the hourly edit limit of 10 edits. Please try again in 45 minutes.",
//   code: "RATE_LIMIT_EXCEEDED",
//   retryAfterMs: 2700000,
//   retryAfter: "45 minutes"
// }

// For simple messages
const message = getRateLimitErrorMessage(result.retryAfterMs, false)
// Returns: "You have exceeded the daily edit limit of 50 edits. Please try again in 12 hours."
```

### Example API Route Implementation

```typescript
import { checkEditSubmissionRateLimit } from '@/lib/server-rate-limit'
import { createRateLimitErrorResponse } from '@/lib/moderation/rate-limit-errors'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const userId = await getUserId(request) // Your auth logic
  
  // Check rate limit
  const rateLimit = checkEditSubmissionRateLimit(userId)
  
  if (!rateLimit.allowed) {
    const isHourly = rateLimit.retryAfterMs <= 3600000
    const errorResponse = createRateLimitErrorResponse(rateLimit.retryAfterMs, isHourly)
    
    return NextResponse.json(errorResponse, { 
      status: 429,
      headers: {
        'Retry-After': Math.ceil(rateLimit.retryAfterMs / 1000).toString()
      }
    })
  }
  
  // Process the edit submission
  // ...
}
```

## Rate Limit Details

### Hourly Limit
- **Limit**: 10 edits per hour
- **Window**: Rolling 1-hour window
- **Scope**: Per user

### Daily Limit
- **Limit**: 50 edits per day
- **Window**: Rolling 24-hour window
- **Scope**: Per user

### Enforcement
Both limits are enforced simultaneously. The hourly limit will typically trigger first for users making many consecutive edits.

## Testing

```typescript
import { 
  checkEditSubmissionRateLimit,
  resetEditSubmissionRateLimit 
} from '@/lib/server-rate-limit'

// Reset rate limits between tests
afterEach(() => {
  resetEditSubmissionRateLimit()
})

// Test rate limiting
it('enforces hourly limit', () => {
  const userId = 'test-user'
  
  // Make 10 edits
  for (let i = 0; i < 10; i++) {
    const result = checkEditSubmissionRateLimit(userId)
    expect(result.allowed).toBe(true)
  }
  
  // 11th edit should be blocked
  const result = checkEditSubmissionRateLimit(userId)
  expect(result.allowed).toBe(false)
})
```

## Error Response Format

All rate limit errors follow this structure:

```typescript
interface RateLimitErrorResponse {
  error: string           // Human-readable error message
  code: string            // "RATE_LIMIT_EXCEEDED"
  retryAfterMs: number    // Milliseconds until retry allowed
  retryAfter: string      // Human-readable retry time
}
```

## Implementation Notes

- Rate limits are stored in-memory using Map structures
- Limits automatically reset after the time window expires
- Each user is tracked independently by their user ID
- The system tracks both hourly and daily limits simultaneously
- When a limit is exceeded, the response includes the time until the next allowed edit
