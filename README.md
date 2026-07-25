# Travel Journal

Denis's personal photo journal and travel diary. A visual, editorial site for
publishing photography, short observations, and longer travel stories — mainly
from trips around Georgia. This is a prototype, not a CMS or SaaS product.

## Stack

- React 19 + TypeScript
- Vite 7 (dev server and build)
- Plain CSS (`src/styles.css`), no CSS framework
- Custom lightweight client-side routing (no router library)
- Custom typed i18n layer for EN/RU (no i18n library)

## Prerequisites

- Node.js 20+ and npm

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts the Vite dev server (default: `http://localhost:5173`).

## Production build

```bash
npm run build
```

Runs `tsc -b` (type-check) then `vite build`, producing static output in `dist/`.

```bash
npm run preview
```

Serves the production build locally for a final check.

## Project structure

```
index.html              Vite entry HTML
src/
  main.tsx              App shell, routing, all page components, viewer
  styles.css            All styles (single file, plain CSS)
  data/
    journal.ts          Journal photo rows + localized fields
    stories.ts          Story preview cards + localized fields
    story-details.ts    Per-story content blocks (text/images/captions)
  i18n/
    types.ts            Locale union, LocalizedText type, translation keys
    translations.ts      EN/RU UI string dictionaries + translate() helper
    locale.ts            Route parsing/building, localize(), date/count formatting
public/
  brand/                 Logo SVG
  images/journal/        Journal photo assets (deployed, referenced by data/journal.ts)
  images/stories/        Story photo assets (deployed, referenced by data/stories.ts and story-details.ts)
references/              Local-only design references and raw photo originals (see below)
```

There is no build-time content pipeline: all Journal/Stories/About content is
authored directly as TypeScript objects in `src/data/`.

## Routes

English (default, no prefix) and Russian (`/ru` prefix) mirror the same pages:

| Page   | English            | Russian               |
|--------|--------------------|------------------------|
| Journal | `/`               | `/ru`                  |
| Stories | `/stories`        | `/ru/stories`           |
| Story   | `/stories/:slug`  | `/ru/stories/:slug`     |
| About   | `/about`          | `/ru/about`             |

Routing is implemented from scratch in `src/main.tsx` using
`window.history.pushState` / `popstate` — see `getRoute` / `getPath` in
`src/i18n/locale.ts` for the URL ↔ route mapping.

## Localization (EN/RU)

- `src/i18n/types.ts` — `Locale` (`'en' | 'ru'`), `LocalizedText` (`{ en, ru? }`), and the `TranslationKey` union for UI strings.
- `src/i18n/translations.ts` — EN/RU dictionaries keyed by `TranslationKey`, and `translate(locale, key, values?)`, which falls back to English if a Russian string is missing.
- `src/i18n/locale.ts` — `localize(value, locale)` resolves a `LocalizedText` (English fallback), plus route helpers and locale-aware `formatDate` / `formatPhotoCount` (Russian pluralization included).

Content fields that need translation (titles, descriptions, captions, alt
text, locations) are typed as `LocalizedText` in `src/data/*.ts`. Fields that
must **not** differ between locales (dates as ISO strings, photo counts,
image paths/dimensions, routes, coordinates, layout) stay as plain strings or
numbers and are formatted per-locale at render time instead of being
duplicated.

The active locale is stored in `localStorage` (key `mararx.locale`) and
`<html lang>` is kept in sync. The site never auto-redirects based on browser
language.

## Journal and Stories data

- **Journal**: `src/data/journal.ts` — `journalRows` is an array of rows, each
  with a `layout` (grid pattern, e.g. `'thirds'`, `'half-portrait'`) and a list
  of `photos`. `journalYears` is derived from the rows for the year filter.
- **Stories list**: `src/data/stories.ts` — `storyPreviews` is an array of
  story cards. Only stories with a `route` are clickable through to a full
  Story page.
- **Story detail content**: `src/data/story-details.ts` — one exported
  content-block array per story (currently `chiaturaCavesContent`), consumed
  by `StoryContent` in `main.tsx`. Blocks are a discriminated union: `text`,
  `image`, `image-row`, `caption`, `location`.

### Adding a Journal photo

1. Add the image file under `public/images/journal/` (or `public/images/stories/` if it belongs to a story too).
2. Add a `JournalPhoto` entry (with `alt`, `date`, `location`, `storyTitle` as `LocalizedText`, plus `orientation`) to an existing or new row in `journalRows` in `src/data/journal.ts`.

### Adding a Story

1. Add a `StoryPreview` entry to `storyPreviews` in `src/data/stories.ts` (cover image, localized title/description/location, and a `route` if it should be clickable).
2. Create a content-block array in `src/data/story-details.ts` (following the `chiaturaCavesContent` pattern) and wire it up in `StoryPage` in `src/main.tsx` for its slug.

## Images

Images are static files under `public/images/`, referenced by absolute path
(e.g. `/images/journal/river-house.JPG`) directly in the data files — there is
no image optimization or resizing pipeline. `SiteImage` in `main.tsx` handles
progressive loading (skeleton → fade-in) and viewer vs. thumbnail display
(`mode="cover" | "contain"`).

**Original high-resolution photographs are stored separately**, outside this
repository's tracked history — see `references/photos/` below, which is
git-ignored. Only the renamed, deployed copies under `public/images/` are
tracked and shipped.

## `references/` folder

- `references/logo/` — small reference logo SVGs (tracked).
- `references/reference*.png` — design/mockup reference screenshots (tracked, not used at runtime).
- `references/photos/` — raw camera originals, byte-identical to the renamed files already deployed under `public/images/`. **Git-ignored** to avoid duplicating ~166MB of already-tracked photo content; kept locally only.

## Known limitations

- Only one Story (`chiatura-caves`) currently has full detail content; other `storyPreviews` entries have no `route` and are not yet clickable.
- Story pagination ("Previous story" / "Next story") always links back to `/stories` — it is not yet wired to actual adjacent stories.
- No CMS, tests, or lint script are configured; `npm run build` (type-check + build) is the only automated check.
- `public/images/iceland-*.png` and `public/fonts/Proxima-Nova-Semibold.ttf` are currently unused by the app and are candidates for removal.
- No routing or i18n library is used by design — this is a small, hand-rolled implementation intended to stay simple.
