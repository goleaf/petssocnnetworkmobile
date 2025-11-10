"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormLabel } from "@/components/ui/form-label"
import { Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onSubmit: (newEmail: string, password: string) => Promise<void>
}

export function EmailChangeModal({ isOpen, onClose, currentEmail, onSubmit }: EmailChangeModalProps) {
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Basic validation
    if (!newEmail || !password) {
      setError("Please fill in all fields")
      return
    }

    if (newEmail === currentEmail) {
      setError("New email must be different from current email")
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(newEmail, password)
      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to change email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setNewEmail("")
    setPassword("")
    setError("")
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address and current password to verify the change.
            A verification email will be sent to your new address.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              Verification email sent! Please check your inbox at <strong>{newEmail}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <FormLabel htmlFor="current-email" icon={Mail}>
                Current Email
              </FormLabel>
              <Input
                id="current-email"
                type="email"
                value={currentEmail}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="new-email" icon={Mail} required>
                New Email Address
              </FormLabel>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your.new.email@example.com"
                disabled={isSubmitting}
                className={cn(error && "border-destructive")}
              />
            </div>

            <div className="space-y-2">
              <FormLabel htmlFor="password" icon={Lock} required>
                Current Password
              </FormLabel>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className={cn(error && "border-destructive")}
              />
              <p className="text-xs text-muted-foreground">
                Required for security verification
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Verification Email"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
