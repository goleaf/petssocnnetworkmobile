import Link from "next/link"
import { ShieldAlert, Home, LogIn, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UnauthorizedPageProps {
  searchParams: { reason?: string }
}

/**
 * Unauthorized page - shown when user doesn't have required permissions
 * Returns 403 status
 */
export default function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const reason = searchParams.reason

  let message = "You don't have permission to access this resource."
  let title = "Access Denied"
  let iconColor = "text-red-500"

  if (reason === "not-authenticated") {
    title = "Authentication Required"
    message = "You must be logged in to access this page."
    iconColor = "text-blue-500"
  } else if (reason === "insufficient-role") {
    title = "Insufficient Permissions"
    message = "You don't have the required role to access this page."
    iconColor = "text-amber-500"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mb-6 flex justify-center">
            <div className={`p-4 rounded-full bg-gradient-to-br ${iconColor.includes('red') ? 'from-red-50 to-red-100' : iconColor.includes('blue') ? 'from-blue-50 to-blue-100' : 'from-amber-50 to-amber-100'}`}>
              <ShieldAlert className={`h-12 w-12 ${iconColor}`} />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{title}</CardTitle>
          <CardDescription className="text-base text-gray-600 leading-relaxed">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Button asChild className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-5 w-5" />
              Go to Homepage
            </Link>
          </Button>
          {reason === "not-authenticated" && (
            <Button asChild variant="outline" className="w-full h-11 text-base font-semibold border-2 hover:bg-gray-50 transition-all">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {reason !== "not-authenticated" && (
            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors inline-flex items-center gap-1"
              >
                Try logging in again
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

