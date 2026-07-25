import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createBlock } from './blockFactory'
import { initialDraft } from './mockDraft'
import type { AddBlockKind, StudioBlock, StudioDraft } from './types'

type StudioDraftContextValue = {
  draft: StudioDraft
  selectedBlockId: string | null
  selectedBlock: StudioBlock | null
  selectBlock: (id: string | null) => void
  updateBlock: (id: string, updater: (block: StudioBlock) => StudioBlock) => void
  reorderBlocks: (fromIndex: number, insertBeforeIndex: number) => void
  addBlock: (kind: AddBlockKind, insertBeforeIndex: number) => void
  deleteBlock: (id: string) => void
}

const StudioDraftContext = createContext<StudioDraftContextValue | null>(null)

export function StudioDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<StudioDraft>(initialDraft)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

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
      selectBlock,
      updateBlock,
      reorderBlocks,
      addBlock,
      deleteBlock,
    }),
    [
      draft,
      selectedBlockId,
      selectedBlock,
      selectBlock,
      updateBlock,
      reorderBlocks,
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
