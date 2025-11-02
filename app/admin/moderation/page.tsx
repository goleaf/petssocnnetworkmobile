"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Flag,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BlurredMedia } from '@/components/moderation/blurred-media';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { MediaModeration } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function ModerationQueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<MediaModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MediaModeration | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'flag'>('approve');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/moderation/queue');
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
      }
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedItem) return;

    setIsReviewing(true);
    try {
      const response = await fetch('/api/moderation/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderationId: selectedItem.id,
          action: reviewAction,
          reason: reviewReason || undefined,
          reviewedBy: 'admin', // In production, get from auth
        }),
      });

      if (response.ok) {
        await loadQueue();
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error reviewing moderation:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleToggleBlur = async (moderationId: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/moderation/blur-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderationId,
          blurOnWarning: !currentValue,
        }),
      });

      if (response.ok) {
        await loadQueue();
      }
    } catch (error) {
      console.error('Error toggling blur:', error);
    }
  };

  const getStatusBadge = (status: MediaModeration['status']) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      flagged: 'destructive',
      approved: 'default',
      rejected: 'destructive',
      reviewed: 'secondary',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Moderation Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review flagged images and videos for graphic content
          </p>
        </div>
        <Button onClick={loadQueue} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue ({queue.length} items)</CardTitle>
          <CardDescription>
            Items flagged for manual review or pending moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items in moderation queue</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blur On Warning</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-16 h-16 relative">
                        <BlurredMedia
                          src={item.mediaUrl}
                          alt="Moderation preview"
                          blurOnWarning={item.blurOnWarning}
                          isFlagged={item.status === 'flagged'}
                          moderationReason={item.reason}
                          width={64}
                          height={64}
                          type={item.mediaType}
                          className="rounded object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.mediaType.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {(item.moderationScore || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.reason ? (
                        <Badge variant="secondary">{item.reason}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.blurOnWarning}
                          onCheckedChange={() =>
                            handleToggleBlur(item.id, item.blurOnWarning)
                          }
                        />
                        {item.blurOnWarning ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Review Media Content</DialogTitle>
                            <DialogDescription>
                              Review flagged content and take appropriate action
                            </DialogDescription>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4">
                              <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                                <BlurredMedia
                                  src={selectedItem.mediaUrl}
                                  alt="Review content"
                                  blurOnWarning={selectedItem.blurOnWarning}
                                  isFlagged={selectedItem.status === 'flagged'}
                                  moderationReason={selectedItem.reason}
                                  type={selectedItem.mediaType}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Moderation Score</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {(selectedItem.moderationScore || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <Label>Auto Flagged</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedItem.autoFlagged ? 'Yes' : 'No'}
                                  </p>
                                </div>
                                {selectedItem.reason && (
                                  <div>
                                    <Label>Reason</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedItem.reason}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4 border-t pt-4">
                                <div>
                                  <Label>Action</Label>
                                  <Select
                                    value={reviewAction}
                                    onValueChange={(value) =>
                                      setReviewAction(
                                        value as 'approve' | 'reject' | 'flag'
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="approve">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4" />
                                          Approve
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="reject">
                                        <div className="flex items-center gap-2">
                                          <XCircle className="h-4 w-4" />
                                          Reject
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="flag">
                                        <div className="flex items-center gap-2">
                                          <Flag className="h-4 w-4" />
                                          Keep Flagged
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Reason (optional)</Label>
                                  <Select
                                    value={reviewReason}
                                    onValueChange={setReviewReason}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="graphic_content">
                                        Graphic Content
                                      </SelectItem>
                                      <SelectItem value="inappropriate">
                                        Inappropriate
                                      </SelectItem>
                                      <SelectItem value="violence">Violence</SelectItem>
                                      <SelectItem value="explicit">Explicit</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  onClick={handleReview}
                                  disabled={isReviewing}
                                  className="w-full"
                                >
                                  {isReviewing ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    'Submit Review'
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
