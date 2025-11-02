import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh', 'ko'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Use 'as-needed' to omit locale prefix for default locale
  localePrefix: 'as-needed'
});

