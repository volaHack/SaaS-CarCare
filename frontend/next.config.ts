import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://10.0.2.2',
    'http://localhost',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://saas-carcare-production-54f9.up.railway.app/api/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
}

export default nextConfig