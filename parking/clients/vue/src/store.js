import { reactive } from 'vue';
import { formatDateTime, isLanguage, translate } from '../../shared/i18n.js';
import { isValidLogin, loginError } from '../../shared/validation.js';
import { api, clearToken, hasToken, saveToken } from './api.js';

const LANGUAGE_KEY = 'parking_language';

function storedLanguage() {
  const code = localStorage.getItem(LANGUAGE_KEY);
  return isLanguage(code) ? code : 'en';
}

// The state every panel reads: language, lots, and who is signed in. Vue records which
// fields each component reads while rendering, and re-renders just those components when
// one of the fields changes.
export const state = reactive({
  language: storedLanguage(),
  lots: [],
  lastRefreshAt: null,
  loadError: null,
  user: null,
  // The session can end without a click (an expired token), so its message lives here
  // rather than in LoginPanel.
  authStatus: null,
});

// Reading state.language here is enough for every template that calls t() to update when
// the language changes.
export const t = (key, params) => translate(state.language, key, params);
export const formatDate = (value) => formatDateTime(state.language, value);

export function setLanguage(code) {
  if (!isLanguage(code)) return;
  localStorage.setItem(LANGUAGE_KEY, code);
  state.language = code;
}

export async function refresh() {
  try {
    state.lots = await api.listLots();
    state.lastRefreshAt = Date.now();
    state.loadError = null;
  } catch (err) {
    state.loadError = err;
  }
}

export function logout() {
  clearToken();
  state.user = null;
  state.authStatus = { text: t('signedOut') };
  refresh();
}

export async function login(username, password) {
  if (!isValidLogin({ username, password })) {
    state.authStatus = { text: t(loginError({ username, password })), isError: true };
    return false;
  }
  state.authStatus = { text: t('signingIn') };
  try {
    const data = await api.login(username, password);
    saveToken(data.token);
    state.user = data.user;
    state.authStatus = { text: t('signedIn') };
    await refresh();
    return true;
  } catch (err) {
    state.authStatus = { text: err.message || t('errLoginFailed'), isError: true };
    return false;
  }
}

export async function restoreSession() {
  if (!hasToken()) return;
  try {
    const data = await api.me();
    if (data.user) state.user = data.user;
    else logout();
  } catch (err) {
    // A server that answered "no" ends the session; a network blip does not.
    if (err.status) logout();
  }
}
