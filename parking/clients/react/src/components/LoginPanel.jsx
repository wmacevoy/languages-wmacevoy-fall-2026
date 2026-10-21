import { useState } from 'react';
import { roleKey } from '../../../shared/roles.js';
import Status from './Status.jsx';

export default function LoginPanel({ parking }) {
  const { t, user, authStatus, login, logout } = parking;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (await login(username.trim(), password)) {
      setPassword('');
    }
  }

  const currentUser = user
    ? t('currentUserFormat', {
        username: user.username,
        role: t(roleKey(user.role, user.is_root)),
      })
    : t('guest');

  return (
    <div className="panel" id="auth-panel">
      <div className="panel-header">
        <h2>{t('loginTitle')}</h2>
        <p>{t('loginSubtitle')}</p>
      </div>
      {!user && (
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            <span>{t('usernameLabel')}</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            <span>{t('passwordLabel')}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" className="primary">
            {t('signIn')}
          </button>
        </form>
      )}
      <div className="auth-meta">
        <div>
          <p className="status-label">{t('currentUserLabel')}</p>
          <p className="status">{currentUser}</p>
        </div>
        {user && (
          <button type="button" className="ghost" onClick={logout}>
            {t('logout')}
          </button>
        )}
      </div>
      <Status status={authStatus} />
    </div>
  );
}
