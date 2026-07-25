const DB_NAME = 'mararx-studio'
const DB_VERSION = 2

export const DRAFT_STORE = 'drafts'
export const MEDIA_STORE = 'media'

export function openStudioDatabase(): Promise<IDBDatabase> {
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
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' })
      }
    }
  })
}

export function runStudioStoreRequest<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openStudioDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
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
