<script setup>
import { formatDate, state, t } from '../store.js';
import Status from './Status.vue';
</script>

<template>
  <div class="panel">
    <div class="panel-header">
      <h2>{{ t('customerViewTitle') }}</h2>
      <p>{{ t('customerViewSubtitle') }}</p>
    </div>
    <div id="lot-list">
      <div
        v-for="(lot, index) in state.lots"
        :key="lot.id"
        class="lot-card"
        :style="{ animationDelay: `${index * 60}ms` }"
      >
        <div class="lot-top">
          <strong>{{ lot.name }}</strong>
          <span class="badge" :class="lot.is_open ? 'open' : 'closed'">
            {{ lot.is_open ? t('lotOpen') : t('lotClosed') }}
          </span>
        </div>
        <div class="availability">
          <span>{{ t('availableLabel') }}</span>
          <strong>{{ lot.available }}</strong>
        </div>
        <div class="meta-row">
          <span>{{ t('capacityLabel') }}: {{ lot.capacity }}</span>
          <span>{{ t('occupiedLabel') }}: {{ lot.occupancy }}</span>
        </div>
        <div class="meta-row">
          <span>{{ t('updatedLabel') }}</span>
          <span>{{ formatDate(lot.updated_at) }}</span>
        </div>
      </div>
    </div>
    <Status
      v-if="state.loadError"
      :status="{ text: state.loadError.message || t('errLoadLots'), isError: true }"
    />
  </div>
</template>
