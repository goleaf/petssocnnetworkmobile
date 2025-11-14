"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/auth/auth-provider";
import { RecentChangesFeed } from "@/components/admin/RecentChangesFeed";
import { ModerationFilters, type FilterValues } from "@/components/admin/ModerationFilters";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";

export default function ModerationDashboardPage() {
  const { user } = useAuth();

  const [filters, setFilters] = useState<FilterValues>({});
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

      setSuccessMessage("Edit request approved and applied successfully.");

      // Trigger feed refresh by updating filters
      setFilters({ ...filters });
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

      setSuccessMessage("Edit request rejected successfully.");
      setRejectDialogOpen(false);
      setActiveRequestId(null);
      setRejectReason("");

      // Trigger feed refresh
      setFilters({ ...filters });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  // Check if user is moderator
  const isModerator = user?.role === "moderator" || user?.role === "admin";

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access the moderation dashboard.
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
            You do not have permission to access the moderation dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve content changes from the community
        </p>
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

      {/* Quick Links to Specialized Queues */}
      <Card>
        <CardHeader>
          <CardTitle>Specialized Queues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/queue/new-pages">
              <Button variant="outline" className="w-full justify-between">
                New Pages
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/queue/flagged-health">
              <Button variant="outline" className="w-full justify-between">
                Health Content
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/queue/coi-edits">
              <Button variant="outline" className="w-full justify-between">
                COI Edits
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/queue/image-reviews">
              <Button variant="outline" className="w-full justify-between">
                Image Reviews
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ModerationFilters onFiltersChange={handleFiltersChange} />
        </div>

        {/* Recent Changes Feed */}
        <div className="lg:col-span-3">
          <RecentChangesFeed
            filters={filters}
            pageSize={10}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Edit Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this edit. The user will be notified.
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
              {actionLoading ? "Rejecting..." : "Reject Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
