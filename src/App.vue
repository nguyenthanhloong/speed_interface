<!-- <template>
  <GlobalLoading />
  <GlobalToast />
  <router-view />
</template>

<script setup>
import GlobalLoading from './components/GlobalLoading.vue';
import GlobalToast from './components/GlobalToast.vue';
</script> -->

<template>
  <GlobalLoading />
  <GlobalToast />

  <router-view />

  <GlobalChatWidget v-if="isAuthenticated && currentRoute.name !== 'Login'" />
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';

import GlobalLoading from './components/GlobalLoading.vue';
import GlobalToast from './components/GlobalToast.vue';
import GlobalChatWidget from './components/GlobalChatWidget.vue';

const route = useRoute();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const currentRoute = computed(() => route);
</script>
