export type AssetStatus = 'available' | 'selected' | 'used' | 'hidden'

export type MediaAsset = {
  id: string
  name: string
  mimeType: string
  previewable: boolean
  status: AssetStatus
  sourceHandle: FileSystemFileHandle
  /** Filename written into the publication folder when used. */
  publishedName?: string
  /** Session object URL for grid / canvas preview. */
  previewUrl?: string
}

export const ASSET_DRAG_MIME = 'application/x-mararx-asset'
