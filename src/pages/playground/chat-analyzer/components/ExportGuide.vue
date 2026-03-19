<script setup lang="ts">
/**
 * ExportGuide - 微信聊天记录导出教程弹窗
 *
 * 方案 A: CipherTalk（推荐）
 * 方案 B: WeChatMsg（备选）
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink, Download, Shield, CheckCircle } from 'lucide-vue-next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const { t } = useI18n()

const open = defineModel<boolean>('open', { default: false })

const activePlan = ref<'ciphertalk' | 'wechatmsg'>('ciphertalk')

const ciphertalkSteps = computed(() => [
  { step: 1, title: t('chatAnalyzer.exportGuide.ciphertalkStep1Title'), desc: t('chatAnalyzer.exportGuide.ciphertalkStep1Desc') },
  { step: 2, title: t('chatAnalyzer.exportGuide.ciphertalkStep2Title'), desc: t('chatAnalyzer.exportGuide.ciphertalkStep2Desc') },
  { step: 3, title: t('chatAnalyzer.exportGuide.ciphertalkStep3Title'), desc: t('chatAnalyzer.exportGuide.ciphertalkStep3Desc') },
  { step: 4, title: t('chatAnalyzer.exportGuide.ciphertalkStep4Title'), desc: t('chatAnalyzer.exportGuide.ciphertalkStep4Desc') },
])

const wechatmsgSteps = computed(() => [
  { step: 1, title: t('chatAnalyzer.exportGuide.wechatmsgStep1Title'), desc: t('chatAnalyzer.exportGuide.wechatmsgStep1Desc') },
  { step: 2, title: t('chatAnalyzer.exportGuide.wechatmsgStep2Title'), desc: t('chatAnalyzer.exportGuide.wechatmsgStep2Desc') },
  { step: 3, title: t('chatAnalyzer.exportGuide.wechatmsgStep3Title'), desc: t('chatAnalyzer.exportGuide.wechatmsgStep3Desc') },
  { step: 4, title: t('chatAnalyzer.exportGuide.wechatmsgStep4Title'), desc: t('chatAnalyzer.exportGuide.wechatmsgStep4Desc') },
])
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-lg">{{ t('chatAnalyzer.exportGuide.title') }}</DialogTitle>
        <DialogDescription class="text-base text-zinc-500 dark:text-zinc-400">
          {{ t('chatAnalyzer.exportGuide.description') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Plan Selector -->
      <div class="flex gap-2 mt-4 mb-6">
        <button
          class="flex-1 px-4 py-3 rounded-lg border text-left active:scale-[0.98] transition-all duration-200"
          :class="activePlan === 'ciphertalk'
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
            : 'border-border hover:border-border/80'"
          @click="activePlan = 'ciphertalk'"
        >
          <div class="flex items-center gap-2 mb-1">
            <Shield :size="16" class="text-emerald-600 dark:text-emerald-400" />
            <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">CipherTalk</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
              {{ t('chatAnalyzer.exportGuide.recommended') }}
            </span>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            {{ t('chatAnalyzer.exportGuide.chatLabFormat') }}
          </p>
        </button>

        <button
          class="flex-1 px-4 py-3 rounded-lg border text-left active:scale-[0.98] transition-all duration-200"
          :class="activePlan === 'wechatmsg'
            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
            : 'border-border hover:border-border/80'"
          @click="activePlan = 'wechatmsg'"
        >
          <div class="flex items-center gap-2 mb-1">
            <Download :size="16" class="text-blue-600 dark:text-blue-400" />
            <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">WeChatMsg</span>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            {{ t('chatAnalyzer.exportGuide.csvFormat') }}
          </p>
        </button>
      </div>

      <!-- Steps -->
      <div class="space-y-4">
        <div
          v-for="item in (activePlan === 'ciphertalk' ? ciphertalkSteps : wechatmsgSteps)"
          :key="item.step"
          class="flex gap-3"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
            :class="activePlan === 'ciphertalk'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'"
          >
            {{ item.step }}
          </div>
          <div class="pt-0.5">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ item.title }}</p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <!-- CipherTalk advantages -->
      <div
        v-if="activePlan === 'ciphertalk'"
        class="mt-6 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30"
      >
        <p class="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-2">{{ t('chatAnalyzer.exportGuide.advantageTitle') }}</p>
        <ul class="space-y-1">
          <li
            v-for="adv in [
              t('chatAnalyzer.exportGuide.adv1'),
              t('chatAnalyzer.exportGuide.adv2'),
              t('chatAnalyzer.exportGuide.adv3'),
              t('chatAnalyzer.exportGuide.adv4'),
            ]"
            :key="adv"
            class="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle :size="12" class="shrink-0" />
            {{ adv }}
          </li>
        </ul>
      </div>

      <!-- Footer -->
      <div class="flex justify-end mt-6">
        <DialogClose as-child>
          <Button variant="outline" size="sm" class="active:scale-95 transition-transform duration-100">
            {{ t('chatAnalyzer.exportGuide.gotIt') }}
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
</template>
