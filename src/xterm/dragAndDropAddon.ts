import type { ITerminalAddon } from '@xterm/xterm'
import { useEventListener } from '@vueuse/core'

import type { Term } from '.'
import type { UploadService } from '../service/websocketBase/uploadService'

export class DragAndDropAddon implements ITerminalAddon {
  private terminal?: Term

  private cleanupFns: (() => void)[] = []

  constructor(private service: UploadService) {}

  activate(terminal: Term): void {
    this.terminal = terminal

    this.cleanupFns.push(
      useEventListener(() => terminal.container, 'dragover', ev => ev.preventDefault()),
    )
    this.cleanupFns.push(useEventListener(() => terminal.container, 'drop', ev => this.handleDrop(ev)))
  }

  dispose(): void {
    this.cleanupFns.forEach(cleanup => cleanup())
    this.cleanupFns = []
  }

  private handleDrop(ev: DragEvent) {
    ev.preventDefault()
    if (!ev.dataTransfer) {
      return
    }
    if (!this.terminal) {
      return
    }

    const items = ev.dataTransfer.items
    for (const item of items) {
      const entry = item.webkitGetAsEntry()
      if (!entry) {
        continue
      }
      void this.service.dropUpload(entry, this.terminal.cwd || 'temp/')
    }
  }
}
