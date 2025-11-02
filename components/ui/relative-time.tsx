"use client"

import React from 'react';
import { formatCommentDate } from '@/lib/utils/date';
import { formatRelativeTime } from '@/lib/i18n/formatting';
import { useLocale } from 'next-intl';

interface RelativeTimeProps {
  date: Date | string | number;
  className?: string;
  useShortFormat?: boolean;
}

/**
 * Client-side component for displaying relative time safely
 * Prevents hydration mismatches by only showing relative time after mount
 */
export function RelativeTime({ date, className, useShortFormat = false }: RelativeTimeProps) {
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);
  const [displayTime, setDisplayTime] = React.useState<string>('');

  React.useEffect(() => {
    setMounted(true);
    // Update time on mount and set up interval to update every minute
    const updateTime = () => {
      if (useShortFormat) {
        setDisplayTime(formatCommentDate(typeof date === 'string' ? date : date.toString()));
      } else {
        setDisplayTime(formatRelativeTime(date, locale));
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [date, locale, useShortFormat]);

  // During SSR or before mount, show absolute date format
  if (!mounted) {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const absoluteDate = dateObj.toLocaleDateString(locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return <span className={className} suppressHydrationWarning>{absoluteDate}</span>;
  }

  return <span className={className}>{displayTime}</span>;
}

