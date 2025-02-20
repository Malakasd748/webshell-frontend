<template>
  <NLayout
    ref="fullscreenTarget"
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
  import { computed, ref, useTemplateRef, watchEffect, onMounted } from 'vue'

  import { useWebShellStateStore } from '../stores/webShellStates'
  import { useWebShellTermStore } from '../stores/webShellTerm'
  import { useWebShellResourceStore } from '../stores/webShellResource'
  import TermBody from '@/components/webShell/TermBody'
  import TermFooter from '@/components/webShell/TermFooter'
  import TermHeader from '@/components/webShell/TermHeader'
  import TermSettings from '@/components/webShell/TermSettings'
  import TermSider from '@/components/webShell/TermSider'
  import { Term } from '@/xterm'
  import { TermManagerRegistry } from '@/services/termManagerRegistry'

  const activeTab = ref<string>('settings')
  const siderCollapsed = ref(false)
  const settingsTabSelected = computed(() => activeTab.value === 'settings')

  const stateStore = useWebShellStateStore()
  const termStore = useWebShellTermStore()
  const resourceStore = useWebShellResourceStore()
  const terms = termStore.terms

  Term.registerNewTermCallback((t) => {
    setTimeout(() => (activeTab.value = t.id), 10)
    t.onSelectionChange(() => {
      const selected = t.getSelection()
      if (!selected) {
        return
      }
    })
  })

  const fullscreenTarget = useTemplateRef('fullscreenTarget')
  const fullscreen = useFullscreen(fullscreenTarget)

  watchEffect(() => (stateStore.isFullscreen = fullscreen.isFullscreen.value))

  onMounted(async () => {
    await resourceStore.fetchResources()
    if (resourceStore.resources.length > 0) {
      resourceStore.selectResourceById(resourceStore.resources[0].id)
      await termStore.addTerm()
    }
  })
</script>

<style scoped></style>
