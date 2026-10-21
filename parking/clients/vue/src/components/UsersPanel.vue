<script setup>
import { computed, onMounted, ref } from 'vue';
import { roleKey } from '../../../shared/roles.js';
import { isValidNewUser, newUserError } from '../../../shared/validation.js';
import { api } from '../api.js';
import { logout, state, t } from '../store.js';
import Status from './Status.vue';

// Only this panel needs the user list, so it loads and keeps it itself.
const users = ref([]);
const username = ref('');
const password = ref('');
const role = ref('none');
const lotId = ref('');
const status = ref(null);

const selectedLotId = computed({
  get: () => lotId.value || String(state.lots[0]?.id ?? ''),
  set: (value) => {
    lotId.value = value;
  },
});

async function loadUsers() {
  try {
    users.value = await api.listUsers();
  } catch (err) {
    if (err.status === 401) logout();
    else status.value = { text: err.message || t('errLoadUsers'), isError: true };
  }
}

// Once, when the panel appears for an admin.
onMounted(loadUsers);

async function handleSubmit() {
  const newUser = {
    username: username.value.trim(),
    password: password.value,
    role: role.value,
    lot_id: role.value === 'sensor' ? Number(selectedLotId.value) : null,
  };
  if (!isValidNewUser(newUser)) {
    status.value = { text: t(newUserError(newUser)), isError: true };
    return;
  }
  status.value = { text: t('creating') };
  try {
    const created = await api.createUser(newUser);
    status.value = { text: t('createdUser', { username: created.username }) };
    username.value = '';
    password.value = '';
    await loadUsers();
  } catch (err) {
    status.value = { text: err.message || t('errCreateFailed'), isError: true };
  }
}

async function remove(account) {
  status.value = { text: t('removing') };
  try {
    const deleted = await api.deleteUser(account.id);
    status.value = { text: t('deletedUser', { username: deleted.username }) };
    await loadUsers();
  } catch (err) {
    status.value = { text: err.message || t('errDeleteFailed'), isError: true };
  }
}
</script>

<template>
  <div class="panel" id="users-panel">
    <div class="panel-header">
      <h2>{{ t('userManagementTitle') }}</h2>
      <p>{{ t('userManagementSubtitle') }}</p>
    </div>
    <form class="stack" @submit.prevent="handleSubmit">
      <label>
        <span>{{ t('usernameLabel') }}</span>
        <input v-model="username" type="text" :placeholder="t('userNamePlaceholder')" />
      </label>
      <label>
        <span>{{ t('passwordLabel') }}</span>
        <input v-model="password" type="password" autocomplete="new-password" />
      </label>
      <label>
        <span>{{ t('roleLabel') }}</span>
        <select v-model="role">
          <option value="none">{{ t('roleNone') }}</option>
          <option value="sensor">{{ t('roleSensor') }}</option>
          <option value="admin">{{ t('roleAdmin') }}</option>
        </select>
      </label>
      <label v-if="role === 'sensor'">
        <span>{{ t('sensorLotLabel') }}</span>
        <select v-model="selectedLotId">
          <option v-for="lot in state.lots" :key="lot.id" :value="String(lot.id)">
            {{ lot.name }}
          </option>
        </select>
      </label>
      <button type="submit" class="primary">{{ t('createUser') }}</button>
    </form>
    <div class="user-list">
      <div v-for="account in users" :key="account.id" class="user-row">
        <div class="user-meta">
          <!-- {{ }} escapes text, so a username can never become markup. -->
          <strong>{{ account.username }}</strong>
          <span>{{ t('lotLabel') }}: {{ account.lot_name || '-' }}</span>
          <span class="tag">{{ t(roleKey(account.role, account.is_root)) }}</span>
        </div>
        <button
          type="button"
          class="danger"
          :disabled="account.is_root"
          @click="remove(account)"
        >
          {{ t('delete') }}
        </button>
      </div>
    </div>
    <Status :status="status" />
  </div>
</template>
