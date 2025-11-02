# Server-Enforced Role-Based Access Control Implementation

## Overview

This document describes the implementation of server-enforced authentication and role-based access control (RBAC) that replaces the previous client-only Zustand authentication system.

## Architecture

### Components

1. **Server-Side Auth (`lib/auth-server.ts`)**
   - Session management with secure HTTP-only cookies
   - User authentication verification
   - Role-based access control helpers
   - Session token generation and validation

2. **Server Actions (`lib/actions/auth.ts`)**
   - `loginAction` - Authenticate user and create session
   - `logoutAction` - Clear session and redirect
   - `registerAction` - Create new user account
   - `getCurrentUserAction` - Get current authenticated user
   - Additional actions for onboarding, magic links, and 2FA

3. **Middleware (`middleware.ts`)**
   - Route protection based on authentication status
   - Role-based route access control
   - Automatic redirects for unauthenticated users
   - Session validation on every request

4. **Client-Side Auth Store (`lib/auth.ts`)**
   - Zustand store that syncs with server sessions
   - Fetches session from `/api/auth/session` on initialization
   - Provides client-side auth state for UI components
   - No longer stores authentication state locally (server is source of truth)

5. **Server-Safe Storage (`lib/storage-server.ts`)**
   - Server-side storage helpers that work without localStorage
   - Provides user lookup functions for server actions
   - Uses in-memory cache (replace with database in production)

## Session Management

### Session Cookie
- **Name**: `pet-social-session`
- **Max Age**: 7 days
- **HttpOnly**: Yes (prevents XSS attacks)
- **Secure**: Yes (in production)
- **SameSite**: Lax

### Session Token Format
Session tokens are base64-encoded JSON containing:
```typescript
{
  userId: string
  username: string
  role: UserRole
  expiresAt: number
}
```

**Note**: In production, consider using JWT tokens or a proper session store (Redis/database) instead of base64-encoded JSON.

## Route Protection

### Protected Routes
Routes are protected via middleware configuration in `middleware.ts`:

- **Auth Required**: `/dashboard`, `/messages`, `/settings`, `/blog/create`, etc.
- **Role Required**: `/admin/*` (admin/moderator only)
- **Public**: `/`, `/feed`, `/blog`, `/wiki`, `/search`

### Middleware Flow
1. Check if route requires authentication
2. Validate session cookie
3. Check role requirements if specified
4. Redirect to login if authentication fails
5. Redirect with error if role check fails

## Usage Examples

### Server Components / Server Actions

```typescript
import { getCurrentUser, requireAuth, requireAdmin } from "@/lib/auth-server"

// Get current user (returns null if not authenticated)
const user = await getCurrentUser()

// Require authentication (throws if not authenticated)
const user = await requireAuth()

// Require admin role (throws if not admin)
const user = await requireAdmin()
```

### Client Components

```typescript
"use client"
import { useAuth } from "@/lib/auth"

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>
  
  return <div>Hello, {user?.username}</div>
}
```

### Protected API Routes

```typescript
import { getCurrentUser } from "@/lib/auth-server"
import { NextResponse } from "next/server"

export async function GET() {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Handle authenticated request
  return NextResponse.json({ data: "..." })
}
```

## Migration Notes

### Breaking Changes

1. **Client-only auth removed**: The Zustand store no longer manages authentication state locally. All auth operations go through server actions.

2. **Session required**: Users must have a valid server session to access protected routes. Client-side state alone is not sufficient.

3. **Server actions required**: Login/logout/register must use server actions (`loginAction`, `logoutAction`, `registerAction`).

### Migration Checklist

- [x] Created server-side auth utilities
- [x] Created server actions for auth operations
- [x] Created middleware for route protection
- [x] Updated client-side auth store to sync with server
- [x] Updated login/register forms to use server actions
- [x] Created server-safe storage helpers
- [ ] Update all protected pages to use server-side auth checks
- [ ] Update API routes to use server-side auth
- [ ] Test authentication flow end-to-end
- [ ] Test role-based access control
- [ ] Update tests to work with server-side auth

## Security Considerations

1. **Session Tokens**: Currently using base64-encoded JSON. In production, use JWT with proper signing or a session store.

2. **Password Storage**: Passwords are stored in plain text in mock data. In production, use bcrypt or similar for password hashing.

3. **Session Expiration**: Sessions expire after 7 days. Consider implementing refresh tokens for longer sessions.

4. **CSRF Protection**: Consider adding CSRF tokens for state-changing operations.

5. **Rate Limiting**: Implement rate limiting for login/register endpoints to prevent brute force attacks.

## Production Recommendations

1. **Database**: Replace in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)

2. **Session Store**: Use Redis or database-backed session store instead of cookies-only sessions

3. **Password Hashing**: Implement bcrypt or Argon2 for password hashing

4. **JWT Tokens**: Use properly signed JWT tokens instead of base64 JSON

5. **Email Service**: Implement email sending for magic links and password resets

6. **2FA**: Implement proper TOTP verification using libraries like `speakeasy`

7. **Audit Logging**: Add audit logs for authentication events

8. **Session Management**: Add session revocation and device management

## Testing

Run tests to verify the implementation:

```bash
pnpm test
```

Key test areas:
- Session creation and validation
- Route protection
- Role-based access control
- Login/logout flows
- Registration flow

