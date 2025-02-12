/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import type { ITerminalAddon, IDisposable, IBuffer } from '@xterm/xterm'

import type { Term } from '.'

/**
 * Shell integration is a feature that enhances the terminal's understanding of what's happening
 * in the shell by injecting special sequences into the shell's prompt using the "Set Text
 * Parameters" sequence (`OSC Ps ; Pt ST`).
 *
 * Definitions:
 * - OSC: `\x1b]`
 * - Ps:  A single (usually optional) numeric parameter, composed of one or more digits.
 * - Pt:  A text parameter composed of printable characters.
 * - ST: `\x7`
 *
 * This is inspired by a feature of the same name in the FinalTerm, iTerm2 and kitty terminals.
 */

/**
 * The identifier for the first numeric parameter (`Ps`) for OSC commands used by shell integration.
 */
export const enum ShellIntegrationOscPs {
  /**
   * Sequences pioneered by FinalTerm.
   */
  FinalTerm = 133,
  /**
   * Sequences pioneered by iTerm.
   */
  ITerm = 1337,
  SetCwd = 7,
}

/**
 * Sequences pioneered by FinalTerm.
 */
const enum FinalTermOscPt {
  /**
   * The start of the prompt, this is expected to always appear at the start of a line.
   *
   * Format: `OSC 133 ; A ST`
   */
  PromptStart = 'A',

  /**
   * The start of a command, ie. where the user inputs their command.
   *
   * Format: `OSC 133 ; B ST`
   */
  CommandStart = 'B',

  /**
   * Sent just before the command output begins.
   *
   * Format: `OSC 133 ; C ST`
   */
  CommandExecuted = 'C',

  /**
   * Sent just after a command has finished. The exit code is optional, when not specified it
   * means no command was run (ie. enter on empty prompt or ctrl+c).
   *
   * Format: `OSC 133 ; D [; <ExitCode>] ST`
   */
  CommandFinished = 'D',
}

/**
 * ITerm sequences
 */
const enum ITermOscPt {
  /**
   * Sets a mark/point-of-interest in the buffer.
   *
   * Format: `OSC 1337 ; SetMark`
   */
  SetMark = 'SetMark',

  /**
   * Reports current working directory (CWD).
   *
   * Format: `OSC 1337 ; CurrentDir=<Cwd> ST`
   */
  CurrentDir = 'CurrentDir',
}

interface SemanticZone {
  type: FinalTermOscPt
  startLine: number
  endLine?: number
  exitCode?: string
}

/**
 * 提供终端集成功能
 *
 * 相关文档:
 * {@link [iTerm2](https://iterm2.com/documentation-escape-codes.html)},
 * {@link [VSCode](https://code.visualstudio.com/docs/terminal/shell-integration#_supported-escape-sequences)},
 * {@link [WezTerm](https://wezfurlong.org/wezterm/shell-integration.html)}
 */
export class ShellIntegrationAddon implements ITerminalAddon {
  public cwd = ''

  private terminal?: Term
  private buffer?: IBuffer
  private disposables: IDisposable[] = []
  private currentZone?: SemanticZone
  private zones: SemanticZone[] = []

  activate(terminal: Term): void {
    this.terminal = terminal
    this.buffer = terminal.buffer.normal

    this.disposables.push(
      terminal.parser.registerOscHandler(ShellIntegrationOscPs.FinalTerm, data =>
        this.handleFinalTermSequence(data),
      ),
    )
    this.disposables.push(
      terminal.parser.registerOscHandler(ShellIntegrationOscPs.ITerm, data =>
        this.handleITermSequence(data),
      ),
    )
    this.disposables.push(
      terminal.parser.registerOscHandler(ShellIntegrationOscPs.SetCwd, data =>
        this.handleSetCwd(data),
      ),
    )

    // 注册三击选择事件处理
    this.terminal.element?.addEventListener('mousedown', this.handleMouseDown.bind(this))
  }

  private handleMouseDown(event: MouseEvent) {
    if (!this.terminal || event.detail !== 3) {
      return
    }

    // 阻止默认的三击选择行为
    event.preventDefault()

    // 获取点击位置对应的行号
    const element = event.target as HTMLElement
    const rect = element.getBoundingClientRect()
    const y = event.clientY - rect.top

    // 计算行号，修正计算行高的括号优先级
    const rowHeight = (this.terminal.element?.clientHeight ?? 0) / this.terminal.rows
    const clickedLine = Math.floor(y / rowHeight)

    // 查找点击位置所在的语义区域
    const zone = this.findZoneByLine(clickedLine)
    if (!zone || zone.endLine === undefined) return

    // 计算选区长度（考虑换行符）
    // 选区长度 = 总列数 + 每行末尾的换行符（\r\n或\n，取决于平台）
    const lineCount = zone.endLine - zone.startLine + 1
    const newlineLength = 1 // \n 的长度为 1
    const totalLength = (this.terminal.cols + newlineLength) * (lineCount - 1) + this.terminal.cols

    // 设置选区 - select(column, row, length)
    this.terminal.select(0, zone.startLine, totalLength)
  }

  private findZoneByLine(line: number): SemanticZone | undefined {
    return this.zones.find(zone => (
      zone.startLine <= line
      && (zone.endLine === undefined || line <= zone.endLine)
    ))
  }

  private handleSetCwd(data: string): boolean {
    if (!this.terminal) {
      return false
    }

    const [uri] = data.split(';')

    if (/^file:\/\/.*\//.exec(uri)) {
      const idx = uri.indexOf('/', 7)
      const path = uri.slice(idx)
      if (path) {
        this.cwd = path
        return true
      }
    }

    return false
  }

  private handleFinalTermSequence(data: string): boolean {
    if (!this.terminal || !this.buffer) {
      return false
    }

    const [command, ...args] = data.split(';')
    const currentLine = this.buffer.cursorY

    switch (command) {
      case FinalTermOscPt.PromptStart: {
        // 如果有未结束的区域，关闭它
        if (this.currentZone) {
          this.currentZone.endLine = currentLine - 1
        }

        this.currentZone = {
          type: FinalTermOscPt.PromptStart,
          startLine: currentLine,
        }
        this.zones.push(this.currentZone)
        this.terminal.registerMarker(currentLine)
        return true
      }
      case FinalTermOscPt.CommandStart: {
        if (this.currentZone?.type === FinalTermOscPt.PromptStart) {
          this.currentZone.endLine = currentLine - 1
        }

        this.currentZone = {
          type: FinalTermOscPt.CommandStart,
          startLine: currentLine,
        }
        this.zones.push(this.currentZone)
        this.terminal.registerMarker(currentLine)
        return true
      }
      case FinalTermOscPt.CommandExecuted: {
        if (this.currentZone?.type === FinalTermOscPt.CommandStart) {
          this.currentZone.endLine = currentLine - 1
        }

        this.currentZone = {
          type: FinalTermOscPt.CommandExecuted,
          startLine: currentLine,
        }
        this.zones.push(this.currentZone)
        this.terminal.registerMarker(currentLine)
        return true
      }
      case FinalTermOscPt.CommandFinished: {
        if (this.currentZone?.type === FinalTermOscPt.CommandExecuted) {
          this.currentZone.endLine = currentLine - 1
        }

        this.currentZone = {
          type: FinalTermOscPt.CommandFinished,
          startLine: currentLine,
          exitCode: args[0],
        }
        this.zones.push(this.currentZone)
        this.terminal.registerMarker(currentLine)
        return true
      }
    }

    return false
  }

  private handleITermSequence(data: string): boolean {
    if (!this.terminal || !this.buffer) {
      return false
    }

    const [command] = data.split(';')

    switch (command) {
      case ITermOscPt.SetMark: {
        // 获取当前光标所在行
        const line = this.buffer.cursorY
        // 在当前行创建一个 marker
        this.terminal.registerMarker(line)
        return true
      }
      default: {
        const [key, value] = command.split('=', 2)
        if (value === undefined) {
          return true
        }

        switch (key as ITermOscPt) {
          case ITermOscPt.CurrentDir:
            this.cwd = value
            return true
        }
      }
    }

    return false
  }

  public getZoneAt(line: number): SemanticZone | undefined {
    return this.findZoneByLine(line)
  }

  public getAllZones(): SemanticZone[] {
    return this.zones
  }

  dispose(): void {
    this.terminal?.element?.removeEventListener('mousedown', this.handleMouseDown.bind(this))
    this.disposables.forEach(d => d.dispose())
  }
}
