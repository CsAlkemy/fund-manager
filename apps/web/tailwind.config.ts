import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'logo-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.6' },
        },
        'blob-1': {
          '0%, 100%': { transform: 'translate(0,0) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(-3px,-4px) scale(1.06) rotate(-5deg)' },
          '66%': { transform: 'translate(2px,3px) scale(0.96) rotate(4deg)' },
        },
        'blob-2': {
          '0%, 100%': { transform: 'translate(0,0) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(4px,2px) scale(0.95) rotate(6deg)' },
          '66%': { transform: 'translate(-3px,-2px) scale(1.05) rotate(-4deg)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'logo-pulse': 'logo-pulse 1.4s ease-in-out infinite',
        'blob-1': 'blob-1 2.4s ease-in-out infinite',
        'blob-2': 'blob-2 2.4s ease-in-out infinite',
      },
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
