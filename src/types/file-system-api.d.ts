interface FilePickerOptions {
  multiple?: boolean
  excludeAcceptAllOption?: boolean
  id?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface DirectoryPickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
}

interface FileSystemDirectoryHandle {
  values(): AsyncGenerator<FileSystemHandle, FileSystemHandle, void>
}

interface Window {
  showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
}
