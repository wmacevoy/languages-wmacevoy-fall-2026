<script setup>
import { onMounted, onUnmounted, watchEffect } from 'vue';
import { isAdmin, isSensor } from '../../shared/roles.js';
import AdminPanel from './components/AdminPanel.vue';
import Hero from './components/Hero.vue';
import LanguagePanel from './components/LanguagePanel.vue';
import LanguagePicker from './components/LanguagePicker.vue';
import LoginPanel from './components/LoginPanel.vue';
import LotList from './components/LotList.vue';
import SensorPanel from './components/SensorPanel.vue';
import UsersPanel from './components/UsersPanel.vue';
import { refresh, restoreSession, state } from './store.js';

const REFRESH_MS = 5000;
let timer;

onMounted(() => {
  restoreSession();
  refresh();
  timer = setInterval(refresh, REFRESH_MS);
});

onUnmounted(() => clearInterval(timer));

watchEffect(() => {
  document.documentElement.lang = state.language;
});
</script>

<template>
  <div class="backdrop"></div>
  <LanguagePicker />
  <main class="page">
    <Hero />
    <section class="grid">
      <LotList />
      <LanguagePanel />
      <LoginPanel />
      <AdminPanel v-if="isAdmin(state.user)" />
      <SensorPanel v-if="isSensor(state.user)" />
      <UsersPanel v-if="isAdmin(state.user)" />
    </section>
  </main>
</template>
