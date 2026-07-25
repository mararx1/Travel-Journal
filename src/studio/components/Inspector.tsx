import type { LocalizedText } from '../../i18n/types'
import { useStudioDraft } from '../StudioDraftContext'
import { localizedValue, setLocalizedField } from '../localized'
import type {
  ImageRowLayout,
  ImageSize,
  ImageTripleLayout,
  StudioBlock,
  StudioImage,
} from '../types'

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

function updateTripleImage(
  block: Extract<StudioBlock, { type: 'image-triple' }>,
  index: 0 | 1 | 2,
  patch: Partial<StudioImage>,
): StudioBlock {
  const images: [StudioImage, StudioImage, StudioImage] = [...block.images]
  images[index] = { ...images[index], ...patch }
  return { ...block, images }
}

function LocalizedFields({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string
  value: LocalizedText | undefined
  rows?: number
  onChange: (next: LocalizedText) => void
}) {
  return (
    <div className="studio-localized-fields">
      <label className="studio-field">
        <span>{label} (EN)</span>
        <textarea
          rows={rows}
          value={localizedValue(value, 'en')}
          onChange={(event) => onChange(setLocalizedField(value, 'en', event.target.value))}
        />
      </label>
      <label className="studio-field">
        <span>{label} (RU)</span>
        <textarea
          rows={rows}
          value={localizedValue(value, 'ru')}
          onChange={(event) => onChange(setLocalizedField(value, 'ru', event.target.value))}
        />
      </label>
    </div>
  )
}

function DeleteBlockButton({ blockId }: { blockId: string }) {
  const { deleteBlock } = useStudioDraft()
  return (
    <div className="studio-panel-footer">
      <button type="button" className="studio-delete" onClick={() => deleteBlock(blockId)}>
        Delete block
      </button>
    </div>
  )
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
        <div className="studio-panel-scroll">
          <h2 className="studio-inspector-title">Text</h2>
          <p className="studio-inspector-desc">EN and RU edit independently. Canvas uses EN fallback for empty RU.</p>
          <LocalizedFields
            label="Content"
            value={block.content}
            rows={5}
            onChange={(content) =>
              updateBlock(block.id, (current) =>
                current.type === 'text' ? { ...current, content } : current,
              )
            }
          />
        </div>
        <DeleteBlockButton blockId={block.id} />
      </>
    )
  }

  if (block.type === 'caption') {
    return (
      <>
        <div className="studio-panel-scroll">
          <h2 className="studio-inspector-title">Caption</h2>
          <LocalizedFields
            label="Caption"
            value={block.content}
            rows={3}
            onChange={(content) =>
              updateBlock(block.id, (current) =>
                current.type === 'caption' ? { ...current, content } : current,
              )
            }
          />
        </div>
        <DeleteBlockButton blockId={block.id} />
      </>
    )
  }

  if (block.type === 'location') {
    return (
      <>
        <div className="studio-panel-scroll">
          <h2 className="studio-inspector-title">Location</h2>
          <LocalizedFields
            label="Label"
            value={block.label}
            rows={2}
            onChange={(label) =>
              updateBlock(block.id, (current) =>
                current.type === 'location' ? { ...current, label } : current,
              )
            }
          />
          <LocalizedFields
            label="Coordinates"
            value={block.coordinates}
            rows={2}
            onChange={(coordinates) =>
              updateBlock(block.id, (current) =>
                current.type === 'location'
                  ? { ...current, coordinates: coordinates.en || coordinates.ru ? coordinates : undefined }
                  : current,
              )
            }
          />
        </div>
        <DeleteBlockButton blockId={block.id} />
      </>
    )
  }

  if (block.type === 'image') {
    return (
      <>
        <div className="studio-panel-scroll">
          <h2 className="studio-inspector-title">Photo</h2>
          <label className="studio-field">
            <span>Layout preset</span>
            <select
              value={block.size}
              onChange={(event) => {
                const size = event.target.value as ImageSize
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
          <LocalizedFields
            label="Alt text"
            value={block.image.alt}
            rows={2}
            onChange={(alt) =>
              updateBlock(block.id, (current) =>
                current.type === 'image'
                  ? updateImageInBlock(current, {
                      alt: alt.en || alt.ru ? alt : undefined,
                    })
                  : current,
              )
            }
          />
          <LocalizedFields
            label="Caption"
            value={block.image.caption}
            rows={3}
            onChange={(caption) =>
              updateBlock(block.id, (current) =>
                current.type === 'image'
                  ? updateImageInBlock(current, {
                      caption: caption.en || caption.ru ? caption : undefined,
                    })
                  : current,
              )
            }
          />
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
        </div>
        <DeleteBlockButton blockId={block.id} />
      </>
    )
  }

  if (block.type === 'image-triple') {
    return (
      <>
        <div className="studio-panel-scroll">
          <h2 className="studio-inspector-title">Three photos</h2>
          <label className="studio-field">
            <span>Layout preset</span>
            <select
              value={block.layout}
              onChange={(event) => {
                const layout = event.target.value as ImageTripleLayout
                updateBlock(block.id, (current) =>
                  current.type === 'image-triple' ? { ...current, layout } : current,
                )
              }}
            >
              <option value="thirds">Equal thirds</option>
              <option value="thirds-portrait">Portrait thirds</option>
            </select>
          </label>
          {block.images.map((image, index) => (
            <LocalizedFields
              key={`${block.id}-cap-${index}`}
              label={`Caption ${index + 1}`}
              value={image.caption}
              rows={2}
              onChange={(caption) =>
                updateBlock(block.id, (current) =>
                  current.type === 'image-triple'
                    ? updateTripleImage(current, index as 0 | 1 | 2, {
                        caption: caption.en || caption.ru ? caption : undefined,
                      })
                    : current,
                )
              }
            />
          ))}
          <button
            type="button"
            className="studio-toggle-row studio-toggle-btn"
            onClick={() =>
              updateBlock(block.id, (current) =>
                current.type === 'image-triple' ? { ...current, showCaption: !current.showCaption } : current,
              )
            }
          >
            <span>Show caption</span>
            <span className={`studio-toggle${block.showCaption ? ' is-on' : ''}`} aria-hidden="true" />
          </button>
        </div>
        <DeleteBlockButton blockId={block.id} />
      </>
    )
  }

  return (
    <>
      <div className="studio-panel-scroll">
        <h2 className="studio-inspector-title">Image row</h2>
        <label className="studio-field">
          <span>Layout preset</span>
          <select
            value={block.layout ?? 'equal'}
            onChange={(event) => {
              const layout = event.target.value as ImageRowLayout
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
        <LocalizedFields
          label="Left caption"
          value={block.images[0].caption}
          rows={2}
          onChange={(caption) =>
            updateBlock(block.id, (current) =>
              current.type === 'image-row'
                ? updateRowImage(current, 0, {
                    caption: caption.en || caption.ru ? caption : undefined,
                  })
                : current,
            )
          }
        />
        <LocalizedFields
          label="Right caption"
          value={block.images[1].caption}
          rows={2}
          onChange={(caption) =>
            updateBlock(block.id, (current) =>
              current.type === 'image-row'
                ? updateRowImage(current, 1, {
                    caption: caption.en || caption.ru ? caption : undefined,
                  })
                : current,
            )
          }
        />
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
      </div>
      <DeleteBlockButton blockId={block.id} />
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
      {selectedBlock ? (
        <BlockInspector block={selectedBlock} updateBlock={updateBlock} />
      ) : (
        <div className="studio-panel-scroll">
          <h2 className="studio-inspector-title">Inspector</h2>
          <p className="studio-inspector-desc">Select a block to edit EN/RU fields and layout.</p>
        </div>
      )}
    </aside>
  )
}
