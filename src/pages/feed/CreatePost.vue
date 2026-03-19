<!-- ================================================
  CreatePost — 发帖页面
  职责：新建帖子表单，内容 + 图片 + 标签
================================================ -->
<template>
  <div class="flex h-full flex-col bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 border-b backdrop-blur-md bg-background/80">
      <div class="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
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
        <h1 class="text-lg font-semibold text-foreground">{{ t('feed.create.title') }}</h1>
        <button
          :disabled="!canSubmit || isSubmitting"
          class="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-base font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-95 disabled:opacity-50"
          @click="handleSubmit"
        >
          <Loader2 v-if="isSubmitting" :size="14" class="animate-spin" />
          {{ isSubmitting ? t('feed.create.submitting') : t('feed.create.submit') }}
        </button>
      </div>
    </header>

    <!-- 发帖表单 -->
    <main class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-3xl px-6 py-8">
        <div class="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div class="p-5">
            <!-- 内容输入框 -->
            <textarea
              v-model="content"
              :placeholder="t('feed.create.contentPlaceholder')"
              class="create-post-textarea w-full resize-none rounded-lg border bg-background p-4 text-base leading-relaxed outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              rows="6"
              :maxlength="2000"
            />
            <div class="mt-1 text-right text-xs text-muted-foreground">
              {{ contentLength }} / 2000
            </div>

            <!-- 图片上传 -->
            <div class="mt-4">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(img, index) in images"
                  :key="index"
                  class="group relative h-20 w-20 overflow-hidden rounded-lg border"
                >
                  <img :src="img" :alt="t('feed.create.uploadedImageAlt')" class="h-full w-full object-cover" />
                  <button
                    class="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 active:scale-95"
                    :aria-label="t('feed.create.deleteImage')"
                    @click="removeImage(index)"
                  >
                    <X :size="14" />
                  </button>
                </div>
                <button
                  v-if="images.length < 9"
                  class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary hover:text-primary active:scale-95"
                  :aria-label="t('feed.create.addImage')"
                  @click="handleAddImage"
                >
                  <ImagePlus :size="24" class="text-muted-foreground/50" />
                </button>
              </div>
            </div>

            <!-- 标签 -->
            <div class="mt-6">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-for="(tag, index) in tags"
                  :key="tag"
                  class="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
                >
                  #{{ tag }}
                  <button class="text-muted-foreground/50 hover:text-foreground active:scale-95 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" :aria-label="t('feed.create.deleteTag')" @click="removeTag(index)">
                    <X :size="12" />
                  </button>
                </span>
                <input
                  v-model="tagInput"
                  :placeholder="t('feed.create.addTagPlaceholder')"
                  class="w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                  @keydown.enter.prevent="handleAddTag"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { ArrowLeft, Loader2, X, ImagePlus } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCreatePost } from "./composables/useCreatePost"

const { t } = useI18n()

const router = useRouter()
const {
  content,
  images,
  tags,
  isSubmitting,
  canSubmit,
  contentLength,
  addTag,
  removeTag,
  removeImage,
  submitPost,
} = useCreatePost()

const tagInput = ref("")

async function handleSubmit() {
  if (isSubmitting.value) return // Guard: 防重入
  const success = await submitPost()
  if (success) {
    router.push("/feed")
  }
}

function handleAddTag() {
  if (tagInput.value.trim()) {
    addTag(tagInput.value)
    tagInput.value = ""
  }
}

function handleAddImage() {
  // TODO: 接入图片上传组件
  console.log("TODO: image upload")
}
</script>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .create-post-textarea {
    border-color: rgba(255, 255, 255, 0.1);
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

