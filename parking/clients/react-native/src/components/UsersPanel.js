import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { roleKey } from '../../../shared/roles.js';
import { isValidNewUser, newUserError } from '../../../shared/validation.js';
import { api } from '../api.js';
import { colors } from '../theme.js';
import { Button, Choices, Field, Panel, Status } from './ui.js';

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

  const roleOptions = [
    { value: 'none', label: t('roleNone') },
    { value: 'sensor', label: t('roleSensor') },
    { value: 'admin', label: t('roleAdmin') },
  ];
  const lotOptions = lots.map((lot) => ({ value: String(lot.id), label: lot.name }));

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

  async function handleSubmit() {
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
    <Panel
      id="users-panel"
      title={t('userManagementTitle')}
      subtitle={t('userManagementSubtitle')}
    >
      <Field
        label={t('usernameLabel')}
        value={username}
        onChangeText={setUsername}
        placeholder={t('userNamePlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Field
        label={t('passwordLabel')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Choices label={t('roleLabel')} options={roleOptions} value={role} onChange={setRole} />
      {role === 'sensor' && (
        <Choices
          label={t('sensorLotLabel')}
          options={lotOptions}
          value={selectedLotId}
          onChange={setLotId}
        />
      )}
      <Button label={t('createUser')} onPress={handleSubmit} />
      <View style={styles.list}>
        {users.map((account) => (
          <View key={account.id} testID={`user ${account.username}`} style={styles.row}>
            <View style={styles.meta}>
              {/* <Text> never interprets markup, so a username is always just text. */}
              <Text style={styles.username}>{account.username}</Text>
              <Text style={styles.detail}>
                {t('lotLabel')}: {account.lot_name || '-'}
              </Text>
              <Text style={styles.tag}>{t(roleKey(account.role, account.is_root))}</Text>
            </View>
            <Button
              kind="danger"
              label={t('delete')}
              disabled={account.is_root}
              onPress={() => remove(account)}
            />
          </View>
        ))}
      </View>
      <Status status={status} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
  },
  meta: {
    flexShrink: 1,
    gap: 4,
  },
  username: {
    fontWeight: '700',
    color: colors.ink,
  },
  detail: {
    color: colors.ink,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 11,
    backgroundColor: colors.inkFaint,
    color: colors.ink,
  },
});
