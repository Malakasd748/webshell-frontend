<template>
  <NTree
    v-model:expanded-keys="expandedKeys"
    v-model:selected-keys="selectedKeys"
    :data="fsService.nodes"
    key-field="path"
    label-field="name"
    expand-on-click
    virtual-scroll
    style="height: calc(100% - 40px); width: 100%"
    :render-label="renderLabel"
    :node-props="nodeProps"
    :show-irrelevant-nodes="false"
    :keyboard="false"
    show-line
    multiple
    block-node
    :override-default-node-click-behavior="overrideNodeClickBehavior"
    @load="handleLoad"
    @update:expanded-keys="onUpdateExpandedKeys"
    @contextmenu.prevent
  />

  <NDropdown
    v-model:show="contextMenu.visible"
    trigger="manual"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :options="contextMenu.options"
    size="small"
    style="width: 120px"
    @clickoutside="contextMenu.visible = false"
    @select="contextMenu.onSelect"
  />
</template>

<script setup lang="ts">
  import { ref, h, reactive, watch, onMounted, computed } from 'vue'
  import { NTree, NEllipsis, NDropdown } from 'naive-ui'
  import type {
    OnLoad,
    TreeOption,
    TreeNodeProps,
    RenderLabel,
    TreeOverrideNodeClickBehavior,
  } from 'naive-ui/es/tree/src/interface'
  import { useKeyModifier } from '@vueuse/core'

  import { FileTreeContextMenu } from './contextMenu'
  import type { ContextMenuActions, ContextMenuOption } from './contextMenu'
  import FileTreeNodeEdit from './FileTreeNodeEdit.vue'
  import type { WebShellWSManager } from '@/services/webshell/webShellWSManager'
  import type { WebShellFSTreeNode } from '@/services/webshell/webshellFSService'
  import { useWebShellTermStore } from '@/stores/webshellTerm'
  import naiveApi from '@/providers/naiveApi'

  const { manager, showHiddenFiles = false } = defineProps<{
    manager: WebShellWSManager
    showHiddenFiles?: boolean
  }>()

  const webshellTermStore = useWebShellTermStore()
  const fsService = computed(() => reactive(manager.fsService))
  const expandedKeys = ref<string[]>([])
  const selectedKeys = ref<string[]>([])
  const copiedNodes = ref<WebShellFSTreeNode[]>([])
  const copyOrCut = ref<'copy' | 'cut'>('copy')

  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    options: [] as ContextMenuOption[],
    onSelect(_option: string) {},
  })

  function refresh() {
    expandedKeys.value.forEach((path) => {
      const node = fsService.value.getNodeByPathBFS(path)
      if (node) {
        void fsService.value.getChildren(node)
      }
    })
  }

  defineExpose({
    refresh,
  })

  onMounted(() => fsService.value.getRoot())

  watch(
    () => showHiddenFiles,
    (val) => {
      fsService.value.showHidden = val
      refresh()
    },
  )

  const handleLoad: OnLoad = (option) => {
    const node = option as WebShellFSTreeNode
    return fsService.value.getChildren(node)
  }

  function onUpdateExpandedKeys(
    _keys: string[],
    _option: unknown,
    meta: {
      node: TreeOption | null
      action: 'expand' | 'collapse' | 'filter'
    },
  ) {
    if (!meta.node) {
      return
    }
    const node = meta.node
    switch (meta.action) {
    case 'expand':
      node.prefix = () => h('div', { class: 'i-ant-design:folder-open-outlined' })
      break
    case 'collapse':
      node.prefix = () => h('div', { class: 'i-ant-design:folder-outlined' })
      break
    }
  }

  const renderLabel: RenderLabel = ({ option }) => {
    const node = option as WebShellFSTreeNode

    function checkNameExisted(name: string): boolean {
      return name !== node.name && !!node.parent?.children?.some(child => child.name === name)
    }

    return !node.editable
      ? h(
        NEllipsis,
        { class: 'max-w-full', tooltip: { keepAliveOnHover: false } },
        { default: () => node.name },
      )
      : h(FileTreeNodeEdit, {
        value: node.name,
        checkNameExisted,
        'onUpdate:value': (newName: string) => {
          node.resolveEdit(newName)
          node.editable = false
        },
        onCancel: () => {
          node.rejectEdit('cancelled')
          node.editable = false
        },
      })
  }

  const nodeProps: TreeNodeProps = ({ option }) => {
    const node = option as WebShellFSTreeNode

    const menu = new FileTreeContextMenu(node, contextMenuActions)

    return {
      onContextmenu(ev) {
        ev.preventDefault()
        contextMenu.options = menu.getOptions()
        contextMenu.onSelect = key => menu.onSelect(key);
        [contextMenu.x, contextMenu.y] = [ev.clientX, ev.clientY]
        contextMenu.visible = true
      },
      onClick(ev) {
        ev.stopPropagation()
      },
    }
  }

  const isMac = navigator.platform.startsWith('Mac')
  const modifierState = useKeyModifier(isMac ? 'Meta' : 'Control')
  const overrideNodeClickBehavior: TreeOverrideNodeClickBehavior = () => {
    if (modifierState) {
      return 'toggleExpand'
    }
    return 'toggleExpand'
  }

  const contextMenuActions: ContextMenuActions = {
    async rename(node) {
      await fsService.value.rename(node)
    },
    delete(node) {
      const { destroy } = naiveApi.dialog.warning({
        title: '文件删除后不可恢复',
        content: `确认删除 ${node.path} 吗？`,
        class: 'mt-30',
        positiveText: '确认',
        negativeText: '取消',
        onPositiveClick: () => {
          void fsService.value.delete(node)
          destroy()
        },
        onClose() {
          destroy()
        },
      })
    },
    async copyPath(node) {
      await navigator.clipboard.writeText(node.path)
    },
    copy(node) {
      copiedNodes.value = [node]
      copyOrCut.value = 'copy'
    },
    cut(node) {
      copiedNodes.value = [node]
      copyOrCut.value = 'cut'
    },
    async paste(node) {
      let destNode = node.isDir ? node : node.parent!
      if (copyOrCut.value === 'copy') {
        await fsService.value.copy(copiedNodes.value[0], destNode.path)
      } else {
        await fsService.value.move(copiedNodes.value[0], destNode.path)
      }
      await fsService.value.getChildren(destNode)
    },
    async newFolder(node) {
      if (!node.isDir) {
        await fsService.value.create(node.parent!)
      } else {
        if (!expandedKeys.value.includes(node.path)) {
          expandedKeys.value.push(node.path)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        await fsService.value.create(node)
        await fsService.value.getChildren(node)
      }
    },
    openInTerminal(node) {
      const path = node.isDir ? node.path : node.parent!.path
      webshellTermStore.lastFocusedTerm?.input(`cd "${path}"\r`)
      webshellTermStore.lastFocusedTerm?.focus()
    },
    async uploadFile(node) {
      const dest = node.isDir ? node : node.parent!
      await manager.uploadService.dialogUpload('file', dest.path)
      await fsService.value.getChildren(dest)
    },
    async uploadFolder(node) {
      const dest = node.isDir ? node : node.parent!
      await manager.uploadService.dialogUpload('directory', dest.path)
      await fsService.value.getChildren(dest)
    },
  }

</script>

<style scoped>
  /* 限制节点宽度，禁止 y 轴滚动*/
  :deep(.n-tree-node) {
    overflow-x: clip;
    overflow-y: visible;
  }

  /* 节点宽度自适应 */
  :deep(.n-tree-node-content__text) {
    flex: 1 1 0;
    contain: inline-size;
  }

  /* 树节点缩进 */
  :deep(.n-tree-node-indent) {
    width: 16px;
  }
  :deep(.n-tree-node-switcher) {
    width: 16px !important;
  }
</style>
