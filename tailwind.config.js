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
     