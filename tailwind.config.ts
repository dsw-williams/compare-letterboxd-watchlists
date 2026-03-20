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
        'bg-input': '#0d0f12',
        'bg-danger': '#2d1515',
        'border-subtle': '#2a2d35',
        'border-strong': '#3a3d45',
        'border-danger': '#5c2020',
        'text-primary': '#ffffff',
        'text-secondary': '#9ba3af',
        'text-tertiary': '#6b7280',
        'text-danger': '#f87171',
        'accent-green': '#00c030',
        'accent-green-hover': '#00a828',
        'accent-green-disabled': '#005518',
        'accent-orange': '#f97316',
        'star-yellow': '#f59e0b',
        'text-on-star': '#1a1a1a',
        'text-director': '#c9d1d9',
      },
      fontSize: {
        '11': ['11px', { lineHeight: '1' }],
        '13': ['13px', { lineHeight: '1.4' }],
        '15': ['15px', { lineHeight: '1.5' }],
        '17': ['17px', { lineHeight: '1.4' }],
        '22': ['22px', { lineHeight: '1' }],
        '26': ['26px', { lineHeight: '1.2' }],
      },
      fontFamily: {
        sans: ['Graphik', 'Arial Narrow', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
