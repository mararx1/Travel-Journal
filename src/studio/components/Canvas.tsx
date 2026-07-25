import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { SiteImage } from '../../components/SiteImage'
import { useStudioDraft } from '../StudioDraftContext'
import type { StudioBlock } from '../types'
import { AddBlockControl } from './AddBlockControl'
import { StudioPhoto } from './StudioPhoto'

function BlockShell({
  block,
  selected,
  dragging,
  onSelect,
  onDragStart,
  onDragEnd,
  children,
}: {
  block: StudioBlock
  selected: boolean
  dragging: boolean
  onSelect: (id: string) => void
  onDragStart: (event: DragEvent<HTMLButtonElement>, id: string) => void
  onDragEnd: () => void
  children: ReactNode
}) {
  return (
    <div
      className={`studio-block${selected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}`}
      data-block-id={block.id}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={(event: MouseEvent) => {
        event.stopPropagation()
        onSelect(block.id)
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          onSelect(block.id)
        }
      }}
    >
      <button
        type="button"
        className="studio-drag-handle"
        draggable
        aria-label="Drag to reorder"
        title="Drag to reorder"
        onClick={(event) => event.stopPropagation()}
        onDragStart={(event) => onDragStart(event, block.id)}
        onDragEnd={onDragEnd}
      >
        ⠿
      </button>
      <div className="studio-block-body">{children}</div>
    </div>
  )
}

function DropIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={`studio-drop-indicator${active ? ' is-active' : ''}`}
      aria-hidden="true"
    />
  )
}

export function Canvas() {
  const { draft, selectedBlockId, selectBlock, reorderBlocks } = useStudioDraft()
  const [dragId, setDragId] = useState<string | null>(null)
  const [insertBefore, setInsertBefore] = useState<number | null>(null)
  const didDropRef = useRef(false)

  function clearDrag() {
    setDragId(null)
    setInsertBefore(null)
    didDropRef.current = false
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        if (dragId) {
          event.preventDefault()
          clearDrag()
          return
        }
        selectBlock(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dragId, selectBlock])

  function handleDragStart(event: DragEvent<HTMLButtonElement>, id: string) {
    didDropRef.current = false
    setDragId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    const ghost = event.currentTarget.closest('.studio-block')
    if (ghost) event.dataTransfer.setDragImage(ghost, 16, 16)
  }

  function handleDragEnd() {
    clearDrag()
  }

  function handleSlotDragOver(event: DragEvent, index: number) {
    if (!dragId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (insertBefore !== index) setInsertBefore(index)
  }

  function handleSlotDrop(event: DragEvent, index: number) {
    if (!dragId) return
    event.preventDefault()
    event.stopPropagation()
    const fromIndex = draft.blocks.findIndex((block) => block.id === dragId)
    if (fromIndex === -1) {
      clearDrag()
      return
    }
    didDropRef.current = true
    reorderBlocks(fromIndex, index)
    clearDrag()
  }

  function renderBlock(block: StudioBlock) {
    const selected = block.id === selectedBlockId
    const dragging = block.id === dragId
    const shellProps = {
      block,
      selected,
      dragging,
      onSelect: selectBlock,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    }

    if (block.type === 'text') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <p className="story-text">{block.content.en || 'Empty text block'}</p>
        </BlockShell>
      )
    }

    if (block.type === 'caption') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <p className="story-caption">{block.content.en || 'Empty caption'}</p>
        </BlockShell>
      )
    }

    if (block.type === 'location') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <aside className="story-location">
            <p>{block.label.en || 'Location'}</p>
            {block.coordinates?.en && <p>{block.coordinates.en}</p>}
          </aside>
        </BlockShell>
      )
    }

    if (block.type === 'image-row') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <div className={`story-photo-pair story-photo-pair--${block.layout ?? 'equal'}`}>
            {block.images.map((image, index) => (
              <figure key={`${block.id}-${index}`}>
                <div className="story-photo-trigger">
                  <StudioPhoto image={image} />
                </div>
                {block.showCaption && image.caption?.en && (
                  <figcaption className="story-caption">{image.caption.en}</figcaption>
                )}
              </figure>
            ))}
          </div>
        </BlockShell>
      )
    }

    if (block.type === 'image-triple') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <div className={`jrow jrow--${block.layout} studio-triple-row`}>
            {block.images.map((image, index) => (
              <div className="featured-photo" key={`${block.id}-${index}`}>
                <StudioPhoto image={image} />
                {block.showCaption && image.caption?.en && (
                  <span className="photo-label">{image.caption.en}</span>
                )}
              </div>
            ))}
          </div>
        </BlockShell>
      )
    }

    return (
      <BlockShell key={block.id} {...shellProps}>
        <figure className={`story-photo story-photo--${block.size}`}>
          <div className="story-photo-trigger">
            <StudioPhoto image={block.image} eager={block.id === draft.blocks[0]?.id} />
          </div>
          {block.showCaption && block.image.caption?.en && (
            <figcaption className="story-caption">{block.image.caption.en}</figcaption>
          )}
        </figure>
      </BlockShell>
    )
  }

  return (
    <main className="studio-canvas-wrap">
      <article
        className="studio-canvas"
        onClick={() => selectBlock(null)}
        onDragOver={(event) => {
          if (!dragId) return
          if (!(event.target as HTMLElement).closest('.studio-drop-slot')) {
            event.dataTransfer.dropEffect = 'none'
          }
        }}
      >
        <p className="studio-canvas-kicker">{draft.kicker}</p>
        <h1 className="studio-canvas-title">{draft.title}</h1>
        <p className="studio-canvas-intro">{draft.intro}</p>

        <div className={`story-narrative${dragId ? ' is-reordering' : ''}`}>
          {draft.blocks.map((block, index) => (
            <div key={block.id} className="studio-block-slot">
              <div
                className="studio-drop-slot"
                onDragOver={(event) => handleSlotDragOver(event, index)}
                onDrop={(event) => handleSlotDrop(event, index)}
              >
                <DropIndicator active={dragId !== null && insertBefore === index} />
              </div>
              <AddBlockControl insertBeforeIndex={index} />
              {renderBlock(block)}
            </div>
          ))}
          <div
            className="studio-drop-slot studio-drop-slot--end"
            onDragOver={(event) => handleSlotDragOver(event, draft.blocks.length)}
            onDrop={(event) => handleSlotDrop(event, draft.blocks.length)}
          >
            <DropIndicator active={dragId !== null && insertBefore === draft.blocks.length} />
          </div>
          <AddBlockControl insertBeforeIndex={draft.blocks.length} />
        </div>

        <div className="jrow jrow--thirds studio-jrow-demo" aria-hidden="true">
          <div className="featured-photo">
            <SiteImage src="/images/journal/port-hull-marks.JPG" alt="Hull marks" />
          </div>
          <div className="featured-photo">
            <SiteImage src="/images/journal/river-house.JPG" alt="River house" />
          </div>
          <div className="featured-photo">
            <SiteImage src="/images/journal/lead-mountain-road.JPG" alt="Mountain road" />
          </div>
        </div>
      </article>
    </main>
  )
}
