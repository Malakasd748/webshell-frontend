import { PTYService, type PTYTerminal } from '../webSocketBase/ptyService'
import { TermManagerRegistry } from '../termManagerRegistry'
import { WebShellWSManager } from './webShellWSManager'

export class WebshellPTYService extends PTYService {
  constructor(protected override manager: WebShellWSManager) {
    super(manager)
  }

  override addTerm(term: PTYTerminal) {
    super.addTerm(term)

    TermManagerRegistry.register(term, this.manager)
  }
}
