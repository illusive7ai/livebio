/** The two addresses the build writes in: the livebio server that supplies public GitHub data, and the livebio website. */
export const SERVICE_URL: string = __SERVICE_URL__;
export const SITE_URL: string = __SITE_URL__.endsWith('/') ? __SITE_URL__ : `${__SITE_URL__}/`;

/** An address on the website: the home page, or one of its tabs, opened for a person when a login is given. */
export function siteLink(route: '' | 'wrapped' | 'linter' | 'studio' | 'templates' | 'extension', login: string | null = null): string {
  const user = login ? `?user=${encodeURIComponent(login)}` : '';
  return `${SITE_URL}${user}#/${route}`;
}
