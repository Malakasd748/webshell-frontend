<template>
  <div>
    <NFloatButton
      v-show="!showDrawer"
      :left="x"
      :top="y"
      shape="square"
      :height="24"
      :width="24"
      style="background: transparent; z-index: 9999"
      @click="
        showDrawer = true;
        inputValue = initialInput;
      "
    >
      <img
        :src="ChatImg"
        class="absolute inset-0 size-full object-contain"
      />
    </NFloatButton>

    <NDrawer
      v-model:show="showDrawer"
      resizable
      :min-width="200"
      :block-scroll="false"
      :show-mask="false"
      :mask-closable="false"
      :to="drawerTo"
      :default-width="360"
      style="background-color: #1f1f1f"
    >
      <NDrawerContent
        closable
        header-style="padding: 12px 16px"
        body-content-style="padding: 16px"
        footer-style="padding: 16px; border: none; overflow-y: visible"
        footer-class="relative before:(absolute inset-0 top--1 blur-6px content-[''] bg-#1F1F1F)"
      >
        <template #header>
          <img
            :src="ChatImg"
            class="size-6 object-contain"
          />
        </template>

        <div class="flex-(~ col gap-4) text-xs">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="px-3 py-2 ws-pre-wrap"
            :style="{
              backgroundColor:
                m.role === 'assistant' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(63, 140, 255, 0.35)',
              borderRadius: m.role === 'assistant' ? '0 4px 4px 4px' : '4px 0 4px 4px',
              alignSelf: m.role === 'assistant' ? 'start' : 'end',
              color: 'rgba(255, 255, 255, 0.85)',
            }"
          >
            <template v-if="m.role === 'assistant' && !m.content">
              <div class="loader"></div>
            </template>
            <template v-else>
              {{ m.content }}
            </template>
          </div>
        </div>

        <template #footer>
          <NInput
            ref="input-ref"
            v-model:value="inputValue"
            :disabled="inputDisabled"
            type="textarea"
            size="small"
            :autosize="{ minRows: 1, maxRows: 7 }"
            :input-props="{
              style: { color: 'rgba(255, 255, 255, 0.85)' },
            }"
            placeholder="有什么问题尽管问我"
            class="py-6.5px"
            @keydown="handleInputKeyDown"
          >
            <template #suffix>
              <NButton
                size="tiny"
                :focusable="false"
                quaternary
                style="padding-inline: 4px"
                :disabled="inputDisabled"
                class="self-end mb-3.75px"
                @click="sendInput"
              >
                <div class="i-mdi:telegram size-4"></div>
              </NButton>
            </template>
          </NInput>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
  import { useKeyModifier } from '@vueuse/core'
  import type { InputInst } from 'naive-ui'
  import { NButton, NDrawer, NDrawerContent, NFloatButton, NInput } from 'naive-ui'
  import { ref, shallowReactive, useTemplateRef, watch } from 'vue'

  import { getChatResponse } from '@/api/webshell'
  import naiveApi from './providers/naiveApi'

  import ChatImg from '@/assets/images/webshell/chat.png'

  const { initialInput } = defineProps<{
    x: number
    y: number
    drawerTo: string
    initialInput: string
  }>()

  interface ChatMessage {
    role: 'system' | 'assistant' | 'user'
    content: string
  }

  const messages = shallowReactive([] as ChatMessage[])
  const showDrawer = ref(false)
  const inputRef = useTemplateRef<InputInst>('input-ref')
  const inputValue = ref('')
  const inputDisabled = ref(false)

  watch(showDrawer, (show) => {
    if (show) {
      setTimeout(() => inputRef.value?.focus(), 200)
    }
  })

  function sendInput() {
    messages.push({ role: 'user', content: inputValue.value })
    messages.push({ role: 'assistant', content: '' })

    getChatResponse(inputValue.value)
      .then((res) => {
        messages.at(-1)!.content = res.content
      })
      .catch((err) => {
        // eslint-disable-next-line
        naiveApi.message.error(err.message ?? err.response?.data?.reponse?.error)
        messages.pop()
      })
      .finally(() => {
        inputDisabled.value = false
      })

    inputValue.value = ''
    inputDisabled.value = true
  }

  const shiftPressed = useKeyModifier('Shift')
  function handleInputKeyDown(ev: KeyboardEvent) {
    if (ev.key === 'Enter') {
      if (shiftPressed.value) {
        return
      } else {
        sendInput()
      }
    }
  }
</script>

<style scoped>
  :deep(.n-input-wrapper) {
    padding-inline: 8px;
  }

  .loader {
    width: 16px;
    aspect-ratio: 2;
    --_g: no-repeat radial-gradient(circle closest-side, rgba(255, 255, 255, 0.85) 90%, #0000);
    background: var(--_g) 0% 50%, var(--_g) 50% 50%, var(--_g) 100% 50%;
    background-size: calc(100% / 3) 50%;
    animation: l3 1s infinite linear;
  }
  @keyframes l3 {
    20% {
      background-position: 0% 0%, 50% 50%, 100% 50%;
    }
    40% {
      background-position: 0% 100%, 50% 0%, 100% 50%;
    }
    60% {
      background-position: 0% 50%, 50% 100%, 100% 0%;
    }
    80% {
      background-position: 0% 50%, 50% 50%, 100% 100%;
    }
  }
</style>
