"use client"

/**
 * Client-side i18n hooks for formatting
 */

import React from 'react';
import { useAuth } from '@/lib/auth';
import { useLocale } from 'next-intl';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatWeight,
  formatLength,
  formatDistance,
  formatTemperature,
  getUnitSystemForLocale,
  getCurrencyForLocale,
  type UnitSystem,
} from './formatting';
import { usePreferences } from '@/lib/preferences';

/**
 * Hook to format numbers with current locale
 */
export function useFormatNumber() {
  const locale = useLocale();
  
  return (value: number, options?: Intl.NumberFormatOptions) => {
    return formatNumber(value, { ...options, locale });
  };
}

/**
 * Hook to format currency with current locale
 */
export function useFormatCurrency() {
  const locale = useLocale();
  const currency = getCurrencyForLocale(locale);
  
  return (value: number, customCurrency?: string) => {
    return formatCurrency(value, customCurrency || currency, locale);
  };
}

/**
 * Hook to format dates with current locale
 */
export function useFormatDate() {
  const locale = useLocale();
  const { user } = useAuth();
  const timeZone = user?.displayPreferences?.timezone;
  
  return (
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string }
  ) => {
    return formatDate(date, { ...options, locale, timeZone: options?.timeZone || timeZone });
  };
}

/**
 * Hook to format relative time with current locale
 * This hook ensures hydration-safe formatting by only formatting on the client
 */
export function useFormatRelativeTime() {
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);
  const { user } = useAuth();
  const _timeZone = user?.displayPreferences?.timezone;
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  return (date: Date | string | number) => {
    // Only format relative time after component has mounted to avoid hydration mismatch
    if (!mounted) {
      // Return absolute date format during SSR
      return formatDate(date, { locale, dateStyle: 'short', timeZone: _timeZone });
    }
    return formatRelativeTime(date, locale);
  };
}

/**
 * Hook to access current user's date/time display preferences
 */
export function useUserDateTimePrefs() {
  const { user } = useAuth();
  return React.useMemo(() => ({
    timestampDisplay: user?.displayPreferences?.timestampDisplay || 'relative',
    dateFormat: user?.displayPreferences?.dateFormat || 'MDY',
    timeFormat: user?.displayPreferences?.timeFormat || '12h',
    timeZone: user?.displayPreferences?.timezone,
    country: user?.displayPreferences?.country,
  }), [user]);
}

/**
 * Hook to format weight with automatic unit conversion
 */
export function useFormatWeight() {
  const locale = useLocale();
  const preferred = usePreferences((s) => s.unitSystem);
  const unitSystem = preferred ?? getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatWeight(value, customUnitSystem || unitSystem, locale);
  };
}

/**
 * Hook to format length with automatic unit conversion
 */
export function useFormatLength() {
  const locale = useLocale();
  const preferred = usePreferences((s) => s.unitSystem);
  const unitSystem = preferred ?? getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatLength(value, customUnitSystem || unitSystem, locale);
  };
}

/**
 * Hook to format distance with automatic unit conversion
 */
export function useFormatDistance() {
  const locale = useLocale();
  const preferred = usePreferences((s) => s.unitSystem);
  const unitSystem = preferred ?? getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatDistance(value, customUnitSystem || unitSystem, locale);
  };
}

/**
 * Hook to get current unit system
 */
export function useUnitSystem(): UnitSystem {
  const locale = useLocale();
  const preferred = usePreferences((s) => s.unitSystem);
  return preferred ?? getUnitSystemForLocale(locale);
}

/**
 * Hook to get current currency
 */
export function useCurrency(): string {
  const locale = useLocale();
  return getCurrencyForLocale(locale);
}

/**
 * Hook to format temperature with current unit preference
 */
export function useFormatTemperature() {
  const locale = useLocale();
  const preferred = usePreferences((s) => s.unitSystem);
  const unitSystem = preferred ?? getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatTemperature(value, customUnitSystem || unitSystem, locale);
  };
}
