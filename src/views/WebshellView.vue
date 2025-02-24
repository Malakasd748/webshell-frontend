<template>
  <NLayout
    ref="fullscreen-target"
    class="h-screen"
    content-class="flex-(~ col)"
  >
    <NLayoutHeader
      style="background-color: var(--ws-panel-background-color)"
      bordered
    >
      <TermHeader
        v-model:active-tab="activeTab"
        @enter-fullscreen="fullscreen.enter()"
        @quit-fullscreen="fullscreen.exit()"
      />
    </NLayoutHeader>

    <NLayout
      has-sider
      class="grow chat-drawer-target"
    >
      <NLayoutSider
        v-show="!settingsTabSelected"
        v-model:collapsed="siderCollapsed"
        collapse-mode="transform"
        :collapsed-width="0"
        :width="300"
        bordered
      >
        <TermSider
          v-for="t in terms"
          v-show="activeTab === t.id"
          :key="t.id"
          v-model:collapsed="siderCollapsed"
          :manager="TermManagerRegistry.getManager(t)!"
          class="h-full"
        />

        <NButton
          v-show="siderCollapsed"
          class="absolute top-3 right-0 translate-x-4.5 z-1 px-0.5!"
          :focusable="false"
          size="tiny"
          @click="siderCollapsed = false"
        >
          <div class="i-ant-design:menu-unfold-outlined size-4"></div>
        </NButton>
      </NLayoutSider>

      <NLayout
        class="h-full"
        content-class="flex-(~ col)"
      >
        <TermSettings
          v-show="activeTab === 'settings'"
          class="grow"
        />
        <TermBody
          v-for="t in terms"
          v-show="activeTab === t.id"
          :key="t.id"
          :term="t"
          class="grow"
        />

        <NLayoutFooter
          v-if="!settingsTabSelected"
          class="mt-auto"
          style="background-color: var(--ws-panel-background-color)"
          bordered
        >
          <TermFooter />
        </NLayoutFooter>
      </NLayout>
    </NLayout>
    <!--
    <ChatButton
      v-show="showChat"
      :x="chatX"
      :y="chatY"
      drawer-to=".chat-drawer-target"
      :initial-input="chatInitialInput"
    /> -->
  </NLayout>
</template>

<script setup lang="ts">
  import { useFullscreen } from '@vueuse/core'
  import { NButton, NLayout, NLayoutFooter, NLayoutHeader, NLayoutSider } from 'naive-ui'
  import { computed, ref, useTemplateRef, watchEffect, watch } from 'vue'

  import { useWebShellStateStore } from '@/stores/webshellStates'
  import { useWebShellTermStore } from '@/stores/webshellTerm'
  import TermBody from '@/components/webshell/TermBody'
  import TermFooter from '@/components/webshell/TermFooter'
  import TermHeader from '@/components/webshell/TermHeader'
  import TermSettings from '@/components/webshell/TermSettings'
  import TermSider from '@/components/webshell/TermSider'
  import { Term } from '@/xterm'
  import { TermManagerRegistry } from '@/service/termManagerRegistry'

  const activeTab = ref<string>('settings')
  const siderCollapsed = ref(false)
  const settingsTabSelected = computed(() => activeTab.value === 'settings')

  const stateStore = useWebShellStateStore()
  const termStore = useWebShellTermStore()
  const terms = termStore.terms

  Term.registerNewTermCallback((t) => {
    setTimeout(() => (activeTab.value = t.id), 10)
  })

  const fullscreenTarget = useTemplateRef('fullscreen-target')
  const fullscreen = useFullscreen(fullscreenTarget)

  watchEffect(() => (stateStore.isFullscreen = fullscreen.isFullscreen.value))

  watch(() => termStore.terms.length, (newLength, oldLength) => {
    if (newLength >= oldLength) {
      return
    }
    const preTab = activeTab.value

    if (activeTab.value !== 'settings' && terms.find(t => t.id === preTab) === undefined) {
      setTimeout(() => {
        activeTab.value = terms.at(-1)?.id || 'settings'
      }, 10)
    } else {
      setTimeout(() => activeTab.value = preTab, 10)
    }
  })
</script>

<style scoped></style>
