import {
  DEFAULT_DRAFT_ID,
  parseDraftDocument,
  type StudioDraftDocument,
} from '../draftDocument'

const DB_NAME = 'mararx-studio'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

function runStoreRequest<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const store = tx.objectStore(STORE_NAME)
        const request = run(store)

        request.onerror = () => {
          reject(request.error ?? new Error('IndexedDB request failed'))
        }

        request.onsuccess = () => {
          resolve(request.result)
        }

        tx.oncomplete = () => {
          db.close()
        }

        tx.onerror = () => {
          reject(tx.error ?? new Error('IndexedDB transaction failed'))
        }
      }),
  )
}

export async function loadDraftDocument(
  id = DEFAULT_DRAFT_ID,
): Promise<StudioDraftDocument | null> {
  const raw = await runStoreRequest('readonly', (store) => store.get(id))
  if (raw === undefined) return null
  return parseDraftDocument(raw)
}

export async function saveDraftDocument(document: StudioDraftDocument): Promise<void> {
  await runStoreRequest('readwrite', (store) => store.put(document))
}
