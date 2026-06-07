/**
 * ScrollToTop - Rola a página para o topo a cada navegação.
 *
 * Ouve mudanças na rota (pathname) e executa window.scrollTo(0, 0).
 * Necessário porque o React Router não faz isso automaticamente
 * — sem esse componente, a página nova abre com a posição de scroll anterior.
 */

// Utilitario que faz scroll para o topo da pagina sempre que a rota muda.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}
