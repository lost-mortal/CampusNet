// Per-tab session store. Uses sessionStorage (not localStorage) so simultaneous
// logins in different tabs of the same browser don't overwrite each other.
// localStorage is shared across all tabs of an origin — that caused the
// "Tanvi's session leaked into Priya's tab" bug.
//
// Trade-off: closing the tab clears the session (reloads survive). For a
// production app you'd swap this for an httpOnly cookie; everything else
// (login, JWT auth, sockets) keeps using these helpers unchanged.

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const ROLE_KEY = 'userRole';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession({ token, user }) {
  if (token !== undefined) sessionStorage.setItem(TOKEN_KEY, token);
  if (user !== undefined) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
