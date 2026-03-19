// ============================================================
// useCreatePost — 发帖 Composable
// 职责：管理发帖表单状态、图片预览、提交发帖
// ============================================================

import { ref, computed } from "vue"
import { useFeedStore } from "@/stores/feedStore"
import * as feedApi from "@/api/feed"

export function useCreatePost() {
  const store = useFeedStore()

  // ---- 表单状态 ----
  const content = ref("")
  const images = ref<string[]>([])
  const tags = ref<string[]>([])
  const isSubmitting = ref(false)

  // ---- 计算属性 ----
  const canSubmit = computed(() => {
    return content.value.trim().length > 0 && !isSubmitting.value
  })

  const contentLength = computed(() => content.value.length)

  // ---- 图片管理 ----
  function addImage(url: string) {
    if (images.value.length < 9) {
      images.value.push(url)
    }
  }

  function removeImage(index: number) {
    images.value.splice(index, 1)
  }

  // ---- 标签管理 ----
  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !tags.value.includes(trimmed)) {
      tags.value.push(trimmed)
    }
  }

  function removeTag(index: number) {
    tags.value.splice(index, 1)
  }

  // ---- 提交发帖 ----
  async function submitPost(): Promise<boolean> {
    if (!canSubmit.value) return false
    if (isSubmitting.value) return false
    isSubmitting.value = true

    try {
      const res = await feedApi.createPost({
        content: content.value.trim(),
        images: images.value,
        tags: tags.value,
      })
      if (res.code === 200 && res.data) {
        // 通过 store 的 transformPost 转换并插入到列表头部
        const post = store.transformPost(res.data)
        store.prependPost(post)

        // 重置表单
        content.value = ""
        images.value = []
        tags.value = []
        return true
      }
      return false
    } catch (error) {
      console.error("[useCreatePost] submitPost failed:", error)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // ---- 重置表单 ----
  function resetForm() {
    content.value = ""
    images.value = []
    tags.value = []
  }

  return {
    content,
    images,
    tags,
    isSubmitting,
    canSubmit,
    contentLength,
    addImage,
    removeImage,
    addTag,
    removeTag,
    submitPost,
    resetForm,
  }
}
