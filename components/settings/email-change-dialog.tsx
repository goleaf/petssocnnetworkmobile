"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ErrorText } from "@/components/ui/error-text"
import { Eye, EyeOff, Mail } from "lucide-react"

interface EmailChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { newEmail: string; currentPassword: string; sendVerification: boolean }) => Promise<void>
  isSubmitting?: boolean
}

/**
 * Email Change Dialog Component
 * 
 * Provides a dialog UI for users to change their email address with:
 * - New email input with format validation
 * - Current password input for verification
 * - Checkbox to send verification email
 * - Form validation and error handling
 * - Loading state during submission
 */
export function EmailChangeDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: EmailChangeDialogProps) {
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [sendVerification, setSendVerification] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Email format validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password requirement validation (at least 1 character for now)
  const isValidPassword = (password: string): boolean => {
    return password.length > 0
  }

  const canSubmit = isValidEmail(newEmail) && isValidPassword(currentPassword) && !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email format
    if (!isValidEmail(newEmail)) {
      setError("Please enter a valid email address")
      return
    }

    // Validate password
    if (!isValidPassword(currentPassword)) {
      setError("Please enter your current password")
      return
    }

    try {
      await onSubmit({ newEmail, currentPassword, sendVerification })
      // Reset form on success
      setNewEmail("")
      setCurrentPassword("")
      setSendVerification(true)
      setError(null)
    } catch (err: any) {
      setError(err?.message || "Failed to change email")
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setNewEmail("")
      setCurrentPassword("")
      setSendVerification(true)
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-500" />
            </div>
            Change Email Address
          </DialogTitle>
          <DialogDescription>
            Enter your new email address and current password to verify the change. A verification link will be sent to your new email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="your.new.email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            {newEmail && !isValidEmail(newEmail) && (
              <p className="text-xs text-destructive">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {currentPassword && !isValidPassword(currentPassword) && (
              <p className="text-xs text-destructive">Password is required</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-verification"
              checked={sendVerification}
              onCheckedChange={(checked) => setSendVerification(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="send-verification"
              className="text-sm font-normal cursor-pointer"
            >
              Send verification email to new address
            </Label>
          </div>

          {error && <ErrorText className="text-sm">{error}</ErrorText>}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              {isSubmitting ? "Changing Email..." : "Change Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
