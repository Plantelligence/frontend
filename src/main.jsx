/**
 * main.jsx - Entry point da aplicação React.
 *
 * Monta o componente raiz (App) no elemento #root do index.html.
 * BrowserRouter envolve tudo para habilitar o roteamento client-side.
 * StrictMode ativado para detectar efeitos colaterais indesejados em desenvolvimento.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
// Aplica tema salvo antes de renderizar (evita flash)
import './store/themeStore.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz não encontrado para inicializar o app.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
