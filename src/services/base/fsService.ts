import { join } from 'pathe'

import type { WebSocketManager } from './webSocketManager'
import { WebSocketService } from './webSocketServiceBase'

const enum FSAction {
  List = 'list',
  GetRoot = 'get_root',
  Rename = 'rename',
  Create = 'create',
  Delete = 'delete',
  Copy = 'copy',
  Move = 'move',
}

export interface FSEntry {
  readonly name: string
  readonly path: string
  readonly isDir: boolean
  readonly size: number
  readonly mode: number
  readonly modTime: number
}

interface FSActionMap {
  [FSAction.List]: {
    request: { showHidden: boolean }
    response: { entries: FSEntry[] }
  }
  [FSAction.GetRoot]: {
    request: void
    response: FSEntry
  }
  [FSAction.Rename]: {
    request: { newName: string }
    response: void
  }
  [FSAction.Create]: {
    request: { name: string, isDir: boolean }
    response: void
  }
  [FSAction.Delete]: {
    request: void
    response: void
  }
  [FSAction.Copy]: {
    request: { dest: string }
    response: void
  }
  [FSAction.Move]: {
    request: { dest: string }
    response: void
  }
}

export class FSService<Node extends FSTreeNode<Node>> extends WebSocketService {
  public readonly name = 'fs'
  public nodes: Node[] = []
  public showHidden = false

  constructor(
    protected override manager: WebSocketManager,
    private nodeFactory: (entry: FSEntry, parent?: Node) => Node,
  ) {
    super(manager)
  }

  protected async request<T extends FSAction>(
    id: string,
    action: T,
    data: FSActionMap[T]['request'],
  ) {
    return this.manager.request<T, FSActionMap[T]['request'], FSActionMap[T]['response']>({
      service: this.name,
      action,
      id,
      data,
    })
  }

  override handleAction(_action: string, _id: string, _data: unknown): void {}

  override dispose(): void {
    this.nodes = []
  }

  async move(node: Node, dest: string) {
    await this.request(node.path, FSAction.Move, { dest })
  }

  async copy(node: Node, dest: string) {
    await this.request(node.path, FSAction.Copy, { dest })
  }

  async delete(node: Node) {
    await this.request(node.path, FSAction.Delete, undefined)
    const idx = node.parent?.children?.indexOf(node)
    if (idx !== undefined && idx > -1) {
      node.parent?.children?.splice(idx, 1)
    }
  }

  async create(parent: Node, isDir: boolean, name: string) {
    await this.request(join(parent.path, name), FSAction.Create, { name, isDir })
    await this.getChildren(parent)
  }

  async rename(node: Node, newName: string) {
    await this.request(node.path, FSAction.Rename, { newName })
    // 假定根节点是不能改名的
    await this.getChildren(node.parent!)
  }

  async getChildren(node: Node) {
    const { entries } = await this.request(node.path, FSAction.List, {
      showHidden: this.showHidden,
    })
    node.children = entries.map(entry => this.nodeFactory(entry, node))
  }

  async getRoot() {
    const entry = await this.request('/', FSAction.GetRoot, undefined)
    this.nodes = [this.nodeFactory(entry)]
  }

  getNodeByPathBFS(path: string) {
    const queue = [...this.nodes]
    while (queue.length) {
      const node = queue.shift()!
      if (node.path === path) {
        return node
      }
      if (node.children) {
        queue.push(...node.children)
      }
    }
    return undefined
  }
}

/**
 * {@link [F-bounded quantification/polymorphism](https://en.wikipedia.org/wiki/Bounded_quantification)}
 *
 * AI 给的方案，能够使派生类的成员有正确的类型，不明觉厉。
 *
 * 让文件树服务与框架解耦
 */
export interface FSTreeNode<T extends FSTreeNode<T>> extends FSEntry {}
export class FSTreeNode<T extends FSTreeNode<T>> {
  public children?: T[]

  constructor(entry: FSEntry, public readonly parent?: T) {
    Object.assign(this, entry)
  }
}
