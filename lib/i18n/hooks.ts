"use client"

/**
 * Client-side i18n hooks for formatting
 */

import React from 'react';
import { useLocale } from 'next-intl';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatWeight,
  formatLength,
  formatDistance,
  getUnitSystemForLocale,
  getCurrencyForLocale,
  type UnitSystem,
} from './formatting';

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
  
  return (
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string }
  ) => {
    return formatDate(date, { ...options, locale });
  };
}

/**
 * Hook to format relative time with current locale
 * This hook ensures hydration-safe formatting by only formatting on the client
 */
export function useFormatRelativeTime() {
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  return (date: Date | string | number) => {
    // Only format relative time after component has mounted to avoid hydration mismatch
    if (!mounted) {
      // Return absolute date format during SSR
      return formatDate(date, { locale, dateStyle: 'short' });
    }
    return formatRelativeTime(date, locale);
  };
}

/**
 * Hook to format weight with automatic unit conversion
 */
export function useFormatWeight() {
  const locale = useLocale();
  const unitSystem = getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatWeight(value, customUnitSystem || unitSystem, locale);
  };
}

/**
 * Hook to format length with automatic unit conversion
 */
export function useFormatLength() {
  const locale = useLocale();
  const unitSystem = getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatLength(value, customUnitSystem || unitSystem, locale);
  };
}

/**
 * Hook to format distance with automatic unit conversion
 */
export function useFormatDistance() {
  const locale = useLocale();
  const unitSystem = getUnitSystemForLocale(locale);
  
  return (value: number, customUnitSystem?: UnitSystem) => {
    return formatDistance(value, customUnitSystem || unitSystem, locale);
  };
}

/**
 * Hook to get current unit system
 */
export function useUnitSystem(): UnitSystem {
  const locale = useLocale();
  return getUnitSystemForLocale(locale);
}

/**
 * Hook to get current currency
 */
export function useCurrency(): string {
  const locale = useLocale();
  return getCurrencyForLocale(locale);
}

