import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateSession, SESSION_COOKIE_NAME } from "./lib/auth-server"
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
  
  // Admin routes
  "/admin": { requireAuth: true, allowedRoles: ["admin", "moderator"] },
  "/admin/moderation": { requireAuth: true, allowedRoles: ["admin", "moderator"] },
  
  // Public routes (no auth required)
  "/": { requireAuth: false },
  "/feed": { requireAuth: false },
  "/blog": { requireAuth: false },
  "/explore": { requireAuth: false },
  "/wiki": { requireAuth: false },
  "/search": { requireAuth: false },
}

/**
 * Check if a path matches a protected route pattern
 */
function getRouteConfig(pathname: string): RouteConfig | null {
  // Check for admin base routes first
  for (const adminBase of ADMIN_BASE_ROUTES) {
    if (pathname === `/${adminBase}` || pathname.startsWith(`/${adminBase}/`)) {
      return { requireAuth: true, allowedRoles: ["admin", "moderator"] }
    }
  }
  
  // Exact match
  if (protectedRoutes[pathname]) {
    return protectedRoutes[pathname]
  }
  
  // Prefix match for nested routes
  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route + "/")) {
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
  
  // If i18n middleware returns a response (redirect/rewrite), return it
  if (intlResponse && intlResponse.status !== 200) {
    return intlResponse
  }
  
  // Get the pathname after i18n processing
  // If i18n rewrote the URL, use the rewritten path
  const rewrittenPath = intlResponse?.headers.get('x-middleware-rewrite')
  const pathname = rewrittenPath 
    ? new URL(rewrittenPath, request.url).pathname
    : request.nextUrl.pathname
  
  // Skip proxy for static files and API routes (except auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next()
  }

  const routeConfig = getRouteConfig(pathname)
  
  // If route is not in protected routes config, allow access
  if (!routeConfig) {
    return NextResponse.next()
  }

  // If route doesn't require auth, allow access
  if (!routeConfig.requireAuth) {
    return NextResponse.next()
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
  return NextResponse.next()
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

