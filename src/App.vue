<template>
  <NConfigProvider :theme-overrides="naiveThemeOverride">
    <NModalProvider>
      <NMessageProvider>
        <router-view />
      </NMessageProvider>
    </NModalProvider>
  </NConfigProvider>
</template>

<script setup lang='ts'>
  import { NConfigProvider, NModalProvider, NMessageProvider } from 'naive-ui'
  import naiveThemeOverride from './theme/naiveThemeOverride'
</script>

<style scoped></style>
