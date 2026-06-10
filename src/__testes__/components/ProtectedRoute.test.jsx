// Testes — Componente ProtectedRoute
// Verifica o guard de autenticação: redireciona sem sessão, renderiza com sessão.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock do authStore — controlamos o estado manualmente em cada teste
vi.mock('../../store/authStore.js', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '../../store/authStore.js';
import { ProtectedRoute } from '../../components/ProtectedRoute.jsx';

const PaginaProtegida = () => <div>Página protegida</div>;
const PaginaLogin = () => <div>Página de login</div>;

function renderComRota(estadoAuth) {
  useAuthStore.mockImplementation((selector) =>
    selector(estadoAuth)
  );

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<PaginaLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<PaginaProtegida />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {

  it('redireciona para /login quando não há usuário', () => {
    renderComRota({ user: null, tokens: null });
    expect(screen.getByText('Página de login')).toBeInTheDocument();
    expect(screen.queryByText('Página protegida')).not.toBeInTheDocument();
  });

  it('redireciona para /login quando há usuário mas não há tokens', () => {
    renderComRota({ user: { id: 'u1' }, tokens: null });
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  it('redireciona para /login quando o accessToken está vazio', () => {
    renderComRota({ user: { id: 'u1' }, tokens: { accessToken: '', refreshToken: '' } });
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  it('renderiza a página protegida quando o usuário tem sessão válida', () => {
    renderComRota({
      user: { id: 'u1', email: 'admin@planti.com' },
      tokens: { accessToken: 'token-valido', refreshToken: 'refresh-valido' },
    });
    expect(screen.getByText('Página protegida')).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });

  it('aceita sessão com refreshToken mas sem accessToken', () => {
    renderComRota({
      user: { id: 'u1' },
      tokens: { accessToken: '', refreshToken: 'refresh-ok' },
    });
    expect(screen.getByText('Página protegida')).toBeInTheDocument();
  });

});
