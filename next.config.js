/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for Runpod deployment
  output: 'standalone',
  // Configure API routes
  serverRuntimeConfig: {
    // Will only be available on the server side
    maxUploadSize: '500mb',
  },
  // Add rewrites for API requests to forward to the backend server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8618/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
