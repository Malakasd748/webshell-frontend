/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShellIntegrationAddon, ShellIntegrationOscPs } from '../shellIntegrationAddon'

class MockTerminal {
  buffer = {
    normal: {
      cursorY: 0,
      cursorX: 0,
      viewportY: 0,
    },
    active: {
      viewportY: 0,
    },
  }

  parser = {
    registerOscHandler: vi.fn().mockImplementation((ps: number, handler: (data: string) => boolean) => {
      this._handlers[ps] = handler
      return {
        dispose: vi.fn(),
      }
    }),
  }

  element: HTMLElement
  container: HTMLElement
  rows = 24
  cols = 80
  registerMarker = vi.fn()

  private _handlers: Record<number, (data: string) => boolean> = {}

  constructor() {
    this.element = document.createElement('div')
    // 设置必要的尺寸属性
    Object.defineProperty(this.element, 'clientHeight', { value: 500 })
    Object.defineProperty(this.element, 'clientWidth', { value: 800 })
    Object.defineProperties(this.element, {
      clientHeight: { value: 500 },
      clientWidth: { value: 800 },
      getBoundingClientRect: {
        value: () => ({
          top: 0,
          left: 0,
          bottom: 500,
          right: 800,
          height: 500,
          width: 800,
        }),
      },
    })
    this.container = document.createElement('div')
    this.container.appendChild(this.element)
  }

  _core = {
    _mouseService: {
      getMouseReportCoords: vi.fn().mockImplementation(() => ({ row: 0, col: 0 })),
    },
  }

  writeOsc(ps: number, data: string) {
    const handler = this._handlers[ps]
    if (handler) {
      return handler(data)
    }
    return false
  }

  moveCursor(y: number) {
    this.buffer.normal.cursorY = y
  }

  select = vi.fn()
}

describe('ShellIntegrationAddon', () => {
  let addon: ShellIntegrationAddon
  let terminal: MockTerminal

  beforeEach(() => {
    terminal = new MockTerminal()
    addon = new ShellIntegrationAddon()
    addon.activate(terminal as any)
  })

  describe('OSC Handler Registration', () => {
    it('should register handlers for FinalTerm sequences', () => {
      expect(terminal.parser.registerOscHandler).toHaveBeenCalledWith(
        ShellIntegrationOscPs.FinalTerm,
        expect.any(Function),
      )
    })

    it('should register handlers for ITerm sequences', () => {
      expect(terminal.parser.registerOscHandler).toHaveBeenCalledWith(
        ShellIntegrationOscPs.ITerm,
        expect.any(Function),
      )
    })
  })

  describe('CWD Tracking', () => {
    it('should update CWD from file URL', () => {
      const result = terminal.writeOsc(
        ShellIntegrationOscPs.SetCwd,
        'file:///home/user/projects',
      )

      expect(result).toBe(true)
      expect(addon.cwd).toBe('/home/user/projects')
    })

    it('should handle invalid CWD paths', () => {
      const result = terminal.writeOsc(
        ShellIntegrationOscPs.SetCwd,
        'invalid://path',
      )

      expect(result).toBe(false)
      expect(addon.cwd).toBe('')
    })
  })

  describe('Addon Lifecycle', () => {
    it('should cleanup on dispose', () => {
      const disposeHandler = vi.fn()
      terminal.parser.registerOscHandler.mockReturnValue({
        dispose: disposeHandler,
      })

      addon.activate(terminal as any)
      addon.dispose()

      expect(disposeHandler).toHaveBeenCalled()
    })
  })
})
