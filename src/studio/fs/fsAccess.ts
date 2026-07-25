/** Narrow File System Access helpers for Studio (Chromium desktop). */

export type DirectoryPickMode = 'read' | 'readwrite'

export function canUseDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

export async function pickDirectory(mode: DirectoryPickMode): Promise<FileSystemDirectoryHandle> {
  if (!canUseDirectoryPicker()) {
    throw new Error('File System Access API unavailable')
  }
  return window.showDirectoryPicker({ mode })
}

export async function ensurePermission(
  handle: FileSystemHandle,
  mode: DirectoryPickMode,
): Promise<boolean> {
  const opts = { mode } as FileSystemHandlePermissionDescriptor
  if ((await handle.queryPermission(opts)) === 'granted') return true
  return (await handle.requestPermission(opts)) === 'granted'
}

const PREVIEW_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const LIST_EXT = new Set([
  ...PREVIEW_EXT,
  '.heic',
  '.heif',
  '.tif',
  '.tiff',
  '.dng',
  '.raw',
  '.cr2',
  '.nef',
  '.arw',
  '.orf',
  '.rw2',
  '.gif',
  '.bmp',
])

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

export function isPreviewableImageName(name: string): boolean {
  return PREVIEW_EXT.has(extensionOf(name))
}

export function isListableImageName(name: string): boolean {
  return LIST_EXT.has(extensionOf(name))
}

export type ListedFile = {
  name: string
  handle: FileSystemFileHandle
  previewable: boolean
}

/** Shallow list of image files in a directory (not recursive). */
export async function listImageFiles(dir: FileSystemDirectoryHandle): Promise<ListedFile[]> {
  const files: ListedFile[] = []
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== 'file') continue
    if (!isListableImageName(name)) continue
    files.push({
      name,
      handle: handle as FileSystemFileHandle,
      previewable: isPreviewableImageName(name),
    })
  }
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  return files
}

function splitName(name: string): { base: string; ext: string } {
  const i = name.lastIndexOf('.')
  if (i <= 0) return { base: name, ext: '' }
  return { base: name.slice(0, i), ext: name.slice(i) }
}

async function uniqueFileName(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
  try {
    await dir.getFileHandle(name)
  } catch {
    return name
  }
  const { base, ext } = splitName(name)
  let n = 1
  while (n < 1000) {
    const candidate = `${base}-${n}${ext}`
    try {
      await dir.getFileHandle(candidate)
      n += 1
    } catch {
      return candidate
    }
  }
  return `${base}-${Date.now()}${ext}`
}

/** Write a Blob into the publication directory (does not touch the source archive). */
export async function writeBlobToDirectory(
  destinationDir: FileSystemDirectoryHandle,
  preferredName: string,
  blob: Blob,
): Promise<string> {
  const destOk = await ensurePermission(destinationDir, 'readwrite')
  if (!destOk) throw new Error('Publication folder write permission denied')

  const name = await uniqueFileName(destinationDir, preferredName)
  const out = await destinationDir.getFileHandle(name, { create: true })
  const writable = await out.createWritable()
  try {
    await writable.write(blob)
  } finally {
    await writable.close()
  }
  return name
}

export async function fileToObjectUrl(handle: FileSystemFileHandle): Promise<string> {
  const ok = await ensurePermission(handle, 'read')
  if (!ok) throw new Error('File read permission denied')
  const file = await handle.getFile()
  return URL.createObjectURL(file)
}

export async function readSourceFile(handle: FileSystemFileHandle): Promise<File> {
  const ok = await ensurePermission(handle, 'read')
  if (!ok) throw new Error('Source read permission denied')
  return handle.getFile()
}

export function canUseOpenFilePicker(): boolean {
  return typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function'
}

export async function pickImageFile(): Promise<FileSystemFileHandle> {
  if (!canUseOpenFilePicker()) {
    throw new Error('File picker unavailable')
  }
  const [handle] = await window.showOpenFilePicker!({
    multiple: false,
    types: [
      {
        description: 'Images',
        accept: {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
        },
      },
    ],
  })
  return handle
}
