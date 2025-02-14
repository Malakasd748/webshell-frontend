<template>
  <NConfigProvider
    :theme-overrides="naiveThemeOverride"
    :theme="darkTheme"
  >
    <NModalProvider>
      <NMessageProvider>
        <router-view />
      </NMessageProvider>
    </NModalProvider>
  </NConfigProvider>
</template>

<script setup lang='ts'>
  import { NConfigProvider, NModalProvider, NMessageProvider, darkTheme } from 'naive-ui'
  import naiveThemeOverride from './theme/naiveThemeOverride'
</script>

<style scoped></style>
