<script setup>
const ERROR_COLOR = '#8a2b1f';

// status is { text, isError } or null.
defineProps({ status: Object });
</script>

<template>
  <p class="status" :style="{ color: status?.isError ? ERROR_COLOR : undefined }">
    {{ status?.text }}
  </p>
</template>
