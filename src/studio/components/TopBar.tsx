import { useStudioDraft } from '../StudioDraftContext'

type TopBarProps = {
  onExit: () => void
}

export function TopBar({ onExit }: TopBarProps) {
  const { draft, previewLocale, previewViewport, setPreviewLocale, setPreviewViewport } = useStudioDraft()

  return (
    <header className="studio-topbar">
      <div className="studio-topbar-left">
        <a
          className="studio-mark"
          href="/"
          title="Back to site"
          onClick={(event) => {
            event.preventDefault()
            onExit()
          }}
        >
          M
        </a>
        <span className="studio-project">MARARX Studio</span>
      </div>

      <div className="studio-topbar-center">
        <h1 className="studio-title">{draft.title}</h1>
        <span className="studio-pill">Draft</span>
        <span className="studio-save">Saved locally</span>
      </div>

      <div className="studio-topbar-right">
        <div className="studio-seg" role="group" aria-label="Canvas language">
          <button
            type="button"
            className={previewLocale === 'en' ? 'is-active' : undefined}
            onClick={() => setPreviewLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={previewLocale === 'ru' ? 'is-active' : undefined}
            onClick={() => setPreviewLocale('ru')}
          >
            RU
          </button>
        </div>
        <div className="studio-seg" role="group" aria-label="Canvas viewport">
          <button
            type="button"
            className={previewViewport === 'desktop' ? 'is-active' : undefined}
            onClick={() => setPreviewViewport('desktop')}
          >
            Desktop
          </button>
          <button
            type="button"
            className={previewViewport === 'mobile' ? 'is-active' : undefined}
            onClick={() => setPreviewViewport('mobile')}
          >
            Mobile
          </button>
        </div>
        <button type="button" className="studio-btn studio-btn-primary" disabled>
          Publish
        </button>
      </div>
    </header>
  )
}
