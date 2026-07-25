import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ASSET_DRAG_MIME, useMediaLibrary } from '../MediaLibraryContext'
import { useStudioDraft } from '../StudioDraftContext'
import type { AddBlockKind } from '../types'

function isAssetDrag(dataTransfer: DataTransfer) {
  return [...dataTransfer.types].includes(ASSET_DRAG_MIME)
}

const OPTIONS: { kind: AddBlockKind; label: string }[] = [
  { kind: 'text', label: 'Text' },
  { kind: 'image', label: 'Photo' },
  { kind: 'image-row', label: 'Two photos' },
  { kind: 'image-triple', label: 'Three photos' },
  { kind: 'image-row-asymmetric', label: 'Asymmetric pair' },
  { kind: 'caption', label: 'Caption' },
  { kind: 'location', label: 'Location' },
]

export function AddBlockControl({ insertBeforeIndex }: { insertBeforeIndex: number }) {
  const { addBlock } = useStudioDraft()
  const { applyAssetAsNewBlock } = useMediaLibrary()
  const [open, setOpen] = useState(false)
  const [assetOver, setAssetOver] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  function handleAssetDragOver(event: DragEvent) {
    if (!isAssetDrag(event.dataTransfer)) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    if (!assetOver) setAssetOver(true)
  }

  function handleAssetDragLeave(event: DragEvent) {
    if (!rootRef.current?.contains(event.relatedTarget as Node)) {
      setAssetOver(false)
    }
  }

  function handleAssetDrop(event: DragEvent) {
    if (!isAssetDrag(event.dataTransfer)) return
    event.preventDefault()
    event.stopPropagation()
    setAssetOver(false)
    const assetId = event.dataTransfer.getData(ASSET_DRAG_MIME)
    if (!assetId) return
    void applyAssetAsNewBlock(assetId, insertBeforeIndex)
  }

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      className={`studio-add-control${open ? ' is-open' : ''}${assetOver ? ' is-asset-over' : ''}`}
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
      onDragOver={handleAssetDragOver}
      onDragLeave={handleAssetDragLeave}
      onDrop={handleAssetDrop}
    >
      <button
        type="button"
        className="studio-add-block"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {assetOver ? 'Drop to add photo' : '+ Add block'}
      </button>
      {open && (
        <ul className="studio-add-menu" role="menu">
          {OPTIONS.map((option) => (
            <li key={option.kind} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  addBlock(option.kind, insertBeforeIndex)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
