import type { DropdownOption, DropdownDividerOption } from 'naive-ui'

type ContextMenuOption = DropdownOption | DropdownDividerOption

interface Param {
  multiple: boolean
  showPaste: boolean
  isRoot: boolean
}
export function useContextMenuOptions({ multiple, showPaste, isRoot }: Param): ContextMenuOption[] {
  return [
    // { label: '新建文件', key: 'newFile', show: !multiple },
    { label: '新建文件夹', key: 'newFolder', show: !multiple },
    { type: 'divider', key: 'divider1', show: !multiple },
    { label: '复制', key: 'copy' },
    { label: '剪切', key: 'cut', show: !isRoot },
    { label: '粘贴', key: 'paste', show: !multiple, disabled: !showPaste },
    { type: 'divider', key: 'divider2' },
    { label: '删除', key: 'delete', show: !isRoot },
    { label: '重命名', key: 'rename', show: !multiple && !isRoot },
    { type: 'divider', key: 'divider3', show: !isRoot },
    { label: '复制路径', key: 'copyPath', show: !multiple },
    { label: '在终端打开', key: 'openInTerminal', show: !multiple },
    { type: 'divider', key: 'divider4', show: !multiple },
    { label: '下载', key: 'download' },
    { label: '上传文件', key: 'uploadFile', show: !multiple },
    { label: '上传文件夹', key: 'uploadFolder', show: !multiple },
  ]
}
