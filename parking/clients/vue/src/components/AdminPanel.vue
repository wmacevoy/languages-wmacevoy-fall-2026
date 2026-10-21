<script setup>
import { computed, ref } from 'vue';
import { api } from '../api.js';
import { refresh, state, t } from '../store.js';
import Status from './Status.vue';

const lotId = ref('');
const status = ref(null);

// Until someone picks, the first lot is selected.
const selectedId = computed({
  get: () => lotId.value || String(state.lots[0]?.id ?? ''),
  set: (value) => {
    lotId.value = value;
  },
});

async function setOpen(open) {
  status.value = { text: t('working') };
  try {
    const lot = await api.setLotOpen(selectedId.value, open);
    status.value = {
      text: t('lotNowState', {
        name: lot.name,
        state: t(lot.is_open ? 'stateOpen' : 'stateClosed'),
      }),
    };
    await refresh();
  } catch (err) {
    status.value = { text: err.message || t('errActionFailed'), isError: true };
  }
}
</script>

<template>
  <div class="panel" id="admin-panel">
    <div class="panel-header">
      <h2>{{ t('adminConsoleTitle') }}</h2>
      <p>{{ t('adminConsoleSubtitle') }}</p>
    </div>
    <div class="stack">
      <label>
        <span>{{ t('lotLabel') }}</span>
        <select v-model="selectedId">
          <option v-for="lot in state.lots" :key="lot.id" :value="String(lot.id)">
            {{ lot.name }}
          </option>
        </select>
      </label>
      <div class="button-row">
        <button type="button" class="primary" @click="setOpen(true)">
          {{ t('openLot') }}
        </button>
        <button type="button" class="danger" @click="setOpen(false)">
          {{ t('closeLot') }}
        </button>
      </div>
    </div>
    <Status :status="status" />
  </div>
</template>
