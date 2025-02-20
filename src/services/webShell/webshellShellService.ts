import { ShellService, type ShellTerminal } from '../websocketBase/shellService'
import { TermManagerRegistry } from '../termManagerRegistry'
import { WebShellWSManager } from './webShellWSManager'

export class WebshellShellService extends ShellService {
  override addTerm(term: ShellTerminal) {
    if (!(this.manager instanceof WebShellWSManager)) throw new Error('ShellService not registered')

    super.addTerm(term)

    TermManagerRegistry.register(term, this.manager)
  }
}
