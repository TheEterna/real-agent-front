<script setup lang="ts">
/**
 * ChatBubble - 聊天气泡
 *
 * 自己: 右侧绿色气泡
 * 对方: 左侧白色气泡
 * 支持情绪标记叠加
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import type { ChatRecord, Contact } from '../types'
import EmotionTag from './EmotionTag.vue'

const { t } = useI18n()

const props = defineProps<{
  record: ChatRecord
  isSelf: boolean
  senderName?: string
}>()

const bubbleRef = ref<HTMLElement | null>(null)

const timeLabel = computed(() => {
  if (!props.record.sentAt) return ''
  const d = new Date(props.record.sentAt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const isTextMessage = computed(() => props.record.msgType === 'text')

const placeholderLabel = computed(() => {
  switch (props.record.msgType) {
    case 'image': return t('chatAnalyzer.chatBubble.imageMsg')
    case 'video': return t('chatAnalyzer.chatBubble.videoMsg')
    case 'voice': return t('chatAnalyzer.chatBubble.voiceMsg')
    case 'emoji': return t('chatAnalyzer.chatBubble.emojiMsg')
    default: return t('chatAnalyzer.chatBubble.otherMsg')
  }
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
    :class="isSelf ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[75%] min-w-0"
      :class="isSelf ? 'items-end' : 'items-start'"
    >
      <!-- Sender name for non-self messages -->
      <p
        v-if="!isSelf && senderName"
        class="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5 px-2"
      >
        {{ senderName }}
      </p>

      <!-- Bubble -->
      <div
        class="px-3 py-2 rounded-2xl text-base leading-relaxed transition-colors duration-200"
        :class="isSelf
          ? 'bg-emerald-600 text-white rounded-br-sm'
          : 'bg-card text-card-foreground border border-border rounded-bl-sm'"
      >
        <template v-if="isTextMessage">
          <p class="whitespace-pre-wrap break-words">{{ record.content }}</p>
        </template>
        <template v-else>
          <p class="text-zinc-400 dark:text-zinc-500 italic text-xs">{{ placeholderLabel }}</p>
        </template>
      </div>

      <!-- Emotion tags + timestamp row -->
      <div
        class="flex items-center gap-1.5 mt-1 px-1"
        :class="isSelf ? 'justify-end' : 'justify-start'"
      >
        <EmotionTag
          v-for="(tag, idx) in record.emotions"
          :key="idx"
          :tag="tag"
        />
        <span
          v-if="timeLabel"
          class="text-[10px] text-zinc-300 dark:text-zinc-600"
        >
          {{ timeLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
