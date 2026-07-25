import { SiteImage } from '../../components/SiteImage'
import { useMediaLibrary } from '../MediaLibraryContext'
import type { StudioImage } from '../types'

type StudioPhotoProps = {
  image: StudioImage
  eager?: boolean
}

export function StudioPhoto({ image, eager }: StudioPhotoProps) {
  const { resolvePreview } = useMediaLibrary()
  const resolved =
    (image.assetId ? resolvePreview(image.assetId) : undefined) ?? image.src

  if (image.placeholder || resolved.startsWith('placeholder:') || resolved.startsWith('asset:')) {
    return (
      <div className="studio-photo-placeholder" aria-label="Empty photo slot">
        Photo
      </div>
    )
  }

  return (
    <SiteImage
      src={resolved}
      alt={image.alt?.en ?? ''}
      orientation={image.orientation}
      mode="cover"
      eager={eager}
    />
  )
}
