import { SiteImage } from '../../components/SiteImage'

export function Canvas() {
  return (
    <main className="studio-canvas-wrap">
      <article className="studio-canvas">
        <p className="studio-canvas-kicker">April 2025 · Chiatura, Georgia</p>
        <h1 className="studio-canvas-title">Untitled Story</h1>
        <p className="studio-canvas-intro">
          Canvas preview using public-site image primitives and layout classes. Photos are existing files under{' '}
          <code>public/images/</code>.
        </p>

        <div className="story-narrative">
          <figure className="story-photo story-photo--full">
            <div className="story-photo-trigger">
              <SiteImage
                src="/images/stories/cliff-cave.JPG"
                alt="A limestone cliff and cave below a cloudy sky"
                eager
              />
            </div>
            <figcaption className="story-caption">Lead photograph — public story asset</figcaption>
          </figure>

          <div className="story-photo-pair story-photo-pair--portrait-pair">
            <figure>
              <div className="story-photo-trigger">
                <SiteImage
                  src="/images/stories/rock-face.JPG"
                  alt="A rock face framed by spring leaves"
                  orientation="portrait"
                />
              </div>
            </figure>
            <figure>
              <div className="story-photo-trigger">
                <SiteImage
                  src="/images/stories/forest-mushroom.JPG"
                  alt="A bracket fungus growing on a tree trunk"
                  orientation="portrait"
                />
              </div>
            </figure>
          </div>

          <p className="story-text">
            Sample text block. Layout below reuses Journal row classes (`jrow--thirds`) with existing journal images.
          </p>
        </div>

        <div className="jrow jrow--thirds studio-jrow-demo">
          <div className="featured-photo">
            <SiteImage src="/images/journal/port-hull-marks.JPG" alt="Hull marks" />
          </div>
          <div className="featured-photo">
            <SiteImage src="/images/journal/river-house.JPG" alt="River house" />
          </div>
          <div className="featured-photo">
            <SiteImage src="/images/journal/lead-mountain-road.JPG" alt="Mountain road" />
          </div>
        </div>
      </article>
    </main>
  )
}
