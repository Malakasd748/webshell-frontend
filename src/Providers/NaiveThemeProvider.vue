<template>
  <NConfigProvider :theme-overrides="themeOverrides" :theme="darkTheme" abstract>
    <slot></slot>
  </NConfigProvider>
</template>

<script setup lang="ts">
  import { theme } from 'ant-design-vue';
  import type { GlobalThemeOverrides } from 'naive-ui';
  import { NConfigProvider, darkTheme } from 'naive-ui';

  const { useToken } = theme;
  const token = useToken().token.value;

  const themeOverrides: GlobalThemeOverrides = {
    common: {
      primaryColor: token.colorPrimary,
      primaryColorHover: token.colorPrimaryHover,
      textColorDisabled: 'rgba(255, 255, 255, 0.35)',
      borderRadius: token.borderRadius + 'px',
    },
    Tabs: {
      colorSegment: 'rgba(255, 255, 255, 0.04)',
      tabTextColorHoverSegment: token.colorPrimary,
      tabTextColorActiveSegment: token.colorPrimary,
      tabColorSegment: 'var(--panel-background-color)',
      tabBorderRadius: 0,
      tabPaddingMediumSegment: '8px 8px',
    },
    Divider: {
      color: 'rgba(255, 255, 255, 0.35)',
    },
    Switch: {
      railColorActive: token.colorPrimaryActive,
    },
    Dropdown: {
      color: '#434343',
    },
    Popover: {
      color: '#434343',
    },
    Popselect: {
      color: '#434343',
    },
    Tooltip: {
      color: '#434343',
    },
  };
</script>

<style scoped></style>
