const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH,
  images: {
    domains: [
      'images.unsplash.com',
      'i.ibb.co',
      'scontent.fotp8-1.fna.fbcdn.net',
    ],
    unoptimized: true,
  },
  webpack: (config) => {
    // Allow imports like 'styles/...', 'components/...', etc. (old Horizon template style)
    config.resolve.alias = {
      ...config.resolve.alias,
      styles: path.join(__dirname, 'src/styles'),
      components: path.join(__dirname, 'src/components'),
      variables: path.join(__dirname, 'src/variables'),
      contexts: path.join(__dirname, 'src/contexts'),
      utils: path.join(__dirname, 'src/utils'),
      types: path.join(__dirname, 'src/types'),
      routes: path.join(__dirname, 'src/routes.tsx'),
    };
    return config;
  },
};

module.exports = nextConfig;
