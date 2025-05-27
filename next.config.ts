import type {NextConfig} from 'next';

/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,

  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
