/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix workspace detection
  outputFileTracingRoot: process.cwd(),
  
  // Minimal configuration for testing
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
