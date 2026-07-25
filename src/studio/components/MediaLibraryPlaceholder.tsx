const mockFolders = [
  { id: 'racha', name: 'Racha — July 2026', count: 36 },
  { id: 'chiatura', name: 'Chiatura caves', count: 18 },
  { id: 'trialeti', name: 'Road to Trialeti', count: 12 },
  { id: 'drone', name: 'Drone selects', count: 8 },
]

export function MediaLibraryPlaceholder() {
  return (
    <aside className="studio-panel studio-panel-left">
      <div className="studio-tabs">
        <span className="studio-tab is-active">Library</span>
        <span className="studio-tab">Pages</span>
      </div>
      <div className="studio-panel-scroll">
        <p className="studio-muted">Trip folders (placeholder — no filesystem access)</p>
        <ul className="studio-tree">
          {mockFolders.map((folder, index) => (
            <li key={folder.id}>
              <div className={`studio-tree-item${index === 0 ? ' is-active' : ''}`}>
                <span>{folder.name}</span>
                <span>{folder.count}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="studio-section-label">Assets</p>
        <div className="studio-asset-grid" aria-hidden="true">
          <div className="studio-asset" style={{ background: '#c4b8a8' }} />
          <div className="studio-asset" style={{ background: '#9aa3ad' }} />
          <div className="studio-asset" style={{ background: '#b7c0b2' }} />
          <div className="studio-asset" style={{ background: '#d7e0e6' }} />
          <div className="studio-asset" style={{ background: '#8f9aa6' }} />
          <div className="studio-asset" style={{ background: '#7f8f78' }} />
        </div>
      </div>
    </aside>
  )
}
