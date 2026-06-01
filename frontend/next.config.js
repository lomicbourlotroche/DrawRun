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
  generateEtags: false,
  turbopack: {},
};

module.exports = withBundleAnalyzer(nextConfig);
