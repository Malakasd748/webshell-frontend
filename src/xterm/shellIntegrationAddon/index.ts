import { ref } from 'vue'
import type { ITerminalAddon, IDisposable, IBuffer } from '@xterm/xterm'

import type { Term } from '..'

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
   * Sequences pioneered by VS Code. The number is derived from the least significant digit of
   * "VSC" when encoded in hex ("VSC" = 0x56, 0x53, 0x43).
   */
  VSCode = 633,
  /**
   * Sequences pioneered by iTerm.
   */
  ITerm = 1337,
  SetCwd = 7,
  SetWindowsFriendlyCwd = 9,
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
 * VS Code-specific shell integration sequences. Some of these are based on more common alternatives
 * like those pioneered in {@link FinalTermOscPt FinalTerm}. The decision to move to entirely custom
 * sequences was to try to improve reliability and prevent the possibility of applications confusing
 * the terminal. If multiple shell integration scripts run, VS Code will prioritize the VS
 * Code-specific ones.
 *
 * It's recommended that authors of shell integration scripts use the common sequences (`133`)
 * when building general purpose scripts and the VS Code-specific (`633`) when targeting only VS
 * Code or when there are no other alternatives (eg. {@link CommandLine `633 ; E`}). These sequences
 * support mix-and-matching.
 */
const enum VSCodeOscPt {
  /**
   * The start of the prompt, this is expected to always appear at the start of a line.
   *
   * Format: `OSC 633 ; A ST`
   *
   * Based on {@link FinalTermOscPt.PromptStart}.
   */
  PromptStart = 'A',

  /**
   * The start of a command, ie. where the user inputs their command.
   *
   * Format: `OSC 633 ; B ST`
   *
   * Based on  {@link FinalTermOscPt.CommandStart}.
   */
  CommandStart = 'B',

  /**
   * Sent just before the command output begins.
   *
   * Format: `OSC 633 ; C ST`
   *
   * Based on {@link FinalTermOscPt.CommandExecuted}.
   */
  CommandExecuted = 'C',

  /**
   * Sent just after a command has finished. The exit code is optional, when not specified it
   * means no command was run (ie. enter on empty prompt or ctrl+c).
   *
   * Format: `OSC 633 ; D [; <ExitCode>] ST`
   *
   * Based on {@link FinalTermOscPt.CommandFinished}.
   */
  CommandFinished = 'D',

  /**
   * Explicitly set the command line. This helps workaround performance and reliability problems
   * with parsing out the command, such as conpty not guaranteeing the position of the sequence or
   * the shell not guaranteeing that the entire command is even visible. Ideally this is called
   * immediately before {@link CommandExecuted}, immediately before {@link CommandFinished} will
   * also work but that means terminal will only know the accurate command line when the command is
   * finished.
   *
   * The command line can escape ascii characters using the `\xAB` format, where AB are the
   * hexadecimal representation of the character code (case insensitive), and escape the `\`
   * character using `\\`. It's required to escape semi-colon (`0x3b`) and characters 0x20 and
   * below, this is particularly important for new line and semi-colon.
   *
   * Some examples:
   *
   * ```
   * "\"  -> "\\"
   * "\n" -> "\x0a"
   * ";"  -> "\x3b"
   * ```
   *
   * An optional nonce can be provided which is may be required by the terminal in order enable
   * some features. This helps ensure no malicious command injection has occurred.
   *
   * Format: `OSC 633 ; E [; <CommandLine> [; <Nonce>]] ST`
   */
  CommandLine = 'E',

  /**
   * Similar to prompt start but for line continuations.
   *
   * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
   */
  ContinuationStart = 'F',

  /**
   * Similar to command start but for line continuations.
   *
   * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
   */
  ContinuationEnd = 'G',

  /**
   * The start of the right prompt.
   *
   * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
   */
  RightPromptStart = 'H',

  /**
   * The end of the right prompt.
   *
   * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
   */
  RightPromptEnd = 'I',

  /**
   * Set the value of an arbitrary property, only known properties will be handled by VS Code.
   *
   * Format: `OSC 633 ; P ; <Property>=<Value> ST`
   *
   * Known properties:
   *
   * - `Cwd` - Reports the current working directory to the terminal.
   * - `IsWindows` - Indicates whether the terminal is using a Windows backend like winpty or
   *   conpty. This may be used to enable additional heuristics as the positioning of the shell
   *   integration sequences are not guaranteed to be correct. Valid values: `True`, `False`.
   * - `ContinuationPrompt` - Reports the continuation prompt that is printed at the start of
   *   multi-line inputs.
   *
   * WARNING: Any other properties may be changed and are not guaranteed to work in the future.
   */
  Property = 'P',

  /**
   * Sets a mark/point-of-interest in the buffer.
   *
   * Format: `OSC 633 ; SetMark [; Id=<string>] [; Hidden]`
   *
   * `Id` - The identifier of the mark that can be used to reference it
   * `Hidden` - When set, the mark will be available to reference internally but will not visible
   *
   * WARNING: This sequence is unfinalized, DO NOT use this in your shell integration script.
   */
  SetMark = 'SetMark',
}

const enum VSCodeProperty {
  Cwd = 'Cwd',
  IsWindows = 'IsWindows',
  ContinuationPrompt = 'ContinuationPrompt',
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
 * 提供终端集成功能
 *
 * 相关文档:
 * {@link [iTerm2](https://iterm2.com/documentation-escape-codes.html)},
 * {@link [VSCode](https://code.visualstudio.com/docs/terminal/shell-integration#_supported-escape-sequences)},
 * {@link [WezTerm](https://wezfurlong.org/wezterm/shell-integration.html)}
 */
export class ShellIntegrationAddon implements ITerminalAddon {
  public cwd = ''

  private _terminal?: Term
  private _buffer?: IBuffer
  private _disposables: IDisposable[] = []

  activate(terminal: Term): void {
    this._terminal = terminal
    this._buffer = terminal.buffer.normal

    this._disposables.push(
      terminal.parser.registerOscHandler(ShellIntegrationOscPs.FinalTerm, data =>
        this._handleFinalTermSequence(data),
      ),
    )
    // this._disposables.push(
    //   terminal.parser.registerOscHandler(ShellIntegrationOscPs.VSCode, data =>
    //     this._handleVscodeSequence(data)
    //   )
    // )
    this._disposables.push(
      terminal.parser.registerOscHandler(ShellIntegrationOscPs.ITerm, data =>
        this._handleITermSequence(data),
      ),
    )
    this._disposables.push(
      terminal.parser.registerOscHandler(ShellIntegrationOscPs.SetCwd, data =>
        this._handleSetCwd(data),
      ),
    )
  }

  private _handleSetCwd(data: string): boolean {
    if (!this._terminal) {
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

  private _handleFinalTermSequence(data: string): boolean {
    if (!this._terminal || !this._buffer) {
      return false
    }

    const [command] = data.split(';')

    switch (command) {
    }

    return false
  }

  private _handleITermSequence(data: string): boolean {
    if (!this._terminal) {
      return false
    }

    const [command] = data.split(';')

    switch (command) {
      case ITermOscPt.SetMark:
        // console.error(ITermOscPt.SetMark, 'not implemented')
        return false
      default: {
        const [key, value] = command.split('=', 2)
        if (value === undefined) {
          return true
        }

        switch (key) {
          case ITermOscPt.CurrentDir:
            this.cwd = value
            return true
        }
      }
    }

    return false
  }

  private _handleVscodeSequence(data: string): boolean {
    if (!this._terminal) {
      return false
    }

    let command: string
    let params: string | undefined = undefined
    const idx = data.indexOf(';')
    if (idx < 0) {
      command = data
    }
    else {
      command = data.slice(0, idx)
      params = data.slice(idx + 1)
    }

    switch (command) {
      case VSCodeOscPt.Property:
        this._handleVscProperty(params)
        return true
      case VSCodeOscPt.SetMark:
        return false
    }

    return false
  }

  private _handleVscProperty(params: string | undefined) {
    if (params === undefined) {
      return
    }

    const [key, value] = params.split('=', 2)
    if (value === undefined) {
      return
    }

    switch (key) {
      case VSCodeProperty.Cwd:
        this.cwd = value
    }
  }

  dispose(): void {
    this._disposables.forEach(d => d.dispose())
  }
}
