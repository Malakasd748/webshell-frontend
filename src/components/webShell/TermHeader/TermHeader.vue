<template>
  <div class="flex-(~ items-center) pr-5">
    <NScrollbar
      x-scrollable
      class="w-auto max-w-3/4 mr-2"
    >
      <NTabs
        v-model:value="activeTab"
        type="segment"
        animated
        :theme-overrides="tabsThemeOverrides"
      >
        <NTab
          :ref="(inst: any) => (tabRefs.settings = inst?.$el)"
          name="settings"
          style="width: 100px; gap: 8px"
        >
          <div class="i-ant-design:setting-outlined"></div>
          设置
        </NTab>
        <NTab
          v-for="t in terms"
          :key="t.id"
          :ref="(inst: any) => (tabRefs[t.id] = inst?.$el)"
          :name="t.id"
          style="width: 120px; gap: 8px"
        >
          {{ TermManagerRegistry.getManager(t)?.resource.name }}

          <NButton
            text
            quaternary
            :focusable="false"
            size="tiny"
            @click="removeTab(t)"
          >
            <div class="i-ant-design:close-outlined"></div>
          </NButton>
        </NTab>
      </NTabs>
    </NScrollbar>

    <ResourcePopselect @new-ssh="showSshModal = true">
      <NButton
        class="tab-bar-btn"
        quaternary
        :focusable="false"
        size="tiny"
        :loading="false"
        @click="webshellTermStore.addTerm()"
      >
        <div class="i-ant-design:plus-outlined tab-bar-icon"></div>
      </NButton>
    </ResourcePopselect>

    <!--
    <NTooltip>
      垂直分屏
      <template #trigger>
        <DefaultButton class="ml-auto tab-bar-btn" @click="emit('vertical-split')">
          <div class="i-material-symbols:splitscreen-vertical-add-outline tab-bar-icon"></div>
        </DefaultButton>
      </template>
    </NTooltip>

    <NTooltip>
      水平分屏
      <template #trigger>
        <DefaultButton class="tab-bar-btn" @click="emit('horizontal-split')">
          <div class="i-material-symbols:splitscreen-add-outline tab-bar-icon"></div>
        </DefaultButton>
      </template>
    </NTooltip> -->

    <NTooltip v-if="!webshellStateStore.isFullscreen">
      全屏
      <template #trigger>
        <NButton
          class="tab-bar-btn ml-auto"
          quaternary
          :focusable="false"
          size="tiny"
          @click="emit('enter-fullscreen')"
        >
          <div class="i-ant-design:fullscreen-outlined tab-bar-icon"></div>
        </NButton>
      </template>
    </NTooltip>
    <NTooltip v-else>
      退出全屏
      <template #trigger>
        <NButton
          class="tab-bar-btn ml-auto"
          quaternary
          :focusable="false"
          size="tiny"
          @click="emit('quit-fullscreen')"
        >
          <div class="i-ant-design:fullscreen-exit-outlined tab-bar-icon"></div>
        </NButton>
      </template>
    </NTooltip>
    <!--
    <NDivider vertical />

    <NTooltip>
      常用命令
      <template #trigger>
        <DefaultButton class="tab-bar-btn" @click="emit('commonCommands')">
          <div class="i-ph:terminal-window tab-bar-icon"></div>
        </DefaultButton>
      </template>
    </NTooltip>

    <NTooltip>
      帮助文档
      <template #trigger>
        <DefaultButton class="tab-bar-btn" @click="emit('documentation')">
          <div class="i-ant-design:question-circle-outlined tab-bar-icon"></div>
        </DefaultButton>
      </template>
    </NTooltip> -->

    <!-- <NDivider vertical />

    <div class="i-ant-design:user-outlined tab-bar-icon mx-2"></div>
    <div>user</div> -->

    <SSHModal v-model:show="showSshModal" />
  </div>
</template>

<script setup lang="ts">
  import type { TabsProps } from 'naive-ui'
  import { NButton, NScrollbar, NTab, NTabs, NTooltip } from 'naive-ui'
  import { watch, ref } from 'vue'

  import { TermManagerRegistry } from '@/service/termManagerRegistry'
  import { useWebShellStateStore } from '@/stores/webshellStates'
  import { useWebShellTermStore } from '@/stores/webshellTerm'
  import type { Term } from '@/xterm'
  import ResourcePopselect from './ResourcePopselect.vue'
  import SSHModal from './SSHModal.vue'

  const webshellStateStore = useWebShellStateStore()
  const webshellTermStore = useWebShellTermStore()

  const terms = webshellTermStore.terms

  const activeTab = defineModel<string | undefined>('activeTab', { required: true })
  const emit = defineEmits<{
    (e: 'vertical-split'): void
    (e: 'horizontal-split'): void
    (e: 'enter-fullscreen'): void
    (e: 'quit-fullscreen'): void
    (e: 'common-commands'): void
    (e: 'documentation'): void
  }>()

  const showSshModal = ref(false)

  const tabRefs: Record<string, HTMLDivElement> = {}

  watch(activeTab, (activeTab) => {
    if (!activeTab) {
      return
    }
    const el = tabRefs[activeTab]
    el?.scrollIntoView({ behavior: 'smooth' })
  })

  function removeTab(term: Term) {
    delete tabRefs[term.id]
    webshellTermStore.removeTerm(term)
  }

  const tabsThemeOverrides: NonNullable<TabsProps['themeOverrides']> = {
    colorSegment: 'rgba(255,255,255,0.04)',
    tabTextColorHoverSegment: '#3f8cff',
    tabTextColorActiveSegment: '#3f8cff',
    tabColorSegment: '#141414',
    tabBorderRadius: '0',
    tabPaddingMediumSegment: '8px 8px',
  }
</script>

<style scoped>
  :deep(.n-tabs .n-tabs-tab .n-tabs-tab__label) {
    display: contents;
  }

  :deep(.n-tabs .n-tabs-rail) {
    padding: 0;
  }

  :deep(.n-scrollbar > .n-scrollbar-rail) {
    display: none;
  }

  .tab-bar-icon {
    width: 16px;
    height: 16px;
  }

  :deep(.n-tabs-tab-wrapper) {
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 2;
  }

  :deep(.n-tabs .n-tabs-rail .n-tabs-capsule) {
    z-index: 1;
  }
</style>
