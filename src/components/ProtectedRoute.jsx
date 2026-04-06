// Rota protegida que redireciona para /login se o usuario nao estiver autenticado.
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export const ProtectedRoute = () => {
  const { user, tokens } = useAuthStore((state) => ({
    user: state.user,
    tokens: state.tokens
  }));
  const hasSessionToken = Boolean(tokens?.accessToken || tokens?.refreshToken);

  if (!user || !hasSessionToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
