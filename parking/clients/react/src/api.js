import { createApi } from '../../shared/api.js';

const TOKEN_KEY = 'parking_token';

// The page and the API share an origin, so paths stay relative.
export const api = createApi('', () => localStorage.getItem(TOKEN_KEY));

export const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY));
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
