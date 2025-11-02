# Internationalization & Localization System

This directory contains the i18n (internationalization) and l10n (localization) infrastructure for the pet social network application.

## Features

### 1. Per-Page Translations with Fallbacks
- Translations are organized by namespace (e.g., `HomePage`, `Common`)
- Automatic fallback to default locale (English) for missing translations
- Type-safe translation keys

### 2. Unit/Date/Currency Auto-Conversion
- Automatic unit system detection (metric/imperial) based on locale
- Currency formatting based on locale
- Date/time formatting with locale support
- Relative time formatting (e.g., "2 hours ago")

### 3. Regional Variations
- Region-specific regulations and care guidelines
- Automatic region detection from locale
- Support for multiple regions: US, UK, EU, CA, AU, JP, CN, KR

### 4. Glossary System
- Localized pet care terms (e.g., "lead" vs "leash")
- Term aliases to handle regional variations
- Server-side and client-side hooks

## Usage

### Translations

#### Server Components
```tsx
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

#### Client Components
```tsx
'use client'
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

### Formatting

#### Currency
```tsx
import { useFormatCurrency } from '@/lib/i18n/hooks';

function PriceDisplay({ amount }: { amount: number }) {
  const formatCurrency = useFormatCurrency();
  return <span>{formatCurrency(amount)}</span>;
}
```

#### Dates
```tsx
import { useFormatDate, useFormatRelativeTime } from '@/lib/i18n/hooks';

function DateDisplay({ date }: { date: Date }) {
  const formatDate = useFormatDate();
  const formatRelative = useFormatRelativeTime();
  
  return (
    <div>
      <span>{formatDate(date, { dateStyle: 'long' })}</span>
      <span>{formatRelative(date)}</span>
    </div>
  );
}
```

#### Units
```tsx
import { useFormatWeight, useFormatLength } from '@/lib/i18n/hooks';

function PetInfo({ weight, height }: { weight: number; height: number }) {
  const formatWeight = useFormatWeight();
  const formatLength = useFormatLength();
  
  return (
    <div>
      <p>Weight: {formatWeight(weight)}</p>
      <p>Height: {formatLength(height)}</p>
    </div>
  );
}
```

### Glossary Terms
```tsx
import { useGlossaryTerm } from '@/lib/i18n/glossary';

function EquipmentList() {
  const leash = useGlossaryTerm('leash');
  const collar = useGlossaryTerm('collar');
  
  return (
    <ul>
      <li>{leash}</li>
      <li>{collar}</li>
    </ul>
  );
}
```

### Regional Variations
```tsx
import { useRegionalRegulations, getRegionFromLocale } from '@/lib/i18n/regions';
import { useLocale } from 'next-intl';

function RegulationsDisplay() {
  const locale = useLocale();
  const region = getRegionFromLocale(locale);
  const regulations = useRegionalRegulations(region);
  
  return (
    <div>
      <h2>Vaccination Requirements</h2>
      <p>{regulations.vaccination}</p>
    </div>
  );
}
```

### Navigation
```tsx
import { Link, useRouter } from '@/lib/i18n/navigation';

function NavigationMenu() {
  const router = useRouter();
  
  return (
    <nav>
      <Link href="/blog">Blog</Link>
      <Link href="/wiki">Wiki</Link>
    </nav>
  );
}
```

## File Structure

```
lib/i18n/
├── formatting.ts    # Unit/date/currency formatting utilities
├── glossary.ts      # Glossary system for localized terms
├── regions.ts       # Regional variations system
├── navigation.ts    # Locale-aware navigation wrappers
└── hooks.ts         # Client-side formatting hooks

messages/
├── en.json          # English translations
├── de.json          # German translations
└── ...              # Other locales

i18n/
├── routing.ts       # Routing configuration
└── request.ts       # Request configuration
```

## Adding New Translations

1. Add keys to `messages/en.json` (base language)
2. Add translations to other locale files (e.g., `messages/de.json`)
3. Use in components with `useTranslations` or `getTranslations`

## Supported Locales

- English (en)
- German (de)
- French (fr)
- Spanish (es)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Polish (pl)
- Russian (ru)
- Japanese (ja)
- Chinese (zh)
- Korean (ko)

## Configuration

The i18n system is configured in:
- `i18n/routing.ts` - Supported locales and routing configuration
- `i18n/request.ts` - Request configuration and message loading
- `middleware.ts` - Locale detection and routing

