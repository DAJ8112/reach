import { useEffect, useState } from 'react';

export type Route = 'home' | 'settings';

function read(): Route {
  if (typeof window === 'undefined') return 'home';
  const h = window.location.hash.replace(/^#/, '');
  if (h === '/settings' || h === 'settings') return 'settings';
  return 'home';
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const sync = () => setRoute(read());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  return route;
}

export function navigate(path: '/' | '/settings') {
  window.location.hash = path === '/' ? '' : path;
  if (path === '/') {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}
