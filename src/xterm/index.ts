import { shallowReactive } from 'vue'
import { Terminal } from '@xterm/xterm'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { ITerminalOptions, ITerminalInitOnlyOptions } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { merge } from 'lodash-es'

import { AutoFitAddon } from './autoFitAddon'
import { ShellIntegrationAddon } from './shellIntegrationAddon'
import type { ShellTerminal } from '../services/websocketBase/shellService'

export class Term extends Terminal implements ShellTerminal {
  readonly id = String(Date.now())
  container: HTMLElement | null = null

  private fitAddon = new AutoFitAddon()
  private shellIntegrationAddon = new ShellIntegrationAddon()

  fit() {
    this.fitAddon.fit()
  }

  get cwd() {
    return this.shellIntegrationAddon.cwd
  }

  constructor(options?: ITerminalOptions | ITerminalInitOnlyOptions) {
    type Option = Exclude<typeof options, undefined>

    super(merge<Option, Option>({ cursorBlink: true }, options ?? {}))
    const reactiveThis = shallowReactive(this)

    reactiveThis.setupAddons()
    Term.newTermCallbacks.forEach(cb => cb(reactiveThis))
    return reactiveThis
  }

  // should only call once
  private setupAddons() {
    this.loadAddon(this.fitAddon)
    this.loadAddon(this.shellIntegrationAddon)
    this.loadAddon(new WebLinksAddon())
  }

  private static newTermCallbacks: ((term: Term) => void)[] = []
  static registerNewTermCallback(cb: (term: Term) => void) {
    this.newTermCallbacks.push(cb)
  }

  override open(parent: HTMLElement): void {
    super.open(parent)
    this.container = parent
    this.element!.style.paddingLeft = '20px'
  }
}
