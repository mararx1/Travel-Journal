import { useEffect, useRef, useState } from 'react'
import { useStudioDraft } from '../StudioDraftContext'
import type { AddBlockKind } from '../types'

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
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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
      className={`studio-add-control${open ? ' is-open' : ''}`}
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="studio-add-block"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        + Add block
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
