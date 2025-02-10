<template>
  <NTree
    :data="fsService.nodes"
    key-field="path"
    label-field="name"
    expand-on-click
    v-model:expanded-keys="expandedKeys"
    v-model:selected-keys="selectedKeys"
    @load="handleLoad"
    @update:expanded-keys="onUpdateExpandedKeys"
    virtual-scroll
    style="height: calc(100% - 40px); width: 100%"
    :render-label="renderLabel"
    :node-props="nodeProps"
    :show-irrelevant-nodes="false"
    :keyboard="false"
    show-line
    multiple
    block-node
    @contextmenu.prevent
    :override-default-node-click-behavior="overrideNodeClickBehavior"
  />

  <NDropdown
    v-model:show="contextMenu.visible"
    trigger="manual"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :options="contextMenu.options"
    @clickoutside="contextMenu.visible = false"
    size="small"
    style="width: 120px"
    @select="(option) => contextMenu.onSelect(option)"
  />
</template>

<script setup lang="tsx">
  import { ref, h, reactive, watch, onMounted, computed } from 'vue';
  import { NTree, NEllipsis, NDropdown } from 'naive-ui';
  import type {
    OnLoad,
    TreeOption,
    TreeNodeProps,
    RenderLabel,
    TreeOverrideNodeClickBehavior,
  } from 'naive-ui/es/tree/src/interface';
  import { FolderOutlined, FolderOpenOutlined } from '@ant-design/icons-vue';
  import { useKeyModifier } from '@vueuse/core';
  import { Modal } from 'ant-design-vue';

  import { useContextMenuOptions } from './contextMenuOptions';
  import FileTreeNodeEdit from './FileTreeNodeEdit.vue';
  import type { WebshellWSManager } from '../../services/webshellWSManager';
  import type { WebshellFSTreeNode } from '../../services/webshellFSService';
  import { useWebshellTermStore } from '../../stores/term';

  const { manager, showHiddenFiles = false } = defineProps<{
    manager: WebshellWSManager;
    showHiddenFiles?: boolean;
  }>();

  const webshellTermStore = useWebshellTermStore();

  const fsService = computed(() => reactive(manager.fsService));
  const uploadService = manager.uploadService;

  onMounted(() => fsService.value.getRoot());

  watch(
    () => showHiddenFiles,
    (val) => {
      fsService.value.showHidden = val;
      refresh();
    },
  );

  const expandedKeys = ref<string[]>([]);
  const selectedKeys = ref<string[]>([]);
  const selectedNodes = ref<WebshellFSTreeNode[]>([]);
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    options: [] as ReturnType<typeof useContextMenuOptions>,
    onSelect(_option: string) {},
  });
  const copiedNodes = ref<WebshellFSTreeNode[]>([]);
  const copyOrCut = ref<'copy' | 'cut'>('copy');

  const handleLoad: OnLoad = (option) => {
    const node = option as WebshellFSTreeNode;
    return fsService.value.getChildren(node);
  };

  function onUpdateExpandedKeys(
    _keys: string[],
    _option: any,
    meta: {
      node: TreeOption | null;
      action: 'expand' | 'collapse' | 'filter';
    },
  ) {
    if (!meta.node) {
      return;
    }
    const node = meta.node;
    switch (meta.action) {
      case 'expand':
        node.prefix = () => h(FolderOpenOutlined);
        break;
      case 'collapse':
        node.prefix = () => h(FolderOutlined);
        break;
    }
  }

  const renderLabel: RenderLabel = ({ option }) => {
    const node = option as WebshellFSTreeNode;

    function checkNameExisted(name: string): boolean {
      return name !== node.name && !!node.parent?.children?.some((child) => child.name === name);
    }

    return (
      <>
        {!node.editable ? (
          <NEllipsis class="max-w-full" tooltip={{ keepAliveOnHover: false }}>
            {{ default: () => node.name }}
          </NEllipsis>
        ) : (
          <FileTreeNodeEdit
            value={node.name}
            checkNameExisted={checkNameExisted}
            onUpdate:value={(newName) => {
              node.resolveEdit(newName);
              node.editable = false;
            }}
            onCancel={() => {
              node.rejectEdit('cancelled');
              node.editable = false;
            }}
          />
        )}
      </>
    );
  };

  const nodeProps: TreeNodeProps = ({ option }) => {
    const node = option as WebshellFSTreeNode;

    return {
      onContextmenu(ev) {
        contextMenu.x = ev.clientX;
        contextMenu.y = ev.clientY;
        contextMenu.options = useContextMenuOptions({
          multiple: selectedKeys.value.length > 1,
          showPaste: copiedNodes.value.length > 0,
          isRoot: !node.parent,
        });
        contextMenu.onSelect = getOnContextMenuSelect(node);
        contextMenu.visible = true;
        ev.preventDefault();
      },
      onClick(ev) {
        ev.stopPropagation();
      },
    };
  };

  function getOnContextMenuSelect(node: WebshellFSTreeNode) {
    return async function (option: string) {
      switch (option) {
        case 'rename':
          fsService.value.rename(node);
          break;
        case 'delete':
          const { destroy } = Modal.confirm({
            title: '文件删除后不可恢复',
            content: `确认删除 ${node.path} 吗？`,
            style: { top: '120px' },
            onOk() {
              fsService.value.delete(node);
              destroy();
            },
            onCancel() {
              destroy();
            },
          });
          break;
        case 'copyPath':
          navigator.clipboard.writeText(node.path);
          break;
        case 'copy':
          copyOrCut.value = 'copy';
          copiedNodes.value = [node];
          break;
        case 'cut':
          copyOrCut.value = 'cut';
          copiedNodes.value = [node];
          break;
        case 'paste': {
          let dest: WebshellFSTreeNode;
          if (node.isDir) {
            dest = node;
          } else {
            dest = node.parent!;
          }
          if (copyOrCut.value === 'copy') {
            for (const copiedNode of copiedNodes.value) {
              await fsService.value.copy(copiedNode, dest.path);
            }
          } else if (copyOrCut.value === 'cut') {
            for (const copiedNode of copiedNodes.value) {
              await fsService.value.move(copiedNode, dest.path);
              fsService.value.getChildren(copiedNode.parent!);
            }
          }
          copiedNodes.value = [];
          fsService.value.getChildren(dest);
          break;
        }
        case 'newFolder':
          if (!node.isDir) {
            fsService.value.create(node.parent!);
          } else {
            if (!expandedKeys.value.includes(node.path)) {
              expandedKeys.value.push(node.path);
              //XXX 这里只有延迟一会才能正常走 `list->expand->create` 的流程，`await node.listChildren()` 和 `await nextTick()` 都有问题，不知道为什么
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            await fsService.value.create(node);
            fsService.value.getChildren(node);
          }
          break;
        case 'openInTerminal': {
          let path: string;
          if (node.isDir) {
            path = node.path;
          } else {
            path = node.parent!.path;
          }
          webshellTermStore.lastFocusedTerm?.input(`cd "${path}"\r`);
          webshellTermStore.lastFocusedTerm?.focus();
          break;
        }
        case 'uploadFile': {
          let dest: WebshellFSTreeNode;
          if (node.isDir) {
            dest = node;
          } else {
            dest = node.parent!;
          }
          await uploadService.dialogUpload('file', dest.path);
          fsService.value.getChildren(dest);
          break;
        }
        case 'uploadFolder': {
          let dest: WebshellFSTreeNode;
          if (node.isDir) {
            dest = node;
          } else {
            dest = node.parent!;
          }
          await uploadService.dialogUpload('directory', dest.path);
          fsService.value.getChildren(dest);
          break;
        }
        // case 'download': {
        //   await storeJWT();
        //   const params = {
        //     resource_id: webshellStore.lastFocusedTerm!.socket.resource!.id,
        //     serverPath: node.path.slice(fsTree.value.nodes[0].path.length),
        //   };
        //   if (node.isDir) {
        //     downloadDir(params);
        //   } else {
        //     downloadFile(params);
        //   }
        // }
      }
    };
  }

  const isMac = navigator.platform.startsWith('Mac');
  const modifierState = useKeyModifier(isMac ? 'Meta' : 'Control');
  //TODO: 支持多选
  const overrideNodeClickBehavior: TreeOverrideNodeClickBehavior = ({ option }) => {
    const node = option as WebshellFSTreeNode;

    // if (!modifierState.value) {
    //   selectedKeys.value = [];
    //   return 'toggleExpand';
    // }
    return 'toggleExpand';
  };

  function refresh() {
    expandedKeys.value.forEach((path) => {
      const node = fsService.value.getNodeByPathBFS(path);
      if (node) {
        fsService.value.getChildren(node);
      }
    });
  }

  defineExpose({
    refresh,
  });
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
