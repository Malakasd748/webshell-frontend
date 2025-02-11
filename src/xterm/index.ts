import { watch, shallowReactive } from 'vue'
import { Terminal } from '@xterm/xterm'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { ITerminalOptions, ITerminalInitOnlyOptions } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { merge } from 'lodash-es'

import { AutoFitAddon } from './autoFitAddon'
import { ShellIntegrationAddon } from './shellIntegrationAddon'
import type { PTYTerminal } from '../services/base/ptyService'

export class Term extends Terminal implements PTYTerminal {
  container: HTMLElement | null = null
  readonly id = String(Date.now())
  private fitAddon = new AutoFitAddon()

  fit() {
    this.fitAddon.fit()
  }

  private constructor(options?: ITerminalOptions | ITerminalInitOnlyOptions) {
    type Option = Exclude<typeof options, undefined>
    super(merge<Option, Option>({ cursorBlink: true }, options ?? {}))

    this.loadAddon(this.fitAddon)
    this.loadAddon(new ShellIntegrationAddon())
    this.loadAddon(new WebLinksAddon())
  }

  private static newTermCallbacks: ((term: Term) => void)[] = []
  static registerNewTermCallback(cb: (term: Term) => void) {
    this.newTermCallbacks.push(cb)
  }

  static new(options?: ITerminalOptions | ITerminalInitOnlyOptions): Term {
    const term = shallowReactive(new Term(options))

    watch(
      () => term.container,
      (el) => {
        if (!el) {
          return
        }
        term.open(el)
        term.element!.style.paddingLeft = '20px'
        term.element!.style.paddingTop = '12px'
      },
    )

    this.newTermCallbacks.forEach(cb => cb(term))
    return term
  }
}
