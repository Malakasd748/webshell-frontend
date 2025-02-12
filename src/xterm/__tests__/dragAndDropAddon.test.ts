/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DragAndDropAddon } from '../dragAndDropAddon'
import { UploadService } from '../../services/webSocketBase/uploadService'
import type { Term } from '..'

// Mock DragEvent for Node.js environment
class MockDragEvent extends Event {
  dataTransfer: any

  constructor(type: string, eventInitDict?: any) {
    super(type, eventInitDict)
    this.dataTransfer = eventInitDict?.dataTransfer
  }
}
global.DragEvent = MockDragEvent as any

class MockUploadService extends UploadService {
  constructor() {
    super({} as any, [])
  }

  readonly name = 'upload' as const
  waitForSetup = false
  dropUpload = vi.fn()
  dialogUpload = vi.fn()
  handleAction = vi.fn()
  dispose = vi.fn()
}

class MockTerminal implements Partial<Term> {
  container: HTMLElement
  cwd = '/test/path'

  constructor() {
    this.container = document.createElement('div')
  }
}

describe('DragAndDropAddon', () => {
  let addon: DragAndDropAddon
  let terminal: MockTerminal
  let uploadService: MockUploadService

  beforeEach(() => {
    terminal = new MockTerminal()
    uploadService = new MockUploadService()
    addon = new DragAndDropAddon(uploadService)
    addon.activate(terminal as any)
  })

  it('should prevent default on dragover', () => {
    const event = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    })
    const preventDefault = vi.spyOn(event, 'preventDefault')

    terminal.container.dispatchEvent(event)

    expect(preventDefault).toHaveBeenCalled()
  })

  it('should handle file drop', () => {
    const mockEntry = {
      isFile: true,
      name: 'test.txt',
    }

    const event = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: {
        items: [{
          webkitGetAsEntry: () => mockEntry,
        }],
      } as any,
    })

    terminal.container.dispatchEvent(event)

    expect(uploadService.dropUpload).toHaveBeenCalledWith(mockEntry, '/test/path')
  })

  it('should handle drop with temp directory when cwd is not available', () => {
    terminal.cwd = ''
    
    const mockEntry = {
      isFile: true,
      name: 'test.txt',
    }

    const event = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: {
        items: [{
          webkitGetAsEntry: () => mockEntry,
        }],
      } as any,
    })

    terminal.container.dispatchEvent(event)

    expect(uploadService.dropUpload).toHaveBeenCalledWith(mockEntry, 'temp/')
  })

  it('should handle drop with no valid entries', () => {
    const event = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: {
        items: [{
          webkitGetAsEntry: () => null,
        }],
      } as any,
    })

    terminal.container.dispatchEvent(event)

    expect(uploadService.dropUpload).not.toHaveBeenCalled()
  })

  it('should cleanup event listeners on dispose', () => {
    const removeEventListener = vi.spyOn(terminal.container, 'removeEventListener')
    
    addon.dispose()

    expect(removeEventListener).toHaveBeenCalledTimes(2)
  })
})