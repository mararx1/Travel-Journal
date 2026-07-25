# MARARX Studio — Architecture (Phase 0 audit)

_Last updated: 25 July 2026_

Product context: [`MARARX_STUDIO_CONTEXT.md`](./MARARX_STUDIO_CONTEXT.md)  
UI reference: [`references/studio-builder-shell.png`](./references/studio-builder-shell.png)

Factual audit of the Travel Journal repository as of this date. Not a product roadmap.

---

## 1. Current content sources

### `src/data/journal.ts`

- Source rows: `JournalRowSource` → exported `journalRows: JournalRow[]`, `journalYears`.
- `JournalPhoto`: `id`, `image`, `date`, optional `orientation` (`'portrait' | 'landscape'`), plus localized `alt`, `location`, `storyTitle`, optional `caption`.
- `JournalRowLayout`: `'single' | 'half' | 'half-portrait' | 'sixty-forty' | 'forty-sixty' | 'thirds' | 'thirds-portrait' | 'portrait-duo'`.
- `JournalRow`: `id`, `year`, `layout`, `photos[]`.
- English strings live on source objects; Russian is filled via a `russianText: Record<string, string>` lookup and `text(en)` → `{ en, ru }`.

### `src/data/stories.ts`

- `StoryPreview`: `id`, `coverImage`, `coverAlt`, optional `detailImage` / `detailAlt`, `title`, `location`, `date`, `description`, optional `intro`, optional `photoCount`, optional `route` (literal `'/stories/chiatura-caves'` only today).
- Same `LocalizedText` + `russianText` lookup pattern as journal.

### `src/data/story-details.ts`

- Discriminated union `StoryContentBlock`:
  - `{ type: 'text'; content: LocalizedText }`
  - `{ type: 'image'; size: 'full' | 'medium' | 'portrait'; image: StoryImage }`
  - `{ type: 'image-row'; layout?: 'equal' | 'wide-narrow' | 'narrow-wide' | 'portrait-pair'; images: [StoryImage, StoryImage] }`
  - `{ type: 'caption'; content: LocalizedText }`
  - `{ type: 'location'; label: LocalizedText; coordinates?: LocalizedText }`
- Only export today: `chiaturaCavesContent`.
- Localization: `russianText` map keyed by English string; `text()` / `image()` map source blocks to localized blocks. Missing keys yield `ru: undefined` (runtime falls back via `localize()`).

### `LocalizedText` pattern

Defined in `src/i18n/types.ts` as `{ en: string; ru?: string }`. Resolved with `localize(value, locale)` → `value[locale] ?? value.en`.

---

## 2. Reusable rendering primitives (Studio canvas preview)

All currently live in `src/main.tsx` except CSS in `src/styles.css`.

| Primitive | Notes |
| --- | --- |
| `SiteImage` | Props: `src`, `alt`, `mode?: 'cover' \| 'contain'`, `priority`, `eager`, `onClick`. Progressive skeleton + opacity; contain mode sets `aspectRatio` from `naturalWidth/naturalHeight` after load. Extracted for reuse to `src/components/SiteImage.tsx` in Phase 1. |
| `jrow--*` | Journal grid layouts in `styles.css`: `.jrow`, `.jrow--single`, `--half`, `--half-portrait`, `--sixty-forty`, `--forty-sixty`, `--thirds`, `--thirds-portrait`, `--portrait-duo`. Used by `JournalPage`. |
| `StoryContent` | Renders blocks with `.story-text`, `.story-caption`, `.story-location`, `.story-photo` / `.story-photo--{size}`, `.story-photo-pair` / `--{layout}`, `.story-photo-trigger` + `SiteImage`. |
| `PhotoViewer` | Fullscreen lightbox with keyboard/swipe; uses `SiteImage` `mode="contain"`. Not required for Studio canvas; exists for public site. |

Public site CSS (`styles.css`) is imported by the app entry (`main.tsx`), so Studio can reuse class names when mounted under the same entry.

---

## 3. Routing and localization

| Piece | Location |
| --- | --- |
| `getRoute` / `getPath` | `src/i18n/locale.ts` |
| `Locale`, `LocalizedText`, `TranslationKey` | `src/i18n/types.ts` |
| `translate()` | `src/i18n/translations.ts` |
| App render switch | `src/main.tsx` → `App` |

Public pages: `journal` | `stories` | `story` | `about`. Paths support optional `/ru` prefix.

To add a private Studio page:

1. Extend `Page` with `'studio'`.
2. Special-case literal `/studio` **before** locale segment parsing in `getRoute` (no `/ru/studio`).
3. Special-case `getPath` when `page === 'studio'` → `'/studio'` (not under locale prefix).
4. In `App`, early-return a lazy `StudioApp` (no public `Header`).
5. Do not add Studio links to `Header` nav.

---

## 4. Image metadata

Confirmed gap (also in `docs/DEVELOPER_HANDOFF.md` §6): no per-image intrinsic `width` / `height` stored on `JournalPhoto` or `StoryImage`. Viewer uses runtime `naturalWidth` / `naturalHeight`. Risk: minor layout shift before load.

---

## 5. Build and deployment

| Item | Fact |
| --- | --- |
| Scripts | `package.json`: `build` = `tsc -b && vite build && cp dist/index.html dist/404.html` |
| Deploy | `.github/workflows/deploy.yml` — Node 22, `npm ci`, `npm run build`, GitHub Pages artifact from `dist` on `main` |
| Vite | `vite.config.ts` — `base: '/'`, `@vitejs/plugin-react` only; **no** `build.rollupOptions.output.manualChunks` |
| Code-splitting Studio | Straightforward: `React.lazy(() => import('./studio/StudioApp'))` produces a separate chunk under default Vite/Rollup splitting without further config |

---

## Phase 1 foundation (this pass)

Isolated `/studio` shell under `src/studio/`, mock UI only, canvas demo using `SiteImage` + public story/journal CSS classes and existing files under `public/images/`. No persistence, DnD, filesystem writes, data migrations, or MUI.

---

## Phase 3 — Local draft persistence

### Draft document schema (`src/studio/draftDocument.ts`)

JSON-compatible envelope stored in IndexedDB:

```ts
{
  schemaVersion: 1,
  id: string,            // working key; Phase 3 uses "default"
  updatedAt: string,     // ISO timestamp
  draft: {
    title: string,
    kicker: string,      // date · location line shown in the shell
    intro: string,
    blocks: StudioBlock[]  // ordered; types text | image | image-row |
                           // image-triple | caption | location
  }
}
```

Each block keeps its existing in-memory shape: `type`, layout presets (`size` / `layout`), image refs + captions, and EN/RU `LocalizedText` fields. Selection and preview UI state are **not** persisted.

### Storage

- IndexedDB database `mararx-studio`, object store `drafts`, keyPath `id`.
- Helpers: `src/studio/persist/draftStore.ts` (hand-rolled; no persistence framework).
- Debounced autosave (~450ms) on draft changes; top-bar status: loading / unsaved / saving / saved / unavailable.
- On `/studio` load: restore document `default` when valid; otherwise seed from `mockDraft`. If IndexedDB fails, Studio stays in-memory for the session and the top bar notes that local saving is unavailable.

---

## Phase 4 slice 1 — Local folder import & publication copy

- Library uses File System Access `showDirectoryPicker` when available; unsupported browsers keep the placeholder list + a short note.
- Source folder: shallow list of image files (`jpg/jpeg/png/webp` previewable; other common camera formats listed as unsupported for preview).
- Asset status: `available` | `selected` | `used` | `hidden` (click / shift-click range; hide + “Show hidden”; drag to canvas → `used`).
- On first use, owner picks a publication folder (readwrite). Studio **copies** (does not move) the original into that folder; no resize/compress/EXIF yet.
- Canvas draft gets `StudioImage.assetId` + session blob preview URL; IndexedDB `media` store keeps handles/status (DB v2). No writes to `src/data/*` or Publish.
