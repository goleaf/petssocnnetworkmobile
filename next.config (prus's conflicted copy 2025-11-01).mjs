/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests in development from local network
  allowedDevOrigins: ['192.168.1.120'],
}

export default nextConfig