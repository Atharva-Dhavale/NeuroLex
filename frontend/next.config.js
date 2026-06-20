/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained build for small, efficient Docker images
  output: 'standalone',
  webpack: (config) => {
    // Required for tesseract.js and some other libraries to work properly in Next.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      os: false,
      stream: false,
      zlib: false,
    };

    // pdfjs-dist pulls in the native `canvas` module for Node-side rendering,
    // which must never be bundled (it ships a .node binary). We only use pdfjs
    // in the browser, so alias canvas to false.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    return config;
  },
};

module.exports = nextConfig; 