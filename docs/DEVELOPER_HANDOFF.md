# Developer Handoff

This document describes the current implementation of mararx.com as it
actually exists in code, for a developer taking this over. Large parts of
this codebase were built quickly with AI-assisted coding across several
iterative sessions (localization, typography, viewer fixes). It works and is
type-checked, but it has **not** had an independent human frontend review.
Sections most worth a careful second look are flagged explicitly below.

## 1. Implementation summary

Single-page React app, no server, no CMS, no build-time content generation.
Everything — routing, i18n, and all page components — lives in one file,
`src/main.tsx` (~700 lines), plus three content data files under `src/data/`
and a small i18n layer under `src/i18n/`. Styling is one plain CSS file,
`src/styles.css`.

There is no test suite and no lint script configured. The only automated
check is `npm run build` (`tsc -b && vite build`).

## 2. Routing architecture

Implemented from scratch, no router library:

- `LocalizedRoute = { locale: 'en' | 'ru', page: 'journal' | 'stories' | 'story' | 'about', slug?: string }` (`src/i18n/locale.ts`).
- `getRoute(pathname)` parses a pathname into a `LocalizedRoute`, stripping a leading `/ru` segment to determine locale.
- `getPath(route)` is the inverse: builds a pathname from a route, prefixing `/ru` when the locale is Russian.
- `App` in `main.tsx` holds `route` state, seeded from `window.location.pathname` on mount, and listens to `popstate` to stay in sync with browser back/forward.
- `navigate(nextRoute)` calls `window.history.pushState` and updates state directly — no full page reload.
- Every in-app link (`Header`, story cards, pagination, lightbox "view story") calls `navigate()` with `event.preventDefault()`, but also renders a real `href` via `getPath()` so open-in-new-tab, refresh, and direct URL entry all work.

**Review flag:** `getRoute`/`getPath` are simple string parsing with no
central route table; adding a new page type means touching both functions
plus the conditional render block in `App`. Fine at the current scale (4
pages), but would not scale past a handful of routes without refactoring.

## 3. Localization architecture

- `src/i18n/types.ts` — `Locale`, `LocalizedText = { en: string; ru?: string }`, and a flat `TranslationKey` union for every UI string.
- `src/i18n/translations.ts` — `translations: Record<Locale, Record<TranslationKey, string>>` plus `translate(locale, key, values?)`, which reads from the target locale and falls back to `translations.en[key]` if missing, with `{placeholder}` interpolation.
- `src/i18n/locale.ts` — `localize(value: LocalizedText, locale)` resolves content fields (falls back to `.en`); `formatDate` wraps `Intl.DateTimeFormat` (`en-GB` / `ru-RU`); `formatPhotoCount` implements Russian plural rules (1 / 2–4 / 5–20+ with the 11–14 exception) and a simple EN singular/plural.
- Content data (`src/data/*.ts`) stores translatable fields as `LocalizedText` objects with inline literal Russian translations (a `russianText` lookup map keyed by the English string, applied via a small `text()` helper in each data file). Non-text fields (dates as ISO strings, photo counts, image paths, routes, coordinates, layout) are **not** duplicated per locale — they're stored once and formatted/rendered per locale where needed.

**Review flag:** the `russianText: Record<string, string>` lookup-by-English-string pattern in `journal.ts` / `stories.ts` / `story-details.ts` is a pragmatic shortcut, not a scalable translation workflow. It's easy to silently miss a translation (falls back to English, which is by design, but there's no tooling to detect gaps). If this project grows past a handful of stories, moving to explicit per-field `{ en, ru }` literals (as already used for the newer About/UI strings) would be more maintainable and greppable.

## 4. Journal row-layout architecture

`src/data/journal.ts` exports `journalRows: JournalRow[]`, each row having an
explicit `layout` (`'single' | 'half' | 'half-portrait' | 'sixty-forty' | 'forty-sixty' | 'thirds' | 'thirds-portrait' | 'portrait-duo'`) and a fixed-size `photos` array matching that layout. `JournalPage` filters rows by
`selectedYear` and renders each row with a `jrow--{layout}` class; the actual
grid CSS for each layout lives in `src/styles.css`. `journalYears` is derived
once via `[...new Set(...)].sort()`.

**Review flag:** layouts are manually curated per row (the data author picks
`layout: 'thirds'` and supplies exactly 3 photos) — there's no validation
that a row's photo count matches its layout's expectations. A malformed row
(e.g. 2 photos in a `'thirds'` row) would render silently wrong rather than
erroring.

## 5. Story content-block architecture

`src/data/story-details.ts` defines `StoryContentBlock` as a discriminated
union: `text`, `image` (`size: 'full' | 'medium' | 'portrait'`), `image-row`
(paired images with a `layout`), `caption`, `location`. `StoryContent` in
`main.tsx` switches on `block.type` to render each. Only one story currently
has content (`chiaturaCavesContent`), hardcoded and referenced directly in
`StoryPage`.

**Review flag:** `StoryPage` currently resolves its story by matching
`route.slug` against `storyPreviews[].route`, but the actual content lookup
(`chiaturaCavesContent`) is still a single hardcoded import, not a map keyed
by slug. Adding a second story's content requires editing `StoryPage` in
`main.tsx` directly (see README "Adding a Story"). A `Record<string, StoryContentBlock[]>` keyed by slug would remove this bottleneck.

## 6. Fullscreen viewer architecture

`PhotoViewer` in `main.tsx` is a single reusable lightbox used from both
`JournalPage` and `StoryPage`. It supports:

- Keyboard navigation (Escape/ArrowLeft/ArrowRight), focus trap (Tab cycling), and swipe (touch delta threshold).
- Adjacent-photo preloading (`new Image()` for next/prev `src`).
- Body scroll lock via `document.body.style.overflow` while open.
- Localized metadata footer (location, date, story title, caption) and a "view story" link that preserves the active locale via `getRoute`/`getPath`.

**Image proportions (recently fixed):** `SiteImage` now takes a `mode: 'cover' | 'contain'` prop. Thumbnails use `mode="cover"` (fixed frame, cropping allowed, unchanged from before). The viewer explicitly passes `mode="contain"`: no `width`/`height` attributes are set on the `<img>`, the frame's `aspect-ratio` is set dynamically from `naturalWidth/naturalHeight` once the image loads (so the loading skeleton has a sensible ratio without constraining the final image), and the actual `<img>` uses `object-fit: contain` with `max-width`/`max-height: 100%` inside a flex-centered `.lightbox-stage`. Verified against portrait, landscape, and near-square source images at 390/768/1440px — no stretching, full photo always visible.

**Review flag:** there are still no true intrinsic `width`/`height` attributes stored per image in the data files (previously a shared placeholder size was used for every photo, which was the root cause of the stretching bug; it's now removed rather than replaced with real per-image dimensions). This means the browser cannot reserve exact layout space before an image loads, so there is a small potential for layout shift right as an image finishes loading. Capturing real per-image `width`/`height` in `JournalPhoto` / `StoryImage` (e.g. from EXIF or `sharp` at import time) would close this gap.

## 7. Progressive image loading

`SiteImage` wraps every `<img>` in a `.image-frame` with an absolutely
positioned `.image-skeleton` (shimmer placeholder). `status` state
(`loading | loaded | error`) is driven by the image's own `onLoad`/`onError`
(with an initial `complete` check for cached images), and CSS fades the
skeleton out / image in on `loaded`. `priority` sets `fetchPriority="high"`
and eager loading for above-the-fold images; everything else is `loading="lazy"`.

## 8. Metadata and asset handling

- All images are static files under `public/images/`, referenced by absolute path string directly in data files — no build-time image pipeline, resizing, or optimization.
- `ViewerPhoto` (built by `journalPhotoToViewerPhoto` / `storyImageToViewerPhoto`) is the normalized shape consumed by `PhotoViewer`, resolving localized text and formatted dates/locations at the point of conversion, not stored pre-formatted.
- Related-story linking in the Journal viewer works by matching `photo.storyTitle` against `storyPreviews[].title` (localized string match) — see technical debt below.

## 9. Responsive breakpoints

Defined in `src/styles.css` via `@media` queries; the two in active use are
roughly `(min-width: 768px) and (max-width: 960px)` and a narrow/mobile
breakpoint below that (see the media query blocks around `.lightbox`,
`.story-list`, `.featured-photo`). Layouts otherwise rely on `clamp()` and CSS
grid/flex sizing rather than a large breakpoint matrix. Verified manually at
~390px / 768px / 1440px during recent localization and viewer work — no
horizontal overflow observed with Russian copy or the language switcher.

## 10. Known technical debt

- **Title-string matching for related content**: `journalPhotoToViewerPhoto` links a Journal photo to its Story by comparing localized `storyTitle` text, not a stable `id`/slug. Any future copy edit that changes a title in one place but not the other will silently break the "View story" link.
- **Single hardcoded story content module**: see section 5. Only `chiaturaCavesContent` exists; the rest of `storyPreviews` have no `route` and are effectively placeholders.
- **Story pagination is not real**: "Previous story" / "Next story" both link to `/stories` regardless of adjacency.
- **Russian translation coverage is lookup-based, not type-enforced**: a missing `ru` entry silently falls back to English (by design), but nothing flags untranslated strings for review.
- **No per-image intrinsic dimensions**: see section 6.
- **Unused static assets**: `public/images/iceland-*.png` (3 files) and `public/fonts/Proxima-Nova-Semibold.ttf` are not referenced anywhere in the app.

## 11. Areas that need frontend review

- The viewer image-proportion fix (section 6) — implemented and spot-checked across a handful of source images, but should be re-verified against the full photo set, especially any very wide panoramas or unusual aspect ratios not covered in this session's testing.
- The Russian translation copy throughout `src/data/*.ts` and `src/i18n/translations.ts` was written by AI and should be reviewed by a Russian-speaking editor for tone and accuracy before this is treated as production copy.
- Manrope/Cormorant Garamond font choices and Cyrillic rendering were checked via automated snapshot/computed-style inspection, not a human visual pass — worth a final look on real devices.
- CSS in `src/styles.css` is a single ~1000+ line file with no naming convention enforcement beyond BEM-ish class names; a pass to split by page/component would help long-term maintainability but is not urgent.

## 12. Recommended next technical steps

1. Give each Story its own content module keyed by slug (`Record<string, StoryContentBlock[]>`) instead of a single hardcoded import, and add `route` to the remaining `storyPreviews` entries once content exists.
2. Replace `storyTitle`-string matching with a stable `storyId` field on `JournalPhoto` that references `StoryPreview.id`.
3. Capture and store real intrinsic `width`/`height` per image (e.g. via a small script using `sharp`/`image-size` at content-authoring time) to eliminate the remaining layout-shift risk in the viewer.
4. Decide on and implement real "previous/next story" adjacency logic.
5. Remove or intentionally re-use the unused `iceland-*.png` and `Proxima-Nova-Semibold.ttf` assets.
6. If the project grows, consider adding a lint script (`eslint`) and a minimal test setup — neither exists today.
