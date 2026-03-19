<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import http from '@/services/http'
import {
  ArrowLeft,
  Plus,
  Search,
  Grid,
  List,
  HardDrive,
  Image as ImageIcon,
  Video,
  UploadCloud,
  ChevronRight,
  X,
  Download,
  Trash2,
  Layers,
  FileText,
  RefreshCw,
  Edit2,
  FolderPlus,
  LayoutGrid,
  Type,
  Info,
  CornerDownRight,
  MoreHorizontal
} from 'lucide-vue-next'

import { uploadFiles, deleteFile, getFileUrl, type FileAttachment } from '@/api/file'
import { listDriveFolders, listDriveFiles, createDriveFolder, renameDriveFolder, moveDriveFolder, moveDriveFiles, renameDriveFile, uploadDriveFiles, getDrivePreviewUrl, getDriveDownloadUrl, type DriveFolderVO } from '@/api/drive'
import { message, Modal as AntModal } from 'ant-design-vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { BUTTON_COPY, ERROR_COPY } from '@/constants/copywriting'
import { useI18n } from 'vue-i18n'
import { bytesToSize, guessFileType, mapIngestStatusToParseStatus, withLock, type FileNode } from '@/composables/useFileUtils'

const { t } = useI18n()

// 子组件
import FileTypeIcon from './components/FileTypeIcon.vue'
import StatusBadge from './components/StatusBadge.vue'

// --- State ---
const driveFolders = ref<DriveFolderVO[]>([])
const driveFileList = ref<FileNode[]>([])

// 图片 Blob URL 缓存
const imageBlobCache = ref<Map<string, string>>(new Map())

const router = useRouter()
const route = useRoute()
const viewMode = ref<'list' | 'grid'>('list')
const selectedFileId = ref<string | null>(null)
const searchQuery = ref('')
const activeFolderId = ref<string | null>(null)
const driveNav = ref<'space' | 'media' | 'docs'>('space')
const mediaFilterType = ref<'all' | 'image' | 'video'>('all')
const docFilterType = ref<'all' | 'pdf' | 'excel' | 'markdown' | 'code'>('all')

const showCreateFolderModal = ref(false)
const isRefreshingDocs = ref(false)
const isUploading = ref(false)
const isLoadingDriveFiles = ref(false)
const isLoadingDocs = ref(false)

const newFolderName = ref('')
const newFolderParentId = ref<string | null>(null)

const authStore = useAuthStore()
const tier = computed(() => authStore.user?.tier ?? 'free')
const isProPlus = computed(() => tier.value === 'pro' || tier.value === 'turbo')

const inFlightKeys = new Set<string>()

const normalizeDateKey = (input?: string | null): string => {
  if (!input) return t('knowledge.common.unknownDate')
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return t('knowledge.common.unknownDate')
  return d.toISOString().slice(0, 10)
}

const formatDateTime = (input?: string | null): string => {
  if (!input) return '—'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  return d.toLocaleString()
}

// 获取带认证的图片 URL（返回 Blob URL）
const getAuthenticatedImageUrl = async (fileId: string): Promise<string | null> => {
  // 检查缓存
  if (imageBlobCache.value.has(fileId)) {
    return imageBlobCache.value.get(fileId)!
  }

  try {
    const blob = await http.get(`/files/${fileId}`, { responseType: 'blob' }) as unknown as Blob
    if (blob && blob.size > 0) {
      const blobUrl = URL.createObjectURL(blob)
      imageBlobCache.value.set(fileId, blobUrl)
      return blobUrl
    }
  } catch (e) {
    console.error('加载图片失败', e)
  }
  return null
}

// --- Methods ---
const refreshDriveFolders = async () => {
  const resp = await listDriveFolders()
  if (resp.code === 200) {
    driveFolders.value = resp.data
  }
}

const normalizeDriveFolderId = (id: string | null | undefined): string | null => {
  return id && id !== 'root' ? id : null
}

const refreshDriveTree = async () => {
  isLoadingDriveFiles.value = true
  try {
    await withLock(inFlightKeys, 'drive:folders', async () => {
      await refreshDriveFolders()
    })
  } finally {
    isLoadingDriveFiles.value = false
  }
}

const refreshDriveFileList = async (folderIdInput?: string | null) => {
  isLoadingDocs.value = true
  try {
    await withLock(inFlightKeys, `drive:files:${folderIdInput || activeFolderId.value || 'root'}`, async () => {
      const folderId = normalizeDriveFolderId(folderIdInput ?? activeFolderId.value)
      const resp = await listDriveFiles(folderId)
      if (resp.code !== 200) return

      const folderIds = new Set(driveFolders.value.map(f => f.id).filter(Boolean) as string[])

      const folderEntries: FileNode[] = driveFolders.value
          .filter(f => {
            if (!f.id) return false
            if (!folderId) return !f.parentId || f.parentId === f.id || !folderIds.has(f.parentId || '')
            return f.parentId === folderId && f.id !== f.parentId
          })
          .map(f => ({ id: f.id!, name: f.name, type: 'folder', rawFolder: f }))

      const fileEntries: FileNode[] = resp.data
          .filter(att => att.mimeType !== 'folder')
          .map(att => ({
            id: att.id || att.storagePath,
            name: att.fileName,
            type: 'file',
            fileType: guessFileType(att.mimeType, att.fileName),
            size: bytesToSize(att.size),
            updatedAt: att.uploadTime,
            status: mapIngestStatusToParseStatus(att),
            chunks: 0,
            ragflowDocumentId: att.ragflowDocumentId,
            raw: att
          }))

      driveFileList.value = [...folderEntries, ...fileEntries]
    })
  } finally {
    isLoadingDocs.value = false
  }
}

const handleRefreshDocs = async () => {
  if (isRefreshingDocs.value) return
  isRefreshingDocs.value = true
  try {
    await refreshDriveTree()
    await refreshDriveFileList()
    message.success(t('knowledge.drive.refreshSuccess'))
  } catch (err) {
    message.error(t('knowledge.drive.refreshFailed'))
  } finally {
    isRefreshingDocs.value = false
  }
}

// --- Computed ---
const currentFileList = computed(() => driveFileList.value)
const selectedFile = computed(() => currentFileList.value.find(f => f.id === selectedFileId.value))

const drivePreviewUrl = ref<string | null>(null)

// 加载预览内容（带认证）
const loadPreview = async (fileId: string) => {
  try {
    const blob = await http.get(`/drive/files/${fileId}/preview`, { responseType: 'blob' }) as unknown as Blob
    if (blob && blob.size > 0) {
      drivePreviewUrl.value = URL.createObjectURL(blob)
    } else {
      drivePreviewUrl.value = null
    }
  } catch (e) {
    console.error('预览加载失败', e)
    drivePreviewUrl.value = null
  }
}

// 监听选中文件变化，加载预览
watch(
  () => selectedFile.value?.raw?.id,
  (newId, oldId) => {
    // 清理旧的 Blob URL
    if (drivePreviewUrl.value && drivePreviewUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(drivePreviewUrl.value)
    }
    drivePreviewUrl.value = null

    if (newId) {
      loadPreview(newId)
    }
  },
  { immediate: true }
)

const editingDriveItem = ref<FileNode | null>(null)
const driveRenameName = ref<string>('')
const showRenameModal = ref(false)

const openRenameModal = (item: FileNode) => {
  editingDriveItem.value = item
  driveRenameName.value = item.name
  showRenameModal.value = true
}

const isRenaming = ref(false)

const submitRename = async () => {
  if (!editingDriveItem.value || !driveRenameName.value.trim()) return
  if (isRenaming.value) return
  isRenaming.value = true
  try {
    if (editingDriveItem.value.type === 'folder') {
      await renameDriveFolder(editingDriveItem.value.id, { name: driveRenameName.value.trim() })
    } else {
      await renameDriveFile(editingDriveItem.value.id, { fileName: driveRenameName.value.trim() })
    }
    message.success(t('knowledge.drive.renameSuccess'))
    showRenameModal.value = false
    await refreshDriveFileList()
  } catch (err) {
    message.error(ERROR_COPY.OPERATION_FAILED)
  } finally {
    isRenaming.value = false
  }
}

const handleDeleteFile = (file: FileNode) => {
  AntModal.confirm({
    title: t('knowledge.drive.deleteFileTitle'),
    content: t('knowledge.drive.deleteFileContent', { name: file.name }),
    okText: BUTTON_COPY.CONFIRM,
    okType: 'danger',
    cancelText: BUTTON_COPY.CANCEL,
    async onOk() {
      try {
        if (file.type === 'folder') {
          await deleteFile(file.id)
        } else {
          await deleteFile(file.id)
        }
        message.success(t('knowledge.drive.deleteSuccess'))
        await refreshDriveFileList()
      } catch (err) {
        message.error(t('knowledge.drive.deleteFailed'))
      }
    }
  })
}

const openMoveModal = (item: FileNode) => {
  editingDriveItem.value = item
  message.info(t('knowledge.common.moveDeveloping'))
}

const visibleFileList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return currentFileList.value
  return currentFileList.value.filter(f => (f.name || '').toLowerCase().includes(q))
})

const drivePath = computed(() => {
  if (!activeFolderId.value) return []
  const path: { id: string; name: string }[] = []
  let currentId: string | null = activeFolderId.value
  while (currentId) {
    const folder = driveFolders.value.find(f => f.id === currentId)
    if (folder) {
      path.unshift({ id: folder.id!, name: folder.name })
      currentId = folder.parentId
    } else {
      currentId = null
    }
  }
  return path
})

const spaceFileList = computed(() => visibleFileList.value)

const mediaFileList = computed(() => {
  let list = visibleFileList.value.filter(f => f.type === 'file' && (f.fileType === 'image' || f.fileType === 'video'))
  if (mediaFilterType.value !== 'all') {
    list = list.filter(f => f.fileType === mediaFilterType.value)
  }
  return list
})

const mediaGroups = computed(() => {
  const groups = new Map<string, FileNode[]>()
  for (const f of mediaFileList.value) {
    const key = normalizeDateKey(f.updatedAt)
    const arr = groups.get(key) || []
    arr.push(f)
    groups.set(key, arr)
  }
  const unknownLabel = t('knowledge.common.unknownDate')
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => (a === unknownLabel ? 1 : b === unknownLabel ? -1 : b.localeCompare(a)))
  return sortedKeys.map(k => ({ date: k, items: groups.get(k) || [] }))
})

const docFileList = computed(() => {
  let list = visibleFileList.value.filter(f => f.type === 'file' && f.fileType !== 'image' && f.fileType !== 'video')
  if (docFilterType.value !== 'all') {
    list = list.filter(f => f.fileType === docFilterType.value)
  }
  return list
})

const driveFolderOptions = computed(() => {
  const nodes = driveFolders.value.map(f => ({ id: f.id, name: f.name, parentId: f.parentId }))
  const map = new Map<string, { id: string; name: string; parentId: string | null; children: any[] }>()
  for (const n of nodes) {
    if (n.id) map.set(n.id, { id: n.id, name: n.name, parentId: n.parentId, children: [] })
  }
  const roots: any[] = []
  for (const n of nodes) {
    if (!n.id) continue
    const cur = map.get(n.id)
    if (!cur) continue
    if (n.parentId && map.has(n.parentId)) {
      map.get(n.parentId)!.children.push(cur)
    } else {
      roots.push(cur)
    }
  }
  const result: { id: string; name: string; level: number }[] = []
  const walk = (list: any[], level: number) => {
    for (const n of list) {
      result.push({ id: n.id, name: n.name, level })
      if (n.children && n.children.length > 0) walk(n.children, level + 1)
    }
  }
  walk(roots, 0)
  return result
})

const driveTree = computed<FileNode[]>(() => {
  const map = new Map<string, FileNode>()
  for (const f of driveFolders.value) {
    if (f.id) {
      map.set(f.id, { id: f.id, name: f.name, type: 'folder', children: [], rawFolder: f })
    }
  }
  const roots: FileNode[] = []
  for (const f of driveFolders.value) {
    if (!f.id) continue
    const node = map.get(f.id)
    if (!node) continue
    if (!f.parentId || f.parentId === f.id) {
      roots.push(node)
    } else {
      const parentNode = map.get(f.parentId)
      if (parentNode) {
        parentNode.children!.push(node)
      } else {
        roots.push(node)
      }
    }
  }
  return [{ id: 'root', name: t('knowledge.drive.myDrive'), type: 'folder', children: roots }]
})

// --- Interaction Handlers ---
const goBack = () => router.push('/playground')
const clearSelection = () => { selectedFileId.value = null }
const openFileDrawer = (id: string) => { selectedFileId.value = id }
const selectFolder = (id: string | null) => {
  const nextId = normalizeDriveFolderId(id)
  activeFolderId.value = nextId
  const currentQueryId = (route.query.folderId as string | undefined) || null
  if (currentQueryId !== nextId) {
    router.replace({ query: { ...route.query, folderId: nextId || undefined } })
  }
  refreshDriveFileList(activeFolderId.value)
}

const openCreateFolder = () => {
  newFolderName.value = ''
  newFolderParentId.value = activeFolderId.value
  showCreateFolderModal.value = true
}

const closeCreateFolder = () => { showCreateFolderModal.value = false }

const uploadInputRef = ref<HTMLInputElement | null>(null)
const openUploadDialog = () => {
  if (isUploading.value) return
  uploadInputRef.value?.click()
}

const handleUploadChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  input.value = ''
  if (files.length === 0) return

  await withLock(inFlightKeys, 'files:upload', async () => {
    isUploading.value = true
    try {
      const up = await uploadDriveFiles(files, { folderId: activeFolderId.value })
      if (up.code !== 200) {
        message.error(up.message || t('knowledge.drive.uploadFailed'))
        return
      }
      await refreshDriveFileList(activeFolderId.value)
    } finally {
      isUploading.value = false
    }
  })
}

const isCreatingFolder = ref(false)

const submitCreateFolder = async () => {
  const name = newFolderName.value.trim()
  if (!name) return
  if (isCreatingFolder.value) return
  isCreatingFolder.value = true
  try {
    const resp = await createDriveFolder({ name, parentId: newFolderParentId.value })
    if (resp.code === 200) {
      await refreshDriveTree()
      await refreshDriveFileList(activeFolderId.value)
      closeCreateFolder()
    }
  } finally {
    isCreatingFolder.value = false
  }
}

const handleFileRowClick = (file: FileNode) => {
  if (driveNav.value === 'space' && file.type === 'folder') {
    selectFolder(file.id === 'root' ? null : file.id)
    return
  }
  if (file.type === 'file') {
    openFileDrawer(file.id)
  }
}

const handleDeleteSelectedFile = async () => {
  if (!selectedFile.value?.raw) return
  const id = selectedFile.value.raw.id
  AntModal.confirm({
    title: t('knowledge.drive.deleteConfirm'),
    content: t('knowledge.drive.deleteConfirmContent', { name: selectedFile.value.name }),
    async onOk() {
      const resp = await deleteFile(id)
      if (resp.code === 200) {
        clearSelection()
        await refreshDriveFileList(activeFolderId.value)
      }
    }
  })
}

const downloadBlobWithAuth = async (url: string, fileName: string) => {
  // 去掉 /api 前缀，http 实例 baseURL 已包含
  const path = url.startsWith('/api') ? url.slice(4) : url
  try {
    const blob = await http.get(path, { responseType: 'blob' }) as unknown as Blob

    if (!blob || blob.size === 0) {
      message.error(t('knowledge.drive.downloadEmpty'))
      return
    }

    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = fileName || 'download'
    document.body.appendChild(a)
    setTimeout(() => {
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    }, 0)
  } catch (e) {
    message.error(t('knowledge.drive.downloadNetworkError'))
  }
}

const downloadSelectedFile = () => {
  if (!selectedFile.value?.raw) return
  const id = selectedFile.value.raw.id
  if (id) {
    void downloadBlobWithAuth(getDriveDownloadUrl(id, selectedFile.value.name), selectedFile.value.name)
    return
  }
  const ragflowId = selectedFile.value.raw.storagePath
  if (!ragflowId) {
    message.warning(t('knowledge.common.noDownloadSupport'))
    return
  }
  void downloadBlobWithAuth(getDriveDownloadUrl(ragflowId, selectedFile.value.name), selectedFile.value.name)
}

const downloadFile = (file: FileNode) => {
  if (file.type !== 'file') return
  const id = file.raw?.id
  if (!id) {
    const ragflowId = file.raw?.storagePath
    if (!ragflowId) {
      message.warning(t('knowledge.common.noDownloadSupport'))
      return
    }
    void downloadBlobWithAuth(getDriveDownloadUrl(ragflowId, file.name), file.name)
    return
  }
  void downloadBlobWithAuth(getDriveDownloadUrl(id, file.name), file.name)
}

// --- Lifecycle & Watches ---
onMounted(async () => {
  await refreshDriveTree()
  const qFolderId = normalizeDriveFolderId(route.query.folderId as string | undefined)
  activeFolderId.value = qFolderId
  await refreshDriveFileList(qFolderId)
})

onBeforeUnmount(() => {
  // 清理预览 Blob URL
  if (drivePreviewUrl.value && drivePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(drivePreviewUrl.value)
  }

  // 清理所有缓存的图片 Blob URL
  imageBlobCache.value.forEach(blobUrl => {
    if (blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl)
    }
  })
  imageBlobCache.value.clear()
})

watch(
  () => route.query.folderId,
  async (folderId) => {
    const normalized = normalizeDriveFolderId(folderId as string | undefined)
    if (normalized === activeFolderId.value) return
    activeFolderId.value = normalized
    await refreshDriveFileList(normalized)
  }
)

watch(
  () => driveNav.value,
  (val) => {
    clearSelection()
    if (val === 'space') {
      viewMode.value = 'list'
      return
    }
    viewMode.value = val === 'media' ? 'grid' : 'list'
  }
)

// 带认证的图片组件
const AuthenticatedImage = {
  props: {
    fileId: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    }
  },
  setup(props: { fileId: string; alt: string }) {
    const imageUrl = ref<string | null>(null)
    const isLoading = ref(true)
    const hasError = ref(false)

    const loadImage = async () => {
      isLoading.value = true
      hasError.value = false
      try {
        const url = await getAuthenticatedImageUrl(props.fileId)
        if (url) {
          imageUrl.value = url
        } else {
          hasError.value = true
        }
      } catch (e) {
        hasError.value = true
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      loadImage()
    })

    return { imageUrl, isLoading, hasError }
  },
  components: { FileTypeIcon },
  template: `
    <div class="w-full h-full flex items-center justify-center">
      <div v-if="isLoading" class="animate-pulse bg-slate-200 dark:bg-zinc-700 w-full h-full"></div>
      <img
        v-else-if="imageUrl && !hasError"
        :src="imageUrl"
        :alt="alt"
        class="w-full h-full object-cover"
      />
      <FileTypeIcon v-else type="file" file-type="image" :size="44" />
    </div>
  `
}
</script>

<template>
  <div class="h-full flex bg-[#fafafa] dark:bg-[#0a0a0a] relative overflow-hidden w-full font-sans selection:bg-emerald-100 selection:text-emerald-900 dark:selection:bg-emerald-900/40 dark:selection:text-emerald-200">
    <input ref="uploadInputRef" type="file" class="hidden" multiple @change="handleUploadChange" />

    <!-- Main two-column layout -->
    <div class="flex-1 flex min-h-0">
      <!-- Sidebar -->
      <aside class="w-60 bg-[#fafafa] dark:bg-[#18181b] border-r border-[#e5e5e5] dark:border-white/10 flex flex-col shrink-0">
        <div class="flex-1 overflow-y-auto custom-scrollbar px-2 py-4 space-y-1">
          <!-- Nav items matching design: All Files, Recent, Starred, Trash -->
          <button
            :class="['w-full flex items-center gap-2 px-3 py-2 rounded-md text-[0.8125rem] font-medium transition-all',
            driveNav === 'space' ? 'bg-[#f4f4f4] dark:bg-[#2a2a30] text-[#09090b] dark:text-[#fafafa]' : 'text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a30]']"
            :aria-current="driveNav === 'space' ? 'page' : undefined"
            @click="driveNav = 'space'"
          >
            <HardDrive :size="16" />
            <span>{{ t('knowledge.drive.mySpace') }}</span>
          </button>

          <button
            :class="['w-full flex items-center gap-2 px-3 py-2 rounded-md text-[0.8125rem] transition-all',
            driveNav === 'media' ? 'bg-[#f4f4f4] dark:bg-[#2a2a30] text-[#09090b] dark:text-[#fafafa] font-medium' : 'text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a30]']"
            :aria-current="driveNav === 'media' ? 'page' : undefined"
            @click="driveNav = 'media'"
          >
            <ImageIcon :size="16" />
            <span>{{ t('knowledge.drive.imageVideo') }}</span>
          </button>

          <button
            :class="['w-full flex items-center gap-2 px-3 py-2 rounded-md text-[0.8125rem] transition-all',
            driveNav === 'docs' ? 'bg-[#f4f4f4] dark:bg-[#2a2a30] text-[#09090b] dark:text-[#fafafa] font-medium' : 'text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a30]']"
            :aria-current="driveNav === 'docs' ? 'page' : undefined"
            @click="driveNav = 'docs'"
          >
            <FileText :size="16" />
            <span>{{ t('knowledge.drive.documents') }}</span>
          </button>

          <!-- Back to knowledge base -->
          <div class="h-px bg-[#e5e5e5] dark:bg-white/10 my-3"></div>
          <button
            class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[0.8125rem] text-[#737373] dark:text-[#a3a3a3] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a30] transition-all"
            @click="$router.push('/knowledge')"
          >
            <Layers :size="16" />
            <span>{{ t('knowledge.drive.knowledgeBase') }}</span>
          </button>
        </div>
      </aside>

      <main class="flex-1 flex flex-col min-w-0 relative">
        <!-- Top area: breadcrumb + title + toolbar -->
        <div class="px-8 pt-6 pb-0 shrink-0 space-y-4">
          <!-- Breadcrumb -->
          <div v-if="driveNav === 'space'" class="flex items-center gap-2 text-[0.8125rem]">
            <button class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors" @click="selectFolder(null)">{{ t('knowledge.drive.myDrive') }}</button>
            <template v-for="item in drivePath" :key="item.id">
              <span class="text-[#737373]">/</span>
              <button class="text-[#0a0a0a] dark:text-[#fafafa] font-medium hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors" @click="selectFolder(item.id)">
                {{ item.name }}
              </button>
            </template>
          </div>
          <div v-else class="flex items-center gap-2 text-[0.8125rem] text-[#737373]">
            <span>{{ driveNav === 'media' ? t('knowledge.drive.media') : t('knowledge.drive.documents') }}</span>
          </div>

          <!-- Title row with actions -->
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
              {{ driveNav === 'space' ? (drivePath.length > 0 ? drivePath[drivePath.length - 1].name : t('knowledge.drive.myDrive')) : (driveNav === 'media' ? t('knowledge.drive.media') : t('knowledge.drive.documents')) }}
            </h1>

            <div class="flex items-center gap-2">
              <!-- Search -->
              <div class="relative">
                <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
                <input v-model="searchQuery" type="text" inputmode="search" autocomplete="off" :aria-label="t('knowledge.drive.searchPlaceholder')" :placeholder="t('knowledge.drive.searchPlaceholder')" class="min-h-[36px] pl-9 pr-3 py-1.5 w-48 focus:w-60 bg-transparent border border-[#e5e5e5] dark:border-white/10 rounded-md text-[0.8125rem] text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#737373] outline-none transition-all focus:border-[#a3a3a3] dark:focus:border-white/20" />
              </div>

              <!-- Upload button -->
              <button
                :disabled="isUploading"
                :class="['min-h-[36px] flex items-center gap-2 px-4 py-1.5 bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]! rounded-md text-[0.8125rem] font-medium transition-all', isUploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#262626] dark:hover:bg-[#e5e5e5] active:scale-95']"
                :aria-label="t('knowledge.drive.upload')"
                @click="openUploadDialog"
              >
                <UploadCloud :size="16" :class="{ 'animate-spin': isUploading }" />
                <span>{{ isUploading ? t('knowledge.drive.uploading') : t('knowledge.drive.upload') }}</span>
              </button>

              <!-- New Folder -->
              <button
                class="min-h-[36px] flex items-center gap-2 px-4 py-1.5 bg-transparent border border-[#e5e5e5] dark:border-white/10 text-[#0a0a0a] dark:text-[#fafafa] rounded-md text-[0.8125rem] font-medium hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all active:scale-95"
                @click="openCreateFolder"
              >
                <FolderPlus :size="16" />
                <span>{{ t('knowledge.drive.createFolder') }}</span>
              </button>

              <!-- View mode toggle -->
              <TooltipProvider v-if="driveNav === 'space'" :delay-duration="300" :skip-delay-duration="100">
                <div class="flex items-center border border-[#e5e5e5] dark:border-white/10 rounded-md overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        :class="['p-1.5 transition-all', viewMode === 'grid' ? 'bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa]' : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
                        :aria-label="t('knowledge.drive.gridView')"
                        @click="viewMode = 'grid'"
                      ><LayoutGrid :size="16" /></button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" :side-offset="6">{{ t('knowledge.drive.gridView') }}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        :class="['p-1.5 transition-all', viewMode === 'list' ? 'bg-[#f5f5f5] dark:bg-[#262626] text-[#0a0a0a] dark:text-[#fafafa]' : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
                        :aria-label="t('knowledge.drive.listView')"
                        @click="viewMode = 'list'"
                      ><List :size="16" /></button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" :side-offset="6">{{ t('knowledge.drive.listView') }}</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>

          <!-- Media/Doc filter tabs -->
          <div v-if="driveNav === 'media'" class="flex items-center gap-2">
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', mediaFilterType === 'all' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="mediaFilterType = 'all'"
            >{{ t('knowledge.drive.all') }}</button>
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', mediaFilterType === 'image' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="mediaFilterType = 'image'"
            >{{ t('knowledge.drive.images') }}</button>
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', mediaFilterType === 'video' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="mediaFilterType = 'video'"
            >{{ t('knowledge.drive.videos') }}</button>
          </div>

          <div v-else-if="driveNav === 'docs'" class="flex items-center gap-2">
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', docFilterType === 'all' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="docFilterType = 'all'"
            >{{ t('knowledge.drive.all') }}</button>
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', docFilterType === 'pdf' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="docFilterType = 'pdf'"
            >PDF</button>
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', docFilterType === 'excel' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="docFilterType = 'excel'"
            >{{ t('knowledge.drive.spreadsheets') }}</button>
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', docFilterType === 'markdown' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="docFilterType = 'markdown'"
            >Markdown</button>
            <button
              :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-all', docFilterType === 'code' ? 'bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]!' : 'border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa]']"
              @click="docFilterType = 'code'"
            >{{ t('knowledge.drive.code') }}</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar px-8 pt-6 pb-8">
          <!-- Loading skeleton -->
          <div v-if="isLoadingDocs" class="w-full py-4">
            <div v-if="viewMode === 'list'" class="rounded-lg border border-[#e5e5e5] dark:border-white/10 overflow-hidden">
              <div v-for="i in 8" :key="i" class="px-4 py-4 border-b border-[#e5e5e5]/50 dark:border-white/5 flex items-center gap-4">
                <div class="w-10 h-10 bg-[#f5f5f5] dark:bg-[#262626] animate-pulse rounded-lg shrink-0"></div>
                <div class="flex-1 h-4 bg-[#f5f5f5] dark:bg-[#262626] animate-pulse rounded"></div>
                <div class="w-16 h-4 bg-[#f5f5f5] dark:bg-[#262626] animate-pulse rounded"></div>
              </div>
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <div v-for="i in 12" :key="i" class="p-4 rounded-lg border border-[#e5e5e5] dark:border-white/10 bg-[#fafafa] dark:bg-[#171717] flex flex-col items-center">
                <div class="w-10 h-10 bg-[#f5f5f5] dark:bg-[#262626] animate-pulse rounded-lg mb-3"></div>
                <div class="h-3 w-3/4 bg-[#f5f5f5] dark:bg-[#262626] animate-pulse rounded mb-2"></div>
                <div class="h-2.5 w-1/2 bg-[#f5f5f5] dark:bg-[#262626] animate-pulse rounded"></div>
              </div>
            </div>
          </div>

          <!-- Space: List view -->
          <div v-else-if="driveNav === 'space' && viewMode === 'list'" class="rounded-lg border border-[#e5e5e5] dark:border-white/10 overflow-hidden mb-6">
            <table class="w-full text-left border-separate border-spacing-0">
              <thead>
              <tr class="text-xs font-medium text-[#737373] uppercase tracking-wider bg-[#fafafa] dark:bg-[#171717]">
                <th class="px-4 py-3 border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colFileName') }}</th>
                <th class="px-4 py-3 text-center border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colSize') }}</th>
                <th class="px-4 py-3 text-center border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colStorageType') }}</th>
                <th class="px-4 py-3 text-center border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colUpdateTime') }}</th>
                <th class="px-4 py-3 text-right border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colActions') }}</th>
              </tr>
              </thead>
              <tbody class="text-[0.8125rem]">
              <tr v-for="file in spaceFileList" :key="file.id" class="group hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-all cursor-pointer" @click="handleFileRowClick(file)">
                <td class="px-4 py-3.5 border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none">
                  <div class="flex items-center gap-3">
                    <FileTypeIcon :type="file.type" :file-type="file.fileType" :size="20" />
                    <span class="font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate max-w-xs">{{ file.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3.5 text-[#737373] font-mono text-center border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none text-xs">
                  {{ file.type === 'folder' ? '—' : (file.size || '—') }}
                </td>
                <td class="px-4 py-3.5 text-[#737373] text-center border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none text-xs">
                  {{ file.type === 'folder' ? '—' : t('knowledge.common.standardStorage') }}
                </td>
                <td class="px-4 py-3.5 text-[#737373] text-center border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none text-xs">
                  {{ formatDateTime(file.updatedAt) }}
                </td>
                <td class="px-4 py-3.5 text-right border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none">
                  <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all"
                        @click.stop="file.type === 'folder' ? selectFolder(file.id) : openFileDrawer(file.id)"
                        :aria-label="file.type === 'folder' ? t('knowledge.drive.enter') : t('knowledge.drive.details')"
                    >
                      <component :is="file.type === 'folder' ? ChevronRight : Info" :size="16" />
                    </button>

                    <button
                      v-if="file.type === 'file'"
                      class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all"
                      :aria-label="t('knowledge.drive.download')"
                      @click.stop="downloadFile(file)"
                    >
                      <Download :size="16" />
                    </button>

                    <div class="relative group/menu">
                      <button class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all" :aria-label="t('knowledge.common.moreActions')">
                        <MoreHorizontal :size="16" />
                      </button>

                      <div class="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#262626] rounded-lg shadow-lg border border-[#e5e5e5] dark:border-white/10 py-1 z-50 hidden group-hover/menu:block">
                        <button class="w-full text-left px-3 py-2 text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#333] flex items-center gap-2 transition-colors" @click.stop="openRenameModal(file)">
                          <Edit2 :size="14" /> {{ t('knowledge.drive.rename') }}
                        </button>

                        <button
                          v-if="file.type === 'file'"
                          class="w-full text-left px-3 py-2 text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#333] flex items-center gap-2 transition-colors"
                          @click.stop="downloadFile(file)"
                        >
                          <Download :size="14" /> {{ t('knowledge.drive.download') }}
                        </button>
                        <button class="w-full text-left px-3 py-2 text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#333] flex items-center gap-2 transition-colors" @click.stop="openMoveModal(file)">
                          <CornerDownRight :size="14" /> {{ t('knowledge.drive.move') }}
                        </button>
                        <div class="h-px bg-[#e5e5e5] dark:bg-white/10 my-1"></div>
                        <button class="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors" @click.stop="handleDeleteFile(file)">
                          <Trash2 :size="14" /> {{ t('knowledge.drive.delete') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <!-- Space: Grid view - matching design with large icon cards -->
          <div v-else-if="driveNav === 'space'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div
              v-for="file in spaceFileList"
              :key="file.id"
              role="button"
              tabindex="0"
              :aria-label="t('knowledge.drive.openFile', { name: file.name })"
              :class="['group p-4 rounded-lg border bg-[#fafafa] dark:bg-[#171717] transition-all cursor-pointer flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:border-[#a3a3a3] dark:hover:border-white/20', selectedFileId === file.id ? 'border-[#171717] dark:border-[#fafafa] shadow-md' : 'border-[#e5e5e5] dark:border-white/10']"
              @click="handleFileRowClick(file)"
              @keydown.enter="handleFileRowClick(file)"
              @keydown.space.prevent="handleFileRowClick(file)"
            >
              <div class="py-4"><FileTypeIcon :type="file.type" :file-type="file.fileType" :size="40" /></div>
              <div class="text-[0.8125rem] font-semibold truncate w-full text-[#0a0a0a] dark:text-[#fafafa]">{{ file.name }}</div>
              <div class="text-xs text-[#737373] mt-1">{{ file.type === 'folder' ? t('knowledge.common.folder') : (file.size || '—') }}</div>
            </div>
          </div>

          <div v-else-if="driveNav === 'media'" class="space-y-6">
            <div v-for="g in mediaGroups" :key="g.date" class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-xs font-medium text-[#0a0a0a] dark:text-[#fafafa]">{{ g.date }}</div>
                <div class="text-xs text-[#737373] font-mono">{{ t('knowledge.drive.itemCount', { count: g.items.length }) }}</div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                <div
                  v-for="file in g.items"
                  :key="file.id"
                  :class="['group rounded-lg bg-[#fafafa] dark:bg-[#171717] border border-[#e5e5e5] dark:border-white/10 overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#a3a3a3] dark:hover:border-white/20', selectedFileId === file.id ? 'ring-2 ring-[#171717] dark:ring-[#fafafa]' : '']"
                  @click="handleFileRowClick(file)"
                >
                  <div class="aspect-square bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center overflow-hidden relative">
                    <template v-if="file.fileType === 'image' && file.raw?.id">
                      <AuthenticatedImage :file-id="file.raw.id" :alt="file.name" />
                    </template>
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <FileTypeIcon :type="file.type" :file-type="file.fileType" :size="40" />
                    </div>
                  </div>
                  <div class="p-2.5">
                    <div class="text-xs font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate">{{ file.name }}</div>
                    <div class="text-xs text-[#737373] mt-0.5">{{ file.size || '—' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="rounded-lg border border-[#e5e5e5] dark:border-white/10 overflow-hidden mb-6">
            <table class="w-full text-left border-separate border-spacing-0">
              <thead>
              <tr class="text-xs font-medium text-[#737373] uppercase tracking-wider bg-[#fafafa] dark:bg-[#171717]">
                <th class="px-4 py-3 border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colFileName') }}</th>
                <th class="px-4 py-3 text-center border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colSize') }}</th>
                <th class="px-4 py-3 text-center border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colType') }}</th>
                <th class="px-4 py-3 text-center border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colUpdateTime') }}</th>
                <th class="px-4 py-3 text-right border-b border-[#e5e5e5] dark:border-white/10">{{ t('knowledge.drive.colActions') }}</th>
              </tr>
              </thead>
              <tbody class="text-[0.8125rem]">
              <tr v-for="file in docFileList" :key="file.id" class="group hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] transition-all cursor-pointer" @click="handleFileRowClick(file)">
                <td class="px-4 py-3.5 border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none">
                  <div class="flex items-center gap-3">
                    <FileTypeIcon :type="file.type" :file-type="file.fileType" :size="20" />
                    <span class="font-medium text-[#0a0a0a] dark:text-[#fafafa] truncate max-w-xs">{{ file.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3.5 text-[#737373] font-mono text-center border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none text-xs">
                  {{ file.size || '—' }}
                </td>
                <td class="px-4 py-3.5 text-[#737373] text-center border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none text-xs">
                  {{ file.fileType || '—' }}
                </td>
                <td class="px-4 py-3.5 text-[#737373] text-center border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none text-xs">
                  {{ formatDateTime(file.updatedAt) }}
                </td>
                <td class="px-4 py-3.5 text-right border-b border-[#e5e5e5]/50 dark:border-white/5 group-last:border-none">
                  <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all"
                      :aria-label="t('knowledge.drive.details')"
                      @click.stop="openFileDrawer(file.id)"
                    >
                      <Info :size="16" />
                    </button>

                    <button
                      class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all"
                      :aria-label="t('knowledge.drive.download')"
                      @click.stop="downloadFile(file)"
                    >
                      <Download :size="16" />
                    </button>

                    <div class="relative group/menu">
                      <button class="text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] p-1.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-all" :aria-label="t('knowledge.common.moreActions')">
                        <MoreHorizontal :size="16" />
                      </button>

                      <div class="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#262626] rounded-lg shadow-lg border border-[#e5e5e5] dark:border-white/10 py-1 z-50 hidden group-hover/menu:block">
                        <button class="w-full text-left px-3 py-2 text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#333] flex items-center gap-2 transition-colors" @click.stop="openRenameModal(file)">
                          <Edit2 :size="14" /> {{ t('knowledge.drive.rename') }}
                        </button>
                        <button class="w-full text-left px-3 py-2 text-xs text-[#0a0a0a] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#333] flex items-center gap-2 transition-colors" @click.stop="downloadFile(file)">
                          <Download :size="14" /> {{ t('knowledge.drive.download') }}
                        </button>
                        <div class="h-px bg-[#e5e5e5] dark:bg-white/10 my-1"></div>
                        <button class="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors" @click.stop="handleDeleteFile(file)">
                          <Trash2 :size="14" /> {{ t('knowledge.drive.delete') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <div v-if="selectedFileId && selectedFile" class="fixed right-0 top-0 bottom-0 bg-white dark:bg-[#171717] border-l border-[#e5e5e5] dark:border-white/10 flex flex-col z-50 w-full sm:w-[380px] shadow-2xl">
          <div class="px-5 py-4 flex items-center justify-between border-b border-[#e5e5e5] dark:border-white/10">
            <span class="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{{ t('knowledge.drive.propertyDetails') }}</span>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="min-h-[44px] min-w-[44px] p-2.5 rounded-md bg-[#f5f5f5] dark:bg-[#262626] hover:bg-[#e5e5e5] dark:hover:bg-[#333] text-[#737373] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-all active:scale-95"
                    :aria-label="t('knowledge.common.close')"
                    @click="clearSelection"
                  >
                    <X :size="20" :stroke-width="2.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" :side-offset="6">{{ t('knowledge.common.close') }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div class="px-5 py-5 flex flex-col items-center border-b border-[#e5e5e5] dark:border-white/10">
            <FileTypeIcon :type="selectedFile.type" :file-type="selectedFile.fileType" :size="48" />
            <h3 class="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-3 text-center px-4 break-words max-w-full">{{ selectedFile.name }}</h3>
          </div>
          <div class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            <div v-if="drivePreviewUrl" class="w-full bg-[#f5f5f5] dark:bg-[#262626] rounded-lg border border-[#e5e5e5] dark:border-white/10 flex items-center justify-center p-3 min-h-[200px]">
              <img
                v-if="selectedFile.fileType === 'image'"
                :src="drivePreviewUrl"
                :alt="selectedFile.name"
                class="max-w-full max-h-[400px] object-contain rounded-md"
              />
              <iframe
                v-else
                :src="drivePreviewUrl"
                class="w-full h-[400px] border-none rounded-md"
              />
            </div>
            <div class="space-y-3">
              <div class="text-base font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{{ t('knowledge.drive.metadata') }}</div>
              <div class="space-y-2.5 text-[0.8125rem]">
                <div class="flex justify-between items-center">
                  <span class="text-[#737373]">{{ t('knowledge.drive.size') }}</span>
                  <span class="text-[#0a0a0a] dark:text-[#fafafa] font-mono">{{ selectedFile.size }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[#737373]">{{ t('knowledge.drive.updateTime') }}</span>
                  <span class="text-[#0a0a0a] dark:text-[#fafafa] text-right text-xs">{{ formatDateTime(selectedFile.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-5 border-t border-[#e5e5e5] dark:border-white/10 flex gap-2 shrink-0">
            <button
              class="flex-1 py-2.5 bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]! rounded-md text-[0.8125rem] font-medium flex items-center justify-center gap-2 hover:bg-[#262626] dark:hover:bg-[#e5e5e5] active:scale-95 transition-all"
              @click="downloadSelectedFile"
            >
              <Download :size="16" /> {{ t('knowledge.drive.download') }}
            </button>
            <button
              class="p-2.5 bg-transparent border border-[#e5e5e5] dark:border-white/10 text-[#737373] hover:text-red-500 hover:border-red-300 dark:hover:border-red-700 rounded-md active:scale-95 transition-all"
              :aria-label="t('knowledge.drive.delete')"
              @click="handleDeleteSelectedFile"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <div v-if="showCreateFolderModal" class="fixed inset-0 z-150 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('knowledge.drive.createFolder')">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" @click="closeCreateFolder"></div>
        <div class="relative w-full max-w-sm bg-white dark:bg-[#262626] rounded-xl p-6 space-y-5">
          <h2 class="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{{ t('knowledge.drive.createFolder') }}</h2>
          <div class="space-y-2">
            <label class="text-[0.8125rem] font-medium text-[#737373]">{{ t('knowledge.drive.folderName') }}</label>
            <input v-model="newFolderName" type="text" class="w-full px-3 py-2.5 bg-[#f5f5f5] dark:bg-[#171717] border border-[#e5e5e5] dark:border-white/10 text-[#0a0a0a] dark:text-[#fafafa] rounded-md outline-none focus:border-[#a3a3a3] dark:focus:border-white/20 transition-colors" />
          </div>
          <div class="flex gap-2 pt-1">
            <button class="flex-1 py-2.5 border border-[#e5e5e5] dark:border-white/10 text-[#0a0a0a] dark:text-[#fafafa] rounded-md font-medium hover:bg-[#f5f5f5] dark:hover:bg-[#333] active:scale-95 transition-all" @click="closeCreateFolder">{{ t('knowledge.common.cancel') }}</button>
            <button class="flex-1 py-2.5 bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]! rounded-md font-medium hover:bg-[#262626] dark:hover:bg-[#e5e5e5] active:scale-95 transition-all" @click="submitCreateFolder">{{ t('knowledge.common.create') }}</button>
          </div>
        </div>
      </div>

      <div v-if="showRenameModal" class="fixed inset-0 z-150 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('knowledge.drive.renameTitle')">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" @click="showRenameModal = false"></div>
        <div class="relative w-full max-w-sm bg-white dark:bg-[#262626] rounded-xl p-6 space-y-5">
          <h2 class="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa]">{{ t('knowledge.drive.renameTitle') }}</h2>
          <div class="space-y-2">
            <label class="text-[0.8125rem] font-medium text-[#737373]">{{ t('knowledge.drive.newName') }}</label>
            <input v-model="driveRenameName" type="text" class="w-full px-3 py-2.5 bg-[#f5f5f5] dark:bg-[#171717] border border-[#e5e5e5] dark:border-white/10 text-[#0a0a0a] dark:text-[#fafafa] rounded-md outline-none focus:border-[#a3a3a3] dark:focus:border-white/20 transition-colors" @keyup.enter="submitRename" />
          </div>
          <div class="flex gap-2 pt-1">
            <button class="flex-1 py-2.5 border border-[#e5e5e5] dark:border-white/10 text-[#0a0a0a] dark:text-[#fafafa] rounded-md font-medium hover:bg-[#f5f5f5] dark:hover:bg-[#333] active:scale-95 transition-all" @click="showRenameModal = false">{{ t('knowledge.common.cancel') }}</button>
            <button class="flex-1 py-2.5 bg-[#171717] dark:bg-[#fafafa] text-white! dark:text-[#171717]! rounded-md font-medium hover:bg-[#262626] dark:hover:bg-[#e5e5e5] active:scale-95 transition-all" @click="submitRename">{{ t('knowledge.drive.confirmRename') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
.aspect-4\/5 { aspect-ratio: 4 / 5; }
</style>

<!-- Dark mode overrides -->
<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}
</style>
