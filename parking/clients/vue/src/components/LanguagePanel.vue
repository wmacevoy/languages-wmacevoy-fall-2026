<script setup>
import { firstLanguages } from '../../../shared/i18n.js';
import { t } from '../store.js';
</script>

<template>
  <div class="panel language-panel">
    <div class="panel-header">
      <h2>{{ t('languagePanelTitle') }}</h2>
      <p>{{ t('languagePanelSubtitle') }}</p>
    </div>
    <ul class="language-list">
      <li v-for="name in firstLanguages" :key="name">{{ name }}</li>
    </ul>
  </div>
</template>
