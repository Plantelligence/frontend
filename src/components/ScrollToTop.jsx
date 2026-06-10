/**
 * ScrollToTop - Rola a página para o topo a cada navegação.
 *
 * Ouve mudanças na rota (pathname) e executa window.scrollTo(0, 0).
 * Necessário porque o React Router não faz isso automaticamente
 * — sem esse componente, a página nova abre com a posição de scroll anterior.
 */

// Utilitario que faz scroll para o topo da pagina sempre que a rota muda.
// useEffect: executa o scroll após cada mudança de pathname
import { useEffect } from 'react';
// useLocation: provê o pathname atual da rota para monitorar mudanças
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  // Monitora a rota atual para detectar navegações
  const location = useLocation();

  // A cada mudança de pathname (nova página), rola para o topo instantaneamente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Componente invisível — não renderiza nada, apenas executa o efeito colateral
  return null;
}
