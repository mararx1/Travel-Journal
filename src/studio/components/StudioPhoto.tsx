import { SiteImage } from '../../components/SiteImage'
import type { StudioImage } from '../types'

export function StudioPhoto({
  image,
  eager = false,
}: {
  image: StudioImage
  eager?: boolean
}) {
  if (image.placeholder || image.src.startsWith('placeholder:')) {
    return (
      <div className="studio-photo-placeholder" aria-label="Empty photo slot">
        Photo
      </div>
    )
  }

  return (
    <SiteImage
      src={image.src}
      alt={image.alt?.en ?? ''}
      orientation={image.orientation}
      eager={eager}
    />
  )
}
