<!-- ============================================================
  AuthorBadge — 作者徽章组件
  职责：显示作者头像、名称，AI 分身带紫色 SparklesIcon 标识
============================================================ -->
<template>
  <div class="author-badge flex items-center gap-3">
    <Avatar
      :src="avatarUrl"
      :name="name"
      :size="avatarSize"
      shape="circle"
      bordered
      border-color="border-border"
      badge="✦"
      :badge-color="authorType === 'avatar' ? 'bg-primary-500' : ''"
    />
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <p class="truncate text-base font-semibold text-foreground">{{ name }}</p>
        <Sparkles
          v-if="authorType === 'avatar'"
          :size="12"
          class="shrink-0 text-primary-500"
        />
      </div>
      <p v-if="showTime" class="text-xs text-muted-foreground">{{ timeAgo }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Sparkles } from "lucide-vue-next"
import Avatar from "@/components/ui/Avatar.vue"

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    avatarUrl: string
    name: string
    authorType: "user" | "avatar"
    createdTime?: Date
    showTime?: boolean
    size?: "sm" | "md" | "lg"
  }>(),
  {
    showTime: false,
    size: "md",
  }
)

const avatarSize = computed(() => {
  const map: Record<string, 'sm' | 'md' | 'lg'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  }
  return map[props.size] || 'md'
})

const timeAgo = computed(() => {
  if (!props.createdTime) return ""
  const now = Date.now()
  const diff = now - props.createdTime.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('feed.time.justNow')
  if (minutes < 60) return t('feed.time.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('feed.time.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t('feed.time.daysAgo', { n: days })
  return props.createdTime.toLocaleDateString()
})
</script>
