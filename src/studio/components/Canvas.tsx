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
import { localize } from '../../i18n/locale'
import type { LocalizedText } from '../../i18n/types'
import { ASSET_DRAG_MIME, useMediaLibrary } from '../MediaLibraryContext'
import { useStudioDraft } from '../StudioDraftContext'
import type { StudioBlock, StudioImage } from '../types'
import { AddBlockControl } from './AddBlockControl'
import { StudioPhoto } from './StudioPhoto'

function isAssetDrag(dataTransfer: DataTransfer) {
  return [...dataTransfer.types].includes(ASSET_DRAG_MIME)
}

type BlockDrag = {
  kind: 'block'
  id: string
  insertBefore: number | null
}

type ImageDrag = {
  kind: 'image'
  blockId: string
  fromIndex: number
  insertBefore: number | null
}

type DragState = BlockDrag | ImageDrag | null

function textOrFallback(value: LocalizedText | undefined, locale: 'en' | 'ru', empty: string) {
  if (!value) return empty
  const shown = localize(value, locale)
  return shown || empty
}

function GripIcon() {
  return (
    <span className="studio-grip" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

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
        aria-label="Drag block to reorder"
        title="Drag block"
        onClick={(event) => event.stopPropagation()}
        onDragStart={(event) => onDragStart(event, block.id)}
        onDragEnd={onDragEnd}
      >
        <GripIcon />
      </button>
      <div className="studio-block-body">{children}</div>
    </div>
  )
}

function DropLine({ active, orientation }: { active: boolean; orientation: 'horizontal' | 'vertical' }) {
  return (
    <div
      className={`studio-drop-line studio-drop-line--${orientation}${active ? ' is-active' : ''}`}
      aria-hidden="true"
    />
  )
}

function RowImages({
  blockId,
  layoutClassName,
  images,
  showCaption,
  previewLocale,
  imageDrag,
  onImageDragStart,
  onImageDragEnd,
  onImageDragOver,
  onImageDrop,
  onAssetDragOver,
  onAssetDrop,
}: {
  blockId: string
  layoutClassName: string
  images: StudioImage[]
  showCaption: boolean
  previewLocale: 'en' | 'ru'
  imageDrag: ImageDrag | null
  onImageDragStart: (event: DragEvent<HTMLButtonElement>, blockId: string, index: number) => void
  onImageDragEnd: () => void
  onImageDragOver: (event: DragEvent, blockId: string, insertBefore: number) => void
  onImageDrop: (event: DragEvent, blockId: string, insertBefore: number) => void
  onAssetDragOver: (event: DragEvent) => void
  onAssetDrop: (event: DragEvent, blockId: string, slotIndex: number) => void
}) {
  const active = imageDrag?.blockId === blockId

  function resolveInsertBefore(event: DragEvent<HTMLElement>, index: number) {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientX < rect.left + rect.width / 2 ? index : index + 1
  }

  return (
    <div className={`${layoutClassName} studio-row-track`}>
      {images.map((image, index) => {
        const dragging = active && imageDrag.fromIndex === index
        const showLineBefore = active && imageDrag.insertBefore === index
        const showLineAfter =
          active && index === images.length - 1 && imageDrag.insertBefore === images.length

        return (
          <figure
            key={`${blockId}-${index}`}
            className={`studio-row-slot${dragging ? ' is-dragging' : ''}`}
            data-image-index={index}
            onDragOver={(event) => {
              if (isAssetDrag(event.dataTransfer)) {
                onAssetDragOver(event)
                return
              }
              onImageDragOver(event, blockId, resolveInsertBefore(event, index))
            }}
            onDrop={(event) => {
              if (isAssetDrag(event.dataTransfer)) {
                onAssetDrop(event, blockId, index)
                return
              }
              onImageDrop(event, blockId, resolveInsertBefore(event, index))
            }}
          >
            <div className="studio-drop-line-wrap studio-drop-line-wrap--start">
              <DropLine active={showLineBefore} orientation="vertical" />
            </div>
            {showLineAfter && (
              <div className="studio-drop-line-wrap studio-drop-line-wrap--end">
                <DropLine active orientation="vertical" />
              </div>
            )}
            <button
              type="button"
              className="studio-image-drag-handle"
              draggable
              aria-label="Drag image to reorder in row"
              title="Drag image"
              onClick={(event) => event.stopPropagation()}
              onDragStart={(event) => onImageDragStart(event, blockId, index)}
              onDragEnd={onImageDragEnd}
            >
              <GripIcon />
            </button>
            <div className="studio-row-media">
              <StudioPhoto image={image} />
            </div>
            {showCaption && image.caption && localize(image.caption, previewLocale) && (
              <figcaption className="story-caption">
                {localize(image.caption, previewLocale)}
              </figcaption>
            )}
          </figure>
        )
      })}
    </div>
  )
}

export function Canvas() {
  const {
    draft,
    selectedBlockId,
    selectBlock,
    reorderBlocks,
    reorderRowImages,
    previewLocale,
    previewViewport,
  } = useStudioDraft()
  const { applyAssetToSlot } = useMediaLibrary()
  const [drag, setDrag] = useState<DragState>(null)
  const didDropRef = useRef(false)
  const ghostRef = useRef<HTMLElement | null>(null)

  function clearDrag() {
    setDrag(null)
    didDropRef.current = false
    if (ghostRef.current) {
      ghostRef.current.remove()
      ghostRef.current = null
    }
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        if (drag) {
          event.preventDefault()
          clearDrag()
          return
        }
        selectBlock(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drag, selectBlock])

  function makeGhost(label: string) {
    const ghost = document.createElement('div')
    ghost.className = 'studio-drag-ghost'
    ghost.textContent = label
    document.body.appendChild(ghost)
    ghostRef.current = ghost
    return ghost
  }

  function handleBlockDragStart(event: DragEvent<HTMLButtonElement>, id: string) {
    didDropRef.current = false
    setDrag({ kind: 'block', id, insertBefore: null })
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `block:${id}`)
    event.dataTransfer.setDragImage(makeGhost('Move block'), 12, 12)
  }

  function handleImageDragStart(event: DragEvent<HTMLButtonElement>, blockId: string, index: number) {
    event.stopPropagation()
    didDropRef.current = false
    setDrag({ kind: 'image', blockId, fromIndex: index, insertBefore: null })
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `image:${blockId}:${index}`)
    event.dataTransfer.setDragImage(makeGhost('Move image'), 12, 12)
  }

  function handleDragEnd() {
    clearDrag()
  }

  function handleBlockSlotDragOver(event: DragEvent, index: number) {
    if (drag?.kind !== 'block') return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (drag.insertBefore !== index) {
      setDrag({ ...drag, insertBefore: index })
    }
  }

  function handleBlockSlotDrop(event: DragEvent, index: number) {
    if (drag?.kind !== 'block') return
    event.preventDefault()
    event.stopPropagation()
    const fromIndex = draft.blocks.findIndex((block) => block.id === drag.id)
    if (fromIndex === -1) {
      clearDrag()
      return
    }
    didDropRef.current = true
    reorderBlocks(fromIndex, index)
    clearDrag()
  }

  function handleImageDragOver(event: DragEvent, blockId: string, insertBefore: number) {
    if (drag?.kind !== 'image' || drag.blockId !== blockId) {
      // Explicitly reject cross-block / unrelated drops.
      event.dataTransfer.dropEffect = 'none'
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    if (drag.insertBefore !== insertBefore) {
      setDrag({ ...drag, insertBefore })
    }
  }

  function handleImageDrop(event: DragEvent, blockId: string, insertBefore: number) {
    if (drag?.kind !== 'image' || drag.blockId !== blockId) return
    event.preventDefault()
    event.stopPropagation()
    didDropRef.current = true
    reorderRowImages(blockId, drag.fromIndex, insertBefore)
    clearDrag()
  }

  function handleAssetDragOver(event: DragEvent) {
    if (!isAssetDrag(event.dataTransfer)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleAssetDrop(event: DragEvent, blockId: string, slotIndex: number) {
    if (!isAssetDrag(event.dataTransfer)) return
    event.preventDefault()
    event.stopPropagation()
    const assetId = event.dataTransfer.getData(ASSET_DRAG_MIME)
    if (!assetId) return
    void applyAssetToSlot(assetId, blockId, slotIndex)
  }

  const imageDrag = drag?.kind === 'image' ? drag : null
  const blockDragId = drag?.kind === 'block' ? drag.id : null
  const blockInsertBefore = drag?.kind === 'block' ? drag.insertBefore : null

  function renderBlock(block: StudioBlock) {
    const selected = block.id === selectedBlockId
    const dragging = block.id === blockDragId
    const shellProps = {
      block,
      selected,
      dragging,
      onSelect: selectBlock,
      onDragStart: handleBlockDragStart,
      onDragEnd: handleDragEnd,
    }

    if (block.type === 'text') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <p className="story-text">
            {textOrFallback(block.content, previewLocale, 'Empty text block')}
          </p>
        </BlockShell>
      )
    }

    if (block.type === 'caption') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <p className="story-caption">
            {textOrFallback(block.content, previewLocale, 'Empty caption')}
          </p>
        </BlockShell>
      )
    }

    if (block.type === 'location') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <aside className="story-location">
            <p>{textOrFallback(block.label, previewLocale, 'Location')}</p>
            {block.coordinates && (
              <p>{localize(block.coordinates, previewLocale)}</p>
            )}
          </aside>
        </BlockShell>
      )
    }

    if (block.type === 'image-row') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <RowImages
            blockId={block.id}
            layoutClassName={`story-photo-pair story-photo-pair--${block.layout ?? 'equal'}`}
            images={[...block.images]}
            showCaption={block.showCaption}
            previewLocale={previewLocale}
            imageDrag={imageDrag}
            onImageDragStart={handleImageDragStart}
            onImageDragEnd={handleDragEnd}
            onImageDragOver={handleImageDragOver}
            onImageDrop={handleImageDrop}
            onAssetDragOver={handleAssetDragOver}
            onAssetDrop={handleAssetDrop}
          />
        </BlockShell>
      )
    }

    if (block.type === 'image-triple') {
      return (
        <BlockShell key={block.id} {...shellProps}>
          <RowImages
            blockId={block.id}
            layoutClassName={`jrow jrow--${block.layout} studio-triple-row`}
            images={[...block.images]}
            showCaption={block.showCaption}
            previewLocale={previewLocale}
            imageDrag={imageDrag}
            onImageDragStart={handleImageDragStart}
            onImageDragEnd={handleDragEnd}
            onImageDragOver={handleImageDragOver}
            onImageDrop={handleImageDrop}
            onAssetDragOver={handleAssetDragOver}
            onAssetDrop={handleAssetDrop}
          />
        </BlockShell>
      )
    }

    return (
      <BlockShell key={block.id} {...shellProps}>
        <figure
          className={`story-photo story-photo--${block.size}`}
          onDragOver={handleAssetDragOver}
          onDrop={(event) => handleAssetDrop(event, block.id, 0)}
        >
          <div className="studio-row-media">
            <StudioPhoto image={block.image} eager={block.id === draft.blocks[0]?.id} />
          </div>
          {block.showCaption && block.image.caption && localize(block.image.caption, previewLocale) && (
            <figcaption className="story-caption">
              {localize(block.image.caption, previewLocale)}
            </figcaption>
          )}
        </figure>
      </BlockShell>
    )
  }

  const reordering = drag !== null

  return (
    <main className={`studio-canvas-wrap studio-canvas-wrap--${previewViewport}`}>
      <article
        className={`studio-canvas${reordering ? ' is-dragging-canvas' : ''}`}
        data-preview-locale={previewLocale}
        onClick={() => selectBlock(null)}
        onDragOver={(event) => {
          if (drag?.kind !== 'block') return
          if (!(event.target as HTMLElement).closest('.studio-drop-slot')) {
            event.dataTransfer.dropEffect = 'none'
          }
        }}
      >
        <p className="studio-canvas-kicker">{draft.kicker}</p>
        <h1 className="studio-canvas-title">{draft.title}</h1>
        <p className="studio-canvas-intro">{draft.intro}</p>

        <div className={`story-narrative${drag?.kind === 'block' ? ' is-reordering' : ''}${drag?.kind === 'image' ? ' is-reordering-images' : ''}`}>
          {draft.blocks.map((block, index) => (
            <div key={block.id} className="studio-block-slot">
              <div
                className="studio-drop-slot"
                onDragOver={(event) => handleBlockSlotDragOver(event, index)}
                onDrop={(event) => handleBlockSlotDrop(event, index)}
              >
                <DropLine
                  active={drag?.kind === 'block' && blockInsertBefore === index}
                  orientation="horizontal"
                />
              </div>
              <AddBlockControl insertBeforeIndex={index} />
              {renderBlock(block)}
            </div>
          ))}
          <div
            className="studio-drop-slot studio-drop-slot--end"
            onDragOver={(event) => handleBlockSlotDragOver(event, draft.blocks.length)}
            onDrop={(event) => handleBlockSlotDrop(event, draft.blocks.length)}
          >
            <DropLine
              active={drag?.kind === 'block' && blockInsertBefore === draft.blocks.length}
              orientation="horizontal"
            />
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
