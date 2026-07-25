/** Client-side web derivative: long-edge cap for ~900px site display (2×). */

export const WEB_LONG_EDGE = 1800
export const WEB_QUALITY = 0.82

export type DerivedImage = {
  /** Intrinsic source dimensions (before resize). */
  width: number
  height: number
  blob: Blob
  mimeType: 'image/webp' | 'image/jpeg'
  extension: '.webp' | '.jpg'
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function derivativeFileName(sourceName: string, extension: '.webp' | '.jpg'): string {
  const base = sourceName.replace(/\.[^.]+$/, '') || sourceName
  return `${base}${extension}`
}

export { derivativeFileName }

export async function measureAndDerive(file: File): Promise<DerivedImage> {
  const bitmap = await createImageBitmap(file)
  try {
    const width = bitmap.width
    const height = bitmap.height
    if (!width || !height) throw new Error('Image has no dimensions')

    const scale = Math.min(1, WEB_LONG_EDGE / Math.max(width, height))
    const outW = Math.max(1, Math.round(width * scale))
    const outH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas unavailable')
    ctx.drawImage(bitmap, 0, 0, outW, outH)

    const webp = await canvasToBlob(canvas, 'image/webp', WEB_QUALITY)
    if (webp && webp.size > 0) {
      return {
        width,
        height,
        blob: webp,
        mimeType: 'image/webp',
        extension: '.webp',
      }
    }

    const jpeg = await canvasToBlob(canvas, 'image/jpeg', WEB_QUALITY)
    if (!jpeg || jpeg.size === 0) throw new Error('Could not encode derivative')

    return {
      width,
      height,
      blob: jpeg,
      mimeType: 'image/jpeg',
      extension: '.jpg',
    }
  } finally {
    bitmap.close()
  }
}

/** Read intrinsic dimensions without writing a derivative. */
export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  try {
    return { width: bitmap.width, height: bitmap.height }
  } finally {
    bitmap.close()
  }
}
