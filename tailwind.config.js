/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Tokens semânticos — lidos das CSS vars definidas em index.css */
        bg:      'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt:     'var(--color-surface-alt)',
          raised:  'var(--color-surface-raised)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
        },
        brand: {
          DEFAULT: 'var(--color-primary)',
          hover:   'var(--color-primary-hover)',
          subtle:  'var(--color-primary-subtle)',
          muted:   'var(--color-primary-muted)',
        },
        feedback: {
          success:       'var(--color-success)',
          'success-bg':  'var(--color-success-subtle)',
          warning:       'var(--color-warning)',
          'warning-bg':  'var(--color-warning-subtle)',
          error:         'var(--color-error)',
          'error-bg':    'var(--color-error-subtle)',
          info:          'var(--color-info)',
          'info-bg':     'var(--color-info-subtle)',
        },
        /* Compatibilidade com código existente */
        primary: {
          DEFAULT: '#C0392B',
          foreground: '#FFFFFF',
        },
      },
      boxShadow: {
        token:      'var(--shadow-sm)',
        'token-md': 'var(--shadow-md)',
        'token-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        token:      'var(--radius-md)',
        'token-sm': 'var(--radius-sm)',
        'token-lg': 'var(--radius-lg)',
        'token-xl': 'var(--radius-xl)',
      },
    },
  },
  plugins: [],
};
