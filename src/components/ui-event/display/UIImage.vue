<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ImageArgs } from '@/types/ui-event'
import { ImageOff } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps<{ args: ImageArgs }>()

const loaded = ref(false)
const errored = ref(false)

const onLoad = () => {
  loaded.value = true
}

const onError = () => {
  errored.value = true
  loaded.value = true
}
</script>

<template>
  <figure class="w-full flex flex-col items-center gap-2">
    <!-- Loading skeleton -->
    <div
      v-if="!loaded && !errored"
      class="rounded-xl bg-zinc-100 animate-pulse"
      :style="{
        width: args.width ? args.width + 'px' : '100%',
        height: args.height ? args.height + 'px' : '200px'
      }"
    />

    <!-- Error state -->
    <div
      v-if="errored"
      class="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50/80 text-zinc-400"
      :style="{
        width: args.width ? args.width + 'px' : '100%',
        height: args.height ? args.height + 'px' : '200px'
      }"
    >
      <ImageOff :size="24" />
      <span class="text-xs">{{ t('uiEvent.image.loadFailed') }}</span>
    </div>

    <!-- Image -->
    <img
      v-show="loaded && !errored"
      :src="args.url"
      :alt="args.alt ?? ''"
      :width="args.width"
      :height="args.height"
      class="rounded-xl border border-zinc-200/40 shadow-sm object-contain max-w-full"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    />

    <!-- Caption -->
    <figcaption v-if="args.caption" class="text-xs text-zinc-500 text-center leading-relaxed">
      {{ args.caption }}
    </figcaption>
  </figure>
</template>
