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
  canUseOpenFilePicker,
  fileToObjectUrl,
  listImageFiles,
  pickDirectory,
  pickImageFile,
  readSourceFile,
  writeBlobToDirectory,
} from './fs/fsAccess'
import { derivativeFileName, measureAndDerive, readImageDimensions } from './media/deriveImage'
import { ASSET_DRAG_MIME, type AssetStatus, type MediaAsset } from './media/types'
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
  markAssetMissing: (id: string) => void
  relinkAsset: (id: string) => Promise<void>
  resolvePreview: (assetId: string) => string | undefined
  getAsset: (assetId: string) => MediaAsset | undefined
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
    width: asset.width,
    height: asset.height,
    placeholder: false,
    alt: { en: asset.name },
  }
}

function patchBlockImage(block: StudioBlock, slotIndex: number, image: StudioImage): StudioBlock {
  if (block.type === 'image') {
    return { ...block, image: { ...block.image, ...image, caption: block.image.caption, alt: image.alt ?? block.image.alt } }
  }
  if (block.type === 'image-row') {
    const images: [StudioImage, StudioImage] = [...block.images]
    if (slotIndex < 0 || slotIndex > 1) return block
    const previous = images[slotIndex]
    images[slotIndex] = {
      ...previous,
      ...image,
      caption: previous.caption,
      alt: image.alt ?? previous.alt,
    }
    return { ...block, images }
  }
  if (block.type === 'image-triple') {
    const images: [StudioImage, StudioImage, StudioImage] = [...block.images]
    if (slotIndex < 0 || slotIndex > 2) return block
    const previous = images[slotIndex]
    images[slotIndex] = {
      ...previous,
      ...image,
      caption: previous.caption,
      alt: image.alt ?? previous.alt,
    }
    return { ...block, images }
  }
  return block
}

function toMissing(asset: MediaAsset): MediaAsset {
  if (asset.status === 'missing') return asset
  revokePreview(asset.previewUrl)
  return {
    ...asset,
    previewUrl: undefined,
    statusBeforeMissing: asset.status,
    status: 'missing',
  }
}

export function MediaLibraryProvider({ children }: { children: ReactNode }) {
  const { draft, updateBlock, insertImageBlock } = useStudioDraft()
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
  const draftRef = useRef(draft)

  assetsRef.current = assets
  publicationDirHandleRef.current = publicationDirHandle
  sourceDirHandleRef.current = sourceDirHandle
  sourceFolderNameRef.current = sourceFolderName
  publicationFolderNameRef.current = publicationFolderName
  draftRef.current = draft

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

  const commitAssets = useCallback(
    (next: MediaAsset[]) => {
      assetsRef.current = next
      setAssets(next)
      persistNow(
        next,
        sourceFolderNameRef.current,
        publicationFolderNameRef.current,
        sourceDirHandleRef.current,
        publicationDirHandleRef.current,
      )
    },
    [persistNow],
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
          if (!item.previewable) {
            hydrated.push({ ...item, previewUrl: undefined })
            continue
          }
          try {
            const previewUrl = await fileToObjectUrl(item.sourceHandle)
            let width = item.width
            let height = item.height
            if (width === undefined || height === undefined) {
              try {
                const file = await readSourceFile(item.sourceHandle)
                const dims = await readImageDimensions(file)
                width = dims.width
                height = dims.height
              } catch {
                // keep existing
              }
            }
            hydrated.push({
              ...item,
              width,
              height,
              previewUrl,
              status: item.status === 'missing' ? (item.statusBeforeMissing ?? 'available') : item.status,
              statusBeforeMissing: undefined,
            })
          } catch {
            hydrated.push(toMissing({ ...item, previewUrl: undefined }))
          }
        }
        if (!cancelled) {
          setAssets(hydrated)
          assetsRef.current = hydrated
        }
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
        let width: number | undefined
        let height: number | undefined
        if (file.previewable) {
          try {
            const sourceFile = await readSourceFile(file.handle)
            mimeType = sourceFile.type || mimeType
            const dims = await readImageDimensions(sourceFile)
            width = dims.width
            height = dims.height
            previewUrl = await fileToObjectUrl(file.handle)
          } catch {
            previewUrl = undefined
          }
        }
        next.push({
          id: nextAssetId(),
          name: file.name,
          mimeType,
          previewable: file.previewable,
          status: previewUrl || !file.previewable ? 'available' : 'missing',
          sourceHandle: file.handle,
          width,
          height,
          previewUrl,
        })
      }

      setSourceDirHandle(dir)
      setSourceFolderName(dir.name)
      sourceDirHandleRef.current = dir
      sourceFolderNameRef.current = dir.name
      commitAssets(next)
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
  }, [commitAssets, fsSupported])

  const choosePublicationFolder = useCallback(async () => {
    if (!fsSupported) return false
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
      const current = assetsRef.current
      const order = options?.orderedIds ?? current.map((asset) => asset.id)
      const index = order.indexOf(id)
      if (index < 0) return

      if (options?.shiftKey && lastSelectedIndexRef.current !== null) {
        const from = Math.min(lastSelectedIndexRef.current, index)
        const to = Math.max(lastSelectedIndexRef.current, index)
        const inRange = new Set(order.slice(from, to + 1))
        commitAssets(
          current.map((asset) => {
            if (!inRange.has(asset.id)) return asset
            if (asset.status === 'hidden' || asset.status === 'used' || asset.status === 'missing') {
              return asset
            }
            return { ...asset, status: 'selected' as const }
          }),
        )
        return
      }

      lastSelectedIndexRef.current = index
      commitAssets(
        current.map((asset) => {
          if (asset.id === id) {
            if (asset.status === 'hidden' || asset.status === 'used' || asset.status === 'missing') {
              return asset
            }
            return { ...asset, status: 'selected' as const }
          }
          if (asset.status === 'selected') return { ...asset, status: 'available' as const }
          return asset
        }),
      )
    },
    [commitAssets],
  )

  const hideAsset = useCallback(
    (id: string) => {
      const next = assetsRef.current.map((asset) =>
        asset.id === id && asset.status !== 'missing'
          ? { ...asset, status: 'hidden' as const }
          : asset,
      )
      commitAssets(next)
    },
    [commitAssets],
  )

  const unhideAsset = useCallback(
    (id: string) => {
      const next = assetsRef.current.map((asset) => {
        if (asset.id !== id) return asset
        if (asset.status === 'missing') return asset
        return {
          ...asset,
          status: (asset.publishedName ? 'used' : 'available') as AssetStatus,
        }
      })
      commitAssets(next)
    },
    [commitAssets],
  )

  const markAssetMissing = useCallback(
    (id: string) => {
      const next = assetsRef.current.map((asset) =>
        asset.id === id ? toMissing(asset) : asset,
      )
      commitAssets(next)
    },
    [commitAssets],
  )

  const resolvePreview = useCallback(
    (assetId: string) => {
      const asset = assets.find((item) => item.id === assetId)
      if (!asset || asset.status === 'missing') return undefined
      return asset.previewUrl
    },
    [assets],
  )

  const getAsset = useCallback(
    (assetId: string) => assets.find((item) => item.id === assetId),
    [assets],
  )

  const writeDerivative = useCallback(
    async (asset: MediaAsset, pubDir: FileSystemDirectoryHandle) => {
      const file = await readSourceFile(asset.sourceHandle)
      const derived = await measureAndDerive(file)
      const preferred = derivativeFileName(asset.name, derived.extension)
      const publishedName = await writeBlobToDirectory(pubDir, preferred, derived.blob)
      return { derived, publishedName }
    },
    [],
  )

  const prepareUsedAsset = useCallback(
    async (assetId: string): Promise<MediaAsset | null> => {
      const asset = assetsRef.current.find((item) => item.id === assetId)
      if (!asset) return null
      if (asset.status === 'missing') {
        setNote('That file is missing. Re-link it before placing on the canvas.')
        return null
      }
      if (!asset.previewable) {
        setNote('That format can’t be previewed or placed on the canvas yet.')
        return null
      }

      const pubDir = await ensurePublicationFolder()
      if (!pubDir) return null

      setBusy(true)
      try {
        let publishedName = asset.publishedName
        let width = asset.width
        let height = asset.height

        if (!publishedName) {
          const { derived, publishedName: written } = await writeDerivative(asset, pubDir)
          publishedName = written
          width = derived.width
          height = derived.height
        } else if (width === undefined || height === undefined) {
          const file = await readSourceFile(asset.sourceHandle)
          const dims = await readImageDimensions(file)
          width = dims.width
          height = dims.height
        }

        const updated: MediaAsset = {
          ...asset,
          status: 'used',
          publishedName,
          width,
          height,
          statusBeforeMissing: undefined,
        }

        commitAssets(
          assetsRef.current.map((item) => (item.id === assetId ? updated : item)),
        )

        return updated
      } catch {
        const current = assetsRef.current.find((item) => item.id === assetId)
        if (current) {
          try {
            await readSourceFile(current.sourceHandle)
            setNote('Could not write the web derivative into the publication folder.')
          } catch {
            commitAssets(
              assetsRef.current.map((item) =>
                item.id === assetId ? toMissing(item) : item,
              ),
            )
            setNote('Source file is missing. Re-link it from the library.')
          }
        } else {
          setNote('Could not prepare that photograph.')
        }
        return null
      } finally {
        setBusy(false)
      }
    },
    [commitAssets, ensurePublicationFolder, writeDerivative],
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

  const relinkAsset = useCallback(
    async (id: string) => {
      if (!canUseOpenFilePicker()) {
        setNote('File re-link isn’t available in this browser.')
        return
      }
      setBusy(true)
      setNote(null)
      try {
        const handle = await pickImageFile()
        const file = await readSourceFile(handle)
        const dims = await readImageDimensions(file)
        const previewUrl = URL.createObjectURL(file)
        const previous = assetsRef.current.find((asset) => asset.id === id)
        if (!previous) return

        revokePreview(previous.previewUrl)

        const restoredStatus: AssetStatus =
          previous.statusBeforeMissing
          ?? (previous.publishedName ? 'used' : 'available')

        let publishedName = previous.publishedName
        const pubDir = publicationDirHandleRef.current

        if (restoredStatus === 'used' || previous.publishedName) {
          if (!pubDir) {
            setNote('Set a publication folder, then re-link again to refresh the derivative.')
          } else {
            const derived = await measureAndDerive(file)
            publishedName = await writeBlobToDirectory(
              pubDir,
              derivativeFileName(handle.name, derived.extension),
              derived.blob,
            )
          }
        }

        const updated: MediaAsset = {
          ...previous,
          name: handle.name,
          mimeType: file.type || previous.mimeType,
          previewable: true,
          sourceHandle: handle,
          width: dims.width,
          height: dims.height,
          previewUrl,
          publishedName,
          status: publishedName ? 'used' : restoredStatus === 'used' ? 'available' : restoredStatus,
          statusBeforeMissing: undefined,
        }

        if (updated.status === 'hidden' && !previous.publishedName) {
          updated.status = 'available'
        }

        commitAssets(
          assetsRef.current.map((asset) => (asset.id === id ? updated : asset)),
        )

        const image = imageFromAsset(updated)
        for (const block of draftRef.current.blocks) {
          if (block.type === 'image' && block.image.assetId === id) {
            updateBlock(block.id, (current) => patchBlockImage(current, 0, image))
          }
          if (block.type === 'image-row') {
            block.images.forEach((slot, index) => {
              if (slot.assetId === id) {
                updateBlock(block.id, (current) => patchBlockImage(current, index, image))
              }
            })
          }
          if (block.type === 'image-triple') {
            block.images.forEach((slot, index) => {
              if (slot.assetId === id) {
                updateBlock(block.id, (current) => patchBlockImage(current, index, image))
              }
            })
          }
        }

        setNote(`Re-linked ${handle.name}.`)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setNote('Could not re-link that file.')
      } finally {
        setBusy(false)
      }
    },
    [commitAssets, updateBlock],
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
      markAssetMissing,
      relinkAsset,
      resolvePreview,
      getAsset,
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
      markAssetMissing,
      relinkAsset,
      resolvePreview,
      getAsset,
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
