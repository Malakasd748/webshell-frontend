import { h } from 'vue'
import type { VNodeChild } from 'vue'
import type { TreeOption } from 'naive-ui/es/tree/src/interface'

import { FSTreeNode, FSService } from '../webSocketBase/fsService'
import type { FSEntry } from '../webSocketBase/fsService'

export class WebShellFSService extends FSService<WebShellFSTreeNode> {
  constructor() {
    super((entry, parent) => new WebShellFSTreeNode(entry, parent))
  }

  override async rename(node: WebShellFSTreeNode) {
    const newName = await node.rename()
    await super.rename(node, newName)
  }

  override async create(parent: WebShellFSTreeNode, isDir = true) {
    const newNode = new WebShellFSTreeNode(
      { isDir, mode: 0, modTime: 0, name: '', path: '', size: 0 },
      parent,
    )
    parent.children = parent.children ?? []
    parent.children.unshift(newNode)

    try {
      const name = await newNode.rename()
      await super.create(parent, isDir, name)
    } catch {
      parent.children.shift()
    }
  }
}

export class WebShellFSTreeNode extends FSTreeNode<WebShellFSTreeNode> implements TreeOption {
  [x: string]: unknown;

  checkboxDisabled?: boolean
  disabled?: boolean
  isLeaf?: boolean
  prefix?: () => VNodeChild
  suffix?: () => VNodeChild
  editable?: boolean

  constructor(entry: FSEntry, parent?: WebShellFSTreeNode) {
    super(entry, parent)

    this.prefix = this.isDir
      ? () => h('div', { class: ['i-ant-design:folder-outlined'] })
      : () => h('div', { class: ['i-ant-design:file-outlined'] })
    this.isLeaf = !this.isDir
  }

  rename() {
    this.editable = true
    return new Promise<string>((resolve, reject) => {
      this.resolveEdit = resolve
      this.rejectEdit = reject
    })
  }

  resolveEdit(_newName: string) {}
  rejectEdit(_reason?: unknown) {}
}
