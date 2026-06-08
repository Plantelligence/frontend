/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
          raised: 'var(--color-surface-raised)',
        },
        'token-border': {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        brand: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          subtle: 'var(--color-primary-subtle)',
        },
        primary: {
          DEFAULT: '#C0392B',
          foreground: '#FFFFFF',
        },
      },
      boxShadow: {
        token: 'var(--shadow-sm)',
        'token-md': 'var(--shadow-md)',
        'token-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
