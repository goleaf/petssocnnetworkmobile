"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueueManager } from "@/components/admin/QueueManager";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/auth/auth-provider";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FlaggedHealthQueuePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle approve action
  const handleApprove = async (id: string) => {
    if (!user) {
      setErrorMessage("You must be logged in to approve edits.");
      return;
    }

    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/moderation/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve edit request");
      }

      setSuccessMessage("Health content approved and published successfully.");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject action
  const handleReject = async (id: string) => {
    setActiveRequestId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // Submit rejection with reason
  const submitReject = async () => {
    if (!activeRequestId || !user) return;

    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/moderation/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeRequestId,
          reason: rejectReason || "No reason provided",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject edit request");
      }

      setSuccessMessage("Health content rejected successfully.");
      setRejectDialogOpen(false);
      setActiveRequestId(null);
      setRejectReason("");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async (
    operation: "approve" | "reject",
    ids: string[]
  ) => {
    if (ids.length === 0) return;

    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const endpoint =
        operation === "approve"
          ? "/api/admin/moderation/approve"
          : "/api/admin/moderation/reject";

      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              reason: operation === "reject" ? "Bulk rejection" : undefined,
            }),
          })
        )
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.filter((r) => r.status === "rejected").length;

      if (failureCount === 0) {
        setSuccessMessage(
          `Successfully ${operation}d ${successCount} health content item${successCount > 1 ? "s" : ""}.`
        );
      } else {
        setErrorMessage(
          `${operation === "approve" ? "Approved" : "Rejected"} ${successCount} items, ${failureCount} failed.`
        );
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Check if user is moderator
  const isModerator = user?.role === "moderator" || user?.role === "admin";

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access the moderation queue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access the moderation queue.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/moderation">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Queue Manager */}
      <QueueManager
        queueType="flagged-health"
        pageSize={20}
        onApprove={handleApprove}
        onReject={handleReject}
        onBulkOperation={handleBulkOperation}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Health Content</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this health-related content. The
              user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? "Rejecting..." : "Reject Content"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
