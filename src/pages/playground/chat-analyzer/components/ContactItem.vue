<script setup lang="ts">
/**
 * ContactItem - 单个联系人条目
 *
 * 头像(色块或图片) + 昵称 + 关系标签 + 最近消息摘要
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Contact, RelationType } from '../types'

const { t } = useI18n()

const props = defineProps<{
  contact: Contact
  active?: boolean
}>()

const emit = defineEmits<{
  select: [contactId: string]
}>()

const relationLabel = computed<Record<RelationType, string>>(() => ({
  lover: t('chatAnalyzer.contactHeader.relationLover'),
  family: t('chatAnalyzer.contactHeader.relationFamily'),
  friend: t('chatAnalyzer.contactHeader.relationFriend'),
  colleague: t('chatAnalyzer.contactHeader.relationColleague'),
  other: t('chatAnalyzer.contactHeader.relationOther'),
}))

const relationColor: Record<RelationType, string> = {
  lover: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  family: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  friend: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  colleague: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  other: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
}

/**
 * Generate a consistent color from name for avatar fallback
 */
const avatarColor = computed(() => {
  const colors = [
    'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
    'bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  ]
  let hash = 0
  for (const char of props.contact.name) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

const initial = computed(() => props.contact.name.charAt(0))
const isBase64Avatar = computed(() => props.contact.avatar?.startsWith('data:'))

/**
 * Format date range from earliestMessageAt ~ latestMessageAt
 */
const dateRange = computed(() => {
  const { earliestMessageAt, latestMessageAt } = props.contact
  if (!earliestMessageAt && !latestMessageAt) return ''
  const fmt = (d: Date | undefined) => {
    if (!d) return ''
    const date = new Date(d)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  const start = fmt(earliestMessageAt)
  const end = fmt(latestMessageAt)
  if (start && end && start !== end) return `${start} - ${end}`
  return start || end
})
</script>

<template>
  <button
    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50"
    :class="active
      ? 'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50'
      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'"
    @click="emit('select', contact.id)"
  >
    <!-- Avatar -->
    <div class="relative shrink-0">
      <img
        v-if="isBase64Avatar"
        :src="contact.avatar"
        :alt="contact.name"
        class="w-10 h-10 rounded-full object-cover"
      />
      <div
        v-else
        class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
        :class="avatarColor"
      >
        {{ initial }}
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {{ contact.name }}
        </span>
        <span
          v-if="contact.relationType"
          class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors duration-200"
          :class="relationColor[contact.relationType] || relationColor.other"
        >
          {{ relationLabel[contact.relationType] ?? contact.relationType }}
        </span>
      </div>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
        {{ t('chatAnalyzer.contactItem.messageCount', { count: contact.messageCount }) }}
        <span v-if="dateRange" class="ml-1">{{ dateRange }}</span>
      </p>
    </div>
  </button>
</template>
