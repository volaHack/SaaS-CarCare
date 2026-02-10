/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'http://10.0.2.2',
    'http://localhost',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://saas-carcare-production.up.railway.app/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig