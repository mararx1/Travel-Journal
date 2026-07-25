import type { GeneratedStoryOutput } from './generateStoryContent'
import {
  buildGeneratedFilenames,
  serializeGeneratedJson,
  serializeStoriesEntryTs,
  serializeStoryDetailsTs,
} from './serializeGenerated'

export type WriteGeneratedResult =
  | { ok: true; mode: 'disk' | 'download'; paths: string[] }
  | { ok: false; error: string }

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function writeGeneratedOutput(
  output: GeneratedStoryOutput,
): Promise<WriteGeneratedResult> {
  const names = buildGeneratedFilenames(output.slug)
  const files: Record<string, string> = {
    [names.details]: serializeStoryDetailsTs(output),
    [names.preview]: serializeStoriesEntryTs(output),
    [names.json]: serializeGeneratedJson(output),
  }

  try {
    const response = await fetch('/__studio/write-output', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: output.slug, files }),
    })

    if (response.ok) {
      const payload = (await response.json()) as { ok?: boolean; written?: string[]; error?: string }
      if (payload.ok && payload.written?.length) {
        return { ok: true, mode: 'disk', paths: payload.written }
      }
    }
  } catch {
    // Fall through to download when the dev write endpoint is unavailable.
  }

  try {
    for (const [name, content] of Object.entries(files)) {
      downloadText(name, content)
    }
    return {
      ok: true,
      mode: 'download',
      paths: Object.keys(files).map((name) => `download:${name}`),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not write generated output',
    }
  }
}
