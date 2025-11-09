import Link from "next/link"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { verifyEmailAction } from "@/lib/actions/auth"

interface VerifyEmailPageProps {
  searchParams: {
    token?: string
  }
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = searchParams?.token
  let title = "Verify your email"
  let description = "Paste the verification link from your inbox to continue."
  let isSuccess = false

  if (!token) {
    description = "We could not find a verification token in this link."
  } else {
    const result = await verifyEmailAction(token)
    if (result.success) {
      isSuccess = true
      title = "Email verified"
      description = "Thank you! Your email address has been verified. You can sign in with your credentials now."
    } else {
      title = "Verification failed"
      description = result.error || "This verification link is no longer valid. Please request a new one."
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center space-y-3">
          {isSuccess ? (
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          )}
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 text-center">
          {!isSuccess && (
            <p>
              Need a fresh link? Return to the registration form and submit your email again to receive a new verification email.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/login">Go to Login</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/register">Back to Register</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
