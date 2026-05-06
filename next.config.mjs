/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Note: 'output: standalone' is unset by default so 'next start' works locally and
  // Vercel's default Next.js builder takes over in production.
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
