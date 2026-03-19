<!-- ================================================
  FeedCard — 帖子卡片组件
  职责：单个帖子的展示，包含作者信息、内容、图片、互动按钮
================================================ -->
<template>
  <div
    class="feed-card group cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    @click="$emit('click', post.id)"
  >
    <!-- 作者信息 -->
    <div class="px-5 pt-4 pb-0">
      <AuthorBadge
        :avatar-url="post.authorAvatarUrl"
        :name="post.authorName"
        :author-type="post.authorType"
        :created-time="post.createdTime"
        show-time
      />
    </div>

    <!-- 帖子内容 -->
    <div class="px-5 pt-3 pb-4">
      <p class="text-base leading-[1.5] text-foreground">{{ displayContent }}</p>
      <button
        v-if="isLongContent"
        class="mt-1 text-xs text-primary transition-colors duration-150 hover:text-primary/80 hover:underline"
        @click.stop="expanded = !expanded"
      >
        {{ expanded ? t('feed.card.collapse') : t('feed.card.expand') }}
      </button>

      <!-- 图片网格 -->
      <ImageGrid :images="post.images" @preview="handlePreview" />

      <!-- 标签 -->
      <div v-if="post.tags.length > 0" class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted/80"
        >
          #{{ tag }}
        </span>
      </div>
    </div>

    <!-- 互动按钮 — 顶部分割线 -->
    <div class="flex items-center gap-4 border-t px-5 py-3">
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="feed-action-btn flex min-h-[36px] min-w-[44px] items-center gap-1.5 text-[0.8125rem] transition-colors duration-150 active:scale-95"
              :class="post.liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'"
              :aria-label="post.liked ? t('feed.card.unlike') : t('feed.card.like')"
              @click.stop="handleLike"
            >
              <Heart :size="16" :fill="post.liked ? 'currentColor' : 'none'" />
              <span v-if="post.likeCount">{{ post.likeCount }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">
            {{ post.liked ? t('feed.card.unlike') : t('feed.card.like') }}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="feed-action-btn flex min-h-[36px] min-w-[44px] items-center gap-1.5 text-[0.8125rem] text-muted-foreground transition-colors duration-150 hover:text-foreground active:scale-95"
              :aria-label="t('feed.card.comment')"
              @click.stop="$emit('comment', post.id)"
            >
              <MessageCircle :size="16" />
              <span v-if="post.commentCount">{{ post.commentCount }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">
            {{ t('feed.card.comment') }}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="feed-action-btn flex min-h-[36px] min-w-[44px] items-center gap-1.5 text-[0.8125rem] text-muted-foreground transition-colors duration-150 hover:text-foreground active:scale-95"
              :aria-label="t('feed.card.repost')"
              @click.stop="$emit('repost', post.id)"
            >
              <Share2 :size="16" />
              <span v-if="post.repostCount">{{ post.repostCount }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">
            {{ t('feed.card.repost') }}
          </TooltipContent>
        </Tooltip>

        <!-- Bookmark -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="feed-action-btn ml-auto flex min-h-[36px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors duration-150 hover:text-foreground active:scale-95"
              :aria-label="t('feed.card.bookmark')"
              @click.stop
            >
              <Bookmark :size="16" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">
            {{ t('feed.card.bookmark') }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useI18n } from "vue-i18n"
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AuthorBadge from "./AuthorBadge.vue"
import ImageGrid from "./ImageGrid.vue"
import type { Post } from "@/types/feed"

const { t } = useI18n()

const props = defineProps<{
  post: Post
}>()

const emit = defineEmits<{
  click: [postId: string]
  like: [postId: string]
  comment: [postId: string]
  repost: [postId: string]
}>()

const MAX_LENGTH = 300
const expanded = ref(false)

const isLongContent = computed(() => props.post.content.length > MAX_LENGTH)

const displayContent = computed(() => {
  if (!isLongContent.value || expanded.value) {
    return props.post.content
  }
  return props.post.content.slice(0, MAX_LENGTH) + "..."
})

function handleLike() {
  emit('like', props.post.id)
}

function handlePreview(index: number) {
  // 图片预览逻辑
}
</script>

<style lang="scss">
.dark {
  .feed-card {
    background-color: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);

    &:hover {
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
