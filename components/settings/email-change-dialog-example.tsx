"use client"

/**
 * Example usage of EmailChangeDialog component
 * 
 * This file demonstrates how to integrate the EmailChangeDialog
 * into a settings page or account management interface.
 */

import { useState } from "react"
import { EmailChangeDialog } from "./email-change-dialog"
import { Button } from "@/components/ui/button"
import { requestEmailChangeAction } from "@/lib/actions/account"

export function EmailChangeDialogExample({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleEmailChange = async (data: {
    newEmail: string
    currentPassword: string
    sendVerification: boolean
  }) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await requestEmailChangeAction({
        userId,
        newEmail: data.newEmail,
        currentPassword: data.currentPassword,
        sendVerification: data.sendVerification,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to change email")
      }

      // Success - close dialog and show success message
      setIsOpen(false)
      setMessage({
        type: "success",
        text: `Verification email sent to ${data.newEmail}. Please check your inbox.`,
      })
    } catch (error: any) {
      // Error will be displayed in the dialog
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Change Email</Button>

      <EmailChangeDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleEmailChange}
        isSubmitting={isSubmitting}
      />

      {message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            message.type === "success"
              ? "bg-green-500/10 text-green-600"
              : "bg-red-500/10 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
