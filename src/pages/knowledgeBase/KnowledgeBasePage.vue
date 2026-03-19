<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  Search,
  Grid,
  List,
  Database,
  UploadCloud,
  RefreshCw,
  X,
  Info,
  FileSearch,
  HardDrive
} from 'lucide-vue-next'

import { useI18n } from 'vue-i18n'
import { deleteKnowledgeBase, updateKnowledgeBase, listKnowledgeBases, createKnowledgeBase, type KnowledgeBase } from '@/api/knowledgeBaseAPI'
import { uploadDriveFiles } from '@/api/drive'
import {
  ingestFilesConvert,
  listDocuments,
  updateDocument
} from '@/api/knowledge'
import { message, Modal as AntModal } from 'ant-design-vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import MemberTierProvider from '@/components/MemberTierProvider.vue'
import { useAuthStore } from '@/stores/authStore'
import { useModalRoute } from '@/composables/useModalRoute'
import { bytesToSize, guessFileType, withLock, type FileNode, type ParseStatus } from '@/composables/useFileUtils'

const { t } = useI18n()

// 子组件
import FileTypeIcon from './components/FileTypeIcon.vue'
import StatusBadge from './components/StatusBadge.vue'
import DatasetItem from "@/pages/knowledgeBase/components/DatasetItem.vue"
import KnowledgeChatPanel from './components/KnowledgeChatPanel.vue'

// --- State ---
const knowledgeBases = ref<KnowledgeBase[]>([])
const knowledgeDocList = ref<FileNode[]>([])

const router = useRouter()
const route = useRoute()
const viewMode = ref<'list' | 'grid'>('list')
const selectedFileId = ref<string | null>(null)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const activeKnowledgeBaseId = ref<string | null>(null)

const showCreateKbModal = ref(false)
const isRefreshingKb = ref(false)
const isRefreshingDocs = ref(false)
const isUploading = ref(false)
const isLoadingKbTree = ref(false)
const isLoadingDocs = ref(false)
const kbTreeError = ref<string | null>(null)
const docsError = ref<string | null>(null)

const newKbName = ref('')
const newKbDescription = ref('')
const newKbIconFile = ref<File | null>(null)
const newKbIconPreviewUrl = ref<string | null>(null)
const isCreatingKb = ref(false)

const authStore = useAuthStore()
const tier = computed(() => authStore.user?.tier ?? 'free')
const isProPlus = computed(() => tier.value === 'pro' || tier.value === 'turbo')

const { openPricing } = useModalRoute()

const inFlightKeys = new Set<string>()

// --- Helper Functions ---
const mapRagflowRunStatusToParseStatus = (run: string): ParseStatus => {
  if (run === '1' || run === 'RUNNING') return 'parsing'
  if (run === '3' || run === 'DONE') return 'success'
  if (run === '4' || run === 'FAIL') return 'error'
  return 'pending'
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Invalid file read result'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const loadImageFromFile = (file: File): Promise<{ img: HTMLImageElement; url: string }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

const canvasToDataUrl = (canvas: HTMLCanvasElement, mime: string, quality?: number): string => {
  try {
    return typeof quality === 'number' ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime)
  } catch (e) {
    return canvas.toDataURL('image/jpeg', 0.85)
  }
}

const fileToAvatarDataUrl = async (file: File): Promise<string> => {
  const MAX_LEN = 65535
  const inputDataUrl = await readFileAsDataUrl(file)
  if (inputDataUrl.length <= MAX_LEN) return inputDataUrl

  const { img, url } = await loadImageFromFile(file)
  try {
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const sizeCandidates = [256, 192, 160, 128, 96]

    for (const maxSide of sizeCandidates) {
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      const scale = Math.min(1, maxSide / Math.max(w, h))
      const targetW = Math.max(1, Math.round(w * scale))
      const targetH = Math.max(1, Math.round(h * scale))

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      ctx.clearRect(0, 0, targetW, targetH)
      ctx.drawImage(img, 0, 0, targetW, targetH)

      const qualities = mime === 'image/png' ? [0.92, 0.85, 0.78, 0.7] : [0.85, 0.75, 0.65, 0.55, 0.45]
      for (const q of qualities) {
        const out = canvasToDataUrl(canvas, mime, q)
        if (out.length <= MAX_LEN) return out
      }
    }

    throw new Error('Icon is too large')
  } finally {
    URL.revokeObjectURL(url)
  }
}

// --- Methods ---
const refreshKnowledgeBases = async () => {
  const resp = await listKnowledgeBases()
  if (resp.code === 200) {
    knowledgeBases.value = resp.data
    kbTreeError.value = null
    const existed = activeKnowledgeBaseId.value && knowledgeBases.value.some(k => k.id === activeKnowledgeBaseId.value)
    if (!existed && knowledgeBases.value.length > 0) {
      activeKnowledgeBaseId.value = knowledgeBases.value[0].id
    }
    return
  }
  kbTreeError.value = resp.message || t('knowledge.base.loadKbListFailed')
  throw new Error(kbTreeError.value)
}

const handleRefreshKb = async () => {
  if (isRefreshingKb.value) return
  isRefreshingKb.value = true
  try {
    await refreshKnowledgeBases()
    message.success(t('knowledge.base.refreshSuccess'))
  } catch (err) {
    message.error(t('knowledge.base.refreshFailed'))
  } finally {
    isRefreshingKb.value = false
  }
}

const docsRequestSeq = ref(0)
const refreshActiveDatasetDocuments = async () => {
  const kb = activeKnowledgeBase.value
  if (!kb?.ragflowDatasetId) {
    knowledgeDocList.value = []
    docsError.value = null
    return
  }
  isLoadingDocs.value = true
  const seq = ++docsRequestSeq.value
  try {
    const resp = await listDocuments(kb.ragflowDatasetId, { page: 1, pageSize: 200, orderBy: 'create_time', desc: true })
    if (seq !== docsRequestSeq.value) {
      return
    }
    if (resp.code !== 200) {
      docsError.value = resp.message || t('knowledge.base.loadDocListFailed')
      knowledgeDocList.value = []
      return
    }
    docsError.value = null
    knowledgeDocList.value = resp.data.map(doc => {
      const runStatus = String(doc.run)
      return {
        id: doc.id,
        name: doc.name,
        type: 'file' as const,
        fileType: guessFileType(doc.type, doc.name),
        size: bytesToSize(doc.size),
        updatedAt: doc.createTime ? new Date(doc.createTime).toLocaleString() : '—',
        status: mapRagflowRunStatusToParseStatus(runStatus),
        chunks: doc.chunkCount || 0,
        ragflowDocumentId: doc.id
      }
    })
  } catch (e) {
    if (seq === docsRequestSeq.value) {
      docsError.value = t('knowledge.base.loadDocListFailed')
      knowledgeDocList.value = []
    }
  } finally {
    if (seq === docsRequestSeq.value) {
      isLoadingDocs.value = false
    }
  }
}

const handleRefreshDocs = async () => {
  if (isRefreshingDocs.value) return
  isRefreshingDocs.value = true
  try {
    await refreshActiveDatasetDocuments()
    message.success(t('knowledge.base.refreshSuccess'))
  } catch (err) {
    message.error(t('knowledge.base.refreshFailed'))
  } finally {
    isRefreshingDocs.value = false
  }
}

// --- Computed ---
const currentFileList = computed(() => knowledgeDocList.value)
const selectedFile = computed(() => currentFileList.value.find(f => f.id === selectedFileId.value))
const activeKnowledgeBase = computed(() => knowledgeBases.value.find(d => d.id === activeKnowledgeBaseId.value))

const visibleFileList = computed(() => {
  const q = debouncedSearchQuery.value.trim().toLowerCase()
  if (!q) return currentFileList.value
  return currentFileList.value.filter(f => (f.name || '').toLowerCase().includes(q))
})

const filteredFileList = computed(() => visibleFileList.value)

// --- Interaction Handlers ---
const goBack = () => router.push('/playground')
const clearSelection = () => { selectedFileId.value = null }
const openFileDrawer = (id: string) => { selectedFileId.value = id }
const selectKnowledgeBase = (id: string) => { activeKnowledgeBaseId.value = id }

const openCreateKb = () => {
  newKbName.value = ''
  newKbDescription.value = ''
  newKbIconFile.value = null
  newKbIconPreviewUrl.value = null
  showCreateKbModal.value = true
}

const closeCreateKb = () => { showCreateKbModal.value = false }

const handleKbIconChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    newKbIconFile.value = file
    const reader = new FileReader()
    reader.onload = () => {
      newKbIconPreviewUrl.value = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

const uploadInputRef = ref<HTMLInputElement | null>(null)
const kbIconInputRef = ref<HTMLInputElement | null>(null)
const editKbIconInputRef = ref<HTMLInputElement | null>(null)
const openUploadDialog = () => {
  if (isUploading.value) return
  if (!activeKnowledgeBase.value?.ragflowDatasetId) {
    message.warning(t('knowledge.common.selectKb'))
    return
  }
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
      const kb = activeKnowledgeBase.value
      const up = await uploadDriveFiles(files, { scene: 'knowledgeBase', kbName: kb?.name })
      if (up.code !== 200) {
        message.error(up.message || t('knowledge.drive.uploadFailed'))
        return
      }
      if (kb?.ragflowDatasetId) {
        const fileIds = up.data.map(x => x.fileId)
        await ingestFilesConvert({ fileIds, datasetId: kb.ragflowDatasetId })
        await refreshActiveDatasetDocuments()
      }
    } finally {
      isUploading.value = false
    }
  })
}

const submitCreateKb = async () => {
  const name = newKbName.value.trim()
  if (!name) {
    message.warning(t('knowledge.base.kbNameRequired'))
    return
  }
  if (isCreatingKb.value) return
  isCreatingKb.value = true
  let avatar: string | null = null
  if (newKbIconFile.value) {
    try {
      avatar = await fileToAvatarDataUrl(newKbIconFile.value)
    } catch (e) {
      message.warning(t('knowledge.base.iconTooLarge'))
      isCreatingKb.value = false
      return
    }
  }
  try {
    const resp = await createKnowledgeBase({
      name,
      description: newKbDescription.value || null,
      avatar
    })
    if (resp.code === 200) {
      await refreshKnowledgeBases()
      activeKnowledgeBaseId.value = resp.data.id
      closeCreateKb()
    } else {
      message.error(resp.message || t('knowledge.base.createFailed'))
    }
  } finally {
    isCreatingKb.value = false
  }
}

const openRetrieve = () => {
  router.push({
    path: '/knowledge/retrieve',
    query: activeKnowledgeBaseId.value ? { kbId: activeKnowledgeBaseId.value } : {}
  })
}

const handleEditKb = (kb: KnowledgeBase) => {
  editingKb.value = {
    ...kb,
    iconFile: null,
    iconPreviewUrl: kb.avatar || null
  }
  showEditKbModal.value = true
}

const handleEditKbIconChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    editingKb.value.iconFile = file
    const reader = new FileReader()
    reader.onload = () => {
      editingKb.value.iconPreviewUrl = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleDeleteKb = (kb: KnowledgeBase) => {
  AntModal.confirm({
    title: t('knowledge.base.deleteKbTitle'),
    content: t('knowledge.base.deleteKbConfirm', { name: kb.name }),
    async onOk() {
      const resp = await deleteKnowledgeBase(kb.id)
      if (resp.code === 200) {
        await refreshKnowledgeBases()
        if (activeKnowledgeBaseId.value === kb.id) activeKnowledgeBaseId.value = null
      }
    }
  })
}

const handleFileRowClick = (file: FileNode) => {
  if (!file.ragflowDocumentId) return
  router.push({
    path: '/knowledge/document',
    query: { kbId: activeKnowledgeBaseId.value || undefined, docId: file.ragflowDocumentId, name: file.name }
  })
}

// --- Knowledge Management ---
const isUpdatingKb = ref(false)
const isUpdatingDoc = ref(false)
const showEditKbModal = ref(false)
const showEditDocModal = ref(false)
const editingKb = ref<Partial<KnowledgeBase> & { iconFile?: File | null; iconPreviewUrl?: string | null }>({})
const editingDoc = ref<{ id: string; name: string }>({ id: '', name: '' })

const openEditDoc = (file: FileNode) => {
  editingDoc.value = { id: file.id, name: file.name }
  showEditDocModal.value = true
}
const closeEditDocModal = () => { showEditDocModal.value = false }
const submitUpdateDoc = async () => {
  const kb = activeKnowledgeBase.value
  if (!kb?.ragflowDatasetId || !editingDoc.value.id) return
  if (isUpdatingDoc.value) return
  isUpdatingDoc.value = true
  try {
    const resp = await updateDocument(kb.ragflowDatasetId, editingDoc.value.id, { name: editingDoc.value.name })
    if (resp.code === 200) {
      await refreshActiveDatasetDocuments()
      closeEditDocModal()
    }
  } finally { isUpdatingDoc.value = false }
}

const closeEditKbModal = () => { showEditKbModal.value = false; editingKb.value = {} }
const submitUpdateKb = async () => {
  if (!editingKb.value.name || !editingKb.value.id) return
  if (isUpdatingKb.value) return
  isUpdatingKb.value = true
  try {
    let avatar: string | null = null
    if (editingKb.value.iconFile) {
      try {
        avatar = await fileToAvatarDataUrl(editingKb.value.iconFile)
      } catch (e) {
        message.warning(t('knowledge.base.iconTooLarge'))
        return
      }
    }
    const resp = await updateKnowledgeBase(editingKb.value.id, {
      name: editingKb.value.name,
      description: editingKb.value.description,
      avatar
    })
    if (resp.code === 200) {
      await refreshKnowledgeBases()
      closeEditKbModal()
      message.success(t('knowledge.base.updateSuccess'))
    } else {
      message.error(resp.message || t('knowledge.base.updateFailed'))
    }
  } catch (err) {
    message.error(t('knowledge.base.updateRetryFailed'))
  } finally {
    isUpdatingKb.value = false
  }
}

// --- Lifecycle & Watches ---
onMounted(async () => {
  isLoadingKbTree.value = true
  try {
    await refreshKnowledgeBases()
  } catch (e) {
  } finally {
    isLoadingKbTree.value = false
  }
  await refreshActiveDatasetDocuments()
})

watch(activeKnowledgeBaseId, async (id) => {
  if ((route.query.kbId as string | undefined) !== (id || undefined)) {
    await router.replace({ query: { ...route.query, kbId: id || undefined } })
  }
  clearSelection()
  await refreshActiveDatasetDocuments()
})

watch(searchQuery, (val, _old, onCleanup) => {
  const timer = window.setTimeout(() => {
    debouncedSearchQuery.value = val
  }, 500)
  onCleanup(() => window.clearTimeout(timer))
}, { immediate: true })
</script>

<template>
  <div class="kb-page h-full flex bg-background relative overflow-hidden w-full font-sans selection:bg-primary/10 selection:text-primary">
    <input ref="uploadInputRef" type="file" class="hidden" multiple @change="handleUploadChange" />

    <!-- ===== LEFT SIDEBAR ===== -->
    <aside class="kb-sidebar w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <!-- Sidebar Header: Org / Back -->
      <div class="h-14 px-4 flex items-center gap-3 border-b border-sidebar-border shrink-0">
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="min-h-[44px] min-w-[44px] p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all active:scale-95" :aria-label="t('knowledge.common.back')" @click="goBack">
                <ArrowLeft :size="18" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" :side-offset="6">{{ t('knowledge.common.back') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span class="text-base font-semibold text-sidebar-foreground truncate">{{ t('knowledge.base.title') }}</span>
      </div>

      <!-- Navigation Section -->
      <nav class="px-3 py-4 space-y-1" aria-label="Knowledge navigation">
        <div class="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</div>
        <button
          class="kb-nav-item kb-nav-item--active"
          aria-current="page"
        >
          <Database :size="16" />
          <span>{{ t('knowledge.base.title') }}</span>
        </button>
        <button
          class="kb-nav-item"
          @click="$router.push('/knowledge/drive')"
        >
          <HardDrive :size="16" />
          <span>{{ t('knowledge.base.cloudDrive') }}</span>
        </button>
        <button
          class="kb-nav-item"
          @click="openRetrieve"
        >
          <FileSearch :size="16" />
          <span>{{ t('knowledge.base.retrievalTest') }}</span>
        </button>
      </nav>

      <!-- Datasets List -->
      <div class="flex-1 flex flex-col min-h-0 border-t border-sidebar-border">
        <div class="px-5 pt-4 pb-2 flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ t('knowledge.base.title') }}</span>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button :disabled="isRefreshingKb || isLoadingKbTree" class="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors" :aria-label="t('knowledge.base.refreshKbList')" @click="handleRefreshKb"><RefreshCw :size="12" :class="{ 'animate-spin': isRefreshingKb || isLoadingKbTree }" /></button>
              </TooltipTrigger>
              <TooltipContent side="right" :side-offset="6">{{ t('knowledge.common.refresh') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
          <div v-if="isLoadingKbTree" class="space-y-1 px-1">
            <div v-for="i in 5" :key="i" class="flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <div class="w-7 h-7 rounded-md bg-muted animate-pulse shrink-0"></div>
              <div class="h-4 flex-1 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          <div v-else-if="kbTreeError" class="px-3 py-3">
            <div class="p-4 rounded-lg bg-card border border-border">
              <div class="text-[0.8125rem] font-semibold text-card-foreground">{{ t('knowledge.base.loadFailed') }}</div>
              <div class="text-xs text-muted-foreground mt-1 break-words">{{ kbTreeError }}</div>
              <button class="min-h-[36px] mt-3 w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 active:scale-95 transition-all" @click="handleRefreshKb">{{ t('knowledge.common.retry') }}</button>
            </div>
          </div>
          <div v-else-if="knowledgeBases.length === 0" class="px-3 py-3">
            <div class="p-4 rounded-lg bg-card border border-border">
              <div class="text-[0.8125rem] font-semibold text-card-foreground">{{ t('knowledge.base.noKb') }}</div>
              <div class="text-xs text-muted-foreground mt-1 mb-2">{{ t('knowledge.base.noKbHint') }}</div>
              <button class="min-h-[36px] mt-2 w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 active:scale-95 transition-all" @click="openCreateKb">{{ t('knowledge.base.createKb') }}</button>
            </div>
          </div>
          <div v-else class="space-y-0.5" role="list" :aria-label="t('knowledge.base.kbList')">
            <DatasetItem v-for="ds in knowledgeBases" :key="ds.id" :data="ds" :level="0" :is-active="activeKnowledgeBaseId === ds.id" @click="selectKnowledgeBase(ds.id)" @edit="handleEditKb(ds)" @delete="handleDeleteKb(ds)" />
          </div>
        </div>
      </div>

      <!-- Create New Dataset button at sidebar bottom -->
      <div class="p-3 border-t border-sidebar-border shrink-0">
        <button class="min-h-[40px] w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-[0.8125rem] font-medium hover:opacity-90 active:scale-95 transition-all" @click="openCreateKb">
          <Plus :size="15" />
          <span>{{ t('knowledge.base.newKb') }}</span>
        </button>
      </div>
    </aside>

    <!-- ===== MAIN CONTENT ===== -->
    <main class="flex-1 flex flex-col bg-background min-w-0 relative">
      <!-- Page Header -->
      <div class="px-8 lg:px-10 pt-8 pb-0">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground leading-tight">{{ t('knowledge.base.title') }}</h1>
            <p class="text-base text-muted-foreground mt-1">{{ activeKnowledgeBase?.name || t('knowledge.common.noKbSelected') }}</p>
          </div>
          <button
            :disabled="isUploading || !activeKnowledgeBase?.ragflowDatasetId"
            :class="[
              'min-h-[40px] flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-[0.8125rem] font-medium shadow-sm transition-all',
              (isUploading || !activeKnowledgeBase?.ragflowDatasetId) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
            ]"
            @click="openUploadDialog"
          >
            <Plus :size="16" />
            <span>{{ isUploading ? t('knowledge.common.uploading') : t('knowledge.common.upload') }}</span>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="flex items-center gap-3 mt-6">
          <div class="relative flex-1">
            <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              inputmode="search"
              autocomplete="off"
              :aria-label="t('knowledge.base.searchPlaceholder')"
              :placeholder="t('knowledge.base.searchPlaceholder')"
              class="min-h-[40px] w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-[0.8125rem] text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <div class="flex items-center border border-input rounded-lg p-0.5">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button :class="['p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-all active:scale-95', viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground']" :aria-label="t('knowledge.base.gridView')" @click="viewMode = 'grid'"><Grid :size="15" /></button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6">{{ t('knowledge.base.gridView') }}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button :class="['p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md transition-all active:scale-95', viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground']" :aria-label="t('knowledge.base.listView')" @click="viewMode = 'list'"><List :size="15" /></button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6">{{ t('knowledge.base.listView') }}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-8 lg:px-10 py-6">
        <!-- Loading skeleton: card grid -->
        <div v-if="isLoadingDocs" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div v-for="i in 6" :key="i" class="kb-card p-0">
            <div class="p-5 pb-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-muted animate-pulse"></div>
                <div>
                  <div class="h-4 w-28 bg-muted animate-pulse rounded mb-2"></div>
                  <div class="h-3 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
              <div class="h-5 w-14 bg-muted animate-pulse rounded-full"></div>
            </div>
            <div class="px-5 pb-5 space-y-3">
              <div class="flex justify-between"><div class="h-3 w-20 bg-muted animate-pulse rounded"></div><div class="h-3 w-12 bg-muted animate-pulse rounded"></div></div>
              <div class="flex gap-2"><div class="h-8 w-16 bg-muted animate-pulse rounded-md"></div><div class="h-8 w-16 bg-muted animate-pulse rounded-md"></div></div>
            </div>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="docsError" class="py-10">
          <div class="max-w-md mx-auto p-6 rounded-lg bg-card border border-border">
            <div class="text-base font-semibold text-card-foreground">{{ t('knowledge.base.loadFailed') }}</div>
            <div class="text-xs text-muted-foreground mt-1 break-words">{{ docsError }}</div>
            <button class="min-h-[40px] mt-4 w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-[0.8125rem] font-medium hover:opacity-90 active:scale-95 transition-all" @click="handleRefreshDocs">{{ t('knowledge.common.retry') }}</button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredFileList.length === 0" class="py-16">
          <div class="max-w-md mx-auto p-8 rounded-lg bg-card border border-border text-center">
            <div class="w-12 h-12 mx-auto rounded-lg bg-muted flex items-center justify-center mb-4">
              <Database :size="24" class="text-muted-foreground" />
            </div>
            <div class="text-base font-semibold text-card-foreground">{{ t('knowledge.base.noFiles') }}</div>
            <div class="text-[0.8125rem] text-muted-foreground mt-2 mb-6">{{ t('knowledge.base.noFilesHint') }}</div>
            <button
              :disabled="isUploading || !activeKnowledgeBase?.ragflowDatasetId"
              :class="[
                'min-h-[40px] w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-[0.8125rem] font-medium flex items-center justify-center gap-2 transition-all',
                (isUploading || !activeKnowledgeBase?.ragflowDatasetId) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
              ]"
              @click="openUploadDialog"
            >
              <UploadCloud :size="16" :class="{ 'animate-spin': isUploading }" />
              <span>{{ isUploading ? t('knowledge.common.uploading') : t('knowledge.common.upload') }}</span>
            </button>
          </div>
        </div>

        <!-- List view -->
        <div v-else-if="viewMode === 'list'" class="kb-card overflow-hidden">
          <table class="w-full text-left border-separate border-spacing-0">
            <thead>
            <tr class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th class="px-6 py-3 border-b border-border">{{ t('knowledge.base.colFileName') }}</th>
              <th class="px-4 py-3 text-center border-b border-border">{{ t('knowledge.base.colSize') }}</th>
              <th class="px-4 py-3 text-center border-b border-border">{{ t('knowledge.base.colParseStatus') }}</th>
              <th class="px-4 py-3 text-center border-b border-border">{{ t('knowledge.base.colUpdateTime') }}</th>
              <th class="px-6 py-3 text-right border-b border-border">{{ t('knowledge.base.colActions') }}</th>
            </tr>
            </thead>
            <tbody class="text-[0.8125rem]">
            <tr v-for="file in filteredFileList" :key="file.id" class="group hover:bg-accent/50 transition-colors cursor-pointer" @click="handleFileRowClick(file)">
              <td class="px-6 py-4 border-b border-border/50 group-last:border-none">
                <div class="flex items-center gap-3">
                  <FileTypeIcon :type="file.type" :file-type="file.fileType" :size="22" />
                  <span class="font-medium text-foreground truncate max-w-xs">{{ file.name }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-muted-foreground font-mono text-xs text-center border-b border-border/50 group-last:border-none">
                {{ file.size || '—' }}
              </td>
              <td class="px-4 py-4 text-center border-b border-border/50 group-last:border-none">
                <div class="flex justify-center"><StatusBadge :status="file.status" /></div>
              </td>
              <td class="px-4 py-4 text-muted-foreground text-xs text-center border-b border-border/50 group-last:border-none">
                {{ file.updatedAt || '—' }}
              </td>
              <td class="px-6 py-4 text-right border-b border-border/50 group-last:border-none">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="text-foreground hover:text-primary font-medium px-3 py-1.5 rounded-md hover:bg-accent transition-all flex items-center gap-1 text-xs"
                    @click.stop="handleFileRowClick(file)"
                  >
                    <Info :size="14" />
                    <span>{{ t('knowledge.common.details') }}</span>
                  </button>
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Grid view: 3-column dataset cards matching design -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div
            v-for="file in filteredFileList"
            :key="file.id"
            role="button"
            tabindex="0"
            :aria-label="t('knowledge.drive.openFile', { name: file.name })"
            class="kb-card kb-card--interactive group"
            @click="handleFileRowClick(file)"
            @keydown.enter="handleFileRowClick(file)"
            @keydown.space.prevent="handleFileRowClick(file)"
          >
            <!-- Card Header: icon + name + badge -->
            <div class="flex items-center justify-between p-5 pb-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <FileTypeIcon :type="file.type" :file-type="file.fileType" :size="20" />
                </div>
                <div class="min-w-0">
                  <div class="text-base font-semibold text-card-foreground truncate">{{ file.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ file.chunks || 0 }} chunks</div>
                </div>
              </div>
              <StatusBadge :status="file.status" />
            </div>
            <!-- Card Body: meta + actions -->
            <div class="px-5 pb-5 space-y-3">
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>{{ file.updatedAt || '—' }}</span>
                <span class="font-mono">{{ file.size || '—' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input text-xs font-medium text-foreground hover:bg-accent transition-all active:scale-95"
                  @click.stop="handleFileRowClick(file)"
                >
                  <Info :size="13" />
                  <span>{{ t('knowledge.common.details') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Create KB Modal -->
      <div v-if="showCreateKbModal" class="fixed inset-0 z-150 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('knowledge.base.createKb')">
        <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" aria-hidden="true" @click="closeCreateKb"></div>
        <div class="relative w-full max-w-lg bg-popover text-popover-foreground rounded-xl p-6 shadow-lg border border-border">
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="absolute right-4 top-4 min-h-[36px] min-w-[36px] grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" :aria-label="t('knowledge.common.close')" @click="closeCreateKb">
                  <X :size="16" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="6">{{ t('knowledge.common.close') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div class="space-y-5">
            <div>
              <div class="text-lg font-semibold text-foreground">{{ t('knowledge.base.createKbTitle') }}</div>
              <div class="text-[0.8125rem] text-muted-foreground mt-1">{{ t('knowledge.base.createKbSubtitle') }}</div>
            </div>
            <div>
              <div class="text-xs font-medium text-muted-foreground mb-2">{{ t('knowledge.base.kbIcon') }}</div>
              <div class="flex items-center gap-4">
                <div v-if="newKbIconPreviewUrl" class="w-12 h-12 rounded-lg overflow-hidden border border-border bg-card">
                  <img :src="newKbIconPreviewUrl" alt="icon" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-12 h-12 rounded-lg border border-border bg-accent flex items-center justify-center">
                  <Database :size="20" class="text-muted-foreground" />
                </div>
                <div class="flex-1">
                  <div class="text-xs text-muted-foreground">{{ t('knowledge.base.kbIconHint') }}</div>
                  <button class="mt-2 min-h-[36px] px-4 py-2 bg-secondary hover:bg-accent rounded-md text-xs font-medium text-secondary-foreground transition-all" @click="kbIconInputRef?.click()">{{ t('knowledge.base.selectIcon') }}</button>
                  <input ref="kbIconInputRef" type="file" class="hidden" accept="image/*" @change="handleKbIconChange" />
                </div>
              </div>
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.kbName') }}</label>
              <input v-model="newKbName" type="text" :placeholder="t('knowledge.base.kbNamePlaceholder')" class="mt-1.5 min-h-[40px] w-full px-3 py-2 bg-background border border-input rounded-lg outline-none text-[0.8125rem] text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.kbDescription') }}</label>
              <textarea v-model="newKbDescription" rows="3" :placeholder="t('knowledge.base.kbDescriptionPlaceholder')" class="mt-1.5 w-full px-3 py-2 bg-background border border-input rounded-lg outline-none text-[0.8125rem] text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/20 resize-none"></textarea>
            </div>
            <div class="flex items-center justify-end gap-3 pt-1">
              <button class="min-h-[40px] px-5 py-2.5 border border-input rounded-lg font-medium text-foreground hover:bg-accent active:scale-95 transition-all text-[0.8125rem]" @click="closeCreateKb">{{ t('knowledge.common.cancel') }}</button>
              <button :disabled="isCreatingKb" :class="['min-h-[40px] px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-all active:scale-95 text-[0.8125rem]', isCreatingKb ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90']" @click="submitCreateKb">
                <RefreshCw v-if="isCreatingKb" :size="14" class="animate-spin" />
                <span>{{ isCreatingKb ? t('knowledge.common.creating') : t('knowledge.base.submitCreate') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit KB Modal -->
      <div v-if="showEditKbModal" class="fixed inset-0 z-150 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('knowledge.base.editKbTitle')">
        <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" aria-hidden="true" @click="closeEditKbModal"></div>
        <div class="relative w-full max-w-md bg-popover text-popover-foreground rounded-xl p-6 shadow-lg border border-border space-y-5">
          <h2 class="text-lg font-semibold text-foreground">{{ t('knowledge.base.editKbTitle') }}</h2>
          <div class="space-y-4">
            <div>
              <label class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.labelName') }}</label>
              <input v-model="editingKb.name" type="text" class="w-full px-3 py-2 bg-background border border-input rounded-lg outline-none mt-1.5 text-foreground text-[0.8125rem] focus:ring-2 focus:ring-ring/20" />
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.labelDescription') }}</label>
              <textarea v-model="editingKb.description" class="w-full px-3 py-2 bg-background border border-input rounded-lg outline-none mt-1.5 text-foreground text-[0.8125rem] resize-none focus:ring-2 focus:ring-ring/20" rows="3"></textarea>
            </div>
            <div>
              <label class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.labelIcon') }}</label>
              <div class="mt-1.5 flex items-center gap-3">
                <div v-if="editingKb.iconPreviewUrl" class="w-10 h-10 rounded-lg overflow-hidden border border-border">
                  <img :src="editingKb.iconPreviewUrl" alt="icon" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Database :size="18" class="text-muted-foreground" />
                </div>
                <button class="px-3 py-1.5 bg-secondary hover:bg-accent rounded-md text-xs font-medium text-secondary-foreground transition-all" @click="editKbIconInputRef?.click()">{{ t('knowledge.base.selectIcon') }}</button>
                <input ref="editKbIconInputRef" type="file" class="hidden" accept="image/*" @change="handleEditKbIconChange" />
              </div>
            </div>
            <div class="pt-1">
              <div class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.ragflowInfo') }}</div>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <div class="px-3 py-2 bg-accent rounded-md">
                  <div class="text-xs text-muted-foreground font-medium">{{ t('knowledge.base.ragflowDocs') }}</div>
                  <div class="text-xs font-mono text-foreground">{{ editingKb.documentCount ?? '—' }}</div>
                </div>
                <div class="px-3 py-2 bg-accent rounded-md">
                  <div class="text-xs text-muted-foreground font-medium">Chunks</div>
                  <div class="text-xs font-mono text-foreground">{{ editingKb.chunkCount ?? '—' }}</div>
                </div>
                <div class="px-3 py-2 bg-accent rounded-md">
                  <div class="text-xs text-muted-foreground font-medium">Tokens</div>
                  <div class="text-xs font-mono text-foreground">{{ editingKb.tokenNum ?? '—' }}</div>
                </div>
                <div class="px-3 py-2 bg-accent rounded-md">
                  <div class="text-xs text-muted-foreground font-medium">{{ t('knowledge.base.ragflowChunkMethod') }}</div>
                  <div class="text-xs font-mono text-foreground">{{ editingKb.chunkMethod || '—' }}</div>
                </div>
                <div class="px-3 py-2 bg-accent rounded-md">
                  <div class="text-xs text-muted-foreground font-medium">Embedding</div>
                  <div class="text-xs font-mono text-foreground truncate">{{ editingKb.embeddingModel || '—' }}</div>
                </div>
                <div class="px-3 py-2 bg-accent rounded-md">
                  <div class="text-xs text-muted-foreground font-medium">{{ t('knowledge.base.ragflowPermission') }}</div>
                  <div class="text-xs font-mono text-foreground">{{ editingKb.permission || '—' }}</div>
                </div>
              </div>
              <div class="mt-2 px-3 py-2 bg-accent rounded-md">
                <div class="text-xs text-muted-foreground font-medium">Dataset ID</div>
                <div class="text-xs font-mono text-foreground break-all">{{ editingKb.ragflowDatasetId || '—' }}</div>
              </div>
            </div>
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 py-2.5 border border-input rounded-lg font-medium text-foreground hover:bg-accent active:scale-95 transition-all text-[0.8125rem]" @click="closeEditKbModal">{{ t('knowledge.common.cancel') }}</button>
            <button :disabled="isUpdatingKb" :class="['flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-[0.8125rem]', isUpdatingKb ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-95']" @click="submitUpdateKb">
              <RefreshCw v-if="isUpdatingKb" :size="14" class="animate-spin" />
              <span>{{ isUpdatingKb ? t('knowledge.common.saving') : t('knowledge.common.save') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Doc Modal -->
      <div v-if="showEditDocModal" class="fixed inset-0 z-150 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('knowledge.base.editDocTitle')">
        <div class="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" aria-hidden="true" @click="closeEditDocModal"></div>
        <div class="relative w-full max-w-sm bg-popover text-popover-foreground rounded-xl p-6 shadow-lg border border-border space-y-5">
          <h2 class="text-lg font-semibold text-foreground">{{ t('knowledge.base.editDocTitle') }}</h2>
          <div class="space-y-2">
            <label class="text-xs font-medium text-muted-foreground">{{ t('knowledge.base.newName') }}</label>
            <input v-model="editingDoc.name" type="text" class="w-full px-3 py-2 bg-background border border-input rounded-lg outline-none text-foreground text-[0.8125rem] focus:ring-2 focus:ring-ring/20" @keyup.enter="submitUpdateDoc" />
          </div>
          <div class="flex gap-3 pt-1">
            <button class="flex-1 py-2.5 border border-input rounded-lg font-medium text-foreground hover:bg-accent active:scale-95 transition-all text-[0.8125rem]" @click="closeEditDocModal">{{ t('knowledge.common.cancel') }}</button>
            <button class="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all text-[0.8125rem]" @click="submitUpdateDoc">{{ t('knowledge.common.confirm') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Knowledge Chat Panel -->
    <KnowledgeChatPanel
      v-if="activeKnowledgeBase?.ragflowDatasetId"
      :dataset-ids="[activeKnowledgeBase.ragflowDatasetId]"
      :knowledge-base-name="activeKnowledgeBase.name || t('knowledge.base.defaultKbName')"
    />
  </div>
</template>

<style scoped>
/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }

/* Card base */
.kb-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 200ms, border-color 200ms;
}

.kb-card--interactive:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--ring);
}

.kb-card--interactive:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--ring);
}

/* Navigation items */
.kb-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--sidebar-foreground);
  transition: background 150ms, color 150ms;
  cursor: pointer;
  border: none;
  background: transparent;
  text-align: left;
}

.kb-nav-item:hover {
  background: var(--sidebar-accent);
  color: var(--sidebar-accent-foreground);
}

.kb-nav-item--active {
  background: var(--sidebar-accent);
  color: var(--sidebar-primary);
  font-weight: 500;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .kb-page .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
  }
  .kb-page .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .kb-page .kb-card {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .kb-page .kb-card--interactive:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>
