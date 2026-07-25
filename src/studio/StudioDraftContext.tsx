import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Locale } from '../i18n/types'
import { createBlock } from './blockFactory'
import { initialDraft } from './mockDraft'
import type { AddBlockKind, StudioBlock, StudioDraft } from './types'

export type PreviewViewport = 'desktop' | 'mobile'

type StudioDraftContextValue = {
  draft: StudioDraft
  selectedBlockId: string | null
  selectedBlock: StudioBlock | null
  previewLocale: Locale
  previewViewport: PreviewViewport
  selectBlock: (id: string | null) => void
  setPreviewLocale: (locale: Locale) => void
  setPreviewViewport: (viewport: PreviewViewport) => void
  updateBlock: (id: string, updater: (block: StudioBlock) => StudioBlock) => void
  reorderBlocks: (fromIndex: number, insertBeforeIndex: number) => void
  reorderRowImages: (blockId: string, fromIndex: number, insertBeforeIndex: number) => void
  addBlock: (kind: AddBlockKind, insertBeforeIndex: number) => void
  deleteBlock: (id: string) => void
}

const StudioDraftContext = createContext<StudioDraftContextValue | null>(null)

export function StudioDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StudioDraft>(initialDraft)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [previewLocale, setPreviewLocale] = useState<Locale>('en')
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop')

  const selectBlock = useCallback((id: string | null) => {
    setSelectedBlockId(id)
  }, [])

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

  const deleteBlock = useCallback((id: string) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.filter((block) => block.id !== id),
    }))
    setSelectedBlockId((current) => (current === id ? null : current))
  }, [])

  const selectedBlock = useMemo(
    () => draft.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [draft.blocks, selectedBlockId],
  )

  const value = useMemo(
    () => ({
      draft,
      selectedBlockId,
      selectedBlock,
      previewLocale,
      previewViewport,
      selectBlock,
      setPreviewLocale,
      setPreviewViewport,
      updateBlock,
      reorderBlocks,
      reorderRowImages,
      addBlock,
      deleteBlock,
    }),
    [
      draft,
      selectedBlockId,
      selectedBlock,
      previewLocale,
      previewViewport,
      selectBlock,
      updateBlock,
      reorderBlocks,
      reorderRowImages,
      addBlock,
      deleteBlock,
    ],
  )

  return <StudioDraftContext.Provider value={value}>{children}</StudioDraftContext.Provider>
}

export function useStudioDraft() {
  const value = useContext(StudioDraftContext)
  if (!value) throw new Error('useStudioDraft must be used within StudioDraftProvider')
  return value
}
