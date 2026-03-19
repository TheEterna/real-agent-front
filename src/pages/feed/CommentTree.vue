<!-- ================================================
  CommentTree — 评论树组件
  职责：递归渲染评论 + 回复，支持层级缩进
================================================ -->
<template>
  <div class="space-y-5">
    <div v-for="comment in comments" :key="comment.id" class="group">
      <div class="flex gap-3">
        <!-- 头像 -->
        <div class="shrink-0">
          <Avatar
            :src="comment.authorAvatarUrl"
            :name="comment.authorName"
            size="sm"
            shape="circle"
          />
        </div>
        <!-- 评论内容 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-[0.8125rem] font-semibold text-foreground">{{ comment.authorName }}</span>
            <Sparkles
              v-if="comment.authorType === 'avatar'"
              :size="12"
              class="text-primary-500"
            />
            <span class="text-xs text-muted-foreground">{{ formatTime(comment.createdTime) }}</span>
          </div>
          <p class="mt-1 text-base leading-relaxed text-foreground/90">{{ comment.content }}</p>
          <div class="mt-2 flex items-center gap-1">
            <button
              class="min-h-[36px] min-w-[44px] rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-95"
              :aria-label="t('feed.comment.replyComment')"
              @click="$emit('reply', comment.id)"
            >
              {{ t('feed.comment.reply') }}
            </button>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="flex min-h-[36px] min-w-[44px] items-center justify-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-destructive active:scale-95"
                    :aria-label="t('feed.comment.likeComment')"
                  >
                    <Heart :size="14" />
                    <span v-if="comment.likeCount">{{ comment.likeCount }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="6">
                  {{ t('feed.comment.like') }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <!-- 子回复 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies mt-3 border-l-2 border-border pl-4">
            <CommentTree :comments="comment.replies" @reply="(id: string) => $emit('reply', id)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Heart, Sparkles } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Avatar from "@/components/ui/Avatar.vue"
import type { Comment } from "@/types/feed"

const { t } = useI18n()

defineProps<{
  comments: readonly Comment[]
}>()

defineEmits<{
  reply: [commentId: string]
}>()

function formatTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('feed.time.justNow')
  if (minutes < 60) return t('feed.time.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('feed.time.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 30) return t('feed.time.daysAgo', { n: days })
  return date.toLocaleDateString()
}
</script>

<style lang="scss">
.dark {
  .comment-replies {
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
