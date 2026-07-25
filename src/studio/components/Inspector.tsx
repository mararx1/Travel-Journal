import { useStudioDraft } from '../StudioDraftContext'
import type { StudioBlock, StudioImage } from '../types'

function enText(value?: { en: string; ru?: string }) {
  return value?.en ?? ''
}

function withEn(current: { en: string; ru?: string } | undefined, en: string) {
  return { en, ru: current?.ru }
}

function updateImageInBlock(
  block: Extract<StudioBlock, { type: 'image' }>,
  patch: Partial<StudioImage>,
): StudioBlock {
  return { ...block, image: { ...block.image, ...patch } }
}

function updateRowImage(
  block: Extract<StudioBlock, { type: 'image-row' }>,
  index: 0 | 1,
  patch: Partial<StudioImage>,
): StudioBlock {
  const images: [StudioImage, StudioImage] = [...block.images]
  images[index] = { ...images[index], ...patch }
  return { ...block, images }
}

function BlockInspector({
  block,
  updateBlock,
}: {
  block: StudioBlock
  updateBlock: (id: string, updater: (block: StudioBlock) => StudioBlock) => void
}) {
  if (block.type === 'text') {
    return (
      <>
        <h2 className="studio-inspector-title">Text</h2>
        <p className="studio-inspector-desc">Editing EN only. RU fields not wired yet.</p>
        <label className="studio-field">
          <span>Content (EN)</span>
          <textarea
            rows={6}
            value={block.content.en}
            onChange={(event) => {
              const en = event.target.value
              updateBlock(block.id, (current) =>
                current.type === 'text' ? { ...current, content: withEn(current.content, en) } : current,
              )
            }}
          />
        </label>
      </>
    )
  }

  if (block.type === 'caption') {
    return (
      <>
        <h2 className="studio-inspector-title">Caption</h2>
        <label className="studio-field">
          <span>Caption (EN)</span>
          <textarea
            rows={4}
            value={block.content.en}
            onChange={(event) => {
              const en = event.target.value
              updateBlock(block.id, (current) =>
                current.type === 'caption' ? { ...current, content: withEn(current.content, en) } : current,
              )
            }}
          />
        </label>
      </>
    )
  }

  if (block.type === 'location') {
    return (
      <>
        <h2 className="studio-inspector-title">Location</h2>
        <label className="studio-field">
          <span>Label (EN)</span>
          <input
            type="text"
            value={block.label.en}
            onChange={(event) => {
              const en = event.target.value
              updateBlock(block.id, (current) =>
                current.type === 'location' ? { ...current, label: withEn(current.label, en) } : current,
              )
            }}
          />
        </label>
        <label className="studio-field">
          <span>Coordinates (EN)</span>
          <input
            type="text"
            value={enText(block.coordinates)}
            onChange={(event) => {
              const en = event.target.value
              updateBlock(block.id, (current) =>
                current.type === 'location'
                  ? { ...current, coordinates: en ? withEn(current.coordinates, en) : undefined }
                  : current,
              )
            }}
          />
        </label>
      </>
    )
  }

  if (block.type === 'image') {
    return (
      <>
        <h2 className="studio-inspector-title">Photo</h2>
        <p className="studio-inspector-desc">Editing EN only. RU fields not wired yet.</p>
        <label className="studio-field">
          <span>Layout preset</span>
          <select
            value={block.size}
            onChange={(event) => {
              const size = event.target.value as 'full' | 'medium' | 'portrait'
              updateBlock(block.id, (current) =>
                current.type === 'image' ? { ...current, size } : current,
              )
            }}
          >
            <option value="full">Full width</option>
            <option value="medium">Medium</option>
            <option value="portrait">Portrait</option>
          </select>
        </label>
        <label className="studio-field">
          <span>Alt text (EN)</span>
          <input
            type="text"
            value={enText(block.image.alt)}
            onChange={(event) => {
              const en = event.target.value
              updateBlock(block.id, (current) =>
                current.type === 'image'
                  ? updateImageInBlock(current, { alt: en ? withEn(current.image.alt, en) : undefined })
                  : current,
              )
            }}
          />
        </label>
        <label className="studio-field">
          <span>Caption (EN)</span>
          <textarea
            rows={3}
            value={enText(block.image.caption)}
            onChange={(event) => {
              const en = event.target.value
              updateBlock(block.id, (current) =>
                current.type === 'image'
                  ? updateImageInBlock(current, {
                      caption: en ? withEn(current.image.caption, en) : undefined,
                    })
                  : current,
              )
            }}
          />
        </label>
        <button
          type="button"
          className="studio-toggle-row studio-toggle-btn"
          onClick={() =>
            updateBlock(block.id, (current) =>
              current.type === 'image' ? { ...current, showCaption: !current.showCaption } : current,
            )
          }
        >
          <span>Show caption</span>
          <span className={`studio-toggle${block.showCaption ? ' is-on' : ''}`} aria-hidden="true" />
        </button>
      </>
    )
  }

  return (
    <>
      <h2 className="studio-inspector-title">Image row</h2>
      <p className="studio-inspector-desc">Editing EN only. RU fields not wired yet.</p>
      <label className="studio-field">
        <span>Layout preset</span>
        <select
          value={block.layout ?? 'equal'}
          onChange={(event) => {
            const layout = event.target.value as NonNullable<Extract<StudioBlock, { type: 'image-row' }>['layout']>
            updateBlock(block.id, (current) =>
              current.type === 'image-row' ? { ...current, layout } : current,
            )
          }}
        >
          <option value="equal">Equal</option>
          <option value="wide-narrow">Wide / narrow</option>
          <option value="narrow-wide">Narrow / wide</option>
          <option value="portrait-pair">Portrait pair</option>
        </select>
      </label>
      <label className="studio-field">
        <span>Left alt (EN)</span>
        <input
          type="text"
          value={enText(block.images[0].alt)}
          onChange={(event) => {
            const en = event.target.value
            updateBlock(block.id, (current) =>
              current.type === 'image-row'
                ? updateRowImage(current, 0, { alt: en ? withEn(current.images[0].alt, en) : undefined })
                : current,
            )
          }}
        />
      </label>
      <label className="studio-field">
        <span>Left caption (EN)</span>
        <textarea
          rows={2}
          value={enText(block.images[0].caption)}
          onChange={(event) => {
            const en = event.target.value
            updateBlock(block.id, (current) =>
              current.type === 'image-row'
                ? updateRowImage(current, 0, {
                    caption: en ? withEn(current.images[0].caption, en) : undefined,
                  })
                : current,
            )
          }}
        />
      </label>
      <label className="studio-field">
        <span>Right alt (EN)</span>
        <input
          type="text"
          value={enText(block.images[1].alt)}
          onChange={(event) => {
            const en = event.target.value
            updateBlock(block.id, (current) =>
              current.type === 'image-row'
                ? updateRowImage(current, 1, { alt: en ? withEn(current.images[1].alt, en) : undefined })
                : current,
            )
          }}
        />
      </label>
      <label className="studio-field">
        <span>Right caption (EN)</span>
        <textarea
          rows={2}
          value={enText(block.images[1].caption)}
          onChange={(event) => {
            const en = event.target.value
            updateBlock(block.id, (current) =>
              current.type === 'image-row'
                ? updateRowImage(current, 1, {
                    caption: en ? withEn(current.images[1].caption, en) : undefined,
                  })
                : current,
            )
          }}
        />
      </label>
      <button
        type="button"
        className="studio-toggle-row studio-toggle-btn"
        onClick={() =>
          updateBlock(block.id, (current) =>
            current.type === 'image-row' ? { ...current, showCaption: !current.showCaption } : current,
          )
        }
      >
        <span>Show caption</span>
        <span className={`studio-toggle${block.showCaption ? ' is-on' : ''}`} aria-hidden="true" />
      </button>
    </>
  )
}

export function Inspector() {
  const { selectedBlock, updateBlock } = useStudioDraft()

  return (
    <aside className="studio-panel studio-panel-right">
      <div className="studio-tabs">
        <span className="studio-tab is-active">Block</span>
        <span className="studio-tab">Page</span>
      </div>
      <div className="studio-panel-scroll">
        {selectedBlock ? (
          <BlockInspector block={selectedBlock} updateBlock={updateBlock} />
        ) : (
          <>
            <h2 className="studio-inspector-title">Inspector</h2>
            <p className="studio-inspector-desc">Static placeholder. No state wiring.</p>

            <label className="studio-field">
              <span>Title</span>
              <input type="text" value="Untitled Story" disabled readOnly />
            </label>

            <label className="studio-field">
              <span>Layout preset</span>
              <select disabled defaultValue="full">
                <option value="full">Full width photo</option>
                <option value="pair">Portrait pair</option>
              </select>
            </label>

            <label className="studio-field">
              <span>Caption (EN)</span>
              <textarea rows={3} disabled readOnly value="" placeholder="—" />
            </label>

            <div className="studio-toggle-row">
              <span>Show caption</span>
              <span className="studio-toggle" aria-hidden="true" />
            </div>
            <div className="studio-toggle-row">
              <span>Open in lightbox</span>
              <span className="studio-toggle is-on" aria-hidden="true" />
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
