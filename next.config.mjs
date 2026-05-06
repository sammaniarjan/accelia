/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // pdf-parse pulls in test fixtures it doesn't need at runtime; mark it external
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
