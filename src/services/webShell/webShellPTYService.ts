import { PTYService, type PTYTerminal } from '../webSocketBase/ptyService'
import { TermManagerRegistry } from '../../termManagerRegistry'
import { WebshellWSManager } from './webshellWSManager'

export class WebshellPTYService extends PTYService {
  constructor(protected override manager: WebshellWSManager) {
    super(manager)
  }

  override addTerm(term: PTYTerminal) {
    super.addTerm(term)

    TermManagerRegistry.register(term, this.manager)
  }
}
