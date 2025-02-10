import { WebSocketManager, type WebSocketManagerEventMap } from './base/webSocketManager';
import { WebshellPTYService } from './webshellPTYService';
import { WebshellFSService } from './webshellFSService';
import { UploadService } from './base/uploadService';
import { useWebshellUploadStore } from '../stores/upload';
import type { UploadSession } from './base/uploadService';
import { WebshellResource } from '../webshellResource';

// 允许服务扩展 WebSocketManager 的事件类型
export interface WebshellWSManagerEventMap extends WebSocketManagerEventMap {}
export interface WebshellWSManager {
  addEventListener<K extends keyof WebshellWSManagerEventMap>(
    type: K,
    listener: (ev: WebshellWSManagerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

export class WebshellWSManager extends WebSocketManager {
  readonly ptyService: WebshellPTYService;
  readonly fsService: WebshellFSService;
  readonly uploadService: UploadService;

  constructor(url: string | URL, readonly resource: Readonly<WebshellResource>) {
    super(url);

    this.ptyService = new WebshellPTYService(this);
    this.fsService = new WebshellFSService(this);

    const uploadSessions = useWebshellUploadStore().sessions;
    this.uploadService = new UploadService(this, uploadSessions as UploadSession[]);

    this.registerService(this.ptyService);
    this.registerService(this.fsService);
    this.registerService(this.uploadService);
  }

  protected override fetchNewUrl(): Promise<string> {
    return this.resource.fetchWsUrl();
  }
}
