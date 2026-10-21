<script setup>
import { computed, ref } from 'vue';
import { roleKey } from '../../../shared/roles.js';
import { login, logout, state, t } from '../store.js';
import Status from './Status.vue';

const username = ref('');
const password = ref('');

async function handleSubmit() {
  if (await login(username.value.trim(), password.value)) {
    password.value = '';
  }
}

const currentUser = computed(() =>
  state.user
    ? t('currentUserFormat', {
        username: state.user.username,
        role: t(roleKey(state.user.role, state.user.is_root)),
      })
    : t('guest')
);
</script>

<template>
  <div class="panel" id="auth-panel">
    <div class="panel-header">
      <h2>{{ t('loginTitle') }}</h2>
      <p>{{ t('loginSubtitle') }}</p>
    </div>
    <form v-if="!state.user" class="stack" @submit.prevent="handleSubmit">
      <label>
        <span>{{ t('usernameLabel') }}</span>
        <input v-model="username" type="text" autocomplete="username" />
      </label>
      <label>
        <span>{{ t('passwordLabel') }}</span>
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>
      <button type="submit" class="primary">{{ t('signIn') }}</button>
    </form>
    <div class="auth-meta">
      <div>
        <p class="status-label">{{ t('currentUserLabel') }}</p>
        <p class="status">{{ currentUser }}</p>
      </div>
      <button v-if="state.user" type="button" class="ghost" @click="logout">
        {{ t('logout') }}
      </button>
    </div>
    <Status :status="state.authStatus" />
  </div>
</template>
