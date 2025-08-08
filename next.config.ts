import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  /* // HEMOS DESACTIVADO ESTO TEMPORALMENTE PARA VER LOS ERRORES REALES
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  */

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
