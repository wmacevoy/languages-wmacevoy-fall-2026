import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { formatDateTime, isLanguage, translate } from '../../shared/i18n.js';
import { isValidLogin, loginError } from '../../shared/validation.js';
import { api, clearToken, loadToken, saveToken } from './api.js';

const LANGUAGE_KEY = 'parking_language';
const REFRESH_MS = 5000;

// The same hook as the React web client, line for line where it can be. The difference is
// storage: on a phone it is asynchronous, so the saved language and token arrive after the
// first render instead of before it.
export function useParking() {
  const [language, setLanguageState] = useState('en');
  const [lots, setLots] = useState([]);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  // The error itself, not a sentence: the timer below keeps the first render's `t`, so the
  // message is translated when it is shown instead.
  const [loadError, setLoadError] = useState(null);
  const [user, setUser] = useState(null);
  // The session can end without a tap (an expired token), so its message lives here
  // rather than in LoginPanel.
  const [authStatus, setAuthStatus] = useState(null);

  const t = (key, params) => translate(language, key, params);
  const formatDate = (value) => formatDateTime(language, value);

  function setLanguage(code) {
    if (!isLanguage(code)) return;
    AsyncStorage.setItem(LANGUAGE_KEY, code);
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
      await saveToken(data.token);
      setUser(data.user);
      setAuthStatus({ text: t('signedIn') });
      await refresh();
      return true;
    } catch (err) {
      setAuthStatus({ text: err.message || t('errLoginFailed'), isError: true });
      return false;
    }
  }

  async function restoreLanguage() {
    const code = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (isLanguage(code)) setLanguageState(code);
  }

  async function restoreSession() {
    if (!(await loadToken())) return;
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
    restoreLanguage();
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
