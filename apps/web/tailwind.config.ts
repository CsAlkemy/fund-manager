import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a2332',
          active: '#4a7c59',
          text: '#94a3b8',
          'text-active': '#ffffff',
        },
        brand: {
          primary: '#4a7c59',
          'primary-light': '#c5e1a5',
          accent: '#d4e157',
        },
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
