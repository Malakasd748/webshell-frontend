/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShellIntegrationAddon, ShellIntegrationOscPs } from '../shellIntegrationAddon'

class MockTerminal {
  buffer = {
    normal: {
      cursorY: 0,
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

  describe('FinalTerm Sequence Handling', () => {
    it('should handle prompt sequence', () => {
      terminal.moveCursor(5)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'A')

      expect(terminal.registerMarker).toHaveBeenCalledWith(5)
      expect(addon.getAllZones()).toContainEqual({
        type: 'A',
        startLine: 5,
      })
    })

    it('should handle complete command execution flow', () => {
      terminal.moveCursor(5)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'A') // prompt

      terminal.moveCursor(6)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'B') // command start

      terminal.moveCursor(7)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'C') // command execute

      terminal.moveCursor(8)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'D;1') // command finish with exit code 1

      const zones = addon.getAllZones()
      expect(zones).toHaveLength(4)

      expect(zones[0]).toEqual({
        type: 'A',
        startLine: 5,
        endLine: 5,
      })

      expect(zones[1]).toEqual({
        type: 'B',
        startLine: 6,
        endLine: 6,
      })

      expect(zones[2]).toEqual({
        type: 'C',
        startLine: 7,
        endLine: 7,
      })

      expect(zones[3]).toEqual({
        type: 'D',
        startLine: 8,
        exitCode: '1',
      })
    })
  })

  describe('Mouse Event Handling', () => {
    it('should handle triple click selection', () => {
      // 设置zones
      terminal.moveCursor(5)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'B') // command start
      terminal.moveCursor(8)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'C') // command execute

      // 创建鼠标事件，模拟点击第6行
      const event = new MouseEvent('mousedown', {
        detail: 3, // 三击
        clientY: 120, // 假设每行高度为20px，点击第6行
        bubbles: true,
      })

      // 触发事件
      terminal.element.dispatchEvent(event)

      // 验证选区设置被调用
      expect(terminal.select).toHaveBeenCalled()
    })

    it('should not handle non-triple clicks', () => {
      terminal.select = vi.fn()

      const event = new MouseEvent('mousedown', {
        detail: 1,
      })

      terminal.element.dispatchEvent(event)

      expect(terminal.select).not.toHaveBeenCalled()
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

  describe('Zone Management', () => {
    it('should find zone by line number', () => {
      terminal.moveCursor(5)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'B')
      terminal.moveCursor(8)
      terminal.writeOsc(ShellIntegrationOscPs.FinalTerm, 'C')

      const zone = addon.getZoneAt(6)
      expect(zone).toEqual({
        type: 'B',
        startLine: 5,
        endLine: 7,
      })
    })

    it('should return undefined for invalid line number', () => {
      const zone = addon.getZoneAt(999)
      expect(zone).toBeUndefined()
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
