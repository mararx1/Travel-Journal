/** Ambient File System Access API bits when TypeScript DOM lib is incomplete. */

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

interface FileSystemHandle {
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface Window {
  showDirectoryPicker(options?: {
    id?: string
    mode?: 'read' | 'readwrite'
    startIn?: FileSystemHandle | string
  }): Promise<FileSystemDirectoryHandle>
}
