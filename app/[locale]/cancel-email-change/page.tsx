import Link from "next/link"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cancelEmailChangeAction } from "@/lib/actions/account"

interface CancelEmailChangePageProps {
  searchParams: {
    token?: string
  }
}

export default async function CancelEmailChangePage({ searchParams }: CancelEmailChangePageProps) {
  const token = searchParams?.token
  let title = "Cancel email change"
  let description = ""
  let isSuccess = false

  if (!token) {
    description = "We could not find a token in this link."
  } else {
    const result = await cancelEmailChangeAction(token)
    if (result.success) {
      isSuccess = true
      title = "Email change cancelled"
      description = "We have cancelled the pending email change request. Your account email remains unchanged."
    } else {
      title = "Cancellation failed"
      description = result.error || "This link is no longer valid."
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
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/settings">Back to Settings</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

