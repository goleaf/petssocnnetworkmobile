"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <LoginForm 
          onSuccess={() => {}} 
          onSwitchToRegister={() => router.push("/register")} 
        />
        
        {/* Demo Credentials Section */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50 hover:shadow-md transition-all duration-300">
          <CardContent className="p-3">
            <div className="flex items-start gap-1.5 mb-2">
              <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-foreground">Demo Credentials</p>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground pl-4.5">
              <p className="break-words">
                <strong className="text-foreground font-semibold">Username:</strong>{" "}
                <span className="font-mono bg-muted px-1 py-0.5 rounded">sarahpaws</span>,{" "}
                <span className="font-mono bg-muted px-1 py-0.5 rounded">mikecatlover</span>,{" "}
                <span className="font-mono bg-muted px-1 py-0.5 rounded">emmabirds</span>,{" "}
                <span className="font-mono bg-muted px-1 py-0.5 rounded">alexrabbits</span>
              </p>
              <p>
                <strong className="text-foreground font-semibold">Password:</strong>{" "}
                <span className="font-mono bg-muted px-1 py-0.5 rounded">password123</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

