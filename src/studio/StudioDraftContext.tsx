import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { initialDraft } from './mockDraft'
import type { StudioBlock, StudioDraft } from './types'

type StudioDraftContextValue = {
  draft: StudioDraft
  selectedBlockId: string | null
  selectedBlock: StudioBlock | null
  selectBlock: (id: string | null) => void
  updateBlock: (id: string, updater: (block: StudioBlock) => StudioBlock) => void
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

  const selectedBlock = useMemo(
    () => draft.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [draft.blocks, selectedBlockId],
  )

  const value = useMemo(
    () => ({ draft, selectedBlockId, selectedBlock, selectBlock, updateBlock }),
    [draft, selectedBlockId, selectedBlock, selectBlock, updateBlock],
  )

  return <StudioDraftContext.Provider value={value}>{children}</StudioDraftContext.Provider>
}

export function useStudioDraft() {
  const value = useContext(StudioDraftContext)
  if (!value) throw new Error('useStudioDraft must be used within StudioDraftProvider')
  return value
}
