// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__testes__/configuracao.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
      ],
      // Threshold sobre o projeto inteiro (~2-3% pois pages/hooks/store não têm testes).
      // Os módulos testados individualmente têm cobertura de 80-100%.
      thresholds: {
        lines: 2,
      },
    },
  },
});
