"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  submitExpertApplicationAction,
  getExpertProfileByUserIdAction,
  isExpertVerifiedAction,
} from "@/lib/actions/expert"
import { CheckCircle, Upload, X, AlertCircle, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/ui/back-button"

export default function ExpertVerificationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [credential, setCredential] = useState("")
  const [licenseNo, setLicenseNo] = useState("")
  const [region, setRegion] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingProfile, setExistingProfile] = useState<any>(null)
  const [isVerified, setIsVerified] = useState(false)

  // Load existing profile
  useEffect(() => {
    if (user) {
      getExpertProfileByUserIdAction(user.id).then((profile) => {
        if (profile) {
          setExistingProfile(profile)
          setIsVerified(profile.status === "verified")
        } else {
          isExpertVerifiedAction(user.id).then((verified) => setIsVerified(verified))
        }
      })
    }
  }, [user])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setIsSubmitting(true)

    try {
      // For demo purposes, we'll convert files to data URLs
      // In a real app, you'd upload to a file storage service
      const credentialFileUrls: string[] = await Promise.all(
        uploadedFiles.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
        })
      )

      const documents = uploadedFiles.map((file, index) => ({
        name: file.name,
        url: credentialFileUrls[index],
        type: file.type || "application/pdf",
        uploadedAt: new Date().toISOString(),
      }))

      const result = await submitExpertApplicationAction(user.id, {
        credential,
        licenseNo: licenseNo || undefined,
        region: region || undefined,
        documents,
        expiresAt: expiresAt || undefined,
      })

      if (result.success) {
        setSuccess(true)
        setExistingProfile(result.profile)
        setTimeout(() => {
          router.push("/settings")
        }, 2000)
      } else {
        setError(result.error || "Failed to submit verification request")
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit verification request")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to request expert verification.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <BackButton href="/settings" label="Back to Settings" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Already Verified
            </CardTitle>
            <CardDescription>
              You are already verified as an expert. You can publish stable health articles.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (existingProfile && existingProfile.status !== "verified") {
    const statusMessages: Record<string, string> = {
      pending: "Your verification request is pending review.",
      expired: "Your expert verification has expired. Please renew.",
      revoked: existingProfile.reviewNotes
        ? `Your verification was revoked: ${existingProfile.reviewNotes}`
        : "Your verification was revoked.",
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <BackButton href="/settings" label="Back to Settings" />
        <Card>
          <CardHeader>
            <CardTitle>Verification Request Status</CardTitle>
            <CardDescription>{statusMessages[existingProfile.status] || "Unknown status"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      existingProfile.status === "pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : existingProfile.status === "expired"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {existingProfile.status.charAt(0).toUpperCase() +
                      existingProfile.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <Label>Credential</Label>
                <div className="mt-1 text-sm">{existingProfile.credential}</div>
              </div>
              {existingProfile.licenseNo && (
                <div>
                  <Label>License Number</Label>
                  <div className="mt-1 text-sm">{existingProfile.licenseNo}</div>
                </div>
              )}
              {existingProfile.expiresAt && (
                <div>
                  <Label>Expires At</Label>
                  <div className="mt-1 text-sm">
                    {new Date(existingProfile.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              )}
              {(existingProfile.status === "rejected" || existingProfile.status === "expired") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setExistingProfile(null)
                  }}
                >
                  Submit New Request
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <BackButton href="/settings" label="Back to Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Request Expert Verification</CardTitle>
          <CardDescription>
            Submit your credentials to become a verified expert. Verified experts can publish stable
            health articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Verification request submitted successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="credential">Credential Type *</Label>
              <Select value={credential} onValueChange={setCredential} required>
                <SelectTrigger id="credential">
                  <SelectValue placeholder="Select your credential" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DVM">DVM (Doctor of Veterinary Medicine)</SelectItem>
                  <SelectItem value="Veterinary Technician">Veterinary Technician</SelectItem>
                  <SelectItem value="Animal Behaviorist">Animal Behaviorist</SelectItem>
                  <SelectItem value="Certified Trainer">Certified Trainer</SelectItem>
                  <SelectItem value="Other">Other (specify in license field)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="licenseNo">License Number (Optional)</Label>
              <Input
                id="licenseNo"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="Enter your license number"
              />
            </div>

            <div>
              <Label htmlFor="region">Region (Optional)</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., California, USA"
              />
            </div>

            <div>
              <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                When your credential expires (if applicable)
              </p>
            </div>

            <div>
              <Label htmlFor="files">Upload Credentials *</Label>
              <div className="mt-2">
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Files
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload images or PDFs of your credentials. Maximum 10MB per file.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting || !credential || uploadedFiles.length === 0}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
