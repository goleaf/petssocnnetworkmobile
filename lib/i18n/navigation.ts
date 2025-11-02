/**
 * Locale-aware navigation utilities
 * Wrappers around Next.js navigation that respect the current locale
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from '@/i18n/routing';

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

