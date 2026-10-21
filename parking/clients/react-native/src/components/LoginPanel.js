import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { roleKey } from '../../../shared/roles.js';
import { colors } from '../theme.js';
import { Button, Field, Panel, Status } from './ui.js';

export default function LoginPanel({ parking }) {
  const { t, user, authStatus, login, logout } = parking;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit() {
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
    <Panel id="auth-panel" title={t('loginTitle')} subtitle={t('loginSubtitle')}>
      {!user && (
        <>
          <Field
            label={t('usernameLabel')}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
          />
          <Field
            label={t('passwordLabel')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={handleSubmit}
          />
          <Button label={t('signIn')} onPress={handleSubmit} />
        </>
      )}
      <View style={styles.meta}>
        <View>
          <Text style={styles.label}>{t('currentUserLabel')}</Text>
          <Text style={styles.currentUser}>{currentUser}</Text>
        </View>
        {user && <Button kind="ghost" label={t('logout')} onPress={logout} />}
      </View>
      <Status status={authStatus} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  currentUser: {
    color: colors.inkSoft,
  },
});
