import {
  StrictMode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from 'react'
import { createRoot } from 'react-dom/client'
import { journalRows, journalYears, type JournalPhoto } from './data/journal'
import { storyPreviews, type StoryPreview } from './data/stories'
import { chiaturaCavesContent, type StoryContentBlock, type StoryImage } from './data/story-details'
import { formatDate, formatPhotoCount, getPath, getRoute, localize, type LocalizedRoute } from './i18n/locale'
import { translate } from './i18n/translations'
import type { Locale } from './i18n/types'
import './styles.css'

type Route = LocalizedRoute

function SiteImage({
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

type ViewerPhoto = {
  id: string
  src: string
  alt: string
  orientation?: 'portrait' | 'landscape' | 'wide'
  location?: string
  date?: string
  storyTitle?: string
  caption?: string
  storyHref?: string
}

function journalPhotoToViewerPhoto(photo: JournalPhoto, locale: Locale): ViewerPhoto {
  const relatedStory = storyPreviews.find((story) => story.route && localize(story.title, locale) === localize(photo.storyTitle, locale))
  return {
    id: photo.id,
    src: photo.image,
    alt: localize(photo.alt, locale),
    orientation: photo.orientation,
    location: localize(photo.location, locale),
    date: formatDate(photo.date, locale),
    storyTitle: localize(photo.storyTitle, locale),
    caption: photo.caption ? localize(photo.caption, locale) : undefined,
    storyHref: relatedStory?.route ? getPath({ locale, page: 'story', slug: relatedStory.route.split('/').pop() }) : undefined,
  }
}

function storyImageToViewerPhoto(image: StoryImage, story: StoryPreview, locale: Locale): ViewerPhoto {
  return {
    id: image.src,
    src: image.src,
    alt: image.alt ? localize(image.alt, locale) : localize(story.title, locale),
    orientation: image.orientation,
    location: localize(story.location, locale),
    date: formatDate(story.date, locale),
    storyTitle: localize(story.title, locale),
    caption: image.caption ? localize(image.caption, locale) : undefined,
  }
}

function flattenStoryPhotos(blocks: StoryContentBlock[], story: StoryPreview, locale: Locale): ViewerPhoto[] {
  const photos: ViewerPhoto[] = []

  for (const block of blocks) {
    if (block.type === 'image') {
      photos.push(storyImageToViewerPhoto(block.image, story, locale))
    } else if (block.type === 'image-row') {
      for (const image of block.images) {
        photos.push(storyImageToViewerPhoto(image, story, locale))
      }
    }
  }

  return photos
}

function PhotoViewer({
  photos,
  index,
  onClose,
  onNavigate,
  navigate,
  locale,
}: {
  photos: ViewerPhoto[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
  navigate?: (route: Route) => void
  locale: Locale
}) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const count = photos.length
  const photo = photos[index]

  const goTo = useCallback(
    (nextIndex: number) => {
      if (count === 0) return
      onNavigate(((nextIndex % count) + count) % count)
    },
    [count, onNavigate],
  )

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])
  const goNext = useCallback(() => goTo(index + 1), [goTo, index])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    surfaceRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
        return
      }

      if (event.key === 'Tab' && surfaceRef.current) {
        const focusable = surfaceRef.current.querySelectorAll<HTMLElement>('button, a[href]')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, onClose])

  useEffect(() => {
    if (count <= 1) return

    const nextSrc = photos[(index + 1) % count]?.src
    const prevSrc = photos[(index - 1 + count) % count]?.src

    for (const src of [nextSrc, prevSrc]) {
      if (!src) continue
      const preload = new Image()
      preload.src = src
    }
  }, [count, index, photos])

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    touchStartX.current = touch?.clientX ?? null
    touchStartY.current = touch?.clientY ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return
    const touch = event.changedTouches[0]
    const deltaX = (touch?.clientX ?? touchStartX.current) - touchStartX.current
    const deltaY = (touch?.clientY ?? touchStartY.current ?? 0) - (touchStartY.current ?? 0)
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return

    if (deltaX > 0) {
      goPrev()
    } else {
      goNext()
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!photo) {
    return null
  }

  const storyHref = photo.storyHref

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={photo.storyTitle ?? photo.alt}
      onClick={handleBackdropClick}
      ref={surfaceRef}
      tabIndex={-1}
    >
      <button className="lightbox-close" type="button" onClick={onClose} aria-label={translate(locale, 'closePhotoViewer')}>
        <span aria-hidden="true">×</span>
      </button>

      {count > 1 && (
        <>
          <button
            className="lightbox-zone lightbox-zone--prev"
            type="button"
            onClick={goPrev}
            aria-label={translate(locale, 'previousPhoto')}
          />
          <button
            className="lightbox-zone lightbox-zone--next"
            type="button"
            onClick={goNext}
            aria-label={translate(locale, 'nextPhoto')}
          />
          <button
            className="lightbox-arrow lightbox-arrow--prev"
            type="button"
            onClick={goPrev}
            aria-label={translate(locale, 'previousPhoto')}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            className="lightbox-arrow lightbox-arrow--next"
            type="button"
            onClick={goNext}
            aria-label={translate(locale, 'nextPhoto')}
          >
            <span aria-hidden="true">›</span>
          </button>
        </>
      )}

      <div className="lightbox-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <SiteImage src={photo.src} alt={photo.alt} orientation={photo.orientation} mode="contain" eager />
      </div>

      <div className="lightbox-footer">
        {count > 1 && (
          <span className="lightbox-counter" aria-live="polite">
            {index + 1} / {count}
          </span>
        )}
        <div className="lightbox-metadata">
          {photo.location && <span>{photo.location}</span>}
          {photo.date && <span>{photo.date}</span>}
          {photo.storyTitle && <span>{photo.storyTitle}</span>}
          {photo.caption && <span>{photo.caption}</span>}
          {storyHref && (
            <a
              className="lightbox-story-link"
              href={storyHref}
              onClick={(event) => {
                if (!navigate) return
                event.preventDefault()
                onClose()
                navigate(getRoute(storyHref))
              }}
            >
              {translate(locale, 'viewStory')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ route, navigate }: { route: Route; navigate: (route: Route) => void }) {
  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, route: Route) {
    event.preventDefault()
    navigate(route)
  }

  return (
    <header className="header">
      <a className="logo" href={getPath({ locale: route.locale, page: 'journal' })} aria-label={translate(route.locale, 'home')} onClick={(event) => handleNavigation(event, { locale: route.locale, page: 'journal' })}>
        <img src="/brand/mararx.svg" alt="mararx" />
      </a>
      <nav aria-label={translate(route.locale, 'primaryNavigation')}>
        <a className={route.page === 'journal' ? 'is-active' : undefined} href={getPath({ locale: route.locale, page: 'journal' })} aria-current={route.page === 'journal' ? 'page' : undefined} onClick={(event) => handleNavigation(event, { locale: route.locale, page: 'journal' })}>
          {translate(route.locale, 'journal')}
        </a>
        <a className={route.page === 'stories' || route.page === 'story' ? 'is-active' : undefined} href={getPath({ locale: route.locale, page: 'stories' })} aria-current={route.page === 'stories' || route.page === 'story' ? 'page' : undefined} onClick={(event) => handleNavigation(event, { locale: route.locale, page: 'stories' })}>
          {translate(route.locale, 'stories')}
        </a>
        <a className={route.page === 'about' ? 'is-active' : undefined} href={getPath({ locale: route.locale, page: 'about' })} aria-current={route.page === 'about' ? 'page' : undefined} onClick={(event) => handleNavigation(event, { locale: route.locale, page: 'about' })}>
          {translate(route.locale, 'about')}
        </a>
        <span className="language-switcher" aria-label={translate(route.locale, 'language')}>
          {(['en', 'ru'] as const).map((locale) => (
            <a
              className={route.locale === locale ? 'is-active' : undefined}
              href={getPath({ ...route, locale })}
              aria-current={route.locale === locale ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault()
                window.localStorage.setItem('mararx.locale', locale)
                navigate({ ...route, locale })
              }}
              key={locale}
            >
              {locale.toUpperCase()}
            </a>
          ))}
        </span>
      </nav>
    </header>
  )
}

function JournalPage({ navigate, locale }: { navigate: (route: Route) => void; locale: Locale }) {
  const [selectedYear, setSelectedYear] = useState(journalYears[0])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)
  const years = journalYears
  const visibleRows = journalRows.filter((row) => row.year === selectedYear)
  const viewerPhotos = useMemo(
    () => visibleRows.flatMap((row) => row.photos).map((photo) => journalPhotoToViewerPhoto(photo, locale)),
    [locale, selectedYear],
  )
  const firstPhotoId = visibleRows[0]?.photos[0]?.id

  useEffect(() => {
    setActiveIndex(null)
  }, [selectedYear])

  function openViewerAt(photoId: string, trigger: HTMLButtonElement) {
    const index = viewerPhotos.findIndex((photo) => photo.id === photoId)
    if (index === -1) return
    lastTriggerRef.current = trigger
    setActiveIndex(index)
  }

  function closeViewer() {
    setActiveIndex(null)
    lastTriggerRef.current?.focus()
    lastTriggerRef.current = null
  }

  return (
    <>
      <main>
        <section className="journal" aria-labelledby="journal-heading">
          <h1 id="journal-heading">{translate(locale, 'journal')}</h1>
          <div className="years" aria-label={translate(locale, 'filterJournalByYear')}>
            {years.map((year) => (
              <button
                type="button"
                className={year === selectedYear ? 'is-active' : undefined}
                aria-pressed={year === selectedYear}
                onClick={() => setSelectedYear(year)}
                key={year}
              >
                {year}
              </button>
            ))}
          </div>

          <div className="feed">
            {visibleRows.map((row) => (
              <div className={`jrow jrow--${row.layout}`} key={row.id}>
                {row.photos.map((photo) => (
                  <button
                    className={`featured-photo${row.layout === 'single' ? ' featured-photo--single' : ''}`}
                    type="button"
                    onClick={(event) => openViewerAt(photo.id, event.currentTarget)}
                    aria-label={translate(locale, 'openPhoto', { title: localize(photo.storyTitle, locale) })}
                    key={photo.id}
                  >
                    <SiteImage src={photo.image} alt={localize(photo.alt, locale)} orientation={photo.orientation} priority={photo.id === firstPhotoId} />
                    <span className="photo-label">{localize(photo.storyTitle, locale)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>

      {activeIndex !== null && (
        <PhotoViewer photos={viewerPhotos} index={activeIndex} onClose={closeViewer} onNavigate={setActiveIndex} navigate={navigate} locale={locale} />
      )}
    </>
  )
}

function StoriesPage({ navigate, locale }: { navigate: (route: Route) => void; locale: Locale }) {
  return (
    <main>
      <section className="stories" aria-labelledby="stories-heading">
        <h1 id="stories-heading">{translate(locale, 'stories')}</h1>
        <p className="stories-intro">{translate(locale, 'storiesIntro')}</p>
        <div className="story-list">
          {storyPreviews.map((story) => (
            <article className="story-preview" key={story.id}>
              <a
                className="story-card"
                href={story.route ? getPath({ locale, page: 'story', slug: story.route.split('/').pop() }) : getPath({ locale, page: 'stories' })}
                aria-label={translate(locale, 'readStory', { title: localize(story.title, locale) })}
                onClick={(event) => {
                  if (story.route) {
                    event.preventDefault()
                    navigate({ locale, page: 'story', slug: story.route.split('/').pop() })
                  }
                }}
              >
                <div className="story-image">
                  <SiteImage className="story-cover" src={story.coverImage} alt={localize(story.coverAlt, locale)} />
                </div>
                <div className="story-content">
                  <div className="story-meta">
                    <span>{localize(story.location, locale)}</span>
                    <span>{formatDate(story.date, locale)}</span>
                  </div>
                  <h2>{localize(story.title, locale)}</h2>
                  <p className="story-description">{localize(story.description, locale)}</p>
                  <p className="photo-count">{formatPhotoCount(story.photoCount ?? 0, locale)}</p>
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function StoryContent({
  blocks,
  photos,
  onOpenPhoto,
  locale,
}: {
  blocks: StoryContentBlock[]
  photos: ViewerPhoto[]
  onOpenPhoto: (photoIndex: number, trigger: HTMLButtonElement) => void
  locale: Locale
}) {
  return (
    <div className="story-narrative">
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          return <p className="story-text" key={`${block.type}-${index}`}>{localize(block.content, locale)}</p>
        }

        if (block.type === 'caption') {
          return <p className="story-caption" key={`${block.type}-${index}`}>{localize(block.content, locale)}</p>
        }

        if (block.type === 'location') {
          return (
            <aside className="story-location" key={`${block.type}-${index}`}>
              <p>{localize(block.label, locale)}</p>
              {block.coordinates && <p>{localize(block.coordinates, locale)}</p>}
            </aside>
          )
        }

        if (block.type === 'image-row') {
          return (
            <div className={`story-photo-pair story-photo-pair--${block.layout ?? 'equal'}`} key={`${block.type}-${index}`}>
              {block.images.map((image) => {
                const photoIndex = photos.findIndex((photo) => photo.src === image.src)
                return (
                  <figure key={image.src}>
                    <button
                      className="story-photo-trigger"
                      type="button"
                      onClick={(event) => onOpenPhoto(photoIndex, event.currentTarget)}
                      aria-label={translate(locale, 'openPhoto', { title: image.caption ? localize(image.caption, locale) : image.alt ? localize(image.alt, locale) : translate(locale, 'photo') })}
                    >
                      <SiteImage src={image.src} alt={image.alt ? localize(image.alt, locale) : ''} orientation={image.orientation} />
                    </button>
                    {image.caption && <figcaption className="story-caption">{localize(image.caption, locale)}</figcaption>}
                  </figure>
                )
              })}
            </div>
          )
        }

        const photoIndex = photos.findIndex((photo) => photo.src === block.image.src)
        return (
          <figure className={`story-photo story-photo--${block.size}`} key={block.image.src}>
            <button
              className="story-photo-trigger"
              type="button"
              onClick={(event) => onOpenPhoto(photoIndex, event.currentTarget)}
              aria-label={translate(locale, 'openPhoto', { title: block.image.caption ? localize(block.image.caption, locale) : block.image.alt ? localize(block.image.alt, locale) : translate(locale, 'photo') })}
            >
              <SiteImage src={block.image.src} alt={block.image.alt ? localize(block.image.alt, locale) : ''} orientation={block.image.orientation} />
            </button>
            {block.image.caption && <figcaption className="story-caption">{localize(block.image.caption, locale)}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}

function StoryPage({ navigate, route }: { navigate: (route: Route) => void; route: Route }) {
  const story = storyPreviews.find(({ route: storyRoute }) => storyRoute?.split('/').pop() === route.slug)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null)
  const storyPhotos = useMemo(
    () => (story ? flattenStoryPhotos(chiaturaCavesContent, story, route.locale) : []),
    [route.locale, story],
  )

  if (!story) {
    return null
  }

  function openViewerAt(photoIndex: number, trigger: HTMLButtonElement) {
    if (photoIndex === -1) return
    lastTriggerRef.current = trigger
    setActiveIndex(photoIndex)
  }

  function closeViewer() {
    setActiveIndex(null)
    lastTriggerRef.current?.focus()
    lastTriggerRef.current = null
  }

  return (
    <main>
      <article className="story" aria-labelledby="story-heading">
        <a className="story-back" href={getPath({ locale: route.locale, page: 'stories' })} onClick={(event) => { event.preventDefault(); navigate({ locale: route.locale, page: 'stories' }) }}>
          ← {translate(route.locale, 'allStories')}
        </a>
        <header className="story-header">
          <h1 id="story-heading">{localize(story.title, route.locale)}</h1>
          <div className="story-page-meta">
            <span>{localize(story.location, route.locale)}</span>
            <span>{formatDate(story.date, route.locale)}</span>
            <span>{formatPhotoCount(story.photoCount ?? 0, route.locale)}</span>
          </div>
          <p>{localize(story.intro ?? story.description, route.locale)}</p>
        </header>

        <StoryContent blocks={chiaturaCavesContent} photos={storyPhotos} onOpenPhoto={openViewerAt} locale={route.locale} />

        <nav className="story-pagination" aria-label={translate(route.locale, 'storyNavigation')}>
          <a href={getPath({ locale: route.locale, page: 'stories' })} onClick={(event) => { event.preventDefault(); navigate({ locale: route.locale, page: 'stories' }) }}>{translate(route.locale, 'previousStory')}</a>
          <a href={getPath({ locale: route.locale, page: 'stories' })} onClick={(event) => { event.preventDefault(); navigate({ locale: route.locale, page: 'stories' }) }}>{translate(route.locale, 'nextStory')}</a>
        </nav>
      </article>

      {activeIndex !== null && (
        <PhotoViewer photos={storyPhotos} index={activeIndex} onClose={closeViewer} onNavigate={setActiveIndex} locale={route.locale} />
      )}
    </main>
  )
}

function AboutPage({ locale }: { locale: Locale }) {
  return (
    <main>
      <section className="about" aria-labelledby="about-heading">
        <h1 id="about-heading">{translate(locale, 'about')}</h1>
        <p className="about-intro">{translate(locale, 'aboutIntro')}</p>

        <div className="about-image">
          <SiteImage src="/images/stories/forest-car.JPG" alt={translate(locale, 'aboutImageAlt')} orientation="portrait" />
        </div>

        <div className="about-copy">
          <section aria-labelledby="project-heading">
            <h2 id="project-heading">{translate(locale, 'project')}</h2>
            <p>{translate(locale, 'projectCopy')}</p>
          </section>
          <section aria-labelledby="photography-heading">
            <h2 id="photography-heading">{translate(locale, 'photographyAndTravel')}</h2>
            <p>{translate(locale, 'photographyAndTravelCopy')}</p>
          </section>
        </div>

        <div className="about-contact" aria-label={translate(locale, 'contact')}>
          <a href="https://instagram.com/">{translate(locale, 'instagram')}</a>
          <a href="mailto:hello@mararx.com">{translate(locale, 'email')}</a>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [route, setRoute] = useState<Route>(() => {
    return getRoute(window.location.pathname)
  })

  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    document.documentElement.lang = route.locale
    window.localStorage.setItem('mararx.locale', route.locale)
  }, [route.locale])

  function navigate(nextRoute: Route) {
    const path = getPath(nextRoute)
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path)
      setRoute(nextRoute)
    }
  }

  return (
    <div className="site">
      <Header route={route} navigate={navigate} />
      {route.page === 'journal' && <JournalPage navigate={navigate} locale={route.locale} />}
      {route.page === 'stories' && <StoriesPage navigate={navigate} locale={route.locale} />}
      {route.page === 'story' && <StoryPage navigate={navigate} route={route} />}
      {route.page === 'about' && <AboutPage locale={route.locale} />}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
