/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the embedded-Postgres WASM package out of the bundler (server-only).
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [
      // Cloudflare Images delivery
      { protocol: "https", hostname: "imagedelivery.net" },
      { protocol: "https", hostname: "**.cloudflareimages.com" },
    ],
  },
};

export default nextConfig;
