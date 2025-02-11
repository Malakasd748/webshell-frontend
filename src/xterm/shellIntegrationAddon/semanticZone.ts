import { IMarker } from '@xterm/xterm'

export interface ISemanticZone {
  readonly cwd: string
  readonly start: IMarker
  readonly end: IMarker
  readonly outputStart?: IMarker
}

// XXX: 没用
export class SemanticZoneService {
  private _cwd = ''
  private _start: IMarker | undefined = undefined
  private _outputStart: IMarker | undefined = undefined

  openSemanticZone(line: IMarker) {
    this._start = line
  }

  setCwd(cwd: string) {
    this._cwd = cwd
  }

  setOutputStart(line: IMarker) {
    this._outputStart = line
  }

  closeSemanticZone(end: IMarker): ISemanticZone | undefined {
    if (this._start === undefined || end <= this._start) {
      this._reset()
      console.error('Semantic Zone: invalid closing')
      return undefined
    }
    const start = this._start
    this._start = undefined
    return { cwd: this._cwd, start, end, outputStart: this._outputStart }
  }

  private _reset() {
    this._start = undefined
    this._outputStart = undefined
    this._cwd = ''
  }
}
