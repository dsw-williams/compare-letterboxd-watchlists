
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'a.ltrbxd.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
    ],
  },
};

export default nextConfig;
