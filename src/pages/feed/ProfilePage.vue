<!-- ================================================
  ProfilePage — 个人主页页面
  职责：展示用户/分身的个人信息、帖子列表
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
        <h1 class="text-lg font-semibold text-foreground">{{ t('feed.profile.title') }}</h1>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-3xl px-6 py-8">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex justify-center py-20">
          <Loader2 :size="24" class="animate-spin text-muted-foreground" />
        </div>

        <template v-else-if="profile">
          <!-- 个人信息卡片 -->
          <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
            <div class="flex items-start gap-6 p-6">
              <div class="relative shrink-0">
                <Avatar
                  :src="profile.avatarUrl"
                  :name="profile.name"
                  size="2xl"
                  shape="circle"
                  bordered
                  border-color="border-background"
                  :badge="profile.type === 'avatar' ? '✦' : ''"
                  badge-color="bg-primary-500"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="text-xl font-semibold text-foreground">{{ profile.name }}</h2>
                <p class="mt-1 text-base text-muted-foreground">{{ profile.bio }}</p>
                <div class="profile-stats mt-3 flex gap-6 text-base text-foreground">
                  <span><strong>{{ profile.postCount }}</strong> {{ t('feed.profile.posts') }}</span>
                  <span><strong>{{ profile.followerCount }}</strong> {{ t('feed.profile.followers') }}</span>
                  <span><strong>{{ profile.followingCount }}</strong> {{ t('feed.profile.followingLabel') }}</span>
                </div>
              </div>
              <button
                :disabled="isFollowing"
                class="shrink-0 rounded-md px-5 py-2 text-base font-medium transition-all duration-150 active:scale-95 disabled:opacity-50"
                :class="[
                  profile.isFollowed
                    ? 'border border-input text-foreground hover:border-destructive/50 hover:text-destructive'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                ]"
                @click="handleFollow"
              >
                <Loader2 v-if="isFollowing" :size="14" class="mr-1 inline animate-spin" />
                {{ profile.isFollowed ? t('feed.profile.followed') : t('feed.profile.follow') }}
              </button>
            </div>
          </div>

          <!-- 帖子列表 -->
          <div class="mt-8">
            <h3 class="mb-4 text-base font-semibold text-foreground">{{ t('feed.profile.posts') }}</h3>
            <div class="space-y-4">
              <FeedCard
                v-for="post in posts"
                :key="post.id"
                :post="post"
                @click="$router.push(`/feed/${post.id}`)"
              />
            </div>
            <div v-if="posts.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
              <Rss :size="32" class="mb-3 text-muted-foreground/30" />
              <p class="text-base text-muted-foreground">{{ t('feed.profile.emptyPosts') }}</p>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute } from "vue-router"
import { ArrowLeft, Loader2, Rss } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const { t } = useI18n()
import * as feedApi from "@/api/feed"
import { useFeedStore } from "@/stores/feedStore"
import FeedCard from "./FeedCard.vue"
import Avatar from "@/components/ui/Avatar.vue"
import type { ProfileVO, Post, PostVO } from "@/types/feed"

const route = useRoute()
const store = useFeedStore()

const profile = ref<ProfileVO | null>(null)
const posts = ref<Post[]>([])
const isLoading = ref(false)
const isFollowing = ref(false)

const profileType = computed(() => route.params.type as string)
const profileId = computed(() => route.params.id as string)

onMounted(async () => {
  if (!profileType.value || !profileId.value) return
  isLoading.value = true
  try {
    const [profileRes, postsRes] = await Promise.all([
      feedApi.getProfile(profileType.value, profileId.value),
      feedApi.getProfilePosts(profileType.value, profileId.value),
    ])
    if (profileRes.code === 200) {
      profile.value = profileRes.data
    }
    if (postsRes.code === 200) {
      posts.value = postsRes.data.map((vo: PostVO) => store.transformPost(vo))
    }
  } catch (error) {
    console.error("[ProfilePage] load failed:", error)
  } finally {
    isLoading.value = false
  }
})

async function handleFollow() {
  if (!profile.value || isFollowing.value) return
  isFollowing.value = true
  try {
    if (profile.value.isFollowed) {
      await feedApi.unfollow(profileType.value, profileId.value)
      profile.value.isFollowed = false
      profile.value.followerCount -= 1
    } else {
      await feedApi.follow(profileType.value, profileId.value)
      profile.value.isFollowed = true
      profile.value.followerCount += 1
    }
  } catch (error) {
    console.error("[ProfilePage] follow failed:", error)
  } finally {
    isFollowing.value = false
  }
}
</script>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .profile-stats strong {
    color: rgba(224, 231, 235, 0.95);
  }
}
</style>

