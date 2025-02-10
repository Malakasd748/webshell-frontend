<template>
  <div class="mx-auto my-10">
    <div class="text-lg font-semibold">字体设置</div>
    <div class="mt-4">
      <div>字号</div>
      <NSelect
        :value="settingsStore.fontSize"
        @update:value="(fontSize) => settingsStore.setConfig({ fontSize })"
        :options="fontSizeOptions"
        class="w-50 mt-2"
      />
    </div>

    <div class="text-lg font-semibold mt-12">主题设置</div>
    <div class="mt-4">
      <div>内置主题</div>
      <ThemePreviewGroup class="mt-2" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watchEffect } from 'vue';
  import { NSelect } from 'naive-ui';
  import type { SelectOption } from 'naive-ui';

  import ThemePreviewGroup from './ThemePreviewGroup.vue';
  import { useWebshellSettingsStore } from '../stores/settings';

  const settingsStore = useWebshellSettingsStore();

  const fontSizeOptions = (function () {
    const ret: SelectOption[] = [];
    for (let i = 12; i <= 30; i += 2) {
      ret.push({ label: i.toString(), value: i });
    }
    return ret;
  })();
</script>

<style scoped></style>
