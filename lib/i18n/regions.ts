/**
 * Regional variations system for regulations and care guidelines
 * Provides region-specific content based on locale
 */

import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export type RegionCode =
  | 'us'
  | 'uk'
  | 'eu'
  | 'ca'
  | 'au'
  | 'jp'
  | 'cn'
  | 'kr';

export interface RegionalContent {
  region: RegionCode;
  regulations?: Record<string, string>;
  careGuidelines?: Record<string, string>;
  restrictions?: string[];
  requirements?: string[];
}

/**
 * Map locale to region code
 */
export function getRegionFromLocale(locale: string): RegionCode {
  // Extract country code from locale (e.g., 'en-US' -> 'us')
  const parts = locale.split('-');
  if (parts.length > 1) {
    const countryCode = parts[1].toLowerCase();
    
    // Map country codes to regions
    const regionMap: Record<string, RegionCode> = {
      us: 'us',
      gb: 'uk',
      ca: 'ca',
      au: 'au',
      jp: 'jp',
      cn: 'cn',
      kr: 'kr',
    };

    if (regionMap[countryCode]) {
      return regionMap[countryCode];
    }
  }

  // Map language codes to default regions
  const langCode = parts[0].toLowerCase();
  const langRegionMap: Record<string, RegionCode> = {
    en: 'us', // Default English to US
    de: 'eu',
    fr: 'eu',
    es: 'eu',
    it: 'eu',
    pt: 'eu',
    nl: 'eu',
    pl: 'eu',
    ru: 'eu',
    ja: 'jp',
    zh: 'cn',
    ko: 'kr',
  };

  return langRegionMap[langCode] || 'us';
}

/**
 * Get region-specific regulations (server-side)
 */
export async function getRegionalRegulations(
  region: RegionCode,
  locale?: string
): Promise<Record<string, string>> {
  // In a real implementation, this would fetch from a database or API
  // For now, we'll use translations
  const t = await getTranslations({ locale, namespace: 'Regulations' });
  
  // Example regulations structure
  const regulations: Record<string, string> = {
    vaccination: t(`${region}.vaccination`, { defaultValue: '' }),
    licensing: t(`${region}.licensing`, { defaultValue: '' }),
    leash: t(`${region}.leash`, { defaultValue: '' }),
    breed: t(`${region}.breed`, { defaultValue: '' }),
  };

  return regulations;
}

/**
 * Hook to get region-specific regulations (client-side)
 */
export function useRegionalRegulations(
  region: RegionCode
): Record<string, string> {
  const t = useTranslations('Regulations');
  
  const regulations: Record<string, string> = {
    vaccination: t(`${region}.vaccination`, { defaultValue: '' }),
    licensing: t(`${region}.licensing`, { defaultValue: '' }),
    leash: t(`${region}.leash`, { defaultValue: '' }),
    breed: t(`${region}.breed`, { defaultValue: '' }),
  };

  return regulations;
}

/**
 * Get region-specific care guidelines (server-side)
 */
export async function getRegionalCareGuidelines(
  region: RegionCode,
  locale?: string
): Promise<Record<string, string>> {
  const t = await getTranslations({ locale, namespace: 'CareGuidelines' });
  
  const guidelines: Record<string, string> = {
    feeding: t(`${region}.feeding`, { defaultValue: '' }),
    exercise: t(`${region}.exercise`, { defaultValue: '' }),
    grooming: t(`${region}.grooming`, { defaultValue: '' }),
    health: t(`${region}.health`, { defaultValue: '' }),
  };

  return guidelines;
}

/**
 * Hook to get region-specific care guidelines (client-side)
 */
export function useRegionalCareGuidelines(
  region: RegionCode
): Record<string, string> {
  const t = useTranslations('CareGuidelines');
  
  const guidelines: Record<string, string> = {
    feeding: t(`${region}.feeding`, { defaultValue: '' }),
    exercise: t(`${region}.exercise`, { defaultValue: '' }),
    grooming: t(`${region}.grooming`, { defaultValue: '' }),
    health: t(`${region}.health`, { defaultValue: '' }),
  };

  return guidelines;
}

/**
 * Check if a specific regulation applies to a region
 */
export function hasRegulation(region: RegionCode, regulation: string): boolean {
  // In a real implementation, this would check against a database
  // For now, return a simple check
  const regionRegulations: Record<RegionCode, string[]> = {
    us: ['vaccination', 'licensing', 'leash'],
    uk: ['vaccination', 'licensing', 'leash'],
    eu: ['vaccination', 'licensing', 'leash', 'microchipping'],
    ca: ['vaccination', 'licensing', 'leash'],
    au: ['vaccination', 'licensing', 'leash'],
    jp: ['vaccination', 'licensing'],
    cn: ['vaccination', 'licensing'],
    kr: ['vaccination', 'licensing'],
  };

  return regionRegulations[region]?.includes(regulation) || false;
}

/**
 * Get all applicable regulations for a region
 */
export function getRegulationsForRegion(region: RegionCode): string[] {
  const regionRegulations: Record<RegionCode, string[]> = {
    us: ['vaccination', 'licensing', 'leash'],
    uk: ['vaccination', 'licensing', 'leash'],
    eu: ['vaccination', 'licensing', 'leash', 'microchipping'],
    ca: ['vaccination', 'licensing', 'leash'],
    au: ['vaccination', 'licensing', 'leash'],
    jp: ['vaccination', 'licensing'],
    cn: ['vaccination', 'licensing'],
    kr: ['vaccination', 'licensing'],
  };

  return regionRegulations[region] || [];
}

