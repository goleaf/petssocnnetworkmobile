/**
 * Internationalization formatting utilities
 * Provides locale-aware formatting for dates, numbers, currencies, and units
 */

import { getLocale } from 'next-intl/server';

export type UnitSystem = 'metric' | 'imperial';

export interface FormattingOptions {
  locale?: string;
  unitSystem?: UnitSystem;
  currency?: string;
  timeZone?: string;
}

/**
 * Get the preferred unit system for a locale
 */
export function getUnitSystemForLocale(locale: string): UnitSystem {
  // Countries that primarily use imperial system
  const imperialLocales = ['en-US', 'en-GB'];
  
  // Check if locale matches imperial countries
  if (imperialLocales.some(imp => locale.startsWith(imp))) {
    return 'imperial';
  }
  
  // Default to metric for most locales
  return 'metric';
}

/**
 * Get the default currency for a locale
 */
export function getCurrencyForLocale(locale: string): string {
  const currencyMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    'de': 'EUR',
    'fr': 'EUR',
    'es': 'EUR',
    'it': 'EUR',
    'pt': 'EUR',
    'nl': 'EUR',
    'pl': 'PLN',
    'ru': 'RUB',
    'ja': 'JPY',
    'zh': 'CNY',
    'ko': 'KRW',
  };

  // Check exact match first
  if (currencyMap[locale]) {
    return currencyMap[locale];
  }

  // Check language code match
  const langCode = locale.split('-')[0];
  if (currencyMap[langCode]) {
    return currencyMap[langCode];
  }

  // Default to USD
  return 'USD';
}

/**
 * Convert weight from metric to imperial or vice versa
 */
export function convertWeight(
  value: number,
  from: UnitSystem,
  to: UnitSystem
): number {
  if (from === to) return value;

  if (from === 'metric' && to === 'imperial') {
    // kg to lb
    return value * 2.20462;
  } else {
    // lb to kg
    return value * 0.453592;
  }
}

/**
 * Convert length from metric to imperial or vice versa
 */
export function convertLength(
  value: number,
  from: UnitSystem,
  to: UnitSystem
): number {
  if (from === to) return value;

  if (from === 'metric' && to === 'imperial') {
    // cm to inches
    return value * 0.393701;
  } else {
    // inches to cm
    return value * 2.54;
  }
}

/**
 * Convert distance from metric to imperial or vice versa
 */
export function convertDistance(
  value: number,
  from: UnitSystem,
  to: UnitSystem
): number {
  if (from === to) return value;

  if (from === 'metric' && to === 'imperial') {
    // km to miles
    return value * 0.621371;
  } else {
    // miles to km
    return value * 1.60934;
  }
}

/**
 * Format a number according to locale
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions & { locale?: string }
): string {
  const { locale, ...formatOptions } = options || {};
  const defaultLocale = locale || 'en-US';
  
  return new Intl.NumberFormat(defaultLocale, {
    ...formatOptions,
  }).format(value);
}

/**
 * Format a currency value according to locale
 */
export function formatCurrency(
  value: number,
  currency?: string,
  locale?: string
): string {
  const defaultLocale = locale || 'en-US';
  const defaultCurrency = currency || getCurrencyForLocale(defaultLocale);

  return new Intl.NumberFormat(defaultLocale, {
    style: 'currency',
    currency: defaultCurrency,
  }).format(value);
}

/**
 * Format a date according to locale
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions & { locale?: string; timeZone?: string }
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const { locale, timeZone, ...formatOptions } = options || {};
  const defaultLocale = locale || 'en-US';
  const defaultTimeZone = timeZone || 'UTC';

  return new Intl.DateTimeFormat(defaultLocale, {
    ...formatOptions,
    timeZone: defaultTimeZone,
  }).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * Note: This function should only be used on the client side to avoid hydration mismatches
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale?: string,
  referenceDate?: Date
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;

  const defaultLocale = locale || 'en-US';
  const rtf = new Intl.RelativeTimeFormat(defaultLocale, { numeric: 'auto' });

  // Use provided reference date or current time (only on client)
  const now = referenceDate || (typeof window !== 'undefined' ? new Date() : new Date(0));
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);

  const intervals: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of intervals) {
    const interval = Math.floor(Math.abs(diffInSeconds) / secondsInUnit);
    if (interval >= 1) {
      return rtf.format(diffInSeconds < 0 ? -interval : interval, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Format weight with automatic unit conversion
 */
export function formatWeight(
  value: number,
  unitSystem: UnitSystem,
  locale?: string
): string {
  const unit = unitSystem === 'metric' ? 'kg' : 'lb';
  const formattedValue = formatNumber(value, {
    locale,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formattedValue} ${unit}`;
}

/**
 * Format length with automatic unit conversion
 */
export function formatLength(
  value: number,
  unitSystem: UnitSystem,
  locale?: string
): string {
  const unit = unitSystem === 'metric' ? 'cm' : 'in';
  const formattedValue = formatNumber(value, {
    locale,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formattedValue} ${unit}`;
}

/**
 * Format distance with automatic unit conversion
 */
export function formatDistance(
  value: number,
  unitSystem: UnitSystem,
  locale?: string
): string {
  const unit = unitSystem === 'metric' ? 'km' : 'mi';
  const formattedValue = formatNumber(value, {
    locale,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formattedValue} ${unit}`;
}

