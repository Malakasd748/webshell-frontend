<template>
  <NConfigProvider :theme-overrides="naiveThemeOverride">
    <router-view />
  </NConfigProvider>
</template>

<script setup lang='ts'>
  import { NConfigProvider } from 'naive-ui'
  import naiveThemeOverride from './theme/naiveThemeOverride'
</script>

<style scoped></style>
