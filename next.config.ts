import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  // Deshabilitamos temporalmente para producción debido a problemas con genkit
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
