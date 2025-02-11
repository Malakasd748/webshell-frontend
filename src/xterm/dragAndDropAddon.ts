import type { ITerminalAddon } from '@xterm/xterm'
import { useEventListener } from '@vueuse/core'

import type { Term } from '.'
import type { UploadService } from '../services/base/uploadService'

export class DragAndDropAddon implements ITerminalAddon {
  private terminal?: Term

  private cleanupFns: (() => void)[] = []

  constructor(private service: UploadService) {}

  activate(terminal: Term): void {
    this.terminal = terminal

    this.cleanupFns.push(
      useEventListener(terminal.container, 'dragover', ev => ev.preventDefault()),
    )
    this.cleanupFns.push(useEventListener(terminal.container, 'drop', ev => this.handleDrop(ev)))
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

    const items = ev.dataTransfer.items
    for (const item of items) {
      const entry = item.webkitGetAsEntry()
      if (!entry) {
        continue
      }
      this.service.dropUpload(entry, this.terminal!.shellIntegrationAddon.cwd.value || 'temp/')
    }
  }
}
