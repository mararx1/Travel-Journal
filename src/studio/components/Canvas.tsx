import { useEffect, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { SiteImage } from '../../components/SiteImage'
import { useStudioDraft } from '../StudioDraftContext'
import type { StudioBlock } from '../types'

function BlockShell({
  block,
  selected,
  onSelect,
  children,
}: {
  block: StudioBlock
  selected: boolean
  onSelect: (id: string) => void
  children: ReactNode
}) {
  return (
    <div
      className={`studio-block${selected ? ' is-selected' : ''}`}
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
      {children}
    </div>
  )
}

export function Canvas() {
  const { draft, selectedBlockId, selectBlock } = useStudioDraft()

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') selectBlock(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectBlock])

  return (
    <main className="studio-canvas-wrap">
      <article
        className="studio-canvas"
        onClick={() => selectBlock(null)}
      >
        <p className="studio-canvas-kicker">{draft.kicker}</p>
        <h1 className="studio-canvas-title">{draft.title}</h1>
        <p className="studio-canvas-intro">{draft.intro}</p>

        <button type="button" className="studio-add-block" disabled>
          + Add block
        </button>

        <div className="story-narrative">
          {draft.blocks.map((block) => {
            const selected = block.id === selectedBlockId

            if (block.type === 'text') {
              return (
                <BlockShell key={block.id} block={block} selected={selected} onSelect={selectBlock}>
                  <p className="story-text">{block.content.en}</p>
                </BlockShell>
              )
            }

            if (block.type === 'caption') {
              return (
                <BlockShell key={block.id} block={block} selected={selected} onSelect={selectBlock}>
                  <p className="story-caption">{block.content.en}</p>
                </BlockShell>
              )
            }

            if (block.type === 'location') {
              return (
                <BlockShell key={block.id} block={block} selected={selected} onSelect={selectBlock}>
                  <aside className="story-location">
                    <p>{block.label.en}</p>
                    {block.coordinates && <p>{block.coordinates.en}</p>}
                  </aside>
                </BlockShell>
              )
            }

            if (block.type === 'image-row') {
              return (
                <BlockShell key={block.id} block={block} selected={selected} onSelect={selectBlock}>
                  <div className={`story-photo-pair story-photo-pair--${block.layout ?? 'equal'}`}>
                    {block.images.map((image) => (
                      <figure key={image.src}>
                        <div className="story-photo-trigger">
                          <SiteImage
                            src={image.src}
                            alt={image.alt?.en ?? ''}
                            orientation={image.orientation}
                          />
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

            return (
              <BlockShell key={block.id} block={block} selected={selected} onSelect={selectBlock}>
                <figure className={`story-photo story-photo--${block.size}`}>
                  <div className="story-photo-trigger">
                    <SiteImage
                      src={block.image.src}
                      alt={block.image.alt?.en ?? ''}
                      orientation={block.image.orientation}
                      eager={block.id === draft.blocks[0]?.id}
                    />
                  </div>
                  {block.showCaption && block.image.caption?.en && (
                    <figcaption className="story-caption">{block.image.caption.en}</figcaption>
                  )}
                </figure>
              </BlockShell>
            )
          })}
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
