import type { PTYTerminal } from './services/base/ptyService';
import type { WebshellWSManager } from './services/webshellWSManager';
import { DragAndDropAddon } from './xterm/dragAndDropAddon';

export class TermManagerRegistry {
  private static managerMap = new Map<string, WebshellWSManager>();

  private constructor() {}

  static register(term: PTYTerminal, manager: WebshellWSManager) {
    this.managerMap.set(term.id, manager);

    term.loadAddon(new DragAndDropAddon(manager.uploadService));
  }

  static getManager(term: PTYTerminal): WebshellWSManager | undefined;
  static getManager(id: string): WebshellWSManager | undefined;
  static getManager(termOrId: PTYTerminal | string) {
    if (typeof termOrId === 'string') {
      return this.managerMap.get(termOrId);
    } else {
      return this.managerMap.get(termOrId.id);
    }
  }

  static unregister(term: PTYTerminal) {
    const socket = this.managerMap.get(term.id);
    socket?.ptyService.removeTerm(term);
    return this.managerMap.delete(term.id);
  }
}
