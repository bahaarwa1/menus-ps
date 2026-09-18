/** @type {import('next').NextConfig} */
// Build timestamp: 2026-09-19 00:20 UTC
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/demo/:path*',
        destination: 'https://menus-ps-demo.vercel.app/demo/:path*',
        permanent: false,
      },
      {
        source: '/demo',
        destination: 'https://menus-ps-demo.vercel.app',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
