<!-- ============================================================
  ImageGrid — 图片网格组件
  职责：帖子图片展示，1-9 张自适应布局
============================================================ -->
<template>
  <div v-if="images.length > 0" class="image-grid mt-3" :class="gridClass">
    <div
      v-for="(img, index) in displayImages"
      :key="index"
      class="image-grid-item group relative cursor-pointer overflow-hidden rounded-lg"
      :class="itemClass(index)"
      role="button"
      :aria-label="t('feed.image.viewImage', { index: index + 1 })"
      tabindex="0"
      @click="$emit('preview', index)"
      @keydown.enter="$emit('preview', index)"
    >
      <img
        :src="img"
        :alt="t('feed.image.imageAlt', { index: index + 1, total: images.length })"
        class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />
      <!-- 更多图片遮罩 -->
      <div
        v-if="index === displayImages.length - 1 && images.length > 4"
        class="image-grid-overlay absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      >
        <span class="text-lg font-medium text-white drop-shadow-sm">+{{ images.length - 4 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"

const { t } = useI18n()

const props = defineProps<{
  images: readonly string[]
}>()

defineEmits<{
  preview: [index: number]
}>()

const displayImages = computed(() => {
  return props.images.slice(0, 4)
})

const gridClass = computed(() => {
  const count = displayImages.value.length
  if (count === 1) return "grid grid-cols-1"
  if (count === 2) return "grid grid-cols-2 gap-1.5"
  return "grid grid-cols-2 gap-1.5"
})

function itemClass(index: number) {
  const count = displayImages.value.length
  if (count === 1) return "aspect-video max-h-80"
  if (count === 3 && index === 0) return "row-span-2 aspect-square"
  return "aspect-square"
}
</script>

<style lang="scss">
.image-grid-item {
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgb(from var(--color-primary-400) r g b / 0.25);
  }
}

.dark {
  .image-grid-item {
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .image-grid-overlay {
    background-color: rgba(0, 0, 0, 0.55);
  }
}
</style>
