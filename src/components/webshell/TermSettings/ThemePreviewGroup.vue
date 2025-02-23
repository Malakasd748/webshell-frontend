<template>
  <NGrid
    :cols="2"
    :x-gap="24"
    :y-gap="32"
  >
    <NGi
      v-for="themeName in Object.keys(availableThemes)"
      :key="themeName"
    >
      <ThemePreview :theme-name="themeName" />
    </NGi>
  </NGrid>
</template>

<script setup lang="ts">
  import { NGrid, NGi } from 'naive-ui'

  import { availableThemes } from '@/stores/webshellSettings'
  import ThemePreview from './ThemePreview.vue'
</script>

<style scoped></style>
