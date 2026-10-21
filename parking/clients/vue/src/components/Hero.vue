<script setup>
import { formatDate, refresh, state, t } from '../store.js';
</script>

<template>
  <header class="hero">
    <div>
      <p class="eyebrow">{{ t('eyebrowCityParking') }}</p>
      <h1>{{ t('heroTitle') }}</h1>
      <p class="subtitle">{{ t('heroSubtitle') }}</p>
    </div>
    <div class="meta">
      <div class="meta-card">
        <span class="meta-label">{{ t('lastRefresh') }}</span>
        <span id="last-updated">
          {{ state.lastRefreshAt ? formatDate(state.lastRefreshAt) : '--' }}
        </span>
      </div>
      <button id="refresh" type="button" class="ghost" @click="refresh">
        {{ t('refreshNow') }}
      </button>
    </div>
  </header>
</template>
