<template>
  <ADrawer
    :open="visible"
    :title="t('thesisWriter.versionHistory.title')"
    placement="right"
    :width="drawerWidth"
    @close="emit('close')"
  >
    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="p-4 rounded-lg border border-slate-100 dark:border-slate-700 animate-pulse">
        <div class="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
        <div class="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="versions.length === 0" class="flex flex-col items-center justify-center py-16">
      <History :size="36" class="mb-3 text-muted-foreground/30" />
      <p class="text-base text-muted-foreground">{{ t('thesisWriter.versionHistory.empty') }}</p>
      <p class="text-xs mt-1 text-muted-foreground/60">{{ t('thesisWriter.versionHistory.emptyHint') }}</p>
    </div>

    <!-- Version List -->
    <div v-else class="space-y-3">
      <div
        v-for="version in versions"
        :key="version.version"
        class="group p-4 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
              v{{ version.version }}
            </span>
            <span v-if="version.version === versions[0]?.version" class="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded font-medium">
              latest
            </span>
          </div>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  :aria-label="t('thesisWriter.versionHistory.restoreTooltip')"
                  class="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 active:scale-95"
                  :disabled="restoring"
                  @click="confirmRestore(version.version)"
                >
                  <RotateCcw :size="12" class="inline mr-1" />
                  {{ t('thesisWriter.versionHistory.restoreBtn') }}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.versionHistory.restoreTooltip') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span class="flex items-center gap-1">
            <Clock :size="12" />
            {{ formatTime(version.createdTime) }}
          </span>
          <span class="flex items-center gap-1">
            <FileText :size="12" />
            {{ version.wordCount }} {{ t('thesisWriter.versionHistory.wordCountUnit') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Restore Confirmation Modal -->
    <AModal
      v-model:open="showConfirm"
      :title="t('thesisWriter.versionHistory.confirmTitle')"
      centered
      :ok-button-props="{ loading: restoring }"
      :ok-text="t('thesisWriter.versionHistory.confirmOk')"
      :cancel-text="t('common.button.cancel')"
      @ok="doRestore"
      @cancel="showConfirm = false"
    >
      <p class="text-base text-slate-600 dark:text-slate-300">
        {{ t('thesisWriter.versionHistory.confirmContent', { version: pendingVersion }) }}
      </p>
    </AModal>
  </ADrawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { History, RotateCcw, Clock, FileText } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getChapterVersions, restoreChapterVersion } from '@/api/thesis-writer'
import { message, Modal as AModal, Drawer as ADrawer } from 'ant-design-vue'
import type { ChapterContent } from '@/types/thesis-writer'

const props = defineProps<{
  nodeId: string
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  restored: []
}>()

const { t } = useI18n()

// 响应式 Drawer 宽度：小屏自适应，大屏最大 400px
const drawerWidth = computed(() => {
  if (typeof window === 'undefined') return 400
  return Math.min(400, window.innerWidth * 0.92)
})

const versions = ref<ChapterContent[]>([])
const loading = ref(false)
const restoring = ref(false)
const showConfirm = ref(false)
const pendingVersion = ref(0)

async function loadVersions() {
  if (!props.nodeId) return
  loading.value = true
  try {
    const res = await getChapterVersions(props.nodeId)
    if (res.code === 200) {
      versions.value = (res.data || []).sort((a, b) => b.version - a.version)
    }
  } catch (e) {
    console.error('Failed to load versions:', e)
    message.error(t('thesisWriter.versionHistory.loadFailed'))
  } finally {
    loading.value = false
  }
}

function confirmRestore(version: number) {
  pendingVersion.value = version
  showConfirm.value = true
}

async function doRestore() {
  restoring.value = true
  try {
    const res = await restoreChapterVersion(props.nodeId, pendingVersion.value)
    if (res.code === 200) {
      message.success(t('thesisWriter.versionHistory.restoreSuccess', { version: pendingVersion.value }))
      showConfirm.value = false
      emit('restored')
      emit('close')
    }
  } catch (e) {
    console.error('Failed to restore version:', e)
    message.error(t('thesisWriter.versionHistory.restoreFailed'))
  } finally {
    restoring.value = false
  }
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

watch(() => props.visible, (val) => {
  if (val) loadVersions()
})
</script>
