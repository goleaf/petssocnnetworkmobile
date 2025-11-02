"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { readData } from '@/lib/storage';

interface BlurredMediaProps {
  src: string;
  alt: string;
  blurOnWarning: boolean;
  isFlagged: boolean;
  moderationReason?: string;
  className?: string;
  width?: number;
  height?: number;
  type?: 'image' | 'video';
}

/**
 * BlurredMedia component that blurs flagged content with option to reveal
 */
export function BlurredMedia({
  src,
  alt,
  blurOnWarning: propBlurOnWarning,
  isFlagged,
  moderationReason,
  className,
  width,
  height,
  type = 'image',
}: BlurredMediaProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [blurOnWarning, setBlurOnWarning] = useState(() => {
    if (propBlurOnWarning !== undefined) return propBlurOnWarning;
    if (typeof window !== 'undefined') {
      return readData('blurOnWarning', true);
    }
    return true;
  });

  useEffect(() => {
    // Listen for blur setting changes
    const handleChange = (event: CustomEvent) => {
      if (event.detail?.enabled !== undefined) {
        setBlurOnWarning(event.detail.enabled);
      }
    };

    window.addEventListener('blurOnWarningChanged', handleChange as EventListener);
    return () => {
      window.removeEventListener('blurOnWarningChanged', handleChange as EventListener);
    };
  }, []);

  const shouldBlur = blurOnWarning && isFlagged && !isRevealed;

  if (type === 'video') {
    return (
      <div className={cn('relative', className)}>
        <div className={cn('relative overflow-hidden rounded-lg', shouldBlur && 'blur-lg')}>
          <video
            src={src}
            controls
            className="w-full h-auto"
            style={{ maxWidth: width, maxHeight: height }}
          />
        </div>
        {shouldBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-yellow-400" />
            <p className="text-white font-medium text-center px-4">
              {moderationReason
                ? `This content has been flagged: ${moderationReason}`
                : 'This content has been flagged for review'}
            </p>
            <Button
              variant="secondary"
              onClick={() => setIsRevealed(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Reveal Content
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('relative', className)}>
        <div className={cn('relative overflow-hidden', shouldBlur && 'blur-lg')}>
          <Image
            src={src}
            alt={alt}
            width={width || 800}
            height={height || 600}
            className="w-full h-auto"
            unoptimized
          />
        </div>
        {shouldBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 rounded-lg">
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-12 w-12 text-yellow-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {moderationReason
                    ? `Flagged: ${moderationReason}`
                    : 'Content flagged for review'}
                </p>
              </TooltipContent>
            </Tooltip>
            <p className="text-white font-medium text-center px-4">
              {moderationReason
                ? `This content has been flagged: ${moderationReason}`
                : 'This content has been flagged for review'}
            </p>
            <Button
              variant="secondary"
              onClick={() => setIsRevealed(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Reveal Content
            </Button>
          </div>
        )}
        {isRevealed && (
          <div className="absolute top-2 right-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRevealed(false)}
                  className="gap-2 bg-background/80"
                >
                  <EyeOff className="h-4 w-4" />
                  Hide
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Blur this content again</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

