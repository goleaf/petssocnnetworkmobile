import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable image optimization for better LCP
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow images from CDN and S3
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
    ],
    // Enable lazy loading by default
    minimumCacheTTL: 60,
  },
  trailingSlash: true,
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Allow cross-origin requests from local network IPs during development
  allowedDevOrigins: ['192.168.1.120'],
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default withNextIntl(nextConfig)
