"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormLabel } from "@/components/ui/form-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  currentPhone?: string
  onSubmit: (phoneNumber: string, countryCode: string) => Promise<void>
  onVerifyOTP: (otp: string) => Promise<void>
}

// Common country codes
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+47", country: "NO", flag: "🇳🇴" },
  { code: "+45", country: "DK", flag: "🇩🇰" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+43", country: "AT", flag: "🇦🇹" },
]

export function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  currentPhone,
  onSubmit,
  onVerifyOTP 
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!phoneNumber) {
      setError("Please enter a phone number")
      return
    }

    // Basic phone number validation (digits only, 7-15 characters)
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      setError("Please enter a valid phone number")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(phoneNumber, countryCode)
      setStep("otp")
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code")
      return
    }

    setIsSubmitting(true)
    try {
      await onVerifyOTP(otp)
      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Invalid verification code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setIsSubmitting(true)
    try {
      await onSubmit(phoneNumber, countryCode)
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep("phone")
    setPhoneNumber("")
    setOtp("")
    setError("")
    setSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "phone" ? "Add/Change Phone Number" : "Verify Phone Number"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone" 
              ? "Enter your phone number to receive a verification code via SMS."
              : `Enter the 6-digit code sent to ${countryCode} ${phoneNumber}`
            }
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              Phone number verified successfully!
            </p>
          </div>
        ) : step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {currentPhone && (
              <div className="space-y-2">
                <FormLabel htmlFor="current-phone" icon={Phone}>
                  Current Phone
                </FormLabel>
                <Input
                  id="current-phone"
                  type="tel"
                  value={currentPhone}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="space-y-2">
              <FormLabel htmlFor="phone-number" icon={Phone} required>
                Phone Number
              </FormLabel>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        <span className="flex items-center gap-2">
                          <span>{item.flag}</span>
                          <span>{item.code}</span>
                          <span className="text-muted-foreground text-xs">{item.country}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="555 123 4567"
                  disabled={isSubmitting}
                  className={cn("flex-1", error && "border-destructive")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Standard SMS rates may apply
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
                  "Send Verification Code"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div className="space-y-2">
              <FormLabel htmlFor="otp" required>
                Verification Code
              </FormLabel>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                disabled={isSubmitting}
                className={cn("text-center text-2xl tracking-widest", error && "border-destructive")}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code sent to your phone
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                disabled={isSubmitting}
                className="text-sm"
              >
                Didn't receive the code? Resend
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("phone")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting || otp.length !== 6}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
