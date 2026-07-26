import { useStudioDraft } from '../StudioDraftContext'
import type { DraftListItem } from '../draftDocument'

function formatEditedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function kindLabel(item: DraftListItem): string {
  return item.kind === 'journal' ? 'Journal' : 'Story'
}

export function PagesPanel() {
  const {
    draftId,
    draftKind,
    draftList,
    openDraft,
    createStoryDraft,
    createJournalDraft,
    discardDraft,
  } = useStudioDraft()

  return (
    <div className="studio-pages">
      <div className="studio-library-actions">
        <button
          type="button"
          className="studio-btn"
          onClick={() => void createStoryDraft()}
        >
          New Story
        </button>
        <button
          type="button"
          className="studio-btn studio-btn-quiet"
          onClick={() => void createJournalDraft()}
          title="Creates a Journal draft stub — Journal editor is not built yet; opens in the Story canvas."
        >
          New Journal entry
        </button>
      </div>

      <p className="studio-muted">
        Local drafts. Journal entries are stubs until a dedicated Journal editor exists.
      </p>

      {draftKind === 'journal' && (
        <p className="studio-muted studio-library-note">
          Editing a Journal stub in the Story canvas (placeholder).
        </p>
      )}

      <p className="studio-section-label">Pages</p>

      {draftList.length === 0 ? (
        <p className="studio-muted">No drafts yet.</p>
      ) : (
        <ul className="studio-tree">
          {draftList.map((item) => {
            const active = item.id === draftId
            return (
              <li key={item.id}>
                <div className={`studio-tree-item studio-page-item${active ? ' is-active' : ''}${item.status === 'ready' ? ' is-ready' : ''}`}>
                  <button
                    type="button"
                    className="studio-page-open"
                    onClick={() => void openDraft(item.id)}
                  >
                    <span className="studio-page-title">{item.title}</span>
                    <span className="studio-page-meta">
                      {kindLabel(item)}
                      {' · '}
                      <span className={item.status === 'ready' ? 'studio-page-status is-ready' : 'studio-page-status'}>
                        {item.status === 'ready' ? 'Ready' : 'Draft'}
                      </span>
                      {' · '}
                      {formatEditedAt(item.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="studio-asset-hide"
                    onClick={(event) => {
                      event.stopPropagation()
                      void discardDraft(item.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
