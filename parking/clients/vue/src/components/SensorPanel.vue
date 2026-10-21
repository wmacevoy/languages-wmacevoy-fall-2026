<script setup>
import { computed, ref } from 'vue';
import { sensorLots } from '../../../shared/roles.js';
import { isValidOccupancy } from '../../../shared/validation.js';
import { api } from '../api.js';
import { refresh, state, t } from '../store.js';
import Status from './Status.vue';

const lotId = ref('');
// null until the user types, so the field follows the live count without overwriting an
// edit in progress when the lots refresh.
const draft = ref(null);
const status = ref(null);

const choices = computed(() => sensorLots(state.user, state.lots));
const lot = computed(
  () => choices.value.find((item) => String(item.id) === lotId.value) ?? choices.value[0]
);

const selectedId = computed({
  get: () => (lot.value ? String(lot.value.id) : ''),
  set: (value) => {
    lotId.value = value;
    draft.value = null;
  },
});

const occupancy = computed({
  get: () => draft.value ?? String(lot.value?.occupancy ?? 0),
  set: (value) => {
    draft.value = value;
  },
});

async function handleSubmit() {
  // An empty field is '', which Number() would quietly send as 0.
  if (!isValidOccupancy(occupancy.value)) {
    status.value = { text: t('errOccupancy'), isError: true };
    return;
  }
  status.value = { text: t('sending') };
  try {
    const updated = await api.updateOccupancy(lot.value.id, Number(occupancy.value));
    status.value = {
      text: t('occupancyUpdated', { name: updated.name, occupancy: updated.occupancy }),
    };
    await refresh();
    draft.value = null;
  } catch (err) {
    status.value = { text: err.message || t('errUpdateFailed'), isError: true };
  }
}
</script>

<template>
  <div class="panel" id="sensor-panel">
    <div class="panel-header">
      <h2>{{ t('sensorUpdateTitle') }}</h2>
      <p>{{ t('sensorUpdateSubtitle') }}</p>
    </div>
    <form class="stack" @submit.prevent="handleSubmit">
      <label>
        <span>{{ t('lotLabel') }}</span>
        <select v-model="selectedId" :disabled="choices.length <= 1">
          <option v-for="item in choices" :key="item.id" :value="String(item.id)">
            {{ item.name }}
          </option>
        </select>
      </label>
      <label>
        <span>{{ t('occupancyLabel') }}</span>
        <input v-model="occupancy" type="number" min="0" :max="lot?.capacity" />
      </label>
      <button type="submit" class="primary">{{ t('sendUpdate') }}</button>
    </form>
    <Status :status="status" />
  </div>
</template>
