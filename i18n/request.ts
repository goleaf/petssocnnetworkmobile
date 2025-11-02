import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

// Static imports for all available message files
// Next.js requires static imports for proper bundling
import enMessages from '../messages/en.json';
import deMessages from '../messages/de.json';

// Message map with fallback to English for missing locales
const messagesMap: Record<string, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
  // Fallback other locales to English until their message files are created
  fr: enMessages,
  es: enMessages,
  it: enMessages,
  pt: enMessages,
  nl: enMessages,
  pl: enMessages,
  ru: enMessages,
  ja: enMessages,
  zh: enMessages,
  ko: enMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  // Get messages for the locale, fallback to English if not available
  const messages = messagesMap[locale] || messagesMap[routing.defaultLocale];

  return {
    locale,
    messages,
    // Enable fallback to default locale for missing translations
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter((part) => part != null).join('.');

      if (error.code === 'MISSING_MESSAGE') {
        // Fallback to English for missing translations
        return path;
      }

      return `Translation error: ${path}`;
    },
    // Configure timezone (can be made dynamic based on locale)
    timeZone: 'UTC',
    // Don't set 'now' to avoid hydration mismatches - let next-intl use its default
  };
});

