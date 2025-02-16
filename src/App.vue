<template>
  <NConfigProvider
    :theme-overrides="naiveThemeOverride"
    :theme="darkTheme"
  >
    <NModalProvider>
      <NMessageProvider>
        <NDialogProvider>
          <NaiveApiProvider>
            <router-view />
          </NaiveApiProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NModalProvider>
  </NConfigProvider>
</template>

<script setup lang='ts'>
  import { defineComponent } from 'vue'
  import { NConfigProvider, NModalProvider, NMessageProvider, NDialogProvider, darkTheme, useDialog, useMessage } from 'naive-ui'

  import naiveThemeOverride from './theme/naiveThemeOverride'
  import naiveApi from '@/providers/naiveApi'

  const NaiveApiProvider = defineComponent({
    setup(_, { slots }) {
      naiveApi.dialog = useDialog()
      naiveApi.message = useMessage()
      return () => {
        return slots.default?.()
      }
    },
  })
</script>
