import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#141414',
        'bg-card': '#1e2128',
        'bg-card-hover': '#252830',
        'border-subtle': '#2a2d35',
        'text-primary': '#ffffff',
        'text-secondary': '#9ba3af',
        'text-tertiary': '#6b7280',
        'accent-green': '#00c030',
        'accent-green-hover': '#00a828',
        'accent-orange': '#f97316',
        'star-yellow': '#f59e0b',
      },
      fontFamily: {
        sans: ['Graphik', 'Arial Narrow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
