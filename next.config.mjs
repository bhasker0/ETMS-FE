/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/uchapat',
        destination: '/karigar/uchapat',
        permanent: false,
      },
      {
        source: '/wage-hisab',
        destination: '/karigar/hisab',
        permanent: false,
      },
      {
        source: '/hisab',
        destination: '/karigar/hisab',
        permanent: false,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;

