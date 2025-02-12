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
          v-for="(t, i) in terms"
          :key="t.id"
          :ref="(inst: any) => (tabRefs[t.id] = inst?.$el)"
          :name="t.id"
          style="width: 120px; gap: 8px"
        >
          {{ TermManagerRegistry.getManager(t)?.resource.name }}

          <DefaultButton
            text
            :quaternary="false"
            @click="
              delete tabRefs[t.id]
            // webshellStore.removeTerm(i);
            "
          >
            <div class="i-ant-design:close-outlined"></div>
          </DefaultButton>
        </NTab>
      </NTabs>
    </NScrollbar>

    <ResourcePopselect>
      <DefaultButton
        class="tab-bar-btn"
        :loading="false"
        @click="webshellResourceStore.selectedResourceId && webshellTermStore.addTerm()"
      >
        <div class="i-ant-design:plus-outlined tab-bar-icon"></div>
      </DefaultButton>
    </ResourcePopselect>

    <!-- 本地开发使用 -->
    <DefaultButton>
      <div
        class="i-ant-design:api-outlined tab-bar-icon"
        @click="webshellTermStore.addTerm(new LocalhostResource({ name: 'localhost' }))"
      ></div>
    </DefaultButton>

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
        <DefaultButton
          class="tab-bar-btn ml-auto"
          @click="emit('enter-fullscreen')"
        >
          <div class="i-ant-design:fullscreen-outlined tab-bar-icon"></div>
        </DefaultButton>
      </template>
    </NTooltip>
    <NTooltip v-else>
      退出全屏
      <template #trigger>
        <DefaultButton
          class="tab-bar-btn ml-auto"
          @click="emit('quit-fullscreen')"
        >
          <div class="i-ant-design:fullscreen-exit-outlined tab-bar-icon"></div>
        </DefaultButton>
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

    <NDivider vertical />

    <div class="i-ant-design:user-outlined tab-bar-icon mx-2"></div>
    <div> {{ userStore.getUserInfo.username }} </div>
  </div>
</template>

<script setup lang="ts">
  import { watch } from 'vue'
  import { NTabs, NTab, NTooltip, NDivider, NScrollbar } from 'naive-ui'

  import type { Term } from '../xterm'
  import { useUserStore } from '@/store/modules/user'
  import ResourcePopselect from './ResourcePopselect.vue'
  import DefaultButton from '../DefaultButton.vue'
  import { useWebshellTermStore } from '../stores/term'
  import { useWebshellStateStore } from '../stores/states'
  import { useWebshellResourceStore } from '../stores/resource'
  import { TermManagerRegistry } from '../termManagerRegistry'
  import { LocalhostResource } from './localHostResource'

  const userStore = useUserStore()
  const webshellStateStore = useWebshellStateStore()
  const webshellResourceStore = useWebshellResourceStore()
  const webshellTermStore = useWebshellTermStore()

  const terms = webshellTermStore.terms as Term[]

  if (!userStore.getUserInfo) {
    window.location.href = '/login'
  }

  const activeTab = defineModel<string | undefined>('activeTab', { required: true })
  const emit = defineEmits<{
    (e: 'vertical-split'): void
    (e: 'horizontal-split'): void
    (e: 'enter-fullscreen'): void
    (e: 'quit-fullscreen'): void
    (e: 'common-commands'): void
    (e: 'documentation'): void
  }>()

  const tabRefs: Record<string, HTMLDivElement> = {}

  watch(activeTab, (activeTab) => {
    if (!activeTab) {
      return
    }
    const el = tabRefs[activeTab]
    el?.scrollIntoView({ behavior: 'smooth' })
  })
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
