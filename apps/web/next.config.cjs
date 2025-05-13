/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any specific Next.js configurations here
  // Example:
  // reactStrictMode: true,
  // images: {
  //   domains: ['example.com'],
  // },
  
  // Ensure experimental features match your needs, if any
  experimental: {
    // appDir: true, // Included by default in recent Next.js versions
  },

  // If you were previously using specific webpack configs, 
  // they might need adjustment for CommonJS format.
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   // Important: return the modified config
  //   return config
  // },
};

module.exports = nextConfig;
