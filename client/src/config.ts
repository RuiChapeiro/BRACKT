// Central client configuration. The API base URL comes from Vite env
// (VITE_API_BASE_URL) and defaults to the local API host for dev convenience.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5180';

/** localStorage key holding the JWT access token. */
export const TOKEN_KEY = 'brackt.token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);
