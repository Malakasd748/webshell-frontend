<template>
  <NTooltip
    trigger="focus"
    :show-arrow="false"
    raw
    :show="!!nameInvalid"
    :animated="false"
    placement="bottom"
    width="trigger"
  >
    <div
      :style="{
        background: theme.errorColor,
        color: 'var(--color-text-0)',
        padding: '4px 6px',
        fontSize: '12px',
      }"
    >
      <template v-if="nameInvalid === 'exists'">
        <span class="font-bold">{{ inputModel }}</span> 已存在，请选择其他名称
      </template>
      <template v-else-if="nameInvalid === 'empty'">
        名称不能为空
      </template>
      <template v-else-if="nameInvalid === 'invalid'">
        <span class="font-bold">{{ inputModel }}</span> 不是合法名称，请选择其他名称
      </template>
    </div>

    <template #trigger>
      <NInput
        ref="inputRef"
        v-model:value="inputModel"
        size="tiny"
        placeholder=""
        style="font-size: 14px"
        :status="nameInvalid ? 'error' : undefined"
        @keydown="onKeydown"
        @blur="onBlur"
      />
    </template>
  </NTooltip>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useTemplateRef } from 'vue'
import { NInput, NTooltip, useThemeVars } from 'naive-ui'

const { checkNameExisted, value } = defineProps<{
  value: string
  checkNameExisted(name: string): boolean
}>()
const emit = defineEmits<{
  (e: 'update:value', value: string): void
  (e: 'cancel'): void
}>()

const inputModel = ref(value)
const nameInvalid = computed(() => {
  if (inputModel.value.length === 0) {
    return 'empty'
  }
  if (inputModel.value.includes('/')) {
    return 'invalid'
  }
  if (checkNameExisted(inputModel.value)) {
    return 'exists'
  }
  return false
})

const theme = useThemeVars()

let cancelled = false
function onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') {
    emit('cancel')
    cancelled = true
  }
  else if (ev.key === 'Enter') {
    if (nameInvalid.value) {
      return
    }
    if (inputModel.value === value) {
      emit('cancel')
      cancelled = true
      return
    }
    emit('update:value', inputModel.value)
  }
}

function onBlur() {
  if (cancelled) {
    return
  }
  if (nameInvalid.value || inputModel.value === value) {
    emit('cancel')
    return
  }
  emit('update:value', inputModel.value)
}

const inputRef = useTemplateRef('inputRef')
onMounted(() => {
  inputRef.value!.focus()
  inputRef.value!.select()
})
</script>

<style scoped>
  :deep(.n-input-wrapper) {
    padding-inline: 2px;
  }
</style>
