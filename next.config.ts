import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'acmeozfrryxpagpshhkm.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/report-media/**',
      },
    ],
  },
};

export default nextConfig;
