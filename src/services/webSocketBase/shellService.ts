import type { IDisposable, Terminal } from '@xterm/xterm'

import { WebSocketService } from './websocketServiceBase'
import type { WebSocketManager } from './webSocketManager'

const enum ShellAction {
  Command = 'command',
  Resize = 'resize',
  Start = 'start',
  Terminate = 'terminate',
}

interface ShellActionMap {
  [ShellAction.Command]: {
    request: string
    response: string
  }
  [ShellAction.Resize]: {
    request: { cols: number, rows: number }
    response: void
  }
  [ShellAction.Start]: {
    request: {
      cwd: string
    }
    response: void
  }
  [ShellAction.Terminate]: {
    request: void
    response: void
  }
}

/** 将具体的 XTerm 实现从 PTY 服务中解耦 */
export interface ShellTerminal extends Terminal {
  id: string
  fit(): void
  cwd: string
}

export class ShellService<Term extends ShellTerminal = ShellTerminal> extends WebSocketService {
  public readonly name = 'shell'
  public terms = new Map<string, Term>()

  private disposables: IDisposable[] = []
  protected manager?: WebSocketManager

  constructor() {
    super()
  }

  register(manager: WebSocketManager): void {
    this.manager = manager

    manager.e.addEventListener('reconnect-end', ({ detail: { success } }) => {
      if (!success) return

      for (const term of this.terms.values()) {
        void this.startShell(term)
      }
    })
  }

  private notify<T extends ShellAction>(id: string, action: T, data: ShellActionMap[T]['request']) {
    if (!this.manager) throw new Error('PTYService not registered')

    return this.manager.request<T, ShellActionMap[T]['request'], ShellActionMap[T]['response']>(
      {
        service: this.name,
        action,
        id,
        data,
      },
      false,
    )
  }

  private async request<T extends ShellAction>(
    id: string,
    action: T,
    data: ShellActionMap[T]['request'],
  ) {
    if (!this.manager) throw new Error('ShellService not registered')

    return this.manager.request<T, ShellActionMap[T]['request'], ShellActionMap[T]['response']>({
      service: this.name,
      action,
      id,
      data,
    })
  }

  override dispose(): void {
    this.disposables.forEach(d => d.dispose())
  }

  override handleAction(action: ShellAction, id: string, data: ShellActionMap[typeof action]['response']): void {
    switch (action) {
      case ShellAction.Command:
        this.handleCommand(id, data as string)
        break
    }
  }

  private handleCommand(id: string, data: string) {
    const term = this.terms.get(id)
    if (!term) return

    term.write(data)
  }

  protected getLastActiveShell(): Term | undefined {
    return undefined
  }

  private async startShell(term: Term) {
    await this.request(term.id, ShellAction.Start, { cwd: this.getLastActiveShell()?.cwd || '' })
    term.fit()
    void this.notify(term.id, ShellAction.Resize, { cols: term.cols, rows: term.rows })
  }

  addTerm(term: Term) {
    if (!this.manager) throw new Error('ShellService not registered')

    this.terms.set(term.id, term)

    this.disposables.push(
      term.onData((data) => {
        void this.notify(term.id, ShellAction.Command, data)
      }),
    )
    this.disposables.push(
      term.onResize((data) => {
        void this.notify(term.id, ShellAction.Resize, data)
      }),
    )

    if (this.manager.ws.readyState === WebSocket.CONNECTING) {
      this.manager.ws.addEventListener('open', () => this.startShell(term), { once: true })
    } else if (this.manager.ws.readyState === WebSocket.OPEN) {
      void this.startShell(term)
    }
  }

  removeTerm(term: Term) {
    if (!this.manager) throw new Error('ShellService not registered')
    if (!this.terms.delete(term.id)) return

    void this.notify(term.id, ShellAction.Terminate, undefined)
    if (this.terms.size === 0) {
      this.manager.ws.close()
    }
  }
}
