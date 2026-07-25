import { useEffect, useState } from 'react'
import { SiteImage } from '../../components/SiteImage'
import { useMediaLibrary } from '../MediaLibraryContext'
import type { StudioImage } from '../types'

type StudioPhotoProps = {
  image: StudioImage
  eager?: boolean
}

function BrokenAsset({ name }: { name: string }) {
  return (
    <div className="studio-photo-missing" role="img" aria-label={`Missing file: ${name}`}>
      <span className="studio-missing-glyph" aria-hidden="true">
        !
      </span>
      <span className="studio-missing-name">{name}</span>
    </div>
  )
}

export function StudioPhoto({ image, eager }: StudioPhotoProps) {
  const { resolvePreview, getAsset, markAssetMissing } = useMediaLibrary()
  const [failed, setFailed] = useState(false)
  const asset = image.assetId ? getAsset(image.assetId) : undefined
  const resolved =
    (image.assetId ? resolvePreview(image.assetId) : undefined) ?? image.src

  useEffect(() => {
    setFailed(false)
  }, [resolved, image.assetId])

  const missing = asset?.status === 'missing' || failed

  if (missing) {
    return <BrokenAsset name={asset?.name ?? image.alt?.en ?? 'Missing file'} />
  }

  if (image.placeholder || resolved.startsWith('placeholder:') || resolved.startsWith('asset:')) {
    return (
      <div className="studio-photo-placeholder" aria-label="Empty photo slot">
        Photo
      </div>
    )
  }

  if (image.assetId) {
    return (
      <span className="image-frame image-frame--cover">
        <img
          className="progressive-image"
          src={resolved}
          alt={image.alt?.en ?? ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => {
            setFailed(true)
            if (image.assetId) markAssetMissing(image.assetId)
          }}
        />
      </span>
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
