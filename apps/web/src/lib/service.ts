/**
 * Address of the livebio server, set when the site is built (VITE_CONTRIBUTIONS_URL). It draws contribution data
 * for the preview, serves the reviews, and draws the live pictures that a copied README points at. Without it the
 * site still works, and the only way to publish is to host the files yourself.
 */
export const SERVICE_URL: string | undefined = (import.meta.env.VITE_CONTRIBUTIONS_URL as string | undefined) || undefined;
