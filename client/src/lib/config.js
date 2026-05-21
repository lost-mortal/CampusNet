// Centralized client config. Imported transitively via lib/api.js so the throw
// fires at app startup, before any component renders, if env vars are missing.

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

if (!API_URL) {
  throw new Error(
    'VITE_API_URL is not set. Create client/.env (see client/.env.example) ' +
    'or set it in your deployment dashboard before building.'
  );
}

export { API_URL, SOCKET_URL };
