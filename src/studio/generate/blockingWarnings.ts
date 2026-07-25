import type { DraftWarning } from './validateDraft'

const BLOCKING_IDS = new Set(['title', 'cover', 'slug-collision'])

/** Issues that require explicit confirmation before Apply to site. */
export function getBlockingWarnings(warnings: DraftWarning[]): DraftWarning[] {
  return warnings.filter(
    (warning) => BLOCKING_IDS.has(warning.id) || warning.id.startsWith('missing-file:'),
  )
}
