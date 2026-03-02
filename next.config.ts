import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from common sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fisiohub.com.br' },
    ],
  },
  // Experimental features for App Router
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.fisiohub.com.br'],
    },
  },
}

export default nextConfig
