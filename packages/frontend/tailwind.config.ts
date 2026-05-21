import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', 50: '#eef2ff', 600: '#4f46e5', 700: '#4338ca' },
        mlbb: { gold: '#FFD700', blue: '#1E90FF', red: '#DC143C', dark: '#0f1923' },
      },
    },
  },
  plugins: [],
};

export default config;
