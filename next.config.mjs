/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the embedded-Postgres WASM package out of the bundler (server-only).
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [
      // Cloudinary delivery
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
