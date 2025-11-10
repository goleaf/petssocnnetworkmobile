"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react"

// ============================================================================
// Types
// ============================================================================

interface Step4FormData {
  microchipId?: string
  microchipCompany?: string
  microchipRegistrationStatus?: string
  microchipCertificateUrl?: string
  microchipCertificateFile?: File | null
  collarTagId?: string
  insurancePolicyNumber?: string
}

interface Step4IdentificationProps {
  formData: Step4FormData
  onChange: (data: Partial<Step4FormData>) => void
  errors?: Record<string, string>
}

// ============================================================================
// Constants
// ============================================================================

const MICROCHIP_COMPANIES = [
  { value: "avid", label: "Avid" },
  { value: "homeagain", label: "HomeAgain" },
  { value: "akc_reunite", label: "AKC Reunite" },
  { value: "petlink", label: "PetLink" },
  { value: "24petwatch", label: "24PetWatch" },
  { value: "other", label: "Other" },
]

const REGISTRATION_STATUS = [
  { value: "registered", label: "Registered" },
  { value: "not_registered", label: "Not Registered" },
  { value: "unknown", label: "Unknown" },
]

const MICROCHIP_ID_LENGTH = 15
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

// ============================================================================
// Helper Functions
// ============================================================================

function validateMicrochipId(id: string): boolean {
  // Must be exactly 15 digits
  return /^\d{15}$/.test(id)
}

function formatMicrochipId(id: string): string {
  // Format as XXX-XXX-XXX-XXX-XXX for readability
  const cleaned = id.replace(/\D/g, "")
  const parts = []
  for (let i = 0; i < cleaned.length; i += 3) {
    parts.push(cleaned.slice(i, i + 3))
  }
  return parts.join("-")
}

// ============================================================================
// Main Component
// ============================================================================

export function Step4Identification({
  formData,
  onChange,
  errors = {},
}: Step4IdentificationProps) {
  const [microchipInput, setMicrochipInput] = useState(formData.microchipId || "")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const microchipLength = microchipInput.replace(/\D/g, "").length
  const isMicrochipValid = validateMicrochipId(microchipInput.replace(/\D/g, ""))
  const hasMicrochipError = microchipInput && !isMicrochipValid && microchipLength > 0

  // ============================================================================
  // Microchip ID Handling
  // ============================================================================

  const handleMicrochipChange = (value: string) => {
    // Allow only digits and hyphens
    const cleaned = value.replace(/[^\d-]/g, "")
    setMicrochipInput(cleaned)

    // Extract just the digits for validation
    const digitsOnly = cleaned.replace(/\D/g, "")
    
    // Update form data
    onChange({ microchipId: digitsOnly || undefined })
  }

  const handleMicrochipBlur = () => {
    // Format on blur if valid
    const digitsOnly = microchipInput.replace(/\D/g, "")
    if (digitsOnly.length === MICROCHIP_ID_LENGTH) {
      setMicrochipInput(formatMicrochipId(digitsOnly))
    }
  }

  // ============================================================================
  // File Upload Handling
  // ============================================================================

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setUploadError(null)

    if (!file) return

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setUploadError("Please upload a PDF or image file (JPEG, PNG, WebP)")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must be less than 10MB")
      return
    }

    // Store file in form data
    onChange({
      microchipCertificateFile: file,
      microchipCertificateUrl: URL.createObjectURL(file),
    })
  }

  const handleRemoveFile = () => {
    // Revoke object URL to prevent memory leaks
    if (formData.microchipCertificateUrl) {
      URL.revokeObjectURL(formData.microchipCertificateUrl)
    }

    onChange({
      microchipCertificateFile: null,
      microchipCertificateUrl: undefined,
    })
    setUploadError(null)
  }

  const getFileDisplayName = () => {
    if (formData.microchipCertificateFile) {
      return formData.microchipCertificateFile.name
    }
    if (formData.microchipCertificateUrl) {
      return "Certificate uploaded"
    }
    return null
  }

  const fileDisplayName = getFileDisplayName()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Identification Information</h3>
        <p className="text-sm text-muted-foreground">
          Add identification details to help recover your pet if lost. All fields are optional.
        </p>
      </div>

      {/* Microchip ID */}
      <div className="space-y-2">
        <Label htmlFor="microchipId">
          Microchip ID (Optional)
        </Label>
        <div className="space-y-2">
          <Input
            id="microchipId"
            value={microchipInput}
            onChange={(e) => handleMicrochipChange(e.target.value)}
            onBlur={handleMicrochipBlur}
            placeholder="Enter 15-digit microchip number"
            maxLength={19} // 15 digits + 4 hyphens
            className={cn(
              hasMicrochipError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          
          {/* Character counter and validation */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {microchipInput && (
                <>
                  {isMicrochipValid ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valid format</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>Must be exactly 15 digits</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <span className={cn(
              "text-muted-foreground",
              microchipLength > MICROCHIP_ID_LENGTH && "text-destructive"
            )}>
              {microchipLength}/{MICROCHIP_ID_LENGTH} digits
            </span>
          </div>
        </div>
        
        {errors.microchipId && (
          <p className="text-sm text-destructive">{errors.microchipId}</p>
        )}
        
        <p className="text-xs text-muted-foreground">
          A microchip is a permanent form of identification implanted under your pet&apos;s skin
        </p>
      </div>

      {/* Microchip Company */}
      {microchipInput && (
        <div className="space-y-2">
          <Label htmlFor="microchipCompany">
            Microchip Company (Optional)
          </Label>
          <Select
            value={formData.microchipCompany || ""}
            onValueChange={(value) => onChange({ microchipCompany: value })}
          >
            <SelectTrigger id="microchipCompany">
              <SelectValue placeholder="Select microchip company" />
            </SelectTrigger>
            <SelectContent>
              {MICROCHIP_COMPANIES.map((company) => (
                <SelectItem key={company.value} value={company.value}>
                  {company.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Registration Status */}
      {microchipInput && (
        <div className="space-y-2">
          <Label htmlFor="registrationStatus">
            Registration Status (Optional)
          </Label>
          <Select
            value={formData.microchipRegistrationStatus || ""}
            onValueChange={(value) =>
              onChange({ microchipRegistrationStatus: value })
            }
          >
            <SelectTrigger id="registrationStatus">
              <SelectValue placeholder="Select registration status" />
            </SelectTrigger>
            <SelectContent>
              {REGISTRATION_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Registered microchips are linked to your contact information in a database
          </p>
        </div>
      )}

      {/* Microchip Certificate Upload */}
      {microchipInput && (
        <div className="space-y-2">
          <Label htmlFor="certificate">
            Microchip Certificate (Optional)
          </Label>
          
          {!fileDisplayName ? (
            <div className="space-y-2">
              <label
                htmlFor="certificate"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-32",
                  "border-2 border-dashed rounded-lg cursor-pointer",
                  "hover:bg-accent transition-colors",
                  uploadError ? "border-destructive" : "border-border"
                )}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF or Image (JPEG, PNG, WebP) up to 10MB
                  </p>
                </div>
                <input
                  id="certificate"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileSelect}
                />
              </label>
              
              {uploadError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{fileDisplayName}</p>
                  {formData.microchipCertificateFile && (
                    <p className="text-xs text-muted-foreground">
                      {(formData.microchipCertificateFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Upload your microchip registration certificate or documentation
          </p>
        </div>
      )}

      {/* Collar Tag ID */}
      <div className="space-y-2">
        <Label htmlFor="collarTagId">
          Collar Tag ID (Optional)
        </Label>
        <Input
          id="collarTagId"
          value={formData.collarTagId || ""}
          onChange={(e) => onChange({ collarTagId: e.target.value })}
          placeholder="e.g., TAG-12345, City License #789"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          ID number on your pet&apos;s collar tag or city license
        </p>
      </div>

      {/* Insurance Policy Number */}
      <div className="space-y-2">
        <Label htmlFor="insurancePolicyNumber">
          Insurance Policy Number (Optional)
        </Label>
        <Input
          id="insurancePolicyNumber"
          value={formData.insurancePolicyNumber || ""}
          onChange={(e) => onChange({ insurancePolicyNumber: e.target.value })}
          placeholder="e.g., POL-123456789"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Pet insurance policy number for quick reference
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Why add identification?
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Proper identification significantly increases the chances of reuniting with your pet if they get lost. 
              A microchip is permanent and can&apos;t fall off like a collar tag.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
