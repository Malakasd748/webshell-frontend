import type { DropdownOption } from 'naive-ui'
import type { WebShellFSTreeNode } from '@/service/webshell/webshellFSService'

type ContextMenuActionNames = 'rename' | 'delete' | 'copyPath' | 'copy' | 'cut' | 'paste' | 'newFolder' | 'openInTerminal' | 'uploadFile' | 'uploadFolder'

export type ContextMenuActions = {
  [action in ContextMenuActionNames]: (node: WebShellFSTreeNode) => void
}

type MenuOptionKey = ContextMenuActionNames | `divider${number}`

export type ContextMenuOption = (Omit<DropdownOption, 'key'> & { key: MenuOptionKey })

interface FileTreeContextMenuStates {
  isMultipleSelect?: () => boolean
  isNoneSelect?: () => boolean
}

export class FileTreeContextMenu implements Required<FileTreeContextMenuStates> {
  isMultipleSelect = () => false
  isNoneSelect = () => false

  constructor(
    private node: WebShellFSTreeNode,
    private actions: ContextMenuActions,
    states: FileTreeContextMenuStates = {},
  ) {
    for (const [key, func] of Object.entries(states)) {
      const typedKey = key as keyof FileTreeContextMenuStates
      const typedFunc = func as () => boolean

      this[typedKey] = typedFunc
    }
  }

  getOptions(): ContextMenuOption[] {
    return [
      { label: '新建文件夹', key: 'newFolder', show: !this.isMultipleSelect() },
      { type: 'divider', key: 'divider1', show: !this.isMultipleSelect() },
      { label: '复制', key: 'copy' },
      { label: '剪切', key: 'cut', show: !this.node.isRoot },
      { label: '粘贴', key: 'paste', show: !this.isMultipleSelect(), disabled: this.isNoneSelect() },
      { type: 'divider', key: 'divider2' },
      { label: '删除', key: 'delete', show: !this.node.isRoot },
      { label: '重命名', key: 'rename', show: !this.isMultipleSelect() && !this.node.isRoot },
      { type: 'divider', key: 'divider3', show: !this.node.isRoot },
      { label: '复制路径', key: 'copyPath', show: !this.isMultipleSelect() },
      { label: '在终端打开', key: 'openInTerminal', show: !this.isMultipleSelect() },
      { type: 'divider', key: 'divider4', show: !this.isMultipleSelect() },
      { label: '上传文件', key: 'uploadFile', show: !this.isMultipleSelect() },
      { label: '上传文件夹', key: 'uploadFolder', show: !this.isMultipleSelect() },
    ]
  }

  onSelect(option: string) {
    switch (option) {
      case 'rename':
        this.actions.rename(this.node)
        break
      case 'delete':
        this.actions.delete(this.node)
        break
      case 'copyPath':
        this.actions.copyPath(this.node)
        break
      case 'copy':
        this.actions.copy(this.node)
        break
      case 'cut':
        this.actions.cut(this.node)
        break
      case 'paste':
        this.actions.paste(this.node)
        break
      case 'newFolder':
        this.actions.newFolder(this.node)
        break
      case 'openInTerminal':
        this.actions.openInTerminal(this.node)
        break
      case 'uploadFile':
        this.actions.uploadFile(this.node)
        break
      case 'uploadFolder':
        this.actions.uploadFolder(this.node)
        break
    }
  }
}
