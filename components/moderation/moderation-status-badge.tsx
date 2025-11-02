"use client";

import { AlertTriangle, CheckCircle2, XCircle, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MediaModerationStatus } from '@/lib/types';

interface ModerationStatusBadgeProps {
  status: MediaModerationStatus;
  className?: string;
}

/**
 * Badge component to display moderation status
 */
export function ModerationStatusBadge({ status, className }: ModerationStatusBadgeProps) {
  const getVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
      case 'flagged':
        return 'destructive';
      case 'reviewed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'flagged':
        return <Flag className="h-3 w-3" />;
      case 'pending':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      <span className="flex items-center gap-1">
        {getIcon()}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </Badge>
  );
}

