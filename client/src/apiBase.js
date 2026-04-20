/**
 * Base URL for the Express API. Leave unset in dev so requests use same origin
 * and Vite proxies `/api` to the backend (see vite.config.js).
 * For a split deploy (e.g. static site + API host), set VITE_API_URL in `.env`.
 * referenced from https://react.dev/reference/react-dom/components/form
 */
export function apiUrl(path) {
  const raw = import.meta.env.VITE_API_URL ?? '';
  const base = raw.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
