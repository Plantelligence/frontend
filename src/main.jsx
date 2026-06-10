/**
 * main.jsx - Entry point da aplicação React.
 *
 * Monta o componente raiz (App) no elemento #root do index.html.
 * BrowserRouter envolve tudo para habilitar o roteamento client-side.
 * StrictMode ativado para detectar efeitos colaterais indesejados em desenvolvimento.
 */

// React é necessário mesmo sem JSX explícito em alguns builds
import React from 'react';
// createRoot: API moderna do React 18 para montagem do app (substitui ReactDOM.render)
import ReactDOM from 'react-dom/client';
// BrowserRouter: provedor de roteamento que usa a History API do navegador
import { BrowserRouter } from 'react-router-dom';
// Componente raiz que define toda a estrutura de rotas da aplicação
import App from './App.jsx';
// Estilos globais: reset, variáveis CSS e classes base do Tailwind
import './index.css';
// Aplica tema salvo antes de renderizar (evita flash)
// A importação do themeStore executa applyTheme() imediatamente, antes da primeira renderização
import './store/themeStore.js';

// Busca o elemento DOM onde o React vai montar o app (definido no index.html)
const rootElement = document.getElementById('root');

// Garante que o elemento existe antes de tentar montar — falha rápido se o HTML estiver errado
if (!rootElement) {
  throw new Error('Elemento raiz não encontrado para inicializar o app.');
}

// Monta o app React no elemento raiz usando o React 18 concurrent mode
ReactDOM.createRoot(rootElement).render(
  // StrictMode: em desenvolvimento, renderiza componentes duas vezes para detectar side effects
  <React.StrictMode>
    {/* BrowserRouter com flags de compatibilidade com React Router v7 futuro */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
