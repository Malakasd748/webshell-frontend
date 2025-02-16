import { PTYService, type PTYTerminal } from '../webSocketBase/ptyService'
import { TermManagerRegistry } from '../termManagerRegistry'
import { WebShellWSManager } from './webShellWSManager'

export class WebshellPTYService extends PTYService {
  override addTerm(term: PTYTerminal) {
    if (!(this.manager instanceof WebShellWSManager)) throw new Error('PTYService not registered')

    super.addTerm(term)

    TermManagerRegistry.register(term, this.manager)
  }
}
