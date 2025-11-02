"use client"

import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useState } from "react"
import { toast } from "sonner"

export type ReportReason = 
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "copyright"
  | "other"

const REPORT_REASONS: Array<{ value: ReportReason; label: string; description: string }> = [
  { value: "spam", label: "Spam", description: "Repetitive, unwanted, or promotional content" },
  { value: "harassment", label: "Harassment", description: "Bullying, threats, or targeted abuse" },
  { value: "inappropriate", label: "Inappropriate Content", description: "Content that violates community guidelines" },
  { value: "misinformation", label: "Misinformation", description: "False or misleading information" },
  { value: "copyright", label: "Copyright Violation", description: "Unauthorized use of copyrighted material" },
  { value: "other", label: "Other", description: "Something else that needs attention" },
]

interface PostReportMenuProps {
  postId: string
  postTitle?: string
  onReport?: (reason: ReportReason, details?: string) => void
}

export function PostReportMenu({ postId, postTitle, onReport }: PostReportMenuProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [details, setDetails] = useState("")

  const handleReport = (reason: ReportReason) => {
    setSelectedReason(reason)
    setShowDialog(true)
  }

  const handleSubmitReport = () => {
    if (!selectedReason) return

    // In a real app, this would send to your backend
    if (onReport) {
      onReport(selectedReason, details.trim() || undefined)
    } else {
      // Default behavior: save to localStorage for now
      const reports = JSON.parse(localStorage.getItem("pet_social_reports") || "[]")
      reports.push({
        id: `report_${Date.now()}`,
        postId,
        reason: selectedReason,
        details: details.trim() || undefined,
        reportedAt: new Date().toISOString(),
      })
      localStorage.setItem("pet_social_reports", JSON.stringify(reports))
    }

    toast.success("Report submitted. Thank you for helping keep our community safe.")
    setShowDialog(false)
    setSelectedReason(null)
    setDetails("")
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Flag className="h-4 w-4" />
            Report
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Report Post</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {REPORT_REASONS.map((reason) => (
            <DropdownMenuItem
              key={reason.value}
              onClick={() => handleReport(reason.value)}
              className="flex flex-col items-start gap-1 p-3"
            >
              <span className="font-medium">{reason.label}</span>
              <span className="text-xs text-muted-foreground">{reason.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report Post</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedReason && (
                <>
                  You are reporting this post for: <strong>{REPORT_REASONS.find((r) => r.value === selectedReason)?.label}</strong>
                  {postTitle && (
                    <>
                      <br />
                      <br />
                      Post: {postTitle}
                    </>
                  )}
                  {selectedReason === "other" && (
                    <>
                      <br />
                      <br />
                      Please provide additional details:
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Describe the issue..."
                        className="mt-2 w-full min-h-[100px] p-2 border rounded-md"
                      />
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDialog(false)
              setSelectedReason(null)
              setDetails("")
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitReport}>
              Submit Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

