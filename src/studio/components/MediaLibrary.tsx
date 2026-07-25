import type { DragEvent } from 'react'
import { ASSET_DRAG_MIME, useMediaLibrary } from '../MediaLibraryContext'
import type { MediaAsset } from '../media/types'

const mockFolders = [
  { id: 'racha', name: 'Racha — July 2026', count: 36 },
  { id: 'chiatura', name: 'Chiatura caves', count: 18 },
  { id: 'trialeti', name: 'Road to Trialeti', count: 12 },
  { id: 'drone', name: 'Drone selects', count: 8 },
]

function statusLabel(asset: MediaAsset): string | null {
  if (asset.status === 'missing') return 'Missing'
  if (asset.status === 'used') return 'Used'
  if (asset.status === 'selected') return 'Selected'
  if (asset.status === 'hidden') return 'Hidden'
  return null
}

export function MediaLibrary() {
  const {
    fsSupported,
    sourceFolderName,
    publicationFolderName,
    assets,
    showHidden,
    busy,
    note,
    setShowHidden,
    openSourceFolder,
    choosePublicationFolder,
    selectAsset,
    hideAsset,
    unhideAsset,
    markAssetMissing,
    relinkAsset,
  } = useMediaLibrary()

  const visibleAssets = assets.filter((asset) => showHidden || asset.status !== 'hidden')
  const orderedIds = visibleAssets.map((asset) => asset.id)
  const hiddenCount = assets.filter((asset) => asset.status === 'hidden').length

  function onAssetDragStart(event: DragEvent<HTMLButtonElement>, asset: MediaAsset) {
    if (!asset.previewable || asset.status === 'missing') {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(ASSET_DRAG_MIME, asset.id)
    event.dataTransfer.setData('text/plain', asset.id)
  }

  return (
    <aside className="studio-panel studio-panel-left">
      <div className="studio-tabs">
        <span className="studio-tab is-active">Library</span>
        <span className="studio-tab">Pages</span>
      </div>
      <div className="studio-panel-scroll">
        {!fsSupported && (
          <>
            <p className="studio-muted">
              Local folder import isn’t available in this browser. Use Chrome or Edge on desktop.
            </p>
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
          </>
        )}

        {fsSupported && (
          <>
            <div className="studio-library-actions">
              <button
                type="button"
                className="studio-btn studio-btn-quiet"
                disabled={busy}
                onClick={() => void openSourceFolder()}
              >
                Open folder
              </button>
              <button
                type="button"
                className="studio-btn studio-btn-quiet"
                disabled={busy}
                onClick={() => void choosePublicationFolder()}
              >
                {publicationFolderName ? `Pub: ${publicationFolderName}` : 'Set publication folder'}
              </button>
            </div>

            {sourceFolderName ? (
              <p className="studio-muted">
                Source: {sourceFolderName}
                {assets.length > 0 ? ` · ${assets.length} files` : ''}
              </p>
            ) : (
              <p className="studio-muted">Open a local trip folder to list photographs.</p>
            )}

            {note && <p className="studio-muted studio-library-note">{note}</p>}

            <div className="studio-library-toolbar">
              <p className="studio-section-label">Assets</p>
              {hiddenCount > 0 && (
                <label className="studio-show-hidden">
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(event) => setShowHidden(event.target.checked)}
                  />
                  Show hidden
                </label>
              )}
            </div>

            {visibleAssets.length === 0 ? (
              <p className="studio-muted">No assets to show.</p>
            ) : (
              <div className="studio-asset-grid">
                {visibleAssets.map((asset) => {
                  const label = statusLabel(asset)
                  const missing = asset.status === 'missing'
                  return (
                    <div
                      key={asset.id}
                      className={[
                        'studio-asset-card',
                        asset.status === 'selected' ? 'is-selected' : '',
                        asset.status === 'used' ? 'is-used' : '',
                        asset.status === 'hidden' ? 'is-hidden' : '',
                        missing ? 'is-missing' : '',
                        !asset.previewable ? 'is-unsupported' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="studio-asset"
                        draggable={asset.previewable && !missing}
                        title={
                          asset.width && asset.height
                            ? `${asset.name} · ${asset.width}×${asset.height}`
                            : asset.name
                        }
                        onClick={(event) => {
                          selectAsset(asset.id, {
                            shiftKey: event.shiftKey,
                            orderedIds,
                          })
                        }}
                        onDragStart={(event) => onAssetDragStart(event, asset)}
                      >
                        {missing ? (
                          <span className="studio-asset-missing">
                            <span className="studio-missing-glyph" aria-hidden="true">
                              !
                            </span>
                            <span className="studio-missing-name">{asset.name}</span>
                          </span>
                        ) : asset.previewable && asset.previewUrl ? (
                          <img
                            src={asset.previewUrl}
                            alt=""
                            draggable={false}
                            onError={() => markAssetMissing(asset.id)}
                          />
                        ) : (
                          <span className="studio-asset-fallback">{asset.name}</span>
                        )}
                        {label && <span className="studio-asset-badge">{label}</span>}
                        {!asset.previewable && !missing && (
                          <span className="studio-asset-badge">Unsupported preview</span>
                        )}
                      </button>
                      {missing ? (
                        <button
                          type="button"
                          className="studio-asset-hide"
                          disabled={busy}
                          onClick={() => void relinkAsset(asset.id)}
                        >
                          Re-link
                        </button>
                      ) : asset.status === 'hidden' ? (
                        <button
                          type="button"
                          className="studio-asset-hide"
                          onClick={() => unhideAsset(asset.id)}
                        >
                          Unhide
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="studio-asset-hide"
                          onClick={() => hideAsset(asset.id)}
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
