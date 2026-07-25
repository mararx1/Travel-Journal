import {
  DEFAULT_DRAFT_ID,
  parseDraftDocument,
  type StudioDraftDocument,
} from '../draftDocument'
import { DRAFT_STORE, runStudioStoreRequest } from './db'

export async function loadDraftDocument(
  id = DEFAULT_DRAFT_ID,
): Promise<StudioDraftDocument | null> {
  const raw = await runStudioStoreRequest(DRAFT_STORE, 'readonly', (store) => store.get(id))
  if (raw === undefined) return null
  return parseDraftDocument(raw)
}

export async function saveDraftDocument(document: StudioDraftDocument): Promise<void> {
  await runStudioStoreRequest(DRAFT_STORE, 'readwrite', (store) => store.put(document))
}
