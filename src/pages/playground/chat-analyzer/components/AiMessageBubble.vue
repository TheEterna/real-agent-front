<script setup lang="ts">
/**
 * AiMessageBubble - AI 对话气泡
 *
 * 两种样式：
 * - ai_advisor: AI顾问（默认色）
 * - ai_simulator: 模拟·{昵称}（警告色边框 + 标注）
 * - user: 用户消息
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bot, UserCircle } from 'lucide-vue-next'
import gsap from 'gsap'
import type { DialogMessage } from '../types'

const { t } = useI18n()

const props = defineProps<{
  message: DialogMessage
  simulatedName?: string
  isStreaming?: boolean
}>()

const bubbleRef = ref<HTMLElement | null>(null)

const isUser = computed(() => props.message.role === 'user')
const isAdvisor = computed(() => props.message.role === 'ai_advisor')
const isSimulator = computed(() => props.message.role === 'ai_simulator')

const timeLabel = computed(() => {
  const d = new Date(props.message.createdAt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

// GSAP entrance animation (respects prefers-reduced-motion)
const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (!bubbleRef.value || prefersReduced) return
  gsap.from(bubbleRef.value, {
    y: 8,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (bubbleRef.value) gsap.killTweensOf(bubbleRef.value)
})
</script>

<template>
  <div
    ref="bubbleRef"
    class="flex mb-3"
    :class="isUser ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[85%] flex gap-2"
      :class="isUser ? 'flex-row-reverse' : 'flex-row'"
    >
      <!-- Avatar -->
      <div class="shrink-0 mt-0.5">
        <!-- User avatar -->
        <div
          v-if="isUser"
          class="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"
        >
          <UserCircle :size="16" class="text-emerald-600 dark:text-emerald-400" />
        </div>
        <!-- AI Advisor avatar -->
        <div
          v-else-if="isAdvisor"
          class="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
        >
          <Bot :size="16" class="text-zinc-500 dark:text-zinc-400" />
        </div>
        <!-- Simulator avatar -->
        <div
          v-else
          class="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
        >
          <UserCircle :size="16" class="text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <!-- Content -->
      <div class="min-w-0">
        <!-- Simulator label -->
        <p
          v-if="isSimulator"
          class="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-0.5 px-1"
        >
          {{ t('chatAnalyzer.aiMessageBubble.simulatorLabel', { name: simulatedName || t('chatAnalyzer.aiMessageBubble.otherFallback') }) }}
        </p>

        <!-- Bubble -->
        <div
          class="px-3 py-2 rounded-2xl text-base leading-relaxed transition-colors duration-200"
          :class="{
            'bg-emerald-600 text-white rounded-br-sm': isUser,
            'bg-card text-card-foreground border border-border rounded-bl-sm': isAdvisor,
            'bg-amber-50 dark:bg-amber-900/10 text-zinc-800 dark:text-zinc-200 border-2 border-amber-300 dark:border-amber-700 rounded-bl-sm': isSimulator,
          }"
        >
          <p class="whitespace-pre-wrap break-words">
            {{ message.content }}
            <span
              v-if="isStreaming && !isUser"
              class="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-middle opacity-70"
            />
          </p>
        </div>

        <!-- Simulator warning -->
        <p
          v-if="isSimulator && !isStreaming"
          class="text-xs text-amber-500 dark:text-amber-500/70 mt-0.5 px-1"
        >
          {{ t('chatAnalyzer.aiMessageBubble.simulatorWarning') }}
        </p>

        <!-- Time -->
        <p
          class="text-[10px] text-zinc-300 dark:text-zinc-600 mt-0.5 px-1"
          :class="isUser ? 'text-right' : 'text-left'"
        >
          {{ timeLabel }}
        </p>
      </div>
    </div>
  </div>
</template>
