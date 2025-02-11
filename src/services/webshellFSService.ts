import { h } from 'vue'
import type { VNodeChild } from 'vue'
import type { TreeOption } from 'naive-ui/es/tree/src/interface'
import { FolderOutlined, FileOutlined } from '@ant-design/icons-vue'

import { FSTreeNode, FSService } from './base/fsService'
import type { FSEntry } from './base/fsService'
import { WebSocketManager } from './base/webSocketManager'

export class WebshellFSService extends FSService<WebshellFSTreeNode> {
  constructor(protected override manager: WebSocketManager) {
    super(manager, (entry, parent) => new WebshellFSTreeNode(entry, parent))
  }

  override async rename(node: WebshellFSTreeNode) {
    const newName = await node.rename()
    await super.rename(node, newName)
  }

  override async create(parent: WebshellFSTreeNode, isDir = true) {
    const newNode = new WebshellFSTreeNode(
      { isDir, mode: 0, modTime: 0, name: '', path: '', size: 0 },
      parent,
    )
    parent.children = parent.children ?? []
    parent.children.unshift(newNode)

    try {
      const name = await newNode.rename()
      await super.create(parent, isDir, name)
    }
    catch {
      parent.children.shift()
    }
  }
}

export class WebshellFSTreeNode extends FSTreeNode<WebshellFSTreeNode> implements TreeOption {
  [x: string]: unknown;

  checkboxDisabled?: boolean
  disabled?: boolean
  isLeaf?: boolean
  prefix?: () => VNodeChild
  suffix?: () => VNodeChild
  editable?: boolean

  constructor(entry: FSEntry, parent?: WebshellFSTreeNode) {
    super(entry, parent)

    this.prefix = this.isDir ? () => h(FolderOutlined) : () => h(FileOutlined)
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
  rejectEdit(_reason?: any) {}
}
