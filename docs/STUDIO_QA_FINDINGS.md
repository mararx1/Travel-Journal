# MARARX Studio QA findings

_Date: 25 July 2026_  
_Method: `npm run build`; `npm run dev` at `http://127.0.0.1:5173/studio`; browser exercise of shell/selection/add-delete/preview/generate; code inspection where File System Access or unfinished Apply flow blocked end-to-end._

---

## Checklist results

### Shell and selection

| Item | Result |
| --- | --- |
| `/studio` loads; `npm run build` still passes for the public site | **PASS** — Studio shell loaded; production build completed successfully. |
| Clicking a block selects it and the Inspector reflects its real data | **PASS** — Text block click opened Inspector titled “Text” with the block’s content. |
| Clicking empty canvas / Escape deselects; Inspector returns to placeholder | **PASS** — Escape restored Inspector placeholder (“Inspector” / select-a-block copy). |
| Editing a caption/text field in the Inspector updates the Canvas immediately | **PASS** — Appending “ QA” in the Inspector EN field appeared on the canvas `.story-text` immediately. |
| EN and RU fields are independent; empty RU falls back to EN in RU preview | **PASS** — Empty RU showed EN (“English only line”) in RU preview; setting RU to “Русская строка” showed Russian independently. |

### Drag-and-drop

| Item | Result |
| --- | --- |
| Whole blocks reorder vertically with a clear insertion indicator | **COULD NOT VERIFY** — Block drag handles render (`.studio-drag-handle`); reliable HTML5 drag gestures were not completed in this automation pass. |
| Images within a multi-image row reorder horizontally | **COULD NOT VERIFY** — Image handles render (`.studio-image-drag-handle`, 2 observed on a two-photo row); horizontal drag not completed end-to-end here. |
| Row layout proportions preserved after an image swap | **COULD NOT VERIFY** — Depends on a successful horizontal reorder test above. |
| A selected block stays selected after being dragged | **COULD NOT VERIFY** — Depends on a successful block drag test above. |
| Block-level and image-level drag handles don’t conflict with click-to-select | **COULD NOT VERIFY** — Handles are separate controls in `Canvas.tsx`; click-to-select on the block body worked, but handle-vs-click conflict during an actual drag was not exercised. |

### Add/delete and layout presets

| Item | Result |
| --- | --- |
| Each MVP block type can be added | **PASS** — Add menu lists Text, Photo, Two photos, Three photos, Asymmetric pair, Caption, Location. |
| Delete requires an explicit action, not a stray click or bare keypress | **PASS** — Delete is an Inspector “Delete block” button; no delete-on-keypress path observed. |
| After delete, Inspector returns to placeholder (no auto-select neighbor) | **PASS** — After delete, Inspector title returned to placeholder “Inspector”. |
| Switching layout preset preserves existing images/captions | **COULD NOT VERIFY** — Preset `<select>` only updates `layout`/`size` in `Inspector.tsx`; not re-tested with filled captions after a preset change in this pass. |
| Invalid presets (e.g. three-photo layout on a two-image block) are not offered | **PASS** — Two-photo row options: `equal`, `wide-narrow`, `narrow-wide`, `portrait-pair`. Single photo: `full`, `medium`, `portrait`. No thirds options on two-image blocks. |

### Desktop/mobile preview and persistence

| Item | Result |
| --- | --- |
| Desktop/mobile toggle reflows Canvas using public-site breakpoints | **PASS** — Mobile toggle applied `.studio-canvas-wrap--mobile` (390px canvas; CSS comments/rules mirror public `max-width: 767px` story behavior in `studio.css`). |
| Edits then reload restore full draft (order, text, presets) | **PASS** — After edits/saves, reload restored a non-empty IndexedDB draft with blocks (including a two-photo row). Save path showed “Saving…” → “Saved locally”. |
| Save-status indicator reflects saved/unsaved state | **PASS** — Indicator moved to “Saving…” after an edit; settled on “Saved locally”. |

### Media import

| Item | Result |
| --- | --- |
| Folder picker opens and lists jpg/jpeg/png/webp; RAW listed without preview | **COULD NOT VERIFY** — `showDirectoryPicker` is available in this Chromium session and “Open folder” is shown, but no real directory was granted to automation (user gesture / OS picker). |
| Dragging a Library asset into a Canvas block replaces placeholder | **COULD NOT VERIFY** — Requires a loaded Library after folder pick. |
| Copy written to publication-assets; source untouched | **COULD NOT VERIFY** — Requires publication-folder pick + use flow; implementation writes derivatives via `writeBlobToDirectory` (read source only). |
| Generated derivatives are smaller than originals | **COULD NOT VERIFY** — No end-to-end import; client resize caps long edge at 1800 (`deriveImage.ts`) but file-size comparison not run. |
| Real intrinsic width/height captured for imported images | **COULD NOT VERIFY** — Capture exists on import/use paths and Inspector can show `W × H`; not measured on a freshly imported file here. |
| Missing source surfaces “missing” + re-link preserving block position | **COULD NOT VERIFY** — UI/code for `missing` + “Re-link” exists (`MediaLibrary.tsx`, `MediaLibraryContext.tsx`); rename/delete of a real source file not simulated. |

### Generation and site integration

| Item | Result |
| --- | --- |
| “Generate” output matches StoryContentBlock / StoryPreview shapes without touching `src/data/*.ts` | **PASS** — Existing `docs/studio-output/untitled-story.*.generated.*` match the public shapes; `src/data/applied-stories.json` remains `{ "stories": {} }`; hand-authored `chiaturaCavesContent` intact. |
| Validation panel flags missing cover/title/translation/missing image without blocking draft save | **PASS** — Validation listed missing title and missing RU translations; draft save continued (“Saving…” / “Saved locally”). Missing-image path exists in `validateDraft.ts` (placeholders / `missing` assets). |
| “Apply to site” (after confirmation) writes live data + images; does not disturb chiatura | **FAIL** — See below. |
| Re-running “Apply to site” on the same draft does not create duplicates | **COULD NOT VERIFY** — Apply action is not available to run. |
| `npm run build` passes after the write | **COULD NOT VERIFY** — No Apply write occurred; baseline `npm run build` already passes. |
| Resulting Story renders at `/stories/:slug` and `/ru/stories/:slug` | **COULD NOT VERIFY** — No Studio-applied story exists in live data; existing `chiatura-caves` still renders correctly in EN and RU (slug wiring via `storyContentBySlug` works for that story). |

---

## FAIL details

### 1. “Apply to site” writes into live site data / images

- **Expected:** An explicit “Apply to site” (or equivalent) action, with confirmation, upserts the generated Story into live data, copies derivatives into `public/images/stories/`, leaves `chiaturaCavesContent` alone, and can advance a clear ready/local state after a successful build.
- **Actual:** Top bar shows **Generate**, **Validation**, and a disabled **Publish** only. There is **no “Apply to site” control**. `vite.config.ts` exposes only `POST /__studio/write-output` (inspect-only `docs/studio-output/`). `src/data/applied-stories.json` is empty. `blockingWarnings.ts` exists but is unused by the UI. No apply/build orchestration endpoint or client caller is wired.
- **Likely files:** `src/studio/components/GeneratePanel.tsx`, `src/studio/components/TopBar.tsx`, `vite.config.ts`, `src/data/applied-stories.ts`, `src/data/applied-stories.json`, `src/studio/generate/blockingWarnings.ts` (stub only), incomplete leftovers from the Phase 5 “finish” slice (registry merge in `stories.ts` / `story-details.ts` / `main.tsx` is present, but the write path that fills `applied-stories.json` is not).

---

## Known limitations observed but expected per current phase scope

- **No Git commit/push automation** — Publish remains disabled; deployment stays a manual owner step.
- **Generate ≠ live site** — Generate writing only to `docs/studio-output/` (or download fallback) is intentional for the earlier Phase 5 slice; live integration was supposed to be a separate Apply action (currently missing — reported as FAIL above, not as an expected limitation).
- **File System Access requires Chromium + user gesture** — folder/publication picks cannot be fully automated here; Safari/Firefox would show the unsupported placeholder by design.
- **Story title is EN-only on the draft shell** — Validation therefore always warns about missing Russian for the story title until story-level RU fields exist; that warning is expected with the current draft model.
- **`image-triple` is not a public Story block type** — Generator expands it to single images and warns; expected until a public triple layout exists.
- **Single working-draft IndexedDB document** — No multi-draft manager UI (by design for Phase 3).

---

## Round 2 — Edge Cases and Stress Testing

_Date: 25 July 2026_  
_Method: browser/CDP exercise on `/studio` plus code inspection where OS pickers, large binaries, or unfinished Apply flow blocked end-to-end._

### Empty / degenerate states

| Item | Result |
| --- | --- |
| Brand-new Story with zero blocks — Canvas/Inspector/Generate | **PASS** — Deleted down to 0 blocks; Studio stayed mounted; Inspector placeholder shown; Generate ran and wrote `docs/studio-output/` with warnings (“Missing title”, “Missing cover image”), no crash. |
| Only text blocks, no images | **PASS** — 3 text/caption blocks; Generate succeeded; validation flagged missing cover (and empty texts); no crash. |
| Image block still placeholder — Generate behavior | **PASS** — Added Photo with `.studio-photo-placeholder`; Generate warned “Unused or empty image slot in the story” / missing cover; did not crash; output omit empty slots (generator skips null images). |
| Delete every block down to zero | **PASS** — Sequential Delete block → 0 blocks; Inspector placeholder; Studio alive. |

### Undo/redo

| Item | Result |
| --- | --- |
| Top-bar undo/redo arrows wired? | **PASS** — **Not present in the current shell** (top bar buttons: EN/RU, Desktop/Mobile, Generate, Validation, Publish). No undo/redo handlers under `src/studio/`. Reference-shell arrows are not implemented; add/delete/reorder/edit cannot be undone. |

### Concurrent / rapid interaction

| Item | Result |
| --- | --- |
| Rapid-fire add multiple blocks — duplicate IDs / corruption | **PASS** — 12 Text blocks added in ~2s; 12 unique `data-block-id` values (`text-<time>-<seq>`); no duplicates observed. |
| Drag block while Inspector mid-edit | **PASS** — Value `PRESERVE-DRAG` survived synthetic dragstart/dragend on the block handle; block remained selected. |
| Switch selection immediately after typing | **PASS** — `PRESERVE-1` still present after immediate click onto another block (input event commits into React state). |
| Double-trigger “Apply to site” | **COULD NOT VERIFY** — No Apply button in UI (same gap as Round 1). |

### Persistence edge cases

| Item | Result |
| --- | --- |
| Large draft (15+ blocks, EN/RU captions) save/restore | **PASS** — 16 blocks with EN/RU filled; “Saved locally”; reload restored **16** blocks and sample EN text (`Block EN 0 …`). |
| IndexedDB quota exceeded / unavailable | **COULD NOT VERIFY** — Could not force quota failure in this environment (estimate ~quota large, usage ~16KB). Code path on load failure sets `saveStatus` to `unavailable` (`StudioDraftContext.tsx`); not re-proven under real private-storage restrictions. |
| Close tab mid-edit, reopen `/studio` | **PASS** — Full reload after save restored the 16-block draft (IndexedDB). **Not** proven for closing during the ~450ms unsaved debounce window before flush. |

### Media import edge cases

| Item | Result |
| --- | --- |
| Very large source (>20MB / huge resolution) | **COULD NOT VERIFY** — No large sample image available to the automated session; folder picker not driven. |
| Unusual aspect ratio (panorama / tall portrait) | **COULD NOT VERIFY** — No import session with extreme-aspect files. |
| Non-image in folder (.mov, .txt) | **PASS** (code) — `listImageFiles` only accepts `LIST_EXT` (images + some RAW/tiff/gif/bmp); `.mov` / `.txt` are filtered out and never enter the Library list. |
| Same source used in two blocks | **PASS** (code + model) — Same Library asset can be placed in multiple slots; `prepareUsedAsset` reuses existing `publishedName` (one derivative, shared path). `uniqueFileName` would suffix `-1` if a second write of the same preferred name were attempted. |

### Localization edge cases

| Item | Result |
| --- | --- |
| Very long RU caption/title | **PASS** — ~720-char Russian on canvas; `white-space: normal`, no horizontal overflow (`scrollWidth === clientWidth`); Studio stayed stable. Inspector textareas scroll vertically as needed. |
| Switch Canvas locale mid-edit | **PASS** — After committing EN via input, EN→RU→EN kept `LOCALE-KEEP` in the EN field. |

### Site-integration edge cases

| Item | Result |
| --- | --- |
| Title/slug collides with `chiatura-caves` or an applied Story | **FAIL** — **Severity: blocks publishing / overwrite risk.** `slugifyTitle('Chiatura caves')` → `chiatura-caves`. Generate would emit that slug. When Apply is finished, `stories.ts` merge drops authored previews whose `id` is in `appliedIds`, so an applied story with that id would **replace** the hand-authored Chiatura card. No collision guard/error UI today. Apply write itself still missing (cannot observe live overwrite). |
| Special / non-Latin title → URL-safe slug | **FAIL** — **Severity: blocks publishing / data integrity.** Cyrillic title `Пещеры Риони` slugifies to **`untitled-story`** (non-Latin letters stripped). Multiple non-Latin titles would collide on the same slug. Latin/`Hello / World!!! 2025` → `hello-world-2025` (URL-safe). |
| Apply then refresh before build-validation finishes | **COULD NOT VERIFY** — Apply + build-validation flow not implemented/wired. |

### Round 2 FAIL details

1. **Slug collision with existing Chiatura story** (`src/studio/generate/slugify.ts`, `src/data/stories.ts` applied-id merge, missing Apply UI) — generating/applying a title that slugifies to `chiatura-caves` has no warning and would be designed to win over the hand-authored entry once Apply writes `applied-stories.json`.
2. **Non-Latin titles collapse to `untitled-story`** (`src/studio/generate/slugify.ts`) — lossy slug; collision across distinct RU/other-script titles.

### Round 2 notes (not scored as product bugs)

- Undo/redo in the design reference is simply **not in the current Studio top bar** — absence is an incomplete feature, not a broken control.
- Same-asset multi-use sharing one derivative is consistent with the current asset state machine (status `used` + single `publishedName`).
