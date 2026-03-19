<script setup lang="ts">
/**
 * Chat Analyzer - 主页面
 *
 * 三栏布局：
 * - 左侧: ContactList (固定宽度 260px)
 * - 右侧上方: ContactHeader + ChatRecordPanel
 * - 右侧下方: AiDialogPanel
 * - ResizableSplitter 在上下区域之间
 *
 * 空状态（无 contact）显示 ImportWizard
 * 报告 Drawer 由 AnalysisReportDrawer 控制
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { useChatAnalyzerStore } from './stores/chatAnalyzerStore'
import { useResizable } from './composables/useResizable'
import { useAnalysis } from './composables/useAnalysis'

import ImportWizard from './components/ImportWizard.vue'
import ContactList from './components/ContactList.vue'
import ContactHeader from './components/ContactHeader.vue'
import ChatRecordPanel from './components/ChatRecordPanel.vue'
import AiDialogPanel from './components/AiDialogPanel.vue'
import ResizableSplitter from './components/ResizableSplitter.vue'
import AnalysisReportDrawer from './components/AnalysisReportDrawer.vue'
import gsap from 'gsap'

const { t } = useI18n()
const router = useRouter()
const store = useChatAnalyzerStore()

const {
  isAnalyzing,
  reportDrawerOpen,
  startAnalysis,
  openReportDrawer,
  closeReportDrawer,
} = useAnalysis()

const {
  ratio,
  isDragging,
  setContainerRef,
  onSplitterMouseDown,
} = useResizable({ initialRatio: 0.55, minRatio: 0.25, maxRatio: 0.8 })

const showImportWizard = ref(false)
const chatRecordRef = ref<InstanceType<typeof ChatRecordPanel> | null>(null)
const mainRef = ref<HTMLElement | null>(null)

const isEmptyState = computed(() => store.isEmptyState)
const hasActiveContact = computed(() => !!store.activeContact)

function goBack() {
  router.push('/playground')
}

function handleImportClick() {
  showImportWizard.value = true
}

function handleImportComplete() {
  showImportWizard.value = false
}

function handleJumpToRecord(seqStart: number) {
  chatRecordRef.value?.scrollToSeq(seqStart)
}

// Initialize store
onMounted(() => {
  store.loadContacts()

  // Entrance animation (respects prefers-reduced-motion)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (mainRef.value && !prefersReduced) {
    gsap.from(mainRef.value, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
})

onUnmounted(() => {
  if (mainRef.value) gsap.killTweensOf(mainRef.value)
})
</script>

<template>
  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
    <div
      ref="mainRef"
      class="h-[100dvh] sm:h-screen w-full flex flex-col bg-background"
    >
      <!-- Import Wizard Modal (only when explicitly triggered) -->
      <div
        v-if="showImportWizard"
        class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        :aria-label="t('chatAnalyzer.index.importDialogLabel')"
        @click.self="showImportWizard = false"
        @keydown.esc="showImportWizard = false"
      >
        <div class="relative bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
          <!-- H3: 显式关闭按钮，用户控制与自由 -->
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="absolute top-3 right-3 z-10 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-accent active:scale-95 text-muted-foreground"
                :aria-label="t('chatAnalyzer.index.closeImportWizard')"
                @click="showImportWizard = false"
              >
                <X :size="18" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="4">{{ t('chatAnalyzer.index.closeEsc') }}</TooltipContent>
          </Tooltip>
          <ImportWizard @import-complete="handleImportComplete" />
        </div>
      </div>

      <!-- Main three-column layout (always visible) -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left: Contact list -->
        <div class="w-[220px] sm:w-[260px] shrink-0">
          <ContactList @import-click="handleImportClick" />
        </div>

        <!-- Right: Content area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <!-- Contact header -->
          <ContactHeader
            @view-report="openReportDrawer"
            @start-analysis="startAnalysis()"
          />

          <!-- Content: Chat records + AI dialog -->
          <template v-if="hasActiveContact">
            <div
              :ref="(el) => setContainerRef(el as HTMLElement)"
              class="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <!-- Top: Chat records -->
              <div :style="{ flex: `0 0 ${ratio * 100}%` }" class="min-h-0 overflow-hidden flex flex-col">
                <ChatRecordPanel ref="chatRecordRef" />
              </div>

              <!-- Splitter -->
              <ResizableSplitter
                :is-dragging="isDragging"
                @mousedown="onSplitterMouseDown"
              />

              <!-- Bottom: AI dialog -->
              <div :style="{ flex: `0 0 ${(1 - ratio) * 100}%` }" class="min-h-0 overflow-hidden flex flex-col">
                <AiDialogPanel />
              </div>
            </div>
          </template>

          <!-- No active contact: H6 识别而非回忆 + H1 状态可见性 -->
          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center gap-3"
          >
            <p class="text-base text-muted-foreground">
              {{ isEmptyState ? t('chatAnalyzer.index.emptyImportHint') : t('chatAnalyzer.index.emptySelectHint') }}
            </p>
            <Button
              v-if="isEmptyState"
              variant="outline"
              size="sm"
              class="gap-1.5 active:scale-95"
              @click="handleImportClick"
            >
              {{ t('chatAnalyzer.index.importRecords') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Report Drawer -->
      <AnalysisReportDrawer
        :open="reportDrawerOpen"
        @update:open="reportDrawerOpen = $event"
        @jump-to-record="handleJumpToRecord"
      />
    </div>
  </TooltipProvider>
</template>
