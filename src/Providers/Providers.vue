<template>
  <ConfigProvider :theme="{ algorithm: theme.darkAlgorithm }">
    <NaiveThemeProvider>
      <slot></slot>
    </NaiveThemeProvider>
  </ConfigProvider>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { ConfigProvider, theme } from 'ant-design-vue';
  import NaiveThemeProvider from './NaiveThemeProvider.vue';
</script>
