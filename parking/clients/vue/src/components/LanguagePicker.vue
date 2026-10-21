<script setup>
import { languages } from '../../../shared/i18n.js';
import { setLanguage, state, t } from '../store.js';
</script>

<template>
  <div class="language-picker">
    <label for="language-select">{{ t('languageLabel') }}</label>
    <select
      id="language-select"
      :aria-label="t('languageLabel')"
      :value="state.language"
      @change="setLanguage($event.target.value)"
    >
      <option v-for="{ code, name } in languages" :key="code" :value="code">
        {{ name }}
      </option>
    </select>
  </div>
</template>
