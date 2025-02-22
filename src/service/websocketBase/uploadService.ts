import { join } from 'pathe'
import { createSHA256 } from 'hash-wasm'

import { WebSocketService } from './websocketServiceBase'
import type { WebSocketManager } from './websocketManager'

enum UploadAction {
  StartSession = 'start_session',
  CompleteSession = 'complete_session',
  CancelSession = 'cancel_session',
  StartFile = 'start_file',
  CompleteFile = 'complete_file',
  Chunk = 'chunk',
  /** 创建空文件夹 */
  Mkdir = 'mkdir',
}

export type DuplicatePolicy = 'overwrite' | 'skip' | 'rename'

interface UploadActionMap {
  [UploadAction.StartSession]: {
    request: { policy?: DuplicatePolicy }
    response: { needConfirm?: boolean }
  }
  [UploadAction.CompleteSession]: {
    request: void
    response: void
  }
  [UploadAction.CancelSession]: {
    request: void
    response: void
  }
  [UploadAction.StartFile]: {
    request: { path: string }
    response: { skip?: boolean }
  }
  [UploadAction.CompleteFile]: {
    request: { digest: string }
    response: void
  }
  [UploadAction.Chunk]: {
    request: { progress: number }
    response: { progress: number }
  }
  [UploadAction.Mkdir]: {
    request: string
    response: void
  }
}

export class UploadService extends WebSocketService {
  readonly name = 'upload'
  waitForSetup = false

  protected manager?: WebSocketManager

  constructor(
    public sessionList: UploadSession[],
    private sessionFactory: (
      service: UploadService,
      type: 'file' | 'directory',
      name: string,
      dest: string,
    ) => UploadSession,
  ) {
    super()
  }

  register(manager: WebSocketManager): void {
    this.manager = manager
  }

  private async request<T extends UploadAction>(
    id: string,
    action: T,
    data: UploadActionMap[T]['request'],
  ) {
    if (!this.manager) throw new Error('manager not registered')

    return this.manager.request<T, UploadActionMap[T]['request'], UploadActionMap[T]['response']>({
      service: this.name,
      action,
      id,
      data,
    })
  }

  override handleAction(_action: string, _id: string, _data: unknown): void {}

  override dispose(): void {
    this.sessionList = []
  }

  async dropUpload(entry: FileSystemEntry, dest: string) {
    if (isFileSystemFileEntry(entry)) {
      await this.dropFileUpload(entry, dest)
    } else if (isFileSystemDirectoryEntry(entry)) {
      await this.dropDirectoryUpload(entry, dest)
    } else {
      throw new TypeError('invalid parameter')
    }
  }

  private async dropFileUpload(entry: FileSystemFileEntry, dest: string) {
    const session = this.sessionFactory(this, 'file', entry.name, dest)
    await session.setup(entry)
    await this.startUpload(session)
  }

  private async dropDirectoryUpload(entry: FileSystemDirectoryEntry, dest: string) {
    const session = this.sessionFactory(this, 'directory', entry.name, dest)
    await session.setup(entry)
    await this.startUpload(session)
  }

  async dialogUpload(type: 'file' | 'directory', dest: string) {
    if (type === 'file') {
      if ('showOpenFilePicker' in window) {
        await this.filePickerUpload(dest)
      } else {
        await this.inputFileUpload(dest)
      }
    } else if (type === 'directory') {
      if ('showDirectoryPicker' in window) {
        await this.directoryPickerUpload(dest)
      } else {
        await this.inputDirectoryUpload(dest)
      }
    } else {
      throw new TypeError('invalid parameter')
    }
  }

  private async filePickerUpload(dest: string): Promise<void> {
    const handles = await window.showOpenFilePicker({ multiple: true, id: 'upload-file' })
    const promises: Promise<void>[] = []
    for (const handle of handles) {
      const session = this.sessionFactory(this, 'file', handle.name, dest)
      await session.setup(handle)
      promises.push(this.startUpload(session))
    }
    await Promise.all(promises)
  }

  private async directoryPickerUpload(dest: string) {
    const handle = await window.showDirectoryPicker({ id: 'upload-directory' })
    const session = this.sessionFactory(this, 'directory', handle.name, dest)
    await session.setup(handle)
    return this.startUpload(session)
  }

  private inputFileUpload(dest: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true

    return new Promise<void>((resolve, reject) => {
      input.onchange = async () => {
        if (!input.files?.length) return resolve()

        const promises: Promise<void>[] = []
        try {
          for (const file of input.files) {
            const session = this.sessionFactory(this, 'file', file.name, dest)
            await session.setup(file)
            promises.push(this.startUpload(session))
          }
          await Promise.all(promises)
          resolve()
        } catch (err) {
          reject(err as Error)
        }
      }
      input.click()
    })
  }

  private inputDirectoryUpload(dest: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true

    return new Promise<void>((resolve) => {
      input.onchange = async () => {
        if (!input.files?.length) return resolve()

        const dirName = input.files[0].webkitRelativePath.split('/')[0]
        const session = this.sessionFactory(this, 'directory', dirName, dest)
        await session.setup(input.files)
        await this.startUpload(session)
        resolve()
      }
      input.click()
    })
  }

  startUpload(session: UploadSession) {
    return this.doStartUpload(session).catch((err) => {
      session.setStatus('error')
      throw err
    })
  }

  private async doStartUpload(session: UploadSession) {
    if (!this.manager) throw new Error('manager not registered')

    const { needConfirm } = await this.request(session.path, UploadAction.StartSession, {})
    if (needConfirm) {
      const policy = await new Promise<DuplicatePolicy>((resolve, reject) => {
        session.resolveConfirm = resolve
        session.rejectConfirm = reject
        // TODO: 使用自定义的消息类
        if (!this.manager) throw new Error('manager not registered')
        this.manager.e.dispatchEvent(new CustomEvent('upload-need-confirm', { detail: session }))
      }).catch(() => undefined) // reject代表取消
      if (policy === undefined) return
      await this.request(session.path, UploadAction.StartSession, { policy })
    }

    session.setStatus('uploading')
    this.sessionList.push(session)

    if (session.entries.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    for (let i = 0; i < session.entries.length; i++) {
      // 如果上传速率超过了遍历速率，则等一等遍历
      if (i === session.entries.length - 1 && !session.setupFinished) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const entry = session.entries[i]
      // 空文件夹，创建路径就行了
      if (entry.isDir) {
        await this.request(session.path, UploadAction.Mkdir, entry.path)
        continue
      }

      session.currentFileRelativePath = entry.path.slice(session.path.length)

      const { skip } = await this.request(session.path, UploadAction.StartFile, {
        path: entry.path,
      })
      if (skip) {
        if (session.type === 'directory') {
          session.doneFilesCount += 1
          session.doneSize += entry.file.size
        } else {
          // 上传任务为文件，且策略为“跳过”时，文件任务从列表中消失
          const idx = this.sessionList.indexOf(session)
          if (idx > -1) {
            this.sessionList.splice(idx, 1)
          }
        }
        continue
      }

      // TODO: 实现一个定制化的 stream reader，并进一步实现断点续传
      const reader = entry.file.stream().getReader()
      const hasher = await createSHA256()
      hasher.init()

      while (true) {
        if (session.status === 'cancelled') {
          void reader.cancel()
          await this.request(session.path, UploadAction.CancelSession, undefined)
          return
        }
        const { done, value } = await reader.read()
        if (done) {
          void reader.cancel()
          session.doneFilesCount += 1

          const digest = hasher.digest()
          await this.request(session.path, UploadAction.CompleteFile, { digest })
          break
        }
        const chunkPromise = this.request(session.path, UploadAction.Chunk, {
          progress: session.doneSize,
        })
        // Send the chunk data
        this.manager.ws.send(value)
        hasher.update(value)

        const { progress } = await chunkPromise
        session.doneSize = progress
      }
    }

    await this.request(session.path, UploadAction.CompleteSession, undefined)
    session.setStatus('completed')
  }
}

export type SessionStatus =
  | 'pending'
  | 'preparing'
  | 'uploading'
  | 'cancelled'
  | 'completed'
  | 'error'
  | undefined

type UploadEntry = { path: string, isDir: true } | { path: string, isDir: false, file: File }

export class UploadSession {
  readonly path: string
  resolveConfirm(_p: DuplicatePolicy) {}
  rejectConfirm(_reason?: unknown) {}

  /** 文件夹任务--当前正在上传的文件名 */
  currentFileRelativePath?: string

  doneSize = 0
  doneFilesCount = 0

  private _entries: UploadEntry[] = []
  private _status: SessionStatus = undefined
  private _totalSize = 0
  private _totalFilesCount = 0
  private _setupFinished = false

  constructor(
    private _service: UploadService,
    readonly type: 'file' | 'directory',
    readonly name: string,
    readonly dest: string,
  ) {
    this.path = join(dest, name)
  }

  get entries(): readonly UploadEntry[] {
    return this._entries
  }

  get status(): SessionStatus {
    return this._status
  }

  get totalSize(): number {
    return this._totalSize
  }

  get totalFilesCount(): number {
    return this._totalFilesCount
  }

  get setupFinished(): boolean {
    return this._setupFinished
  }

  setStatus(status: SessionStatus) {
    this._status = status
  }

  cancel() {
    this._status = 'cancelled'
  }

  redo() {
    this.doneFilesCount = 0
    this.doneSize = 0
    this.removeFromList()
    return this._service.startUpload(this)
  }

  removeFromList() {
    const list = this._service.sessionList
    const idx = list.indexOf(this)
    if (idx > -1) {
      list.splice(idx, 1)
    }
  }

  /** `showOpenFilePicker` */
  setup(arg: FileSystemFileHandle): Promise<void>
  /** `showOpenDirectoryPicker` */
  setup(arg: FileSystemDirectoryHandle): Promise<void>
  /** drop file */
  setup(arg: FileSystemFileEntry): Promise<void>
  /** drop directory */
  setup(arg: FileSystemDirectoryEntry): Promise<void>
  /** `<input type="file" />` */
  setup(arg: File): Promise<void>
  /** `<input type="file" webkitdirectory />` */
  setup(arg: FileList): Promise<void>
  async setup(
    arg:
      | FileSystemFileHandle
      | FileSystemDirectoryHandle
      | FileSystemFileEntry
      | FileSystemDirectoryEntry
      | File
      | FileList,
  ) {
    this._status = 'preparing'

    let promise: Promise<void> = Promise.resolve()
    if (arg instanceof File) {
      promise = this.setupFile(arg)
    } else if (arg instanceof FileList) {
      promise = this.setupFileList(arg)
    } else if (arg instanceof FileSystemFileHandle) {
      promise = this.setupFileHandle(arg)
    } else if (arg instanceof FileSystemDirectoryHandle) {
      promise = this.setupDirectoryHandle(arg)
    } else if (isFileSystemFileEntry(arg)) {
      promise = this.setupFileEntry(arg)
    } else if (isFileSystemDirectoryEntry(arg)) {
      promise = this.setupDirectoryEntry(arg)
    } else {
      promise = Promise.reject(new Error('invalid session setup argument'))
    }
    promise = promise
      .catch((err) => {
        this._status = 'error'
        throw err
      })
      .finally(() => {
        this._setupFinished = true
      })
    if (this._service.waitForSetup) {
      await promise
    }
  }

  private countFile(path: string, file: File) {
    this._totalSize += file.size
    this._totalFilesCount += 1
    this._entries.push({ path, isDir: false, file })
  }

  private setupFile(file: File) {
    this.countFile(join(this.dest, file.name), file)
    return Promise.resolve()
  }

  private async setupFileList(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      if (this.status === 'cancelled') return

      this.countFile(join(this.dest, files[i].webkitRelativePath), files[i])
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve))
      }
    }
  }

  private async setupFileEntry(entry: FileSystemFileEntry) {
    const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject))
    this.countFile(join(this.dest, file.name), file)
  }

  private async setupDirectoryEntry(entry: FileSystemDirectoryEntry) {
    const setupEntry = async (parent: string, entry: FileSystemEntry) => {
      if (this.status === 'cancelled') return

      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) =>
          (entry as FileSystemFileEntry).file(resolve, reject),
        )
        this.countFile(join(parent, entry.name), file)
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader()

        let isFirstRead = true
        const readEntries = async () => {
          const children = await new Promise<FileSystemEntry[]>((resolve, reject) =>
            reader.readEntries(resolve, reject),
          )
          if (!children.length) {
            if (isFirstRead) {
              // 空文件夹
              this._entries.push({ path: join(parent, entry.name), isDir: true })
            }
            return
          }
          isFirstRead = false
          for (const child of children) {
            await setupEntry(join(parent, entry.name), child)
          }
          // `reader.readEntries()` 函数不会读取全部 entry，需要反复调用直至 children 为空
          await readEntries()
        }

        await readEntries()
      }
    }

    await setupEntry(this.dest, entry)
  }

  private async setupFileHandle(handle: FileSystemFileHandle) {
    const file = await handle.getFile()
    this.countFile(join(this.dest, file.name), file)
  }

  private async setupDirectoryHandle(handle: FileSystemDirectoryHandle) {
    const setupHandle = async (parent: string, handle: FileSystemHandle) => {
      if (this.status === 'cancelled') return

      if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile()
        this.countFile(join(parent, file.name), file)
      } else if (handle.kind === 'directory') {
        const generator = (handle as FileSystemDirectoryHandle).values()
        const { value: firstChild, done } = await generator.next()
        if (done) {
          // 空文件夹
          this._entries.push({ path: join(parent, handle.name), isDir: true })
        } else {
          await setupHandle(join(parent, handle.name), firstChild)
          for await (const child of generator) {
            await setupHandle(join(parent, handle.name), child)
          }
        }
      }
    }

    await setupHandle(this.dest, handle)
  }
}

export function isFileSystemEntry(arg: unknown): arg is FileSystemEntry {
  return typeof arg === 'object' && arg !== null && 'isFile' in arg && 'isDirectory' in arg
}

export function isFileSystemFileEntry(entry: unknown): entry is FileSystemFileEntry {
  return isFileSystemEntry(entry) && entry.isFile
}

export function isFileSystemDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return isFileSystemEntry(entry) && entry.isDirectory
}
