import { useEffect, useState } from 'react';
import { formatDateTime, isLanguage, translate } from '../../shared/i18n.js';
import { isValidLogin, loginError } from '../../shared/validation.js';
import { api, clearToken, hasToken, saveToken } from './api.js';

const LANGUAGE_KEY = 'parking_language';
const REFRESH_MS = 5000;

function storedLanguage() {
  const code = localStorage.getItem(LANGUAGE_KEY);
  return isLanguage(code) ? code : 'en';
}

// The state every panel reads: language, lots, and who is signed in. Each call to a setter
// re-runs App, and React updates only the parts of the page that changed.
export function useParking() {
  const [language, setLanguageState] = useState(storedLanguage);
  const [lots, setLots] = useState([]);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  // The error itself, not a sentence: the timer below keeps the first render's `t`, so the
  // message is translated when it is shown instead.
  const [loadError, setLoadError] = useState(null);
  const [user, setUser] = useState(null);
  // The session can end without a click (an expired token), so its message lives here
  // rather than in LoginPanel.
  const [authStatus, setAuthStatus] = useState(null);

  const t = (key, params) => translate(language, key, params);
  const formatDate = (value) => formatDateTime(language, value);

  function setLanguage(code) {
    if (!isLanguage(code)) return;
    localStorage.setItem(LANGUAGE_KEY, code);
    setLanguageState(code);
  }

  async function refresh() {
    try {
      setLots(await api.listLots());
      setLastRefreshAt(Date.now());
      setLoadError(null);
    } catch (err) {
      setLoadError(err);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    setAuthStatus({ text: t('signedOut') });
    refresh();
  }

  async function login(username, password) {
    if (!isValidLogin({ username, password })) {
      setAuthStatus({ text: t(loginError({ username, password })), isError: true });
      return false;
    }
    setAuthStatus({ text: t('signingIn') });
    try {
      const data = await api.login(username, password);
      saveToken(data.token);
      setUser(data.user);
      setAuthStatus({ text: t('signedIn') });
      await refresh();
      return true;
    } catch (err) {
      setAuthStatus({ text: err.message || t('errLoginFailed'), isError: true });
      return false;
    }
  }

  async function restoreSession() {
    if (!hasToken()) return;
    try {
      const data = await api.me();
      if (data.user) setUser(data.user);
      else logout();
    } catch (err) {
      // A server that answered "no" ends the session; a network blip does not.
      if (err.status) logout();
    }
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    restoreSession();
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return {
    language,
    setLanguage,
    t,
    formatDate,
    lots,
    lastRefreshAt,
    loadError,
    refresh,
    user,
    authStatus,
    login,
    logout,
  };
}
