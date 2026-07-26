import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from '../i18n/types'
import { createBlock } from './blockFactory'
import {
  createEmptyJournalDraft,
  createEmptyStoryDraft,
  newDraftId,
  toDraftDocument,
  type DraftKind,
  type DraftListItem,
  type DraftSiteStatus,
} from './draftDocument'
import { initialDraft } from './mockDraft'
import {
  deleteDraftDocument,
  listDraftSummaries,
  loadDraftDocument,
  readActiveDraftId,
  saveDraftDocument,
  writeActiveDraftId,
} from './persist/draftStore'
import type { AddBlockKind, StudioBlock, StudioDraft, StudioImage } from './types'

export type PreviewViewport = 'desktop' | 'mobile'

export type SaveStatus = 'loading' | 'saving' | 'saved' | 'unsaved' | 'unavailable'

/** Local site-integration state (not deployed). Ready = Apply + build succeeded. */
export type SiteStatus = DraftSiteStatus

type StudioDraftContextValue = {
  draft: StudioDraft
  draftId: string
  draftKind: DraftKind
  draftList: DraftListItem[]
  selectedBlockId: string | null
  selectedBlock: StudioBlock | null
  previewLocale: Locale
  previewViewport: PreviewViewport
  saveStatus: SaveStatus
  siteStatus: SiteStatus
  ready: boolean
  selectBlock: (id: string | null) => void
  setPreviewLocale: (locale: Locale) => void
  setPreviewViewport: (viewport: PreviewViewport) => void
  markSiteReady: () => void
  updateDraftMeta: (patch: Partial<Pick<StudioDraft, 'title' | 'kicker' | 'intro'>>) => void
  updateBlock: (id: string, updater: (block: StudioBlock) => StudioBlock) => void
  reorderBlocks: (fromIndex: number, insertBeforeIndex: number) => void
  reorderRowImages: (blockId: string, fromIndex: number, insertBeforeIndex: number) => void
  addBlock: (kind: AddBlockKind, insertBeforeIndex: number) => void
  insertImageBlock: (image: StudioImage, insertBeforeIndex: number) => void
  deleteBlock: (id: string) => void
  openDraft: (id: string) => Promise<void>
  createStoryDraft: () => Promise<void>
  createJournalDraft: () => Promise<void>
  discardDraft: (id: string) => Promise<void>
  refreshDraftList: () => Promise<void>
}

const StudioDraftContext = createContext<StudioDraftContextValue | null>(null)

const SAVE_DEBOUNCE_MS = 450

export function StudioDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StudioDraft>(initialDraft)
  const [draftId, setDraftId] = useState(newDraftId())
  const [draftKind, setDraftKind] = useState<DraftKind>('story')
  const [draftList, setDraftList] = useState<DraftListItem[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [previewLocale, setPreviewLocale] = useState<Locale>('en')
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading')
  const [siteStatus, setSiteStatus] = useState<SiteStatus>('draft')
  const [ready, setReady] = useState(false)

  const persistEnabledRef = useRef(true)
  const skipNextPersistRef = useRef(true)
  const saveTimerRef = useRef<number | null>(null)
  const readyFingerprintRef = useRef<string | null>(null)

  const draftRef = useRef(draft)
  const draftIdRef = useRef(draftId)
  const draftKindRef = useRef(draftKind)
  const siteStatusRef = useRef(siteStatus)

  draftRef.current = draft
  draftIdRef.current = draftId
  draftKindRef.current = draftKind
  siteStatusRef.current = siteStatus

  const refreshDraftList = useCallback(async () => {
    try {
      const list = await listDraftSummaries()
      setDraftList(list)
    } catch {
      // Keep the previous list if IndexedDB listing fails mid-session.
    }
  }, [])

  const flushSave = useCallback(async () => {
    if (!persistEnabledRef.current) return

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    setSaveStatus('saving')
    const document = toDraftDocument(draftRef.current, draftIdRef.current, {
      kind: draftKindRef.current,
      status: siteStatusRef.current,
    })

    try {
      await saveDraftDocument(document)
      if (!persistEnabledRef.current) return
      setSaveStatus('saved')
      await refreshDraftList()
    } catch {
      persistEnabledRef.current = false
      setSaveStatus('unavailable')
    }
  }, [refreshDraftList])

  const loadIntoEditor = useCallback(
    (id: string, nextDraft: StudioDraft, kind: DraftKind, status: SiteStatus) => {
      skipNextPersistRef.current = true
      setDraftId(id)
      setDraft(nextDraft)
      setDraftKind(kind)
      setSiteStatus(status)
      setSelectedBlockId(null)
      writeActiveDraftId(id)
      if (status === 'ready') {
        readyFingerprintRef.current = JSON.stringify(nextDraft)
      } else {
        readyFingerprintRef.current = null
      }
      setSaveStatus('saved')
    },
    [],
  )

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        let list = await listDraftSummaries()

        // Empty store: migrate legacy `default` if present, otherwise seed mock draft.
        if (list.length === 0) {
          const legacy = await loadDraftDocument('default')
          if (legacy) {
            await saveDraftDocument(
              toDraftDocument(legacy.draft, legacy.id, {
                kind: legacy.kind,
                status: legacy.status,
              }),
            )
          } else {
            const seedId = newDraftId()
            await saveDraftDocument(
              toDraftDocument(initialDraft, seedId, {
                kind: 'story',
                status: 'draft',
              }),
            )
          }
          list = await listDraftSummaries()
        }

        if (cancelled) return

        setDraftList(list)
        const preferred = readActiveDraftId()
        const activeSummary = list.find((item) => item.id === preferred) ?? list[0]
        if (!activeSummary) {
          skipNextPersistRef.current = true
          setSaveStatus('saved')
          setReady(true)
          return
        }

        const stored = await loadDraftDocument(activeSummary.id)
        if (cancelled) return

        if (stored) {
          loadIntoEditor(stored.id, stored.draft, stored.kind, stored.status)
        } else {
          skipNextPersistRef.current = true
          setSaveStatus('saved')
        }
      } catch {
        if (cancelled) return
        persistEnabledRef.current = false
        skipNextPersistRef.current = true
        setSaveStatus('unavailable')
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadIntoEditor])

  useEffect(() => {
    if (siteStatus === 'ready' && readyFingerprintRef.current !== null) {
      const fingerprint = JSON.stringify(draft)
      if (fingerprint !== readyFingerprintRef.current) {
        siteStatusRef.current = 'draft'
        setSiteStatus('draft')
        readyFingerprintRef.current = null
      }
    }
  }, [draft, siteStatus])

  useEffect(() => {
    if (!ready || !persistEnabledRef.current) return

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false
      return
    }

    setSaveStatus('unsaved')

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null
      void flushSave()
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [draft, draftId, draftKind, siteStatus, ready, flushSave])

  const selectBlock = useCallback((id: string | null) => {
    setSelectedBlockId(id)
  }, [])

  const markSiteReady = useCallback(() => {
    readyFingerprintRef.current = JSON.stringify(draftRef.current)
    setSiteStatus('ready')
    siteStatusRef.current = 'ready'
    void flushSave()
  }, [flushSave])

  const updateDraftMeta = useCallback(
    (patch: Partial<Pick<StudioDraft, 'title' | 'kicker' | 'intro'>>) => {
      setDraft((current) => ({ ...current, ...patch }))
    },
    [],
  )

  const updateBlock = useCallback((id: string, updater: (block: StudioBlock) => StudioBlock) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === id ? updater(block) : block)),
    }))
  }, [])

  const reorderBlocks = useCallback((fromIndex: number, insertBeforeIndex: number) => {
    setDraft((current) => {
      if (
        fromIndex < 0
        || fromIndex >= current.blocks.length
        || insertBeforeIndex < 0
        || insertBeforeIndex > current.blocks.length
      ) {
        return current
      }

      if (insertBeforeIndex === fromIndex || insertBeforeIndex === fromIndex + 1) {
        return current
      }

      const blocks = [...current.blocks]
      const [moved] = blocks.splice(fromIndex, 1)
      const dest = insertBeforeIndex > fromIndex ? insertBeforeIndex - 1 : insertBeforeIndex
      blocks.splice(dest, 0, moved)
      return { ...current, blocks }
    })
  }, [])

  const reorderRowImages = useCallback((blockId: string, fromIndex: number, insertBeforeIndex: number) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => {
        if (block.id !== blockId) return block
        if (block.type !== 'image-row' && block.type !== 'image-triple') return block

        const images = [...block.images]
        if (
          fromIndex < 0
          || fromIndex >= images.length
          || insertBeforeIndex < 0
          || insertBeforeIndex > images.length
        ) {
          return block
        }

        if (insertBeforeIndex === fromIndex || insertBeforeIndex === fromIndex + 1) {
          return block
        }

        const [moved] = images.splice(fromIndex, 1)
        const dest = insertBeforeIndex > fromIndex ? insertBeforeIndex - 1 : insertBeforeIndex
        images.splice(dest, 0, moved)

        if (block.type === 'image-row') {
          return { ...block, images: images as [typeof images[0], typeof images[0]] }
        }

        return {
          ...block,
          images: images as [typeof images[0], typeof images[0], typeof images[0]],
        }
      }),
    }))
  }, [])

  const addBlock = useCallback((kind: AddBlockKind, insertBeforeIndex: number) => {
    const block = createBlock(kind)
    setDraft((current) => {
      const blocks = [...current.blocks]
      const index = Math.max(0, Math.min(insertBeforeIndex, blocks.length))
      blocks.splice(index, 0, block)
      return { ...current, blocks }
    })
    setSelectedBlockId(block.id)
  }, [])

  const insertImageBlock = useCallback((image: StudioImage, insertBeforeIndex: number) => {
    const created = createBlock('image')
    if (created.type !== 'image') return
    const block: StudioBlock = { ...created, image, showCaption: false }
    setDraft((current) => {
      const blocks = [...current.blocks]
      const index = Math.max(0, Math.min(insertBeforeIndex, blocks.length))
      blocks.splice(index, 0, block)
      return { ...current, blocks }
    })
    setSelectedBlockId(block.id)
  }, [])

  const deleteBlock = useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== id),
    }))
    setSelectedBlockId((current) => (current === id ? null : current))
  }, [])

  const openDraft = useCallback(
    async (id: string) => {
      if (id === draftIdRef.current) return
      await flushSave()
      const stored = await loadDraftDocument(id)
      if (!stored) {
        await refreshDraftList()
        return
      }
      loadIntoEditor(stored.id, stored.draft, stored.kind, stored.status)
    },
    [flushSave, loadIntoEditor, refreshDraftList],
  )

  const createStoryDraft = useCallback(async () => {
    await flushSave()
    const id = newDraftId()
    const next = createEmptyStoryDraft()
    const document = toDraftDocument(next, id, { kind: 'story', status: 'draft' })
    await saveDraftDocument(document)
    loadIntoEditor(id, next, 'story', 'draft')
    await refreshDraftList()
  }, [flushSave, loadIntoEditor, refreshDraftList])

  const createJournalDraft = useCallback(async () => {
    await flushSave()
    const id = newDraftId()
    const next = createEmptyJournalDraft()
    const document = toDraftDocument(next, id, { kind: 'journal', status: 'draft' })
    await saveDraftDocument(document)
    loadIntoEditor(id, next, 'journal', 'draft')
    await refreshDraftList()
  }, [flushSave, loadIntoEditor, refreshDraftList])

  const discardDraft = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        'Delete this draft permanently? This cannot be undone.',
      )
      if (!confirmed) return

      const deletingActive = id === draftIdRef.current
      if (deletingActive) {
        await flushSave()
      }

      await deleteDraftDocument(id)
      let list = await listDraftSummaries()

      if (list.length === 0) {
        const seedId = newDraftId()
        const next = createEmptyStoryDraft()
        await saveDraftDocument(toDraftDocument(next, seedId, { kind: 'story', status: 'draft' }))
        list = await listDraftSummaries()
        loadIntoEditor(seedId, next, 'story', 'draft')
        setDraftList(list)
        return
      }

      setDraftList(list)

      if (deletingActive) {
        const nextId = list[0]!.id
        const stored = await loadDraftDocument(nextId)
        if (stored) {
          loadIntoEditor(stored.id, stored.draft, stored.kind, stored.status)
        }
      }
    },
    [flushSave, loadIntoEditor],
  )

  const selectedBlock = useMemo(
    () => draft.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [draft.blocks, selectedBlockId],
  )

  const value = useMemo(
    () => ({
      draft,
      draftId,
      draftKind,
      draftList,
      selectedBlockId,
      selectedBlock,
      previewLocale,
      previewViewport,
      saveStatus,
      siteStatus,
      ready,
      selectBlock,
      setPreviewLocale,
      setPreviewViewport,
      markSiteReady,
      updateDraftMeta,
      updateBlock,
      reorderBlocks,
      reorderRowImages,
      addBlock,
      insertImageBlock,
      deleteBlock,
      openDraft,
      createStoryDraft,
      createJournalDraft,
      discardDraft,
      refreshDraftList,
    }),
    [
      draft,
      draftId,
      draftKind,
      draftList,
      selectedBlockId,
      selectedBlock,
      previewLocale,
      previewViewport,
      saveStatus,
      siteStatus,
      ready,
      selectBlock,
      markSiteReady,
      updateDraftMeta,
      updateBlock,
      reorderBlocks,
      reorderRowImages,
      addBlock,
      insertImageBlock,
      deleteBlock,
      openDraft,
      createStoryDraft,
      createJournalDraft,
      discardDraft,
      refreshDraftList,
    ],
  )

  return <StudioDraftContext.Provider value={value}>{children}</StudioDraftContext.Provider>
}

export function useStudioDraft() {
  const value = useContext(StudioDraftContext)
  if (!value) throw new Error('useStudioDraft must be used within StudioDraftProvider')
  return value
}
