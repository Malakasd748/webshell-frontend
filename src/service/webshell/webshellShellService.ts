import { ShellService, type ShellTerminal } from '../websocketBase/shellService'
import { TermManagerRegistry } from '../termManagerRegistry'
import { WebShellWSManager } from './webshellWSManager'
import { useWebShellTermStore } from '@/stores/webshellTerm'

export class WebshellShellService extends ShellService {
  override addTerm(term: ShellTerminal) {
    if (!(this.manager instanceof WebShellWSManager)) throw new Error('ShellService not registered')

    super.addTerm(term)

    TermManagerRegistry.register(term, this.manager)
  }

  protected override getLastActiveShell(): ShellTerminal | undefined {
    return useWebShellTermStore().lastFocusedTerm
  }
}
