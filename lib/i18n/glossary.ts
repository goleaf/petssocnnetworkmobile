/**
 * Glossary system for localized pet care terms
 * Handles regional variations (e.g., "lead" vs "leash")
 */

import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

export type GlossaryTerm =
  | 'lead'
  | 'leash'
  | 'collar'
  | 'harness'
  | 'food'
  | 'treat'
  | 'toy'
  | 'vet'
  | 'veterinarian'
  | 'grooming'
  | 'training'
  | 'walk'
  | 'exercise';

/**
 * Get a localized glossary term (server-side)
 */
export async function getGlossaryTerm(
  term: GlossaryTerm,
  locale?: string
): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'Glossary' });
  return t(term);
}

/**
 * Hook to get a localized glossary term (client-side)
 */
export function useGlossaryTerm(term: GlossaryTerm): string {
  const t = useTranslations('Glossary');
  return t(term);
}

/**
 * Get multiple glossary terms at once (server-side)
 */
export async function getGlossaryTerms(
  terms: GlossaryTerm[],
  locale?: string
): Promise<Record<GlossaryTerm, string>> {
  const t = await getTranslations({ locale, namespace: 'Glossary' });
  
  const result: Partial<Record<GlossaryTerm, string>> = {};
  for (const term of terms) {
    result[term] = t(term);
  }
  
  return result as Record<GlossaryTerm, string>;
}

/**
 * Hook to get multiple glossary terms at once (client-side)
 */
export function useGlossaryTerms(
  terms: GlossaryTerm[]
): Record<GlossaryTerm, string> {
  const t = useTranslations('Glossary');
  
  const result: Partial<Record<GlossaryTerm, string>> = {};
  for (const term of terms) {
    result[term] = t(term);
  }
  
  return result as Record<GlossaryTerm, string>;
}

/**
 * Term aliases - maps equivalent terms across regions
 * For example, "lead" (UK) and "leash" (US) refer to the same thing
 */
export const TERM_ALIASES: Record<string, GlossaryTerm[]> = {
  lead: ['lead', 'leash'],
  leash: ['lead', 'leash'],
  collar: ['collar'],
  harness: ['harness'],
  food: ['food'],
  treat: ['treat'],
  toy: ['toy'],
  vet: ['vet', 'veterinarian'],
  veterinarian: ['vet', 'veterinarian'],
  grooming: ['grooming'],
  training: ['training'],
  walk: ['walk'],
  exercise: ['exercise'],
};

/**
 * Check if two terms are aliases (refer to the same thing)
 */
export function areTermsAliases(term1: string, term2: string): boolean {
  const aliases1 = TERM_ALIASES[term1.toLowerCase()] || [];
  const aliases2 = TERM_ALIASES[term2.toLowerCase()] || [];
  
  return (
    aliases1.includes(term2.toLowerCase() as GlossaryTerm) ||
    aliases2.includes(term1.toLowerCase() as GlossaryTerm) ||
    term1.toLowerCase() === term2.toLowerCase()
  );
}

/**
 * Find all aliases for a given term
 */
export function getTermAliases(term: string): GlossaryTerm[] {
  return TERM_ALIASES[term.toLowerCase()] || [term.toLowerCase() as GlossaryTerm];
}

