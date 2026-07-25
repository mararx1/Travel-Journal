export type AssetStatus = 'available' | 'selected' | 'used' | 'hidden' | 'missing'

export type MediaAsset = {
  id: string
  name: string
  mimeType: string
  previewable: boolean
  status: AssetStatus
  sourceHandle: FileSystemFileHandle
  /** Intrinsic pixel size of the source image. */
  width?: number
  height?: number
  /** Filename written into the publication folder when used (web derivative). */
  publishedName?: string
  /** Lifecycle status before the file went missing (for restore on re-link). */
  statusBeforeMissing?: Exclude<AssetStatus, 'missing'>
  /** Session object URL for grid / canvas preview. */
  previewUrl?: string
}

export const ASSET_DRAG_MIME = 'application/x-mararx-asset'
