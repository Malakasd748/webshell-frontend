<template>
  <NModal
    v-model:show="show"
    :mask-closable="false"
    preset="card"
    :bordered="false"
    title="新建 SSH 连接"
    style="width: 540px"
    @after-leave="resetForm()"
  >
    <NForm
      id="ssh-form"
      ref="form"
      :model="formValue"
      :rules="rules"
      label-placement="left"
      label-width="80"
      @submit.prevent="handleSubmit()"
    >
      <NFormItem
        label="名称"
        path="name"
      >
        <NInput
          v-model:value="formValue.name"
          placeholder="标签名称"
          autofocus
        />
      </NFormItem>

      <div class="flex">
        <NFormItem
          class="grow"
          label="主机"
          path="host"
        >
          <NInput
            v-model:value="formValue.host"
            placeholder="SSH 服务器地址"
          />
        </NFormItem>

        <NFormItem
          label="端口"
          path="port"
        >
          <NInputNumber
            v-model:value="formValue.port"
            class="w-20"
            placeholder="端口"
            :show-button="false"
            :min="1"
            :max="65535"
          />
        </NFormItem>
      </div>

      <NFormItem
        label="用户名"
        path="username"
      >
        <NInput
          v-model:value="formValue.username"
          placeholder="SSH 登录用户名"
        />
      </NFormItem>

      <NFormItem
        label="密码"
        path="password"
      >
        <NInput
          v-model:value="formValue.password"
          type="password"
          show-password-on="click"
          placeholder="SSH 登录密码"
        />
      </NFormItem>
    </NForm>

    <div class="flex">
      <NButton
        class="ml-auto"
        @click="show = false"
      >
        取消
      </NButton>
      <NButton
        :loading="isLoading"
        class="ml-3"
        type="primary"
        :disabled="isLoading"
        attr-type="submit"
        form="ssh-form"
      >
        确定
      </NButton>
    </div>
  </NModal>
</template>

<script setup lang='ts'>
  import type { FormInst, FormRules } from 'naive-ui'
  import { NButton, NForm, NFormItem, NInput, NInputNumber, NModal } from 'naive-ui'
  import { ref, useTemplateRef } from 'vue'

  import { SSHResource } from '@/models/resources/sshResource'
  import { useWebShellResourceStore } from '@/stores/webshellResource'
  import { useWebShellTermStore } from '@/stores/webshellTerm'

  const show = defineModel<boolean>('show', { default: false })

  const isLoading = ref(false)
  const form = useTemplateRef<FormInst>('form')

  const resourceStore = useWebShellResourceStore()
  const termStore = useWebShellTermStore()

  const formValue = ref({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
  })

  const rules: FormRules = {
    name: [
      { required: true, message: '请输入名称' },
      { message: '名称已存在', validator: (_rule, value) => !resourceStore.resources.some(r => r.name === value) },
    ],
    host: {
      required: true,
      message: '请输入主机地址',
    },
    port: {
      required: true,
      type: 'number',
      message: '请输入端口号',
    },
    username: {
      required: true,
      message: '请输入用户名',
    },
    password: {
      required: true,
      message: '请输入密码',
    },
  }

  async function handleSubmit() {
    if (!form.value) return

    isLoading.value = true
    try {
      await form.value.validate()
    } catch {
      isLoading.value = false
      return
    }

    const resource = new SSHResource({
      name: formValue.value.name,
      host: formValue.value.host,
      port: formValue.value.port,
      username: formValue.value.username,
      password: formValue.value.password,
    })

    resourceStore.addResource(resource)
    resourceStore.selectResource(resource)

    await termStore.addTerm(resource)

    isLoading.value = false
    show.value = false
    resetForm()
  }

  function resetForm() {
    Object.assign(formValue.value, {
      name: '',
      host: '',
      port: 22,
      username: '',
      password: '',
    })
    form.value?.restoreValidation()
  }
</script>

<style scoped></style>
