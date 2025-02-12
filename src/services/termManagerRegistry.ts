import type { PTYTerminal } from './webSocketBase/ptyService'
import type { WebShellWSManager } from './webShell/webshellWSManager'
import { DragAndDropAddon } from '../xterm/dragAndDropAddon'

export class TermManagerRegistry {
  private static managerMap = new Map<string, WebShellWSManager>()

  private constructor() {}

  static register(term: PTYTerminal, manager: WebShellWSManager) {
    this.managerMap.set(term.id, manager)

    term.loadAddon(new DragAndDropAddon(manager.uploadService))
  }

  static getManager(term: PTYTerminal): WebShellWSManager | undefined
  static getManager(id: string): WebShellWSManager | undefined
  static getManager(termOrId: PTYTerminal | string) {
    if (typeof termOrId === 'string') {
      return this.managerMap.get(termOrId)
    }
    else {
      return this.managerMap.get(termOrId.id)
    }
  }

  static unregister(term: PTYTerminal) {
    const socket = this.managerMap.get(term.id)
    socket?.ptyService.removeTerm(term)
    return this.managerMap.delete(term.id)
  }
}
