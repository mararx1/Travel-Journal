import { useMemo, useState } from 'react'
import { generateStoryContent } from '../generate/generateStoryContent'
import { writeGeneratedOutput } from '../generate/writeGeneratedOutput'
import { useMediaLibrary } from '../MediaLibraryContext'
import { useStudioDraft } from '../StudioDraftContext'

export function GeneratePanel() {
  const { draft } = useStudioDraft()
  const { assets } = useMediaLibrary()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [resultNote, setResultNote] = useState<string | null>(null)

  const preview = useMemo(() => generateStoryContent(draft, assets), [draft, assets])
  const warningCount = preview.warnings.length

  async function handleGenerate() {
    setBusy(true)
    setResultNote(null)
    setOpen(true)
    try {
      const output = generateStoryContent(draft, assets)
      const result = await writeGeneratedOutput(output)
      if (!result.ok) {
        setResultNote(result.error)
        return
      }
      if (result.mode === 'disk') {
        setResultNote(`Wrote ${result.paths.length} file(s) under docs/studio-output/`)
      } else {
        setResultNote(`Downloaded ${output.slug}.*.generated.* (dev write endpoint unavailable)`)
      }
    } catch (error) {
      setResultNote(error instanceof Error ? error.message : 'Generate failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="studio-generate-panel">
      <button
        type="button"
        className="studio-btn"
        disabled={busy}
        onClick={() => void handleGenerate()}
      >
        {busy ? 'Generating…' : 'Generate'}
      </button>
      <button
        type="button"
        className={`studio-btn studio-btn-quiet${warningCount > 0 ? ' has-warnings' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {warningCount === 0 ? 'Validation' : `Validation (${warningCount})`}
      </button>
      <button type="button" className="studio-btn studio-btn-primary" disabled>
        Publish
      </button>

      {open && (
        <div className="studio-generate-popover" role="region" aria-label="Generation and validation">
          {resultNote && (
            <p className="studio-generate-note" aria-live="polite">
              {resultNote}
            </p>
          )}
          <p className="studio-section-label">Validation</p>
          {warningCount === 0 ? (
            <p className="studio-muted">No warnings — draft can still be generated anytime.</p>
          ) : (
            <ul className="studio-warning-list">
              {preview.warnings.map((warning) => (
                <li key={warning.id}>{warning.message}</li>
              ))}
            </ul>
          )}
          <p className="studio-muted studio-generate-hint">
            Warnings do not block Generate or draft save.
          </p>
        </div>
      )}
    </div>
  )
}
