/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'images.clerk.dev', 'img.clerk.com'],
  },
}

module.exports = nextConfig