import { Canvas } from './components/Canvas'
import { Inspector } from './components/Inspector'
import { MediaLibrary } from './components/MediaLibrary'
import { TopBar } from './components/TopBar'
import { MediaLibraryProvider } from './MediaLibraryContext'
import { StudioDraftProvider } from './StudioDraftContext'
import './studio.css'

type StudioAppProps = {
  onExit: () => void
}

export default function StudioApp({ onExit }: StudioAppProps) {
  return (
    <StudioDraftProvider>
      <MediaLibraryProvider>
        <div className="studio">
          <TopBar onExit={onExit} />
          <div className="studio-body">
            <MediaLibrary />
            <Canvas />
            <Inspector />
          </div>
        </div>
      </MediaLibraryProvider>
    </StudioDraftProvider>
  )
}
