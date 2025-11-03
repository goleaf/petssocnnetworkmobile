"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { Loader2, Eye, EyeOff, User, UserPlus, Lock } from "lucide-react"

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Client-side validation
    if (!username.trim()) {
      setError("Username is required")
      return
    }
    if (!password.trim()) {
      setError("Password is required")
      return
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    const result = await login(username.trim(), password)

    setIsLoading(false)

    if (result.success) {
      onSuccess?.()
      // Redirect to home (feed) after successful login
      router.push("/")
      router.refresh()
    } else {
      setError(result.error || "Login failed")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
        <CardDescription className="text-sm sm:text-base">Sign in to your pet social network account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 sm:h-11 w-full pl-10 text-sm sm:text-base"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 sm:h-11 w-full pl-10 pr-10 text-sm sm:text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-xs sm:text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:gap-4 pt-4 sm:pt-6 p-4 sm:p-6">
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && <User className="h-4 w-4 mr-2" />}
            <span className="text-sm sm:text-base">Sign In</span>
          </Button>
          {onSwitchToRegister && (
            <Button type="button" variant="ghost" className="w-full" onClick={onSwitchToRegister}>
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">{"Don't have an account? Register"}</span>
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
