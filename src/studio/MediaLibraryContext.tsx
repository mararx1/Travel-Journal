import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  canUseDirectoryPicker,
  copyFileToDirectory,
  fileToObjectUrl,
  listImageFiles,
  pickDirectory,
} from './fs/fsAccess'
import { ASSET_DRAG_MIME, type MediaAsset } from './media/types'
import { loadMediaLibrary, saveMediaLibrary } from './persist/mediaStore'
import { useStudioDraft } from './StudioDraftContext'
import type { StudioBlock, StudioImage } from './types'

type MediaLibraryContextValue = {
  fsSupported: boolean
  sourceFolderName: string | null
  publicationFolderName: string | null
  assets: MediaAsset[]
  showHidden: boolean
  busy: boolean
  note: string | null
  setShowHidden: (value: boolean) => void
  openSourceFolder: () => Promise<void>
  choosePublicationFolder: () => Promise<boolean>
  selectAsset: (id: string, options?: { shiftKey?: boolean; orderedIds?: string[] }) => void
  hideAsset: (id: string) => void
  unhideAsset: (id: string) => void
  resolvePreview: (assetId: string) => string | undefined
  applyAssetToSlot: (assetId: string, blockId: string, slotIndex: number) => Promise<void>
  applyAssetAsNewBlock: (assetId: string, insertBeforeIndex: number) => Promise<void>
}

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null)

let assetSeq = 0
function nextAssetId() {
  assetSeq += 1
  return `asset-${Date.now().toString(36)}-${assetSeq}`
}

function revokePreview(url: string | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function imageFromAsset(asset: MediaAsset): StudioImage {
  return {
    src: asset.previewUrl ?? `asset:${asset.id}`,
    assetId: asset.id,
    placeholder: false,
    alt: { en: asset.name },
  }
}

function patchBlockImage(block: StudioBlock, slotIndex: number, image: StudioImage): StudioBlock {
  if (block.type === 'image') {
    return { ...block, image }
  }
  if (block.type === 'image-row') {
    const images: [StudioImage, StudioImage] = [...block.images]
    if (slotIndex < 0 || slotIndex > 1) return block
    images[slotIndex] = image
    return { ...block, images }
  }
  if (block.type === 'image-triple') {
    const images: [StudioImage, StudioImage, StudioImage] = [...block.images]
    if (slotIndex < 0 || slotIndex > 2) return block
    images[slotIndex] = image
    return { ...block, images }
  }
  return block
}

export function MediaLibraryProvider({ children }: { children: ReactNode }) {
  const { updateBlock, insertImageBlock } = useStudioDraft()
  const fsSupported = canUseDirectoryPicker()

  const [sourceFolderName, setSourceFolderName] = useState<string | null>(null)
  const [publicationFolderName, setPublicationFolderName] = useState<string | null>(null)
  const [sourceDirHandle, setSourceDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [publicationDirHandle, setPublicationDirHandle] = useState<FileSystemDirectoryHandle | null>(
    null,
  )
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const lastSelectedIndexRef = useRef<number | null>(null)
  const persistTimerRef = useRef<number | null>(null)
  const assetsRef = useRef(assets)
  const publicationDirHandleRef = useRef(publicationDirHandle)
  const sourceDirHandleRef = useRef(sourceDirHandle)
  const sourceFolderNameRef = useRef(sourceFolderName)
  const publicationFolderNameRef = useRef(publicationFolderName)

  assetsRef.current = assets
  publicationDirHandleRef.current = publicationDirHandle
  sourceDirHandleRef.current = sourceDirHandle
  sourceFolderNameRef.current = sourceFolderName
  publicationFolderNameRef.current = publicationFolderName

  const persistNow = useCallback(
    (
      nextAssets: MediaAsset[],
      sourceName: string | null,
      pubName: string | null,
      sourceHandle: FileSystemDirectoryHandle | null,
      pubHandle: FileSystemDirectoryHandle | null,
    ) => {
      if (persistTimerRef.current !== null) window.clearTimeout(persistTimerRef.current)
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null
        void saveMediaLibrary({
          sourceFolderName: sourceName,
          publicationFolderName: pubName,
          sourceDirHandle: sourceHandle,
          publicationDirHandle: pubHandle,
          assets: nextAssets.map(({ previewUrl: _u, ...rest }) => rest),
        }).catch(() => {
          setNote('Could not remember the media library locally.')
        })
      }, 400)
    },
    [],
  )

  useEffect(() => {
    if (!fsSupported) return

    let cancelled = false

    ;(async () => {
      try {
        const stored = await loadMediaLibrary()
        if (cancelled || !stored) return

        setSourceFolderName(stored.sourceFolderName)
        setPublicationFolderName(stored.publicationFolderName)
        setSourceDirHandle(stored.sourceDirHandle)
        setPublicationDirHandle(stored.publicationDirHandle)

        const hydrated: MediaAsset[] = []
        for (const item of stored.assets) {
          let previewUrl: string | undefined
          if (item.previewable) {
            try {
              previewUrl = await fileToObjectUrl(item.sourceHandle)
            } catch {
              previewUrl = undefined
            }
          }
          hydrated.push({ ...item, previewUrl })
        }
        if (!cancelled) setAssets(hydrated)
      } catch {
        if (!cancelled) setNote('Could not restore the media library.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fsSupported])

  useEffect(() => {
    return () => {
      for (const asset of assetsRef.current) revokePreview(asset.previewUrl)
      if (persistTimerRef.current !== null) window.clearTimeout(persistTimerRef.current)
    }
  }, [])

  const openSourceFolder = useCallback(async () => {
    if (!fsSupported) return
    setBusy(true)
    setNote(null)
    try {
      const dir = await pickDirectory('read')
      const listed = await listImageFiles(dir)
      for (const asset of assetsRef.current) revokePreview(asset.previewUrl)

      const next: MediaAsset[] = []
      for (const file of listed) {
        let previewUrl: string | undefined
        let mimeType = 'application/octet-stream'
        if (file.previewable) {
          try {
            previewUrl = await fileToObjectUrl(file.handle)
            const f = await file.handle.getFile()
            mimeType = f.type || mimeType
          } catch {
            previewUrl = undefined
          }
        }
        next.push({
          id: nextAssetId(),
          name: file.name,
          mimeType,
          previewable: file.previewable,
          status: 'available',
          sourceHandle: file.handle,
          previewUrl,
        })
      }

      setSourceDirHandle(dir)
      setSourceFolderName(dir.name)
      setAssets(next)
      persistNow(
        next,
        dir.name,
        publicationFolderNameRef.current,
        dir,
        publicationDirHandleRef.current,
      )
      setNote(
        next.length === 0
          ? 'No image files found in that folder.'
          : `Loaded ${next.length} file${next.length === 1 ? '' : 's'} from ${dir.name}.`,
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setNote('Could not open that folder.')
    } finally {
      setBusy(false)
    }
  }, [fsSupported, persistNow])

  const choosePublicationFolder = useCallback(async () => {
    if (!fsSupported) return false
    setBusy(true)
    setNote(null)
    try {
      const dir = await pickDirectory('readwrite')
      setPublicationDirHandle(dir)
      setPublicationFolderName(dir.name)
      persistNow(
        assetsRef.current,
        sourceFolderNameRef.current,
        dir.name,
        sourceDirHandleRef.current,
        dir,
      )
      setNote(`Publication copies will go to ${dir.name}.`)
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false
      setNote('Could not set the publication folder.')
      return false
    } finally {
      setBusy(false)
    }
  }, [fsSupported, persistNow])

  const ensurePublicationFolder = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (publicationDirHandleRef.current) return publicationDirHandleRef.current
    if (!fsSupported) return null
    setBusy(true)
    setNote(null)
    try {
      const dir = await pickDirectory('readwrite')
      setPublicationDirHandle(dir)
      setPublicationFolderName(dir.name)
      publicationDirHandleRef.current = dir
      publicationFolderNameRef.current = dir.name
      persistNow(
        assetsRef.current,
        sourceFolderNameRef.current,
        dir.name,
        sourceDirHandleRef.current,
        dir,
      )
      setNote(`Publication copies will go to ${dir.name}.`)
      return dir
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null
      setNote('Could not set the publication folder.')
      return null
    } finally {
      setBusy(false)
    }
  }, [fsSupported, persistNow])

  const selectAsset = useCallback(
    (id: string, options?: { shiftKey?: boolean; orderedIds?: string[] }) => {
      setAssets((current) => {
        const order = options?.orderedIds ?? current.map((asset) => asset.id)
        const index = order.indexOf(id)
        if (index < 0) return current

        if (options?.shiftKey && lastSelectedIndexRef.current !== null) {
          const from = Math.min(lastSelectedIndexRef.current, index)
          const to = Math.max(lastSelectedIndexRef.current, index)
          const inRange = new Set(order.slice(from, to + 1))
          const next = current.map((asset) => {
            if (!inRange.has(asset.id)) return asset
            if (asset.status === 'hidden' || asset.status === 'used') return asset
            return { ...asset, status: 'selected' as const }
          })
          persistNow(
            next,
            sourceFolderNameRef.current,
            publicationFolderNameRef.current,
            sourceDirHandleRef.current,
            publicationDirHandleRef.current,
          )
          return next
        }

        lastSelectedIndexRef.current = index
        const next = current.map((asset) => {
          if (asset.id === id) {
            if (asset.status === 'hidden' || asset.status === 'used') return asset
            return { ...asset, status: 'selected' as const }
          }
          if (asset.status === 'selected') return { ...asset, status: 'available' as const }
          return asset
        })
        persistNow(
          next,
          sourceFolderNameRef.current,
          publicationFolderNameRef.current,
          sourceDirHandleRef.current,
          publicationDirHandleRef.current,
        )
        return next
      })
    },
    [persistNow],
  )

  const hideAsset = useCallback(
    (id: string) => {
      setAssets((current) => {
        const next = current.map((asset) =>
          asset.id === id ? { ...asset, status: 'hidden' as const } : asset,
        )
        persistNow(
          next,
          sourceFolderNameRef.current,
          publicationFolderNameRef.current,
          sourceDirHandleRef.current,
          publicationDirHandleRef.current,
        )
        return next
      })
    },
    [persistNow],
  )

  const unhideAsset = useCallback(
    (id: string) => {
      setAssets((current) => {
        const next = current.map((asset) => {
          if (asset.id !== id) return asset
          return {
            ...asset,
            status: asset.publishedName ? ('used' as const) : ('available' as const),
          }
        })
        persistNow(
          next,
          sourceFolderNameRef.current,
          publicationFolderNameRef.current,
          sourceDirHandleRef.current,
          publicationDirHandleRef.current,
        )
        return next
      })
    },
    [persistNow],
  )

  const resolvePreview = useCallback(
    (assetId: string) => assets.find((asset) => asset.id === assetId)?.previewUrl,
    [assets],
  )

  const prepareUsedAsset = useCallback(
    async (assetId: string): Promise<MediaAsset | null> => {
      const asset = assetsRef.current.find((item) => item.id === assetId)
      if (!asset) return null
      if (!asset.previewable) {
        setNote('That format can’t be previewed or placed on the canvas yet.')
        return null
      }

      const pubDir = await ensurePublicationFolder()
      if (!pubDir) return null

      setBusy(true)
      try {
        const publishedName =
          asset.publishedName
          ?? (await copyFileToDirectory(asset.sourceHandle, pubDir, asset.name))

        const updated: MediaAsset = {
          ...asset,
          status: 'used',
          publishedName,
        }

        setAssets((current) => {
          const next = current.map((item) => (item.id === assetId ? updated : item))
          assetsRef.current = next
          persistNow(
            next,
            sourceFolderNameRef.current,
            publicationFolderNameRef.current ?? pubDir.name,
            sourceDirHandleRef.current,
            pubDir,
          )
          return next
        })

        return updated
      } catch {
        setNote('Could not copy the file into the publication folder.')
        return null
      } finally {
        setBusy(false)
      }
    },
    [ensurePublicationFolder, persistNow],
  )

  const applyAssetToSlot = useCallback(
    async (assetId: string, blockId: string, slotIndex: number) => {
      const used = await prepareUsedAsset(assetId)
      if (!used) return
      updateBlock(blockId, (block) => patchBlockImage(block, slotIndex, imageFromAsset(used)))
    },
    [prepareUsedAsset, updateBlock],
  )

  const applyAssetAsNewBlock = useCallback(
    async (assetId: string, insertBeforeIndex: number) => {
      const used = await prepareUsedAsset(assetId)
      if (!used) return
      insertImageBlock(imageFromAsset(used), insertBeforeIndex)
    },
    [insertImageBlock, prepareUsedAsset],
  )

  const value = useMemo(
    () => ({
      fsSupported,
      sourceFolderName,
      publicationFolderName,
      assets,
      showHidden,
      busy,
      note,
      setShowHidden,
      openSourceFolder,
      choosePublicationFolder,
      selectAsset,
      hideAsset,
      unhideAsset,
      resolvePreview,
      applyAssetToSlot,
      applyAssetAsNewBlock,
    }),
    [
      fsSupported,
      sourceFolderName,
      publicationFolderName,
      assets,
      showHidden,
      busy,
      note,
      openSourceFolder,
      choosePublicationFolder,
      selectAsset,
      hideAsset,
      unhideAsset,
      resolvePreview,
      applyAssetToSlot,
      applyAssetAsNewBlock,
    ],
  )

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>
}

export function useMediaLibrary() {
  const value = useContext(MediaLibraryContext)
  if (!value) throw new Error('useMediaLibrary must be used within MediaLibraryProvider')
  return value
}

export { ASSET_DRAG_MIME }
