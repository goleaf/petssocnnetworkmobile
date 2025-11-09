import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateSession, SESSION_COOKIE_NAME } from "./lib/auth-server"
import { getServerUserByUsername } from "./lib/storage-server"
import { getServerUsernameHistory } from "./lib/server-username-history"
import type { UserRole } from "./lib/types"
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/**
 * Route protection configuration
 */
interface RouteConfig {
  requireAuth?: boolean
  allowedRoles?: UserRole[]
  redirectTo?: string
}

/**
 * Admin routes configuration using prefix matching
 * All routes under /admin require admin or moderator role
 */
const ADMIN_BASE_ROUTES = ["admin"]

/**
 * Protected routes configuration
 */
const protectedRoutes: Record<string, RouteConfig> = {
  "/dashboard": { requireAuth: true },
  "/dashboard/add-pet": { requireAuth: true },
  "/dashboard/schedule": { requireAuth: true },
  "/messages": { requireAuth: true },
  "/settings": { requireAuth: true },
  "/blog/create": { requireAuth: true },
  "/blog/drafts": { requireAuth: true },
  "/drafts": { requireAuth: true },
  "/notifications": { requireAuth: true },
  "/promote": { requireAuth: true },
  "/profile": { requireAuth: true },
  "/groups/create": { requireAuth: true },
  "/wiki/create": { requireAuth: true },
  
  // Protected routes (require authentication)
  "/blog": { requireAuth: true },
  "/groups": { requireAuth: true },
  "/wiki": { requireAuth: true },
  "/shelters": { requireAuth: true },
  "/search": { requireAuth: true },
  
  // Admin routes
  "/admin": { requireAuth: true, allowedRoles: ["admin", "moderator"] },
  "/admin/moderation": { requireAuth: true, allowedRoles: ["admin", "moderator"] },
  
  // Public routes (no auth required)
  "/": { requireAuth: false },
  "/login": { requireAuth: false },
  "/register": { requireAuth: false },
  "/feed": { requireAuth: false },
  "/explore": { requireAuth: false },
}

/**
 * Check if a path matches a protected route pattern
 */
function getRouteConfig(pathname: string): RouteConfig | null {
  // Normalize pathname - remove locale prefix if present (e.g., /en/blog -> /blog, /en -> /)
  let normalizedPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, (match, slash) => {
    return slash === '/' ? '/' : '/'
  })
  
  // Remove trailing slash except for root
  if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1)
  }
  
  // Ensure root path is exactly "/"
  if (normalizedPath === '' || normalizedPath === '/en' || normalizedPath === '/en/') {
    normalizedPath = '/'
  }
  
  // Check for admin base routes first
  for (const adminBase of ADMIN_BASE_ROUTES) {
    if (normalizedPath === `/${adminBase}` || normalizedPath.startsWith(`/${adminBase}/`)) {
      return { requireAuth: true, allowedRoles: ["admin", "moderator"] }
    }
  }
  
  // Exact match
  if (protectedRoutes[normalizedPath]) {
    return protectedRoutes[normalizedPath]
  }
  
  // Prefix match for nested routes
  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (normalizedPath.startsWith(route + "/")) {
      return config
    }
  }
  
  return null
}

/**
 * Check if path is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/")
}

// Create i18n middleware
const intlMiddleware = createIntlMiddleware(routing)

/**
 * Proxy for authentication and authorization
 */
export async function proxy(request: NextRequest) {
  // First, handle i18n routing
  const intlResponse = intlMiddleware(request)
  
  // Get the pathname after i18n processing
  // If i18n rewrote the URL, use the rewritten path
  const rewrittenPath = intlResponse?.headers.get('x-middleware-rewrite')
  const pathname = rewrittenPath 
    ? new URL(rewrittenPath, request.url).pathname
    : request.nextUrl.pathname
  
  // Skip proxy for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|css|js|woff|woff2|ttf)$/)
  ) {
    return intlResponse || NextResponse.next()
  }

  // Username redirect (migrated from legacy middleware.ts)
  // If user/profile path uses an old username that was recently changed, redirect to the new one
  try {
    const segments = pathname.split("/") // e.g., ['', 'en', 'user', 'bob', 'edit']
    const findIndex = (key: string) => segments.findIndex((s) => s === key)
    let typeIndex = findIndex("user")
    if (typeIndex === -1) typeIndex = findIndex("profile")
    if (typeIndex !== -1) {
      const usernameIndex = typeIndex + 1
      const candidate = segments[usernameIndex]
      if (candidate) {
        const existing = getServerUserByUsername(candidate)
        if (!existing) {
          const history = getServerUsernameHistory()
          const record = history
            .filter((r) => r.previousUsername.toLowerCase() === candidate.toLowerCase())
            .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0]
          if (record) {
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
            const changedAt = new Date(record.changedAt).getTime()
            if (Date.now() - changedAt <= THIRTY_DAYS_MS) {
              const newSegments = [...segments]
              newSegments[usernameIndex] = record.newUsername
              const url = new URL(request.url)
              url.pathname = newSegments.join("/") || "/"
              // Preserve existing query and add banner param
              url.searchParams.set("renamed_from", candidate)
              return NextResponse.redirect(url, 308)
            }
          }
        }
      }
    }
  } catch {
    // Best-effort; ignore errors and continue
  }

  const routeConfig = getRouteConfig(pathname)
  
  // If route is not in protected routes config, allow access
  if (!routeConfig) {
    return intlResponse || NextResponse.next()
  }

  // If route doesn't require auth, allow access
  if (!routeConfig.requireAuth) {
    return intlResponse || NextResponse.next()
  }

  // Get session from cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  
  if (!sessionToken) {
    // No session
    if (isApiRoute(pathname)) {
      // Return 401 JSON for API routes
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      )
    }
    // Redirect to login for non-API routes
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session
  const session = validateSession(sessionToken)
  
  if (!session) {
    // Invalid or expired session
    if (isApiRoute(pathname)) {
      // Return 401 JSON for API routes
      const response = NextResponse.json(
        { error: "Unauthorized", message: "Invalid or expired session" },
        { status: 401 }
      )
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
    // Redirect to login for non-API routes
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  // Check role requirements
  if (routeConfig.allowedRoles && routeConfig.allowedRoles.length > 0) {
    const hasRequiredRole = routeConfig.allowedRoles.includes(session.role)
    
    if (!hasRequiredRole) {
      // User doesn't have required role
      if (isApiRoute(pathname)) {
        // Return 403 JSON for API routes
        return NextResponse.json(
          { 
            error: "Forbidden", 
            message: "Insufficient permissions",
            requiredRoles: routeConfig.allowedRoles 
          },
          { status: 403 }
        )
      }
      // Redirect to home with error for non-API routes
      const homeUrl = new URL("/", request.url)
      homeUrl.searchParams.set("error", "insufficient_permissions")
      return NextResponse.redirect(homeUrl)
    }
  }

  // All checks passed, allow request
  return intlResponse || NextResponse.next()
}

/**
 * Configure which routes to run proxy on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
