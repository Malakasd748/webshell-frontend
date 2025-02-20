/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import type { ITerminalAddon, IDisposable, IBuffer, IBufferRange } from '@xterm/xterm'
import { useEventListener } from '@vueuse/core'

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

/**
 * 表示一个完整的命令执行周期，包含提示符、命令输入、执行输出等位置信息
 */
interface SemanticZone {
  /**
   * 提示符区域
   */
  prompt?: IBufferRange
  /**
   * 命令输入区域
   */
  command?: IBufferRange
  /**
   * 命令输出区域
   */
  output?: IBufferRange
  /**
   * 命令退出码
   */
  exitCode?: string
  /**
   * 整个区域的起始行
   */
  startLine: number
  /**
   * 整个区域的结束行
   */
  endLine?: number
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
    const dispose = useEventListener(() => terminal.container, 'mousedown', ev => this.handleMouseDown(ev))
    this.disposables.push({ dispose })
  }

  // TODO
  private handleMouseDown(event: MouseEvent) {
    if (!this.terminal || event.detail !== 3) {
      return
    }

    // 阻止默认的三击选择行为
    event.preventDefault()

    console.log('triple click')

    // 获取点击位置对应的行号
    const position = this.terminal._core._mouseService.getMouseReportCoords(event, this.terminal.element)
    console.log(position)

    // 查找点击位置所在的语义区域
    // const zone = this.findZoneByLine(clickedLine)
    // console.log(this.zones)
    // if (!zone || zone.endLine === undefined) return

    // // 如果点击在命令输出区域内，选择输出文本
    // if (zone.output && clickedLine >= zone.output.start.y && clickedLine <= zone.output.end.y) {
    //   const startPos = zone.output.start
    //   const endPos = zone.output.end
    //   const length = (endPos.y - startPos.y) * (this.terminal.cols + 1) + (endPos.x - startPos.x)
    //   this.terminal.select(startPos.x, startPos.y, length)
    // } else {
    //   // 默认选择整个区域
    //   const totalLength = (zone.endLine - zone.startLine + 1) * (this.terminal.cols + 1)
    //   this.terminal.select(0, zone.startLine, totalLength)
    // }
    // console.log(zone)
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
    const currentCol = this.buffer.cursorX

    switch (command) {
      case FinalTermOscPt.PromptStart: {
        // 开始一个新的语义区域
        this.currentZone = {
          startLine: currentLine,
          prompt: {
            start: { x: 0, y: currentLine },
            end: { x: 0, y: currentLine }, // 结束位置将在 CommandStart 时更新
          },
        }
        this.zones.push(this.currentZone)
        this.terminal.registerMarker(currentLine)
        return true
      }
      case FinalTermOscPt.CommandStart: {
        if (this.currentZone?.prompt) {
          // 更新提示符区域的结束位置
          this.currentZone.prompt.end = { x: currentCol, y: currentLine }
          // 开始记录命令输入区域
          this.currentZone.command = {
            start: { x: currentCol, y: currentLine },
            end: { x: currentCol, y: currentLine }, // 结束位置将在 CommandExecuted 时更新
          }
        }
        this.terminal.registerMarker(currentLine)
        return true
      }
      case FinalTermOscPt.CommandExecuted: {
        if (this.currentZone?.command) {
          // 更新命令输入区域的结束位置
          this.currentZone.command.end = { x: currentCol, y: currentLine }
          // 开始记录输出区域
          this.currentZone.output = {
            start: { x: currentCol, y: currentLine },
            end: { x: currentCol, y: currentLine }, // 结束位置将在 CommandFinished 时更新
          }
        }
        this.terminal.registerMarker(currentLine)
        return true
      }
      case FinalTermOscPt.CommandFinished: {
        if (this.currentZone) {
          if (this.currentZone.output) {
            // 更新输出区域的结束位置
            this.currentZone.output.end = { x: currentCol, y: currentLine }
          }
          // 完成当前语义区域
          this.currentZone.endLine = currentLine
          this.currentZone.exitCode = args[0]
          this.currentZone = undefined
        }
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
