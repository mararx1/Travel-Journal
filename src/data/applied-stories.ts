import appliedData from './applied-stories.json'
import type { StoryContentBlock } from './story-details'
import type { StoryPreview } from './stories'

type AppliedStoryRecord = {
  preview: StoryPreview & { route?: string }
  blocks: StoryContentBlock[]
}

type AppliedStoriesFile = {
  stories: Record<string, AppliedStoryRecord>
}

const data = appliedData as AppliedStoriesFile

/** Stories written by Studio “Apply to site” (idempotent upsert by slug). */
export const appliedStoryPreviews: StoryPreview[] = Object.values(data.stories).map(
  (entry) => entry.preview as StoryPreview,
)

export const appliedStoryContentBySlug: Record<string, StoryContentBlock[]> = Object.fromEntries(
  Object.entries(data.stories).map(([slug, entry]) => [slug, entry.blocks]),
)
