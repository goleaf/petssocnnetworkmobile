/**
 * CDN configuration and utilities for media assets
 * Integrates with AWS S3 CloudFront or similar CDN
 */

/**
 * CDN configuration
 */
export interface CDNConfig {
  /** Base URL of the CDN (e.g., https://d1234567890.cloudfront.net) */
  baseUrl: string;
  /** S3 bucket name */
  bucketName: string;
  /** Whether to use CDN for all media */
  enabled: boolean;
}

/**
 * Get CDN configuration from environment variables
 */
export function getCDNConfig(): CDNConfig {
  const baseUrl = process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_S3_BUCKET_URL || '';
  const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
  const enabled = process.env.NEXT_PUBLIC_CDN_ENABLED === 'true' || !!baseUrl;

  return {
    baseUrl,
    bucketName,
    enabled,
  };
}

/**
 * Get CDN URL for a media asset
 * @param key - S3 object key or relative path
 * @returns Full CDN URL if CDN is enabled, otherwise returns the key as-is
 */
export function getCDNUrl(key: string): string {
  const config = getCDNConfig();

  if (!config.enabled || !config.baseUrl) {
    return key;
  }

  // Remove leading slash if present
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;

  // If key already contains http/https, return as-is
  if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
    return cleanKey;
  }

  // Construct CDN URL
  const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
  return `${baseUrl}/${cleanKey}`;
}

/**
 * Get optimized image URL with CDN and query parameters
 * @param key - S3 object key or relative path
 * @param options - Image optimization options
 */
export function getOptimizedImageUrl(
  key: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  }
): string {
  const url = getCDNUrl(key);

  // If using CloudFront or similar CDN with image transformation
  // Add query parameters for optimization
  if (options && (options.width || options.height || options.quality || options.format)) {
    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    return `${url}?${params.toString()}`;
  }

  return url;
}

/**
 * Check if a URL is from CDN
 */
export function isCDNUrl(url: string): boolean {
  const config = getCDNConfig();
  if (!config.baseUrl) return false;
  
  try {
    const urlObj = new URL(url);
    const cdnUrl = new URL(config.baseUrl);
    return urlObj.hostname === cdnUrl.hostname || urlObj.hostname.endsWith('.cloudfront.net');
  } catch {
    return false;
  }
}

