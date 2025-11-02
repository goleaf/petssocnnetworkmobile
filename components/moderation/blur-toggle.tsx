"use client";

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { readData, writeData } from '@/lib/storage';

const STORAGE_KEY = 'blurOnWarning';

interface BlurToggleProps {
  className?: string;
}

/**
 * BlurToggle component for user settings
 * Allows users to enable/disable blur-on-warning for flagged content
 */
export function BlurToggle({ className }: BlurToggleProps) {
  const [blurOnWarning, setBlurOnWarning] = useState(() => {
    if (typeof window !== 'undefined') {
      return readData(STORAGE_KEY, true);
    }
    return true;
  });

  useEffect(() => {
    // Listen for changes from other components
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

  const handleToggle = (checked: boolean) => {
    setBlurOnWarning(checked);
    writeData(STORAGE_KEY, checked);
    
    // Dispatch custom event so components can react to changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('blurOnWarningChanged', { detail: { enabled: checked } })
      );
    }
  };

  return (
    <TooltipProvider>
      <div className={className}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="blur-toggle" className="cursor-pointer">
              Blur Flagged Content
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                  {blurOnWarning ? (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {blurOnWarning
                    ? 'Flagged content is blurred. Click to disable.'
                    : 'Flagged content is visible. Click to enable blur.'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="blur-toggle"
            checked={blurOnWarning}
            onCheckedChange={handleToggle}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          When enabled, content flagged for review will be blurred until you choose to reveal it.
        </p>
      </div>
    </TooltipProvider>
  );
}

