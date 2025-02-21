import { shallowReadonly } from 'vue'

import type { ShellTerminal } from './websocketBase/shellService'
import type { WebShellWSManager } from './webshell/webShellWSManager'
import { DragAndDropAddon } from '../xterm/dragAndDropAddon'

export class TermManagerRegistry {
  private static managerMap = new Map<string, WebShellWSManager>()

  private constructor() {}

  static register(term: ShellTerminal, manager: WebShellWSManager) {
    this.managerMap.set(term.id, shallowReadonly(manager) as WebShellWSManager)

    term.loadAddon(new DragAndDropAddon(manager.uploadService))
  }

  static getManager(term: ShellTerminal): WebShellWSManager | undefined
  static getManager(id: string): WebShellWSManager | undefined
  static getManager(catchAll: unknown): WebShellWSManager | undefined
  static getManager(termOrId: ShellTerminal | string) {
    if (typeof termOrId === 'object') {
      return this.managerMap.get(termOrId.id)
    } else if (typeof termOrId === 'string') {
      return this.managerMap.get(termOrId)
    } else {
      return undefined
    }
  }

  static unregister(term: ShellTerminal) {
    const socket = this.managerMap.get(term.id)
    socket?.shellService.removeTerm(term)
    return this.managerMap.delete(term.id)
  }
}
