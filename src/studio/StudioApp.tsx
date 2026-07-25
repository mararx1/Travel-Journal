import { Canvas } from './components/Canvas'
import { Inspector } from './components/Inspector'
import { MediaLibraryPlaceholder } from './components/MediaLibraryPlaceholder'
import { TopBar } from './components/TopBar'
import './studio.css'

type StudioAppProps = {
  onExit: () => void
}

export default function StudioApp({ onExit }: StudioAppProps) {
  return (
    <div className="studio">
      <TopBar onExit={onExit} />
      <div className="studio-body">
        <MediaLibraryPlaceholder />
        <Canvas />
        <Inspector />
      </div>
    </div>
  )
}
