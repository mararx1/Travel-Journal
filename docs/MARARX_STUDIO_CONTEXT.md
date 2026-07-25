# MARARX Studio — Travel Journal Builder Context

_Last updated: 25 July 2026_

## 0. How to use this document

This file is the product and implementation context for Cursor.

Before making changes:

1. Read this document.
2. Inspect the current repository and existing project rules.
3. Treat the current public website as the source of truth for visual style and routing.
4. Do not try to implement the entire builder in one pass.
5. Work in small, reviewable phases and preserve the existing public site.

The builder is a private authoring tool for the owner of mararx.com. It is not a public CMS, a multi-user SaaS product, or a generic page builder.

---

# 1. Product context

## 1.1 Existing public website

mararx.com is a personal bilingual EN/RU travel and photography journal.

Current public sections:

- **Journal** — chronological photography feed and recent field notes;
- **Stories** — complete trip stories;
- **About** — project description;
- **Fullscreen viewer** — full-image viewing with metadata and navigation.

Current public routes include:

- `/`
- `/stories`
- `/stories/:slug`
- `/about`
- `/ru`
- `/ru/stories`
- `/ru/stories/:slug`
- `/ru/about`

The existing site is built with Vite, React, and TypeScript.

The visual direction is:

- editorial;
- restrained;
- photography-first;
- warm off-white background;
- black typography;
- minimal interface chrome;
- no SaaS-style cards, gradients, or decorative dashboards on the public site;
- no colour-changing filters or brightness effects on photographs;
- thumbnails may crop;
- fullscreen images must preserve the original aspect ratio.

The builder must not redesign or destabilise the public website.

---

## 1.2 Why the builder is needed

The public site already has the right basic structure, but adding real content manually in code will not scale.

The owner needs a fast workflow for:

- importing photographs from a trip;
- selecting only the useful photographs;
- arranging them into an editorial story;
- adding short text, captions, a route/map, and optional video;
- previewing EN and RU versions;
- publishing without editing React arrays or JSON manually.

The workflow must be simpler than:

- designing a new page in Figma;
- editing source code;
- manually resizing and copying every image;
- maintaining several disconnected archives.

The builder should feel closer to a lightweight, private Squarespace/Notion-style editor, but with far fewer options and a much stronger photography-specific structure.

---

# 2. Core product idea

## 2.1 Product name

Working name:

**MARARX Studio**

Possible internal route:

`/studio`

The Studio route is private authoring infrastructure and should not appear in the public navigation.

---

## 2.2 Main principle

The builder is a **constrained block-based editorial composer**.

It is not:

- a Figma-like free canvas;
- a generic no-code website builder;
- a full rich-text CMS;
- a drag-anything-anywhere design tool.

The centre of the editor may look like a white page canvas, but content is arranged through responsive editorial blocks.

The owner should be able to:

1. import a trip;
2. drag selected photographs from the media library;
3. choose a layout for each photo group;
4. reorder blocks;
5. add text only where it improves the story;
6. preview the final responsive page;
7. publish.

The system must prevent accidental broken layouts.

---

# 3. Content model

The public site has two connected content levels.

## 3.1 Journal entry

A Journal entry is a short chronological field note.

Typical use:

- a recent discovery;
- several photographs from one day;
- a mushroom, bird, road, place, or landscape observation;
- a short update before the full Story is ready.

Typical content:

- date;
- location;
- 50–250 words;
- 3–10 selected images;
- optional link to a related Story.

Goal:

**Publish quickly.**

---

## 3.2 Story

A Story is a complete trip or photo narrative.

Example:

**Racha — July 2026**

Typical content:

- cover image;
- title;
- date range;
- region/location;
- introduction;
- route or map;
- selected photo sequence;
- captions and field notes;
- optional embedded video;
- related Journal entries.

Goal:

**Tell the complete story without turning the page into an endless unedited gallery.**

---

## 3.3 Relationship between Journal and Stories

A Journal entry may:

- exist independently;
- link to an existing Story;
- later become related to a newly created Story.

A Story may contain links to several Journal entries from the same trip.

The builder must preserve this connection without forcing the owner to create a complete Story immediately.

---

# 4. Primary user workflow

## 4.1 Start a new trip

From the Studio dashboard:

1. Click **New Story**.
2. Enter:
   - working title;
   - trip date or date range;
   - region/location;
   - optional slug;
   - default language content.
3. Create the Story as a draft.
4. Open the Media Import step.

The system may generate the slug from the English title, but the slug remains editable before first publication.

---

## 4.2 Import media

The source photographs may come from:

- a local SSD;
- a mounted cloud folder;
- Google Drive or iCloud Drive synced to the computer;
- an exported Lightroom folder;
- camera, drone, phone, or other device folders.

The builder must keep two concepts separate:

### Source archive

The owner’s original archive.

May contain:

- RAW;
- full-resolution JPEG;
- video;
- drone files;
- audio;
- unused frames.

The builder must never treat the website as the only archive.

### Publication assets

Curated web-ready copies used by the website.

The builder should:

- copy selected files rather than move originals;
- generate web derivatives;
- preserve the original aspect ratio;
- avoid putting RAW files into the website;
- avoid publishing hundreds of unedited frames;
- keep source and publication storage conceptually separate.

---

## 4.3 Select photographs

After import, show a media library for the current trip.

The owner can:

- view a thumbnail grid;
- filter by device or source folder when metadata is available;
- mark favourites;
- hide rejected assets;
- search by filename;
- sort by capture date;
- select multiple photographs;
- drag photographs to the Story canvas.

The first MVP does not require a Lightroom replacement.

Do not build:

- advanced colour grading;
- star-rating workflows with many states;
- non-destructive photo editing;
- duplicate RAW development.

A simple state is sufficient:

- available;
- selected;
- used;
- hidden.

---

## 4.4 Compose the Story

The editor shell:

### Left panel — Media library

Contains:

- trip media;
- filters;
- upload/import action;
- thumbnail grid;
- asset usage state;
- drag source.

### Centre — Story canvas

Contains the responsive sequence of Story blocks.

The canvas should:

- resemble the final public page;
- use the public website typography and spacing;
- show desktop width by default;
- support desktop/tablet/mobile preview modes;
- allow drag-and-drop reordering;
- show insertion points between blocks;
- keep layout rules constrained.

### Right panel — Inspector

Shows settings for the selected block or asset.

Examples:

- layout preset;
- image crop mode for thumbnail contexts;
- focal point;
- caption;
- alt text;
- EN/RU text;
- link;
- spacing preset;
- map settings;
- video URL.

### Top bar

Contains:

- back to Studio;
- Story title;
- save status;
- draft/published status;
- undo/redo when practical;
- preview;
- publish.

---

# 5. Builder blocks

The builder should use a small set of reusable blocks.

Do not allow arbitrary coordinates, absolute positioning, or free resizing.

## 5.1 Photo block

One photograph.

Layout options:

- content width;
- wide;
- full bleed;
- portrait narrow;
- centred.

Settings:

- asset;
- caption EN/RU;
- alt text EN/RU;
- display width preset;
- focal point only when cropping is used;
- optional link to fullscreen viewer.

The Story page should normally preserve the full photograph rather than crop it.

---

## 5.2 Photo row block

Two or three photographs in one row.

Presets:

- 2 equal;
- 3 equal;
- large left + small right;
- small left + large right;
- portrait pair;
- landscape pair.

Rules:

- responsive stacking must be predefined;
- photographs must never stretch;
- row height must be derived from real image dimensions or a deliberate crop frame;
- the builder should show the expected mobile order.

---

## 5.3 Photo sequence block

A compact group of several images using a predefined editorial pattern.

Use only a few approved templates.

Examples:

- 1 large + 2 small;
- 2 top + 1 wide;
- alternating landscape and portrait;
- compact contact-sheet-like row for secondary details.

This block must remain structured and responsive.

---

## 5.4 Text block

Text is secondary to photography.

Variants:

- introduction;
- body note;
- field note;
- quote or observation;
- section heading.

Requirements:

- EN and RU fields;
- plain text or limited rich text;
- paragraphs, links, italic, and bold are enough;
- no arbitrary font, colour, or alignment controls;
- no SEO-style filler.

---

## 5.5 Caption

A caption may belong to:

- one photograph;
- one photo row;
- one section.

Captions should explain:

- where;
- when;
- what is easy to miss;
- why the moment mattered.

Do not describe what is already visually obvious.

---

## 5.6 Map or route block

Purpose:

- show where the trip happened;
- show a route or a small set of meaningful points.

MVP options:

- embed URL;
- static map image with caption;
- structured coordinates prepared for a later map integration.

Do not build a full GIS editor in the first version.

---

## 5.7 Video block

Purpose:

- embed a finished video from an external host.

Fields:

- URL;
- poster image;
- title;
- caption EN/RU.

The website is not the primary archive for large video files.

---

## 5.8 Divider or spacing block

Only predefined spacing:

- small;
- medium;
- large.

Avoid pixel-level controls.

A simple section divider may be supported, but decorative separators are not a priority.

---

# 6. Journal entry editor

The Journal editor should be simpler than the Story builder.

Suggested form:

- title EN/RU;
- date;
- location EN/RU;
- short text EN/RU;
- related Story;
- 3–10 selected photographs;
- compact photo layout preset;
- draft/publish status.

The Journal entry editor may use a linear form plus a small visual preview.

Do not reuse the full Story canvas when a simpler editor is enough.

The goal is to publish a short entry faster than sending a large photo batch to a chat.

---

# 7. Studio dashboard

The Studio dashboard is the entry point.

## 7.1 Main navigation

Keep it minimal:

- Stories;
- Journal;
- Media;
- Settings only when necessary.

Do not create a complex admin dashboard.

---

## 7.2 Stories list

Columns or card information:

- cover thumbnail;
- title;
- date/location;
- status;
- last edited;
- publication date;
- number of assets;
- language completeness.

Actions:

- open;
- preview;
- duplicate;
- publish/unpublish;
- archive.

Avoid destructive delete as a primary action.

---

## 7.3 Journal list

Information:

- thumbnail;
- date;
- title/location;
- related Story;
- status;
- last edited.

Actions:

- open;
- preview;
- duplicate;
- publish/unpublish.

---

## 7.4 Media library

The global Media section is secondary in the MVP.

It may later support:

- all publication assets;
- usage locations;
- unused assets;
- duplicates;
- missing alt text.

The first implementation can focus on media inside a Story.

---

# 8. Localisation

The public website is bilingual EN/RU.

The builder must support both languages without duplicating the entire Story structure.

Use one shared block sequence with localised text fields.

Example:

```ts
type LocalizedText = {
  en: string
  ru: string
}
```

The same photograph and layout are shared by both locales.

Localised fields may include:

- title;
- subtitle;
- introduction;
- body text;
- caption;
- location label;
- alt text;
- map caption;
- video title.

Builder behaviour:

- language tabs or a compact EN/RU editing toggle;
- clear indication of missing translation;
- preview in either locale;
- publishing warnings for incomplete required fields;
- do not block draft saving because a translation is incomplete.

---

# 9. Draft and publishing states

Required states:

- draft;
- unpublished changes;
- publishing;
- published;
- failed;
- published with warnings;
- archived.

The top bar should always make the current state visible.

Examples:

- `Draft`
- `Saved locally`
- `Unpublished changes`
- `Publishing…`
- `Published`
- `Publish failed`

The owner must not wonder whether work is saved.

---

# 10. Preview

Preview is a first-class part of the builder.

Required preview modes:

- desktop;
- tablet;
- mobile;
- EN;
- RU.

Preview should use the same rendering components as the public site whenever practical.

Do not create a visually approximate second renderer that drifts from production.

The builder should reuse public components for:

- Story blocks;
- Journal photo layouts;
- typography;
- captions;
- image viewer triggers.

Editing chrome must remain separate from public rendering.

---

# 11. Media processing

## 11.1 MVP publication pipeline

The first practical version should be local-first.

Suggested pipeline:

1. Owner selects source images.
2. Studio copies selected images into a publication workspace.
3. A processing script creates web derivatives.
4. Metadata is written to structured content files.
5. Public site reads these generated content files.
6. Production build is validated.
7. Publishing to GitHub is a separate explicit action.

For the current static project, a practical first implementation may use:

```text
content/
  stories/
    racha-july-2026/
      story.json
  journal/
    2026-07-15-fireflies.json

public/
  media/
    stories/
      racha-july-2026/
    journal/
      2026-07-15-fireflies/
```

Cursor must inspect the current repository before creating or changing this structure.

Do not migrate existing content blindly.

---

## 11.2 Image derivatives

The system should prepare, when practical:

- thumbnail;
- medium;
- large;
- fullscreen-quality web image.

Possible formats:

- AVIF;
- WebP;
- JPEG fallback where needed.

Requirements:

- preserve colour and HDR appearance as closely as the current browser pipeline allows;
- never apply aesthetic filters;
- preserve EXIF orientation;
- store actual width and height;
- avoid one shared hardcoded size;
- generate `srcset` metadata when the public site supports it.

Original RAW and full-resolution archive files remain outside the site.

---

## 11.3 Future storage adapter

The architecture should not permanently couple the builder to `public/media`.

A future publication storage adapter may upload derivatives to object storage/CDN.

Possible interface:

```ts
interface PublicationStorage {
  upload(file: ProcessedAsset): Promise<PublishedAsset>
  remove(assetId: string): Promise<void>
  getPublicUrl(assetId: string): string
}
```

MVP may use local filesystem storage.

Do not implement cloud storage before the local workflow is stable.

---

# 12. Suggested data model

The exact model must follow the current repository where possible.

## 12.1 Asset

```ts
type MediaAsset = {
  id: string
  sourceFilename: string
  sourcePath?: string
  publishedPath?: string
  mimeType: string
  width: number
  height: number
  aspectRatio: number
  capturedAt?: string
  device?: string
  status: 'available' | 'selected' | 'used' | 'hidden'
  alt: LocalizedText
}
```

---

## 12.2 Story

```ts
type Story = {
  id: string
  slug: string
  status:
    | 'draft'
    | 'published'
    | 'unpublished_changes'
    | 'archived'
  title: LocalizedText
  description: LocalizedText
  location: LocalizedText
  dateFrom?: string
  dateTo?: string
  coverAssetId?: string
  blocks: StoryBlock[]
  relatedJournalEntryIds: string[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}
```

---

## 12.3 Story blocks

```ts
type StoryBlock =
  | PhotoBlock
  | PhotoRowBlock
  | PhotoSequenceBlock
  | TextBlock
  | MapBlock
  | VideoBlock
  | SpacerBlock
```

Every block should have:

```ts
type BaseBlock = {
  id: string
  type: string
  order: number
}
```

Avoid storing editor-only pixel coordinates.

---

## 12.4 Journal entry

```ts
type JournalEntry = {
  id: string
  slug: string
  status: 'draft' | 'published' | 'unpublished_changes' | 'archived'
  title: LocalizedText
  text: LocalizedText
  location: LocalizedText
  date: string
  assetIds: string[]
  layoutPreset: string
  relatedStoryId?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}
```

---

# 13. Technical architecture

## 13.1 Separation from the public site

Keep Studio isolated.

Suggested structure:

```text
src/
  public-site/
  studio/
    components/
    pages/
    features/
      stories/
      journal/
      media/
      publishing/
    state/
    types/
```

Use the current project structure as the source of truth. Do not force this exact structure if it conflicts with the repository.

The private Studio code should be code-split and must not unnecessarily increase the public bundle.

---

## 13.2 UI foundation

The public site keeps its existing custom editorial design.

The private Studio may use:

- MUI as an application-shell foundation;
- custom editor components for canvas, media library, and inspector.

Rules:

- do not make the public site look like MUI;
- do not import the complete Studio UI into the public bundle;
- do not add a large UI dependency until Cursor has inspected the current package setup;
- if the project already has suitable primitives, reuse them.

The Studio can look functional and professional rather than editorial.

---

## 13.3 State management

The first version may use:

- React state plus context;
- a focused store if drag-and-drop and undo become complex.

Do not introduce a heavy state framework without a concrete need.

Draft persistence should survive accidental refresh.

Possible MVP persistence:

- local file content through a local development API;
- IndexedDB as a temporary draft cache;
- localStorage only for small UI preferences, not large content.

---

## 13.4 Local filesystem bridge

A normal browser cannot freely write into the project repository without user permission or a local service.

For a local-first MVP, use one of these approaches:

### Preferred

A small local Node service or Vite development plugin that:

- reads content files;
- writes draft JSON;
- copies selected publication assets;
- runs image processing;
- validates output.

### Alternative

File System Access API for explicitly selected folders.

Do not hide this limitation.

Do not build a fake Publish button that only changes UI state without actually producing publishable files.

---

# 14. UX rules

1. The owner should always know what is selected.
2. Dragging a photograph must show a clear insertion position.
3. Reordering should not change the content unexpectedly.
4. Layout options must be presets, not arbitrary geometry.
5. The same Story should remain structurally identical in EN and RU.
6. Mobile preview must be available before publication.
7. The builder should warn about:
   - missing cover;
   - missing title;
   - missing required translation;
   - missing image file;
   - unused or broken asset reference;
   - invalid video URL;
   - failed publication.
8. Warnings should not block saving a draft.
9. Publishing must be explicit.
10. Destructive actions require confirmation.
11. Autosave must not silently publish.
12. The builder must not modify original source files.

---

# 15. MVP scope

Build only the minimum needed to publish the first real Story without code editing.

## 15.1 MVP screens

1. Studio dashboard.
2. Stories list.
3. New Story flow.
4. Story builder:
   - media library;
   - canvas;
   - inspector;
   - top bar.
5. Preview.
6. Publish validation panel.
7. Simplified Journal entry editor.

---

## 15.2 MVP blocks

- text;
- single photo;
- two-photo row;
- three-photo row;
- asymmetric two-photo row;
- map embed/static map;
- video embed;
- spacing.

---

## 15.3 MVP capabilities

- create Story;
- edit metadata;
- import selected photographs;
- drag photographs into the Story;
- reorder blocks;
- change block layout preset;
- edit EN/RU text;
- preview desktop/mobile;
- save draft;
- generate content files;
- validate production build;
- expose an explicit publish-ready state.

Actual Git commit/push automation may remain a later step.

---

# 16. Explicit non-goals

Do not build yet:

- multi-user collaboration;
- public user accounts;
- roles and permissions;
- comments;
- newsletter;
- shop;
- complex tagging taxonomy;
- a separate public Gallery;
- AI-generated travel text;
- automatic photo aesthetic ranking;
- Lightroom-style image editing;
- full map route drawing;
- arbitrary freeform layout;
- plugin marketplace;
- theme editor;
- remote cloud sync;
- analytics dashboard;
- scheduled social media publishing;
- direct Instagram publishing;
- SEO management suite.

---

# 17. First implementation strategy

Do not implement the entire document at once.

## Phase 0 — Repository audit

Cursor should:

- inspect existing content structures;
- identify where Journal and Stories data live;
- identify reusable public rendering components;
- identify current image metadata handling;
- identify routing and localisation logic;
- identify build and deployment constraints;
- write a short architecture note before structural changes.

No broad refactor.

---

## Phase 1 — Studio shell

Build only:

- private `/studio` route;
- top bar;
- left media placeholder;
- centre canvas using existing Story rendering primitives where possible;
- right inspector placeholder;
- responsive shell;
- mock Story data;
- no real filesystem writes yet.

Keep the public site unchanged.

---

## Phase 2 — Block editing

Add:

- block selection;
- add block;
- delete block;
- reorder block;
- layout presets;
- inspector editing;
- EN/RU text fields;
- desktop/mobile preview.

---

## Phase 3 — Local persistence

Add:

- draft file schema;
- read/write through local service;
- validation;
- recovery after reload.

---

## Phase 4 — Media import and processing

Add:

- source file selection;
- publication copy;
- real dimensions;
- derivative generation;
- asset metadata;
- missing-file handling.

---

## Phase 5 — Publish-ready output

Add:

- generated Story content;
- generated Journal content;
- public site integration;
- production build validation;
- publish status.

Only after this is stable should automated Git publishing or remote object storage be considered.

---

# 18. Acceptance criteria for the first real Story

The MVP is successful when the owner can:

1. open MARARX Studio;
2. create `Racha — July 2026`;
3. select photographs from a prepared local/cloud-synced source folder;
4. drag photographs into a Story;
5. choose several editorial layouts;
6. add EN/RU title, location, introduction, captions, and notes;
7. add a map or route representation;
8. add an external video URL;
9. preview desktop and mobile;
10. save and reopen the draft;
11. generate valid public content without manually editing code;
12. run the existing production build successfully;
13. open the published-style Story in both EN and RU;
14. view photographs without stretching or colour-changing effects.

---

# 19. Cursor behaviour rules

For all work based on this document:

- Make the smallest viable change for the current phase.
- Inspect only relevant files.
- Do not redesign the public website.
- Do not perform unrelated refactors.
- Do not add dependencies without checking whether existing code already solves the problem.
- Subagents are allowed when they materially improve the result.
- Do not narrate reasoning, planning, file reads, or tool usage.
- Do not repeatedly audit the whole repository.
- Run only necessary validation.
- Preserve Git history.
- Do not publish, delete source media, change the domain, or perform destructive actions without explicit confirmation.
- After completion, reply in no more than two lines:
  - changed files;
  - validation result.

---

# 20. Initial Cursor task

Use this as the first instruction after placing this file in the repository:

```text
Read MARARX_STUDIO_CONTEXT.md and the existing `.cursor/rules` before making changes.

Audit the current mararx.com repository specifically for adding the private MARARX Studio builder described in the context file.

Do not implement the complete builder yet.

Produce Phase 0 and the smallest Phase 1 foundation:

1. Identify:
   - current Journal and Stories content sources;
   - Story rendering components that can be reused in preview;
   - routing and EN/RU localisation structure;
   - image metadata and progressive image components;
   - current build/deployment constraints.

2. Create a concise architecture note at:
   `docs/MARARX_STUDIO_ARCHITECTURE.md`

3. Add the smallest isolated `/studio` shell:
   - private/internal route not shown in public navigation;
   - top bar;
   - left media-library placeholder;
   - centre canvas placeholder;
   - right inspector placeholder;
   - responsive desktop layout;
   - no real publishing;
   - no filesystem writes;
   - no public-site redesign.

4. Keep Studio code isolated and code-split when practical.

5. Do not add MUI or another large dependency unless the current repository genuinely needs it. Reuse existing primitives first.

6. Run the existing production build once.

Execution guidance:
- Do not narrate reasoning, planning, progress, file reads, or tool usage.
- Subagents are allowed when they materially improve the result.
- Avoid broad audits and unrelated refactoring.
- Make the requested changes directly.
- After completion, reply in no more than 2 lines:
  - changed files;
  - validation result.
```
