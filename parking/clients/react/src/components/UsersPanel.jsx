import { useEffect, useState } from 'react';
import { roleKey } from '../../../shared/roles.js';
import { isValidNewUser, newUserError } from '../../../shared/validation.js';
import { api } from '../api.js';
import Status from './Status.jsx';

export default function UsersPanel({ parking }) {
  const { t, lots, logout } = parking;
  // Only this panel needs the user list, so it loads and keeps it itself.
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('none');
  const [lotId, setLotId] = useState('');
  const [status, setStatus] = useState(null);
  const selectedLotId = lotId || String(lots[0]?.id ?? '');

  async function loadUsers() {
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      if (err.status === 401) logout();
      else setStatus({ text: err.message || t('errLoadUsers'), isError: true });
    }
  }

  // Once, when the panel appears for an admin.
  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const newUser = {
      username: username.trim(),
      password,
      role,
      lot_id: role === 'sensor' ? Number(selectedLotId) : null,
    };
    if (!isValidNewUser(newUser)) {
      setStatus({ text: t(newUserError(newUser)), isError: true });
      return;
    }
    setStatus({ text: t('creating') });
    try {
      const created = await api.createUser(newUser);
      setStatus({ text: t('createdUser', { username: created.username }) });
      setUsername('');
      setPassword('');
      await loadUsers();
    } catch (err) {
      setStatus({ text: err.message || t('errCreateFailed'), isError: true });
    }
  }

  async function remove(account) {
    setStatus({ text: t('removing') });
    try {
      const deleted = await api.deleteUser(account.id);
      setStatus({ text: t('deletedUser', { username: deleted.username }) });
      await loadUsers();
    } catch (err) {
      setStatus({ text: err.message || t('errDeleteFailed'), isError: true });
    }
  }

  return (
    <div className="panel" id="users-panel">
      <div className="panel-header">
        <h2>{t('userManagementTitle')}</h2>
        <p>{t('userManagementSubtitle')}</p>
      </div>
      <form className="stack" onSubmit={handleSubmit}>
        <label>
          <span>{t('usernameLabel')}</span>
          <input
            type="text"
            placeholder={t('userNamePlaceholder')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          <span>{t('passwordLabel')}</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          <span>{t('roleLabel')}</span>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="none">{t('roleNone')}</option>
            <option value="sensor">{t('roleSensor')}</option>
            <option value="admin">{t('roleAdmin')}</option>
          </select>
        </label>
        {role === 'sensor' && (
          <label>
            <span>{t('sensorLotLabel')}</span>
            <select value={selectedLotId} onChange={(event) => setLotId(event.target.value)}>
              {lots.map((lot) => (
                <option key={lot.id} value={String(lot.id)}>
                  {lot.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" className="primary">
          {t('createUser')}
        </button>
      </form>
      <div className="user-list">
        {users.map((account) => (
          <div key={account.id} className="user-row">
            <div className="user-meta">
              {/* JSX escapes text, so a username can never become markup. */}
              <strong>{account.username}</strong>
              <span>
                {t('lotLabel')}: {account.lot_name || '-'}
              </span>
              <span className="tag">{t(roleKey(account.role, account.is_root))}</span>
            </div>
            <button
              type="button"
              className="danger"
              disabled={account.is_root}
              onClick={() => remove(account)}
            >
              {t('delete')}
            </button>
          </div>
        ))}
      </div>
      <Status status={status} />
    </div>
  );
}
