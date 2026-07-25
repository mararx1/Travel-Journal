import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'

export function SiteImage({
  src,
  alt,
  className,
  mode = 'cover',
  priority = false,
  eager = false,
  onClick,
}: {
  src: string
  alt: string
  className?: string
  orientation?: 'portrait' | 'landscape' | 'wide'
  mode?: 'cover' | 'contain'
  priority?: boolean
  eager?: boolean
  onClick?: (event: MouseEvent<HTMLImageElement>) => void
}) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [ratio, setRatio] = useState<number | null>(null)

  useLayoutEffect(() => {
    setStatus('loading')
    setRatio(null)
    const image = imageRef.current

    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? 'loaded' : 'error')
      if (image.naturalWidth > 0) setRatio(image.naturalWidth / image.naturalHeight)
    }
  }, [src])

  return (
    <span
      className={`image-frame image-frame--${mode} image-frame--${status}`}
      style={mode === 'contain' && ratio ? { aspectRatio: ratio } : undefined}
    >
      <span className="image-skeleton" aria-hidden="true" />
      <img
        ref={imageRef}
        className={`${className ?? ''} progressive-image`}
        src={src}
        alt={alt}
        loading={priority || eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        style={mode === 'contain' && ratio ? { aspectRatio: ratio } : undefined}
        onLoad={(event) => {
          setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)
          setStatus('loaded')
        }}
        onError={() => setStatus('error')}
        onClick={onClick}
      />
    </span>
  )
}
