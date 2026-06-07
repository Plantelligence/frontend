/**
 * AdminRoute - Guard de rota para administradores.
 *
 * Verifica se o usuário logado tem papel "Admin".
 * Se não, redireciona para o dashboard com substituição de histórico.
 * Usado nas rotas de /admin/* no App.jsx.
 */

// Rota restrita a administradores, redireciona para home se o usuario nao tiver permissao.
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export const AdminRoute = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
