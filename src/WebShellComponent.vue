<template>
  <NLayout
    ref="fullscreenTarget"
    class="h-screen"
    content-class="flex-(~ col)"
    style="--panel-background-color: #141414"
  >
    <NLayoutHeader
      style="background-color: var(--panel-background-color)"
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
          <div class="i-ant-design:menu-unfold-outlined size-4" />
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
          style="background-color: var(--panel-background-color)"
          bordered
        >
          <TermFooter />
        </NLayoutFooter>
      </NLayout>
    </NLayout>

    <ChatButton
      v-show="showChat"
      :x="chatX"
      :y="chatY"
      drawer-to=".chat-drawer-target"
      :initial-input="chatInitialInput"
    />
  </NLayout>
</template>

<script setup lang="ts">
import { useFullscreen, useMouse } from '@vueuse/core'
import { debounce } from 'lodash-es'
import { NButton, NLayout, NLayoutFooter, NLayoutHeader, NLayoutSider } from 'naive-ui'
import { computed, ref, useTemplateRef, watchEffect } from 'vue'

import ChatButton from './ChatButton.vue'
import { useWebshellStateStore } from './stores/states'
import { useWebshellTermStore } from './stores/term'
import TermBody from './TermBody'
import TermFooter from './TermFooter'
import TermHeader from './TermHeader'
import { TermManagerRegistry } from './termManagerRegistry'
import TermSettings from './TermSettings'
import TermSider from './TermSider'
import { Term } from './xterm'

const { x: mouseX, y: mouseY } = useMouse()
const showChat = ref(false)
const chatX = ref(0)
const chatY = ref(0)
const chatInitialInput = ref('')
const respondSelectionChange = debounce((t: Term) => {
  chatInitialInput.value = t.getSelection()
  showChat.value = true
  chatX.value = mouseX.value + 24
  chatY.value = mouseY.value - 24
}, 200)

const activeTab = ref<string>('settings')
const siderCollapsed = ref(false)
const settingsTabSelected = computed(() => activeTab.value === 'settings')

const stateStore = useWebshellStateStore()
const terms = useWebshellTermStore().terms as Term[]

Term.registerNewTermCallback((t) => {
  setTimeout(() => (activeTab.value = t.id), 10)
  t.onSelectionChange(() => {
    const selected = t.getSelection()
    if (!selected) {
      showChat.value = false
      return
    }
    respondSelectionChange(t)
  })
})

// webshellStore.onRemoveTerm((t) => {
//   const preTab = activeTab.value;
//   if (activeTab.value === t.id) {
//     setTimeout(() => (activeTab.value = terms.value.at(-1)?.id || 'settings'), 10);
//   } else {
//     setTimeout(() => (activeTab.value = preTab), 10);
//   }
// });

const fullscreenTarget = useTemplateRef('fullscreenTarget')
const fullscreen = useFullscreen(fullscreenTarget)

watchEffect(() => (stateStore.isFullscreen = fullscreen.isFullscreen.value))
</script>

<style scoped></style>
