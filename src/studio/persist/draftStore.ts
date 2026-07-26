import {
  parseDraftDocument,
  toDraftListItem,
  type DraftListItem,
  type StudioDraftDocument,
} from '../draftDocument'
import { DRAFT_STORE, openStudioDatabase, runStudioStoreRequest } from './db'

const ACTIVE_DRAFT_KEY = 'mararx-studio-active-draft-id'

export async function loadDraftDocument(id: string): Promise<StudioDraftDocument | null> {
  const raw = await runStudioStoreRequest(DRAFT_STORE, 'readonly', (store) => store.get(id))
  if (raw === undefined) return null
  return parseDraftDocument(raw)
}

export async function saveDraftDocument(document: StudioDraftDocument): Promise<void> {
  await runStudioStoreRequest(DRAFT_STORE, 'readwrite', (store) => store.put(document))
}

export async function deleteDraftDocument(id: string): Promise<void> {
  await runStudioStoreRequest(DRAFT_STORE, 'readwrite', (store) => store.delete(id))
}

export async function listDraftDocuments(): Promise<StudioDraftDocument[]> {
  const db = await openStudioDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE, 'readonly')
    const store = tx.objectStore(DRAFT_STORE)
    const request = store.getAll()

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to list drafts'))
    }

    request.onsuccess = () => {
      const docs = (request.result as unknown[])
        .map((raw) => parseDraftDocument(raw))
        .filter((doc): doc is StudioDraftDocument => doc !== null)
      resolve(docs)
    }

    tx.oncomplete = () => {
      db.close()
    }

    tx.onerror = () => {
      reject(tx.error ?? new Error('Failed to list drafts'))
    }
  })
}

export async function listDraftSummaries(): Promise<DraftListItem[]> {
  const docs = await listDraftDocuments()
  return docs
    .map(toDraftListItem)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function readActiveDraftId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_DRAFT_KEY)
  } catch {
    return null
  }
}

export function writeActiveDraftId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, id)
  } catch {
    // Ignore private-mode / quota failures; session still works in memory.
  }
}
