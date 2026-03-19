<!-- ================================================
  FeedPage (Index.vue) — Feed 社区主页面
  职责：Feed 流综合页面，Tab 切换 + 无限滚动 + GSAP 卡片入场
================================================ -->
<template>
  <div class="flex h-full flex-col bg-background">
    <!-- 主体三栏布局 -->
    <main
      ref="scrollContainerRef"
      class="flex-1 overflow-y-auto"
    >
      <div class="mx-auto flex max-w-6xl gap-6 px-6 py-8 lg:px-12">
        <!-- 左列：Feed 主内容区 -->
        <div class="min-w-0 flex-1">
          <!-- 顶部栏：标题 + 操作 -->
          <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-semibold text-foreground">{{ t('feed.list.title') }}</h1>
            <div class="flex items-center gap-2">
              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
                      :aria-label="t('feed.list.search')"
                    >
                      <Search :size="16" />
                      <span class="hidden sm:inline">{{ t('feed.list.search') }}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" :side-offset="6">{{ t('feed.list.search') }}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button
                class="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95"
                @click="$router.push('/feed/create')"
              >
                <Plus :size="16" />
                {{ t('feed.list.createPost') }}
              </button>
            </div>
          </div>

          <!-- Tab 栏 -->
          <FeedTabs :active-tab="activeTab" @change="switchTab" />

          <!-- Feed 卡片流 -->
          <div class="mt-4 space-y-4">
            <FeedCard
              v-for="(post, index) in feedList"
              :key="post.id"
              :ref="(el) => { if (el) animateCardEntry((el as any).$el || el, index) }"
              :post="post"
              @click="handlePostClick"
              @like="handleToggleLike"
              @comment="handleComment"
              @repost="handleRepost"
            />

            <!-- 加载状态 -->
            <div v-if="isLoading" class="flex justify-center py-8">
              <Loader2 :size="24" class="animate-spin text-muted-foreground" />
            </div>

            <!-- 没有更多 -->
            <div v-if="!hasMore && feedList.length > 0" class="py-8 text-center text-base text-muted-foreground">
              {{ t('feed.list.noMore') }}
            </div>

            <!-- 空状态 -->
            <div v-if="!isLoading && feedList.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
              <Rss :size="48" class="mb-4 text-muted-foreground/50" />
              <p class="text-base text-muted-foreground">{{ t('feed.list.emptyTitle') }}</p>
              <p class="mt-1 text-xs text-muted-foreground/60">{{ t('feed.list.emptyHint') }}</p>
            </div>
          </div>
        </div>

        <!-- 右侧栏：Trending + Suggested -->
        <aside class="hidden w-[280px] shrink-0 lg:block">
          <div class="sticky top-8 space-y-4">
            <!-- Trending Topics -->
            <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
              <div class="flex items-center justify-between border-b px-5 py-4">
                <span class="text-base font-semibold text-foreground">{{ t('feed.trending.title') }}</span>
                <TrendingUp :size="16" class="text-muted-foreground" />
              </div>
              <div class="p-2">
                <div
                  v-for="topic in trendingTopics"
                  :key="topic.tag"
                  class="cursor-pointer rounded-md px-3 py-2.5 transition-colors hover:bg-accent"
                >
                  <p class="text-base font-medium text-foreground">#{{ topic.tag }}</p>
                  <p class="text-xs text-muted-foreground">{{ topic.postCount }}</p>
                </div>
              </div>
            </div>

            <!-- Suggested Users -->
            <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
              <div class="flex items-center justify-between border-b px-5 py-4">
                <span class="text-base font-semibold text-foreground">{{ t('feed.suggested.title') }}</span>
                <Users :size="16" class="text-muted-foreground" />
              </div>
              <div class="p-2">
                <div
                  v-for="user in suggestedUsers"
                  :key="user.id"
                  class="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent"
                >
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {{ user.initials }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[0.8125rem] font-medium text-foreground">{{ user.name }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ user.bio }}</p>
                  </div>
                  <button
                    class="shrink-0 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-95"
                    @click.stop="handleFollowSuggested(user.id)"
                  >
                    {{ t('feed.suggested.follow') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { Plus, Loader2, Rss, Search, TrendingUp, Users } from "lucide-vue-next"
import { useRouter } from "vue-router"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const { t } = useI18n()
import FeedTabs from "./FeedTabs.vue"
import FeedCard from "./FeedCard.vue"
import { useFeed } from "./composables/useFeed"
import { usePostInteraction } from "./composables/usePostInteraction"

const router = useRouter()
const {
  scrollContainerRef,
  feedList,
  activeTab,
  isLoading,
  hasMore,
  switchTab,
  animateCardEntry,
} = useFeed()

const { handleToggleLike, handleRepost } = usePostInteraction()

// Trending topics (placeholder data — will be replaced by API)
const trendingTopics = ref([
  { tag: "MultiAgentAI", postCount: "1.2k posts" },
  { tag: "MCPTools", postCount: "856 posts" },
  { tag: "PromptEngineering", postCount: "643 posts" },
  { tag: "RAGPipeline", postCount: "421 posts" },
])

// Suggested users (placeholder data — will be replaced by API)
const suggestedUsers = ref([
  { id: "1", name: "Jessica Wang", bio: "AI Researcher", initials: "JW" },
  { id: "2", name: "Mike Kim", bio: "Full-Stack Dev", initials: "MK" },
  { id: "3", name: "Luna Zhang", bio: "NLP Engineer", initials: "LZ" },
])

function handlePostClick(postId: string) {
  router.push(`/feed/${postId}`)
}

function handleComment(postId: string) {
  router.push(`/feed/${postId}#comments`)
}

function handleFollowSuggested(userId: string) {
  // TODO: integrate with follow API
  console.log("Follow suggested user:", userId)
}
</script>

