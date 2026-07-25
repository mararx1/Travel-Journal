import type { AssetStatus } from '../media/types'
import { MEDIA_STORE, runStudioStoreRequest } from './db'

const MEDIA_KEY = 'default'

export type PersistedMediaAsset = {
  id: string
  name: string
  mimeType: string
  previewable: boolean
  status: AssetStatus
  width?: number
  height?: number
  publishedName?: string
  statusBeforeMissing?: Exclude<AssetStatus, 'missing'>
  sourceHandle: FileSystemFileHandle
}

export type PersistedMediaLibrary = {
  id: typeof MEDIA_KEY
  sourceFolderName: string | null
  publicationFolderName: string | null
  sourceDirHandle: FileSystemDirectoryHandle | null
  publicationDirHandle: FileSystemDirectoryHandle | null
  assets: PersistedMediaAsset[]
}

export async function loadMediaLibrary(): Promise<PersistedMediaLibrary | null> {
  const raw = await runStudioStoreRequest(MEDIA_STORE, 'readonly', (store) => store.get(MEDIA_KEY))
  if (!raw || typeof raw !== 'object') return null
  return raw as PersistedMediaLibrary
}

export async function saveMediaLibrary(data: Omit<PersistedMediaLibrary, 'id'> & { id?: string }): Promise<void> {
  const document: PersistedMediaLibrary = {
    id: MEDIA_KEY,
    sourceFolderName: data.sourceFolderName,
    publicationFolderName: data.publicationFolderName,
    sourceDirHandle: data.sourceDirHandle,
    publicationDirHandle: data.publicationDirHandle,
    assets: data.assets,
  }
  await runStudioStoreRequest(MEDIA_STORE, 'readwrite', (store) => store.put(document))
}
