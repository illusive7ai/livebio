import { useEffect, useState } from 'react';

export type Route = 'home' | 'templates' | 'studio';

const ROUTES: Route[] = ['home', 'templates', 'studio'];

function read(): Route {
  const name = window.location.hash.replace(/^#\/?/, '');
  return ROUTES.find((route) => route === name) ?? 'home';
}

/** The page the address bar points at. Hash links keep this working on a static host. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function routeHref(route: Route): string {
  return route === 'home' ? '#/' : `#/${route}`;
}

export function go(route: Route): void {
  window.location.hash = routeHref(route);
}
