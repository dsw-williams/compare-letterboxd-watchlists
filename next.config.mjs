

const nextConfig = {
  images: {
    domains: ['image.tmdb.org', 'a.ltrbxd.com', 'secure.gravatar.com'],
  },
  experimental: {
    serverComponentsExternalPackages: [
      'playwright',
      'playwright-extra',
      'puppeteer-extra',
      'puppeteer-extra-plugin-stealth',
      'puppeteer-extra-plugin',
      'clone-deep',
      'merge-deep',
    ],
  },
};

export default nextConfig;
