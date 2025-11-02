"use client";

import { useState, useEffect } from 'react';
import { getModerationStatus, shouldBlurMedia } from '../moderation';
import type { MediaModeration } from '../types';

interface UseModerationOptions {
  mediaUrl: string;
  blurOnWarningEnabled?: boolean;
}

interface UseModerationResult {
  moderation: MediaModeration | null;
  isFlagged: boolean;
  shouldBlur: boolean;
  loading: boolean;
}

/**
 * Hook to check moderation status for media
 */
export function useModeration({
  mediaUrl,
  blurOnWarningEnabled = true,
}: UseModerationOptions): UseModerationResult {
  const [moderation, setModeration] = useState<MediaModeration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mediaUrl) {
      setLoading(false);
      return;
    }

    // Check moderation status
    const status = getModerationStatus(mediaUrl);
    setModeration(status);
    setLoading(false);
  }, [mediaUrl]);

  const isFlagged = moderation?.status === 'flagged' || moderation?.autoFlagged || false;
  const shouldBlur = shouldBlurMedia(mediaUrl, blurOnWarningEnabled);

  return {
    moderation,
    isFlagged,
    shouldBlur,
    loading,
  };
}

