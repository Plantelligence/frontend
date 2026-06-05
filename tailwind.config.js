/** Configuração tipada do Tailwind. @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#b42318',
          foreground: '#fff7ed'
        }
      }
    }
  },
  plugins: []
};
