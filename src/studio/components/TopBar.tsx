type TopBarProps = {
  onExit: () => void
}

export function TopBar({ onExit }: TopBarProps) {
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
        <h1 className="studio-title">Untitled Story</h1>
        <span className="studio-pill">Draft</span>
        <span className="studio-save">Saved locally</span>
      </div>

      <div className="studio-topbar-right">
        <button type="button" className="studio-btn" disabled>
          Preview
        </button>
        <button type="button" className="studio-btn studio-btn-primary" disabled>
          Publish
        </button>
      </div>
    </header>
  )
}
