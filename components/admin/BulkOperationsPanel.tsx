"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkOperationItem {
  id: string;
  label: string;
  description?: string;
}

export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  totalCount: number;
  failedIds: string[];
  errors: Array<{ id: string; error: string }>;
}

export interface BulkOperationsPanelProps {
  /** Items available for bulk operations */
  items: BulkOperationItem[];
  /** Currently selected item IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void;
  /** Callback when bulk revert is executed */
  onBulkRevert?: (ids: string[], reason: string) => Promise<BulkOperationResult>;
  /** Callback when bulk range block is executed */
  onBulkRangeBlock?: (ids: string[], reason: string) => Promise<BulkOperationResult>;
  /** Whether operations are currently being executed */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * BulkOperationsPanel provides UI for selecting multiple items and executing
 * bulk operations (revert, range block) with confirmation dialogs and progress indicators.
 */
export function BulkOperationsPanel({
  items,
  selectedIds,
  onSelectionChange,
  onBulkRevert,
  onBulkRangeBlock,
  loading = false,
  className,
}: BulkOperationsPanelProps) {
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [showRangeBlockDialog, setShowRangeBlockDialog] = useState(false);
  const [revertReason, setRevertReason] = useState("");
  const [rangeBlockReason, setRangeBlockReason] = useState("");
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  // Handle individual item selection
  const handleItemToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Execute bulk revert
  const executeBulkRevert = async () => {
    if (!onBulkRevert || selectedIds.length === 0) return;

    setOperationInProgress(true);
    setShowRevertDialog(false);

    try {
      const result = await onBulkRevert(selectedIds, revertReason);
      setOperationResult(result);
      setShowResultDialog(true);
      
      // Clear selection after successful operation
      if (result.successCount > 0) {
        onSelectionChange([]);
      }
    } catch (error) {
      console.error("Bulk revert failed:", error);
      setOperationResult({
        successCount: 0,
        failureCount: selectedIds.length,
        totalCount: selectedIds.length,
        failedIds: selectedIds,
        errors: [{ id: "all", error: error instanceof Error ? error.message : "Unknown error" }],
      });
      setShowResultDialog(true);
    } finally {
      setOperationInProgress(false);
      setRevertReason("");
    }
  };

  // Execute bulk range block
  const executeBulkRangeBlock = async () => {
    if (!onBulkRangeBlock || selectedIds.length === 0) return;

    setOperationInProgress(true);
    setShowRangeBlockDialog(false);

    try {
      const result = await onBulkRangeBlock(selectedIds, rangeBlockReason);
      setOperationResult(result);
      setShowResultDialog(true);
      
      // Clear selection after successful operation
      if (result.successCount > 0) {
        onSelectionChange([]);
      }
    } catch (error) {
      console.error("Bulk range block failed:", error);
      setOperationResult({
        successCount: 0,
        failureCount: selectedIds.length,
        totalCount: selectedIds.length,
        failedIds: selectedIds,
        errors: [{ id: "all", error: error instanceof Error ? error.message : "Unknown error" }],
      });
      setShowResultDialog(true);
    } finally {
      setOperationInProgress(false);
      setRangeBlockReason("");
    }
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                  className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                />
                <span className="text-sm font-medium">
                  {selectedIds.length} of {items.length} selected
                </span>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevertDialog(true)}
                disabled={selectedIds.length === 0 || loading || operationInProgress}
              >
                Bulk Revert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRangeBlockDialog(true)}
                disabled={selectedIds.length === 0 || loading || operationInProgress}
              >
                Range Block
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {operationInProgress && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing bulk operation... This may take a moment.
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Revert Confirmation Dialog */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Revert</DialogTitle>
            <DialogDescription>
              You are about to reject {selectedIds.length} edit request{selectedIds.length !== 1 ? "s" : ""}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="revert-reason" className="text-sm font-medium">
                Reason for rejection (required)
              </label>
              <textarea
                id="revert-reason"
                className="mt-2 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter reason for bulk rejection..."
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
              />
            </div>

            {selectedIds.length > 100 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are about to process {selectedIds.length} items. This operation may take several minutes.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevertDialog(false);
                setRevertReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeBulkRevert}
              disabled={!revertReason.trim()}
            >
              Confirm Revert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Range Block Confirmation Dialog */}
      <Dialog open={showRangeBlockDialog} onOpenChange={setShowRangeBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Range Block</DialogTitle>
            <DialogDescription>
              You are about to block users associated with {selectedIds.length} edit request{selectedIds.length !== 1 ? "s" : ""}.
              This will reject the edits and log block actions for the users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="block-reason" className="text-sm font-medium">
                Reason for blocking (required)
              </label>
              <textarea
                id="block-reason"
                className="mt-2 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter reason for range block..."
                value={rangeBlockReason}
                onChange={(e) => setRangeBlockReason(e.target.value)}
              />
            </div>

            {selectedIds.length > 100 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are about to process {selectedIds.length} items. This operation may take several minutes.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRangeBlockDialog(false);
                setRangeBlockReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeBulkRangeBlock}
              disabled={!rangeBlockReason.trim()}
            >
              Confirm Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Operation Results</DialogTitle>
            <DialogDescription>
              Operation completed with the following results:
            </DialogDescription>
          </DialogHeader>

          {operationResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{operationResult.totalCount}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {operationResult.successCount}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {operationResult.failureCount}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Error Details */}
              {operationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Failed Items:</h4>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {operationResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription>
                          <span className="font-medium">ID: {error.id}</span>
                          <br />
                          {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
