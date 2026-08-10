/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'drawrun.fr',
      },
    ],
  },
  poweredByHeader: false,
  generateEtags: false, // Disabled for API-only backend; re-enable if serving static assets
  turbopack: {},
};

module.exports = withBundleAnalyzer(nextConfig);
