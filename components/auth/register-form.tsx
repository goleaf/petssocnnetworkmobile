"use client"

import type React from "react"
import type { CheckedState } from "@radix-ui/react-checkbox"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { Loader2, Eye, EyeOff, User, UserPlus, Mail, Lock, Calendar, Shield } from "lucide-react"

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/
const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (!@#$%^&*)"

type UsernameState = "idle" | "checking" | "available" | "unavailable" | "invalid"

interface PasswordStrength {
  score: number
  label: "Weak" | "Fair" | "Good" | "Strong" | ""
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "" }
  }

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*]/.test(password)
  const lengthCheck = password.length >= 8
  const extraLength = password.length >= 12

  const checks = [lengthCheck, extraLength, hasUpper, hasLower, hasNumber, hasSpecial]
  const score = checks.filter(Boolean).length

  if (score >= 5) return { score, label: "Strong" }
  if (score === 4) return { score, label: "Good" }
  if (score === 3) return { score, label: "Fair" }
  return { score, label: "Weak" }
}

function validateBirthDate(value: string): string {
  if (!value) {
    return "Date of birth is required"
  }

  const birthDate = new Date(value)
  if (Number.isNaN(birthDate.getTime())) {
    return "Please provide a valid date"
  }

  const now = new Date()
  const ageDate = new Date(birthDate.getFullYear() + 13, birthDate.getMonth(), birthDate.getDate())
  if (ageDate > now) {
    return "You must be at least 13 years old to join PawSocial"
  }

  return ""
}

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    dateOfBirth: "",
    acceptedPolicies: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordMatchError, setPasswordMatchError] = useState("")
  const [dateOfBirthError, setDateOfBirthError] = useState("")
  const [termsError, setTermsError] = useState("")
  const [usernameState, setUsernameState] = useState<UsernameState>("idle")
  const [usernameMessage, setUsernameMessage] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: "" })
  const [passwordError, setPasswordError] = useState("")
  const { register } = useAuth()
  const router = useRouter()
  const passwordStrengthStyles = {
    Weak: { text: "text-destructive", bg: "bg-destructive" },
    Fair: { text: "text-amber-600", bg: "bg-amber-500" },
    Good: { text: "text-blue-600", bg: "bg-blue-500" },
    Strong: { text: "text-emerald-600", bg: "bg-emerald-500" },
  } as const

  const maxBirthDate = useMemo(() => {
    const today = new Date()
    today.setFullYear(today.getFullYear() - 13)
    return today.toISOString().split("T")[0]
  }, [])

  useEffect(() => {
    setPasswordStrength(evaluatePasswordStrength(formData.password))
    if (!formData.password) {
      setPasswordError("")
      return
    }
    if (!PASSWORD_COMPLEXITY_REGEX.test(formData.password)) {
      setPasswordError(PASSWORD_REQUIREMENTS_MESSAGE)
    } else {
      setPasswordError("")
    }
  }, [formData.password])

  useEffect(() => {
    if (!formData.confirmPassword) {
      setPasswordMatchError("")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatchError("Passwords do not match")
    } else {
      setPasswordMatchError("")
    }
  }, [formData.password, formData.confirmPassword])

  useEffect(() => {
    const username = formData.username.trim()
    if (!username) {
      setUsernameState("idle")
      setUsernameMessage("")
      return
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameState("invalid")
      setUsernameMessage("Use 3-20 characters (letters, numbers, underscores, hyphens).")
      return
    }

    const controller = new AbortController()
    setUsernameState("checking")
    setUsernameMessage("Checking availability...")

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error("Request failed")
        }
        const data = await response.json()
        if (data.available) {
          setUsernameState("available")
          setUsernameMessage("Username is available")
        } else {
          setUsernameState("unavailable")
          setUsernameMessage(data.error || "That username is already taken")
        }
      } catch (fetchError) {
        if (controller.signal.aborted) return
        console.error("Username availability check failed:", fetchError)
        setUsernameState("unavailable")
        setUsernameMessage("Could not verify username. Try again.")
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [formData.username])

  const handleEmailChange = (value: string) => {
    setFormData((prev) => ({ ...prev, email: value }))
    if (!value) {
      setEmailError("Email is required")
    } else if (!EMAIL_REGEX.test(value)) {
      setEmailError("Enter a valid email address")
    } else {
      setEmailError("")
    }
  }

  const handleDateOfBirthChange = (value: string) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: value }))
    setDateOfBirthError(validateBirthDate(value))
  }

  const handlePoliciesChange = (checked: CheckedState) => {
    const accepted = checked === true
    setFormData((prev) => ({ ...prev, acceptedPolicies: accepted }))
    if (accepted) {
      setTermsError("")
    }
  }

  const usernameStatusClass = {
    idle: "text-muted-foreground",
    checking: "text-muted-foreground",
    available: "text-emerald-600",
    invalid: "text-destructive",
    unavailable: "text-destructive",
  }[usernameState]

  const fullNameLength = formData.fullName.trim().length
  const isSubmitDisabled =
    isLoading ||
    usernameState === "checking" ||
    !formData.email ||
    !!emailError ||
    !formData.password ||
    !!passwordError ||
    !!passwordMatchError ||
    fullNameLength < 2 ||
    fullNameLength > 50 ||
    !formData.username ||
    usernameState !== "available" ||
    !formData.dateOfBirth ||
    !!dateOfBirthError ||
    !formData.acceptedPolicies

  const currentStrengthStyle = passwordStrength.label ? passwordStrengthStyles[passwordStrength.label] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(formData.password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE)
      return
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      setEmailError("Enter a valid email address")
      return
    }

    if (usernameState !== "available") {
      setError("Please choose an available username")
      return
    }

    const dobValidation = validateBirthDate(formData.dateOfBirth)
    setDateOfBirthError(dobValidation)
    if (dobValidation) {
      return
    }

    if (!formData.acceptedPolicies) {
      setTermsError("Please accept the Terms of Service and Privacy Policy")
      return
    }

    setIsLoading(true)

    const result = await register({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      acceptedPolicies: formData.acceptedPolicies,
    })

    setIsLoading(false)

    if (result.success) {
      onSuccess?.()

      if (result.sessionCreated) {
        router.push("/")
        router.refresh()
        return
      }

      const expiresLabel = result.verificationExpiresAt
        ? `on ${new Date(result.verificationExpiresAt).toLocaleString()}`
        : "within 24 hours"

      setSuccessMessage(
        `We sent a verification link to ${formData.email}. The link expires ${expiresLabel}.`,
      )
    } else {
      setError(result.error || "Registration failed")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
        <CardDescription className="text-sm sm:text-base">Join the pet social network community</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {successMessage && (
            <Alert>
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm sm:text-base">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-10 sm:h-11 w-full pl-10 text-sm sm:text-base"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Use your real name (2-50 characters).</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm sm:text-base">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-10 sm:h-11 w-full pl-10 text-sm sm:text-base"
                required
              />
            </div>
            {usernameMessage && (
              <p className={cn("text-xs", usernameStatusClass)}>{usernameMessage}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="h-10 sm:h-11 w-full pl-10 text-sm sm:text-base"
                required
              />
            </div>
            {emailError && <p className="text-xs text-destructive">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Password strength</span>
                <span className={cn("font-medium", currentStrengthStyle ? currentStrengthStyle.text : "text-muted-foreground")}>
                  {passwordStrength.label || ""}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentStrengthStyle ? currentStrengthStyle.bg : "bg-muted-foreground/40"
                  )}
                  style={{ width: `${Math.min(100, (passwordStrength.score / 6) * 100)}%` }}
                />
              </div>
            </div>
            {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-10 sm:h-11 w-full pl-10 pr-10 text-sm sm:text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
          </div>
          {passwordMatchError && <p className="text-xs text-destructive">{passwordMatchError}</p>}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="text-sm sm:text-base">Date of Birth</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                max={maxBirthDate}
                onChange={(e) => handleDateOfBirthChange(e.target.value)}
                className="h-10 sm:h-11 w-full pl-10 text-sm sm:text-base"
                required
              />
            </div>
            {dateOfBirthError && <p className="text-xs text-destructive">{dateOfBirthError}</p>}
          </div>
          <div className="flex items-start gap-3 rounded-md border border-dashed border-muted p-3">
            <Checkbox
              id="acceptedPolicies"
              checked={formData.acceptedPolicies}
              onCheckedChange={handlePoliciesChange}
              className="mt-1"
            />
            <div className="space-y-1 text-sm">
              <Label htmlFor="acceptedPolicies" className="font-medium flex items-center gap-1">
                <Shield className="h-4 w-4 text-primary" />
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noreferrer" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" rel="noreferrer" className="underline">
                  Privacy Policy
                </Link>
              </Label>
              <p className="text-xs text-muted-foreground">
                You must accept these policies to create an account.
              </p>
              {termsError && <p className="text-xs text-destructive">{termsError}</p>}
            </div>
          </div>
          {error && <p className="text-xs sm:text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:gap-4 pt-4 sm:pt-6 p-4 sm:p-6">
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && <UserPlus className="h-4 w-4 mr-2" />}
            <span className="text-sm sm:text-base">Create Account</span>
          </Button>
          {onSwitchToLogin && (
            <Button type="button" variant="ghost" className="w-full" onClick={onSwitchToLogin}>
              <User className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Already have an account? Sign in</span>
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
