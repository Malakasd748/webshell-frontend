import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AutoFitAddon } from '../autoFitAddon'
import { FitAddon } from '@xterm/addon-fit'
import type { Term } from '..'

class MockTerminal implements Partial<Term> {
  container: HTMLElement
  focus = vi.fn()

  constructor() {
    this.container = document.createElement('div')
  }
}

describe('AutoFitAddon', () => {
  let addon: AutoFitAddon
  let terminal: MockTerminal
  let mockFit: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    terminal = new MockTerminal()
    addon = new AutoFitAddon()
    mockFit = vi.spyOn(FitAddon.prototype, 'fit')
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should activate and setup resize observer', () => {
    addon.activate(terminal as any)
    expect(addon).toBeDefined()
  })

  it('should not fit when container is not visible', () => {
    Object.defineProperty(terminal.container, 'checkVisibility', {
      value: () => false,
    })

    addon.activate(terminal as any)
    addon.fit()
    vi.runAllTimers()

    expect(mockFit).not.toHaveBeenCalled()
    expect(terminal.focus).not.toHaveBeenCalled()
  })

  it('should fit and focus when container is visible', () => {
    Object.defineProperty(terminal.container, 'checkVisibility', {
      value: () => true,
    })

    addon.activate(terminal as any)
    addon.fit()
    vi.runAllTimers()

    expect(mockFit).toHaveBeenCalledTimes(1)
    expect(terminal.focus).toHaveBeenCalledTimes(1)
  })

  it('should debounce fit calls', async () => {
    Object.defineProperty(terminal.container, 'checkVisibility', {
      value: () => true,
    })

    addon.activate(terminal as any)
    
    // 快速连续调用 fit 三次
    addon.fit()
    addon.fit()
    addon.fit()
    
    // 运行所有计时器来触发防抖的回调
    vi.runAllTimers()

    // 由于防抖，应该只调用一次 fit
    expect(mockFit).toHaveBeenCalledTimes(1)
    expect(terminal.focus).toHaveBeenCalledTimes(1)
  })
})