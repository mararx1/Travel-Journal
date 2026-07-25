export function Inspector() {
  return (
    <aside className="studio-panel studio-panel-right">
      <div className="studio-tabs">
        <span className="studio-tab is-active">Block</span>
        <span className="studio-tab">Page</span>
      </div>
      <div className="studio-panel-scroll">
        <h2 className="studio-inspector-title">Inspector</h2>
        <p className="studio-inspector-desc">Static placeholder. No state wiring in Phase 1.</p>

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
      </div>
    </aside>
  )
}
