
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'a.ltrbxd.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
    ],
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 256, 320, 384],
  },
};

export default nextConfig;
