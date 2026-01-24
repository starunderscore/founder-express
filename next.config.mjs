/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
    typedRoutes: true,
    serverActions: {
      allowedOrigins: ["*"]
    }
  },
  async redirects() {
    return [
      { source: '/employer/:path*', destination: '/employee/:path*', permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/icon/web/favicon.ico' },
    ];
  }
};

export default nextConfig;
