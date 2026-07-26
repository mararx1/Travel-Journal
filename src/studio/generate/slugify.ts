import { appliedStoryContentBySlug, appliedStoryPreviews } from '../../data/applied-stories'
import { storyPreviews } from '../../data/stories'
import { storyContentBySlug } from '../../data/story-details'

/** Basic Cyrillic → Latin map for URL-safe slugs (EN/RU site). */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Е: 'e', Ё: 'e', Ж: 'zh', З: 'z',
  И: 'i', Й: 'y', К: 'k', Л: 'l', М: 'm', Н: 'n', О: 'o', П: 'p', Р: 'r',
  С: 's', Т: 't', У: 'u', Ф: 'f', Х: 'kh', Ц: 'ts', Ч: 'ch', Ш: 'sh', Щ: 'shch',
  Ъ: '', Ы: 'y', Ь: '', Э: 'e', Ю: 'yu', Я: 'ya',
}

export type StorySlugResult = {
  slug: string
  /** True when the base slug collided with an existing story and was disambiguated. */
  collisionAdjusted: boolean
}

function transliterate(input: string): string {
  let out = ''
  for (const char of input) {
    out += CYRILLIC_TO_LATIN[char] ?? char
  }
  return out
}

function shortId(input: string): string {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36).slice(0, 6)
}

function routeSlug(route: string | undefined): string | null {
  if (!route) return null
  const match = route.match(/\/stories\/([^/?#]+)/)
  return match?.[1] ?? null
}

function reservedStorySlugs(): Set<string> {
  const reserved = new Set<string>()

  for (const story of storyPreviews) {
    reserved.add(story.id)
    const fromRoute = routeSlug(story.route)
    if (fromRoute) reserved.add(fromRoute)
  }

  for (const story of appliedStoryPreviews) {
    reserved.add(story.id)
    const fromRoute = routeSlug(story.route)
    if (fromRoute) reserved.add(fromRoute)
  }

  for (const slug of Object.keys(appliedStoryContentBySlug)) {
    reserved.add(slug)
  }

  // Live StoryPage keys (hand-authored + applied), so content routes stay reserved
  // even if a preview row is filtered out by the applied-id merge.
  for (const slug of Object.keys(storyContentBySlug)) {
    reserved.add(slug)
  }

  return reserved
}

function baseSlugFromTitle(title: string): string {
  const base = transliterate(title)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  if (base) return base
  return `untitled-story-${shortId(title.trim() || 'empty')}`
}

function disambiguate(base: string, reserved: Set<string>): StorySlugResult {
  if (!reserved.has(base)) {
    return { slug: base, collisionAdjusted: false }
  }

  let n = 2
  while (n < 1000) {
    const candidate = `${base.slice(0, 60)}-${n}`
    if (!reserved.has(candidate)) {
      return { slug: candidate, collisionAdjusted: true }
    }
    n += 1
  }

  return {
    slug: `${base.slice(0, 50)}-${shortId(base)}`,
    collisionAdjusted: true,
  }
}

/** Reuse the slug of an already-applied Studio story with the same EN title (idempotent re-Apply). */
function appliedSlugForTitle(title: string): string | null {
  const normalized = title.trim()
  if (!normalized) return null
  for (const story of appliedStoryPreviews) {
    const en = story.title?.en?.trim()
    if (en && en === normalized) return story.id
  }
  return null
}

/** Resolve a URL-safe story slug, avoiding collisions with existing site stories. */
export function resolveStorySlug(title: string): StorySlugResult {
  const existing = appliedSlugForTitle(title)
  if (existing) {
    return { slug: existing, collisionAdjusted: false }
  }
  const base = baseSlugFromTitle(title)
  return disambiguate(base, reservedStorySlugs())
}

export function slugifyTitle(title: string): string {
  return resolveStorySlug(title).slug
}
