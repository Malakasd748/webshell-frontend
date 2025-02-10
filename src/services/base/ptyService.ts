import type { IDisposable, Terminal } from '@xterm/xterm';

import { WebSocketService } from './webSocketServiceBase';
import type { WebSocketManager } from './webSocketManager';

const enum PTYAction {
  Command = 'command',
  Resize = 'resize',
  Start = 'start',
  Terminate = 'terminate',
}

type PTYActionMap = {
  [PTYAction.Command]: {
    request: string;
    response: string;
  };
  [PTYAction.Resize]: {
    request: { cols: number; rows: number };
    response: void;
  };
  [PTYAction.Start]: {
    request: {
      cwd: string;
    };
    response: void;
  };
  [PTYAction.Terminate]: {
    request: void;
    response: void;
  };
};

/** 将具体的 XTerm 实现从 PTY 服务中解耦 */
export interface PTYTerminal extends Terminal {
  id: string;
  fit(): void;
}

export class PTYService<Term extends PTYTerminal = PTYTerminal> extends WebSocketService {
  public readonly name = 'pty';
  public terms = new Map<string, Term>();
  private disposables: IDisposable[] = [];

  constructor(protected override manager: WebSocketManager) {
    super(manager);

    manager.addEventListener('reconnect-end', ({ detail: { success } }) => {
      if (!success) return;

      for (const term of this.terms.values()) {
        this.startPty(term);
      }
    });
  }

  private notify<T extends PTYAction>(id: string, action: T, data: PTYActionMap[T]['request']) {
    return this.manager.request<T, PTYActionMap[T]['request'], PTYActionMap[T]['response']>(
      {
        service: this.name,
        action,
        id,
        data,
      },
      true,
    );
  }

  private async request<T extends PTYAction>(
    id: string,
    action: T,
    data: PTYActionMap[T]['request'],
  ) {
    return this.manager.request<T, PTYActionMap[T]['request'], PTYActionMap[T]['response']>({
      service: this.name,
      action,
      id,
      data,
    });
  }

  override dispose(): void {
    this.disposables.forEach((d) => d.dispose);
  }

  override handleAction(action: string, id: string, data: any): void {
    switch (action) {
      case PTYAction.Command:
        this.handleCommand(id, data);
        break;
    }
  }

  private handleCommand(id: string, data: PTYActionMap['command']['response']) {
    const term = this.terms.get(id);
    if (!term) return;

    term.write(data);
  }

  private async startPty(term: Term) {
    await this.request(term.id, PTYAction.Start, { cwd: '' });
    term.fit();
    this.notify(term.id, PTYAction.Resize, { cols: term.cols, rows: term.rows });
  }

  addTerm(term: Term) {
    this.terms.set(term.id, term);

    this.disposables.push(
      term.onData((data) => {
        this.notify(term.id, PTYAction.Command, data);
      }),
    );
    this.disposables.push(
      term.onResize((data) => {
        this.notify(term.id, PTYAction.Resize, data);
      }),
    );

    if (this.manager.ws.readyState === WebSocket.CONNECTING) {
      this.manager.ws.addEventListener('open', () => this.startPty(term), { once: true });
    } else if (this.manager.ws.readyState === WebSocket.OPEN) {
      this.startPty(term);
    }
  }

  removeTerm(term: Term) {
    if (!this.terms.delete(term.id)) return;

    this.notify(term.id, PTYAction.Terminate, undefined);
    if (this.terms.size === 0) {
      this.manager.ws.close();
    }
  }
}
