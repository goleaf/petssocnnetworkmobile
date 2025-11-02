/**
 * Largest Contentful Paint (LCP) optimization utilities
 * Target: LCP under 2.5s on 3G networks
 */

/**
 * Preload critical resources for faster LCP
 */
export function preloadCriticalResources(urls: string[]): void {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = url.endsWith('.css') ? 'style' : url.match(/\.(jpg|jpeg|png|webp|avif)$/i) ? 'image' : 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to external domains for faster resource loading
 */
export function preconnectToDomains(domains: string[]): void {
  if (typeof window === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Add DNS prefetch hints for external resources
 */
export function dnsPrefetch(domains: string[]): void {
  if (typeof window === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Measure and report LCP if needed
 */
export function measureLCP(callback?: (lcp: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
        startTime?: number;
      };

      const lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime || 0;
      
      if (callback) {
        callback(lcp);
      }

      // Log warning if LCP exceeds target
      if (lcp > 2500) {
        console.warn(`LCP exceeded target: ${lcp}ms (target: 2500ms)`);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.error('Failed to measure LCP:', error);
  }
}

/**
 * Initialize LCP optimizations
 * Call this in your root layout or app initialization
 */
export function initLCPOptimizations(options?: {
  preloadUrls?: string[];
  preconnectDomains?: string[];
  dnsPrefetchDomains?: string[];
}): void {
  if (typeof window === 'undefined') return;

  // Preload critical resources
  if (options?.preloadUrls) {
    preloadCriticalResources(options.preloadUrls);
  }

  // Preconnect to CDN and API domains
  if (options?.preconnectDomains) {
    preconnectToDomains(options.preconnectDomains);
  }

  // DNS prefetch for external resources
  if (options?.dnsPrefetchDomains) {
    dnsPrefetch(options.dnsPrefetchDomains);
  }

  // Measure LCP
  measureLCP();
}

