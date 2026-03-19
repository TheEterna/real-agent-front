<!-- ================================================
  PostDetail — 帖子详情页面
  职责：帖子全文内容 � 评论列表 � 发言评论交亗
================================================ -->
<template>
  <div class="flex h-full flex-col bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 border-b backdrop-blur-md bg-background/80">
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-6 py-3">
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="rounded-lg p-2 transition-colors hover:bg-muted active:scale-95"
                :aria-label="t('common.button.back')"
                @click="$router.back()"
              >
                <ArrowLeft :size="20" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('common.button.back') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <h1 class="text-lg font-semibold text-foreground">{{ t('feed.detail.title') }}</h1>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-3xl px-6 py-8">
        <!-- 加载状态 -->
        <div v-if="isLoadingPost" class="flex justify-center py-20">
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>

        <!-- 帖子内容 -->
        <template v-else-if="post">
          <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
            <!-- 作者信息 -->
            <div class="px-5 pt-4">
              <AuthorBadge
                :avatar-url="post.authorAvatarUrl"
                :name="post.authorName"
                :author-type="post.authorType"
                :created-time="post.createdTime"
                show-time
                size="lg"
              />
            </div>

            <!-- 正文内容 -->
            <div class="px-5 pt-4 pb-4">
              <p class="text-base leading-relaxed text-foreground">{{ post.content }}</p>

              <!-- 图片 -->
              <ImageGrid v-if="post.images.length > 0" :images="post.images" />
            </div>

            <!-- 互动按钮 -->
            <div class="flex items-center gap-4 border-t px-5 py-3">
              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="flex min-h-[36px] min-w-[44px] items-center gap-1.5 text-[0.8125rem] transition-colors active:scale-95"
                      :class="post.liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'"
                      :aria-label="post.liked ? t('feed.card.unlike') : t('feed.card.like')"
                      @click="handleToggleLike(post.id)"
                    >
                      <Heart :size="16" :fill="post.liked ? 'currentColor' : 'none'" />
                      <span>{{ post.likeCount }}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" :side-offset="6">
                    {{ post.liked ? t('feed.card.unlike') : t('feed.card.like') }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div class="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                <MessageCircle :size="16" />
                <span>{{ post.commentCount }}</span>
              </div>
            </div>
          </div>

          <!-- 发言评论 -->
          <div class="mt-6 flex gap-3">
            <input
              v-model="commentContent"
              type="text"
              :placeholder="t('feed.detail.commentPlaceholder')"
              class="post-detail-input flex-1 rounded-lg border bg-background px-4 py-2.5 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              @keydown.enter="submitComment"
            />
            <button
              :disabled="!commentContent.trim() || isCommenting"
              class="rounded-lg bg-primary px-4 py-2 text-base font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
              @click="submitComment"
            >
              <Loader2 v-if="isCommenting" :size="14" class="animate-spin" />
              <span v-else>{{ t('feed.detail.publish') }}</span>
            </button>
          </div>

          <!-- 评论列表 -->
          <div id="comments" class="mt-6">
            <h2 class="mb-4 text-base font-semibold text-foreground">
              {{ t('feed.detail.commentCount', { count: post.commentCount }) }}
            </h2>
            <div v-if="isLoadingComments" class="flex justify-center py-8">
              <Loader2 :size="20" class="animate-spin text-muted-foreground" />
            </div>
            <CommentTree
              v-else-if="comments.length > 0"
              :comments="comments"
              @reply="handleReply"
            />
            <div v-else class="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare :size="28" class="mb-3 text-muted-foreground/30" />
              <p class="text-base text-muted-foreground">{{ t('feed.detail.emptyComments') }}</p>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { ArrowLeft, Heart, MessageCircle, MessageSquare, Loader2 } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const { t } = useI18n()
import { useFeedStore } from "@/stores/feedStore"
import { usePostInteraction } from "./composables/usePostInteraction"
import AuthorBadge from "./AuthorBadge.vue"
import ImageGrid from "./ImageGrid.vue"
import CommentTree from "./CommentTree.vue"

const route = useRoute()
const store = useFeedStore()
const { handleToggleLike, commentContent, isCommenting, handleAddComment } = usePostInteraction()

const postId = computed(() => route.params.postId as string)
const post = computed(() => store.currentPost)
const comments = computed(() => store.currentComments)
const isLoadingPost = computed(() => store.isLoadingPost)
const isLoadingComments = computed(() => store.isLoadingComments)

onMounted(async () => {
  if (postId.value) {
    await store.loadPost(postId.value)
    await store.loadComments(postId.value)
  }
})

async function submitComment() {
  if (!postId.value || isCommenting.value) return // Guard: 防重入
  await handleAddComment(postId.value)
}

function handleReply(commentId: string) {
  // TODO: 实现回复指定评论
  console.log("Reply to:", commentId)
}
</script>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .post-detail-input {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(224, 231, 235, 0.9);

    &::placeholder {
      color: rgba(224, 231, 235, 0.4);
    }

    &:focus {
      border-color: var(--color-primary-400);
    }
  }
}
</style>

