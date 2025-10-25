/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,          // Enables React strict mode
  swcMinify: true,                // Use SWC compiler for faster minification
  output: 'standalone',           // Optional: for Docker/standalone builds
  experimental: {
    // Remove appDir here! It's stable now in Next 14
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',           // Allow external images from any domain (adjust if needed)
      },
    ],
  },
  eslint: {
    dirs: ['pages', 'components', 'app'], // Lint these directories
  },
};

module.exports = nextConfig;
