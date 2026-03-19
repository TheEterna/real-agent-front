<template>
  <div class="param-panel-renderer space-y-4">
    <template v-for="(item, key) in schema" :key="key">
      <!-- Select 选择器 -->
      <div v-if="item.type === 'select'" class="space-y-1.5">
        <label class="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1 block">
          {{ item.label || key }}
        </label>
        <div class="relative group">
          <select
            :value="String(model[key] ?? item.default ?? (item as any).defaultValue ?? '')"
            @change="updateValue(key, ($event.target as HTMLSelectElement).value)"
            class="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 cursor-pointer appearance-none transition-all"
          >
            <option
              v-for="opt in item.options"
              :key="String(opt.value)"
              :value="String(opt.value)"
            >
              {{ opt.label }}
            </option>
          </select>
          <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity">
            <ChevronDown class="w-3.5 h-3.5" />
          </div>
        </div>
        <p v-if="item.description" class="text-[9px] text-zinc-400 dark:text-zinc-600 leading-relaxed pl-1">
          {{ item.description }}
        </p>
      </div>

      <!-- Slider 滑块 -->
      <div v-else-if="item.type === 'slider'" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em]">
            {{ item.label || key }}
          </label>
          <span class="text-[10px] font-mono font-bold text-primary-500 tabular-nums">
            {{ model[key] ?? item.default ?? (item as any).defaultValue ?? item.min ?? 0 }}
          </span>
        </div>
        <input
          :type="'range'"
          :value="model[key] ?? item.default ?? (item as any).defaultValue ?? item.min ?? 0"
          :min="item.min ?? 0"
          :max="item.max ?? 100"
          :step="item.step ?? 1"
          @input="updateValue(key, Number(($event.target as HTMLInputElement).value))"
          class="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary-500"
        />
        <p v-if="item.description" class="text-[9px] text-zinc-400 dark:text-zinc-600 leading-relaxed pl-1">
          {{ item.description }}
        </p>
      </div>

      <!-- Input 文本输入 -->
      <div v-else-if="item.type === 'input'" class="space-y-1.5">
        <label class="text-[10px] font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.15em]">
          {{ item.label || key }}
        </label>
        <input
          :type="item.inputType || 'text'"
          :value="model[key] ?? item.default ?? (item as any).defaultValue"
          @input="updateValue(key, ($event.target as HTMLInputElement).value)"
          :placeholder="item.placeholder"
          class="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/30 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
        />
        <p v-if="item.description" class="text-[9px] text-zinc-400 dark:text-zinc-600 leading-relaxed pl-1">
          {{ item.description }}
        </p>
      </div>

      <!-- Textarea 多行文本 -->
      <div v-else-if="item.type === 'textarea'" class="space-y-2">
        <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {{ item.label || key }}
        </label>
        <textarea
          :value="model[key] ?? item.default ?? (item as any).defaultValue"
          @input="updateValue(key, ($event.target as HTMLTextAreaElement).value)"
          :placeholder="item.placeholder"
          :rows="item.rows ?? 3"
          class="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <p v-if="item.description" class="text-[10px] text-zinc-400 dark:text-zinc-500">
          {{ item.description }}
        </p>
      </div>

      <!-- Switch 开关 -->
      <div v-else-if="item.type === 'switch'" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {{ item.label || key }}
          </label>
          <button
            type="button"
            @click="updateValue(key, !(model[key] ?? item.default ?? (item as any).defaultValue ?? false))"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            :class="model[key] ?? item.default ?? (item as any).defaultValue ?? false ? 'bg-primary-500' : 'bg-zinc-300 dark:bg-zinc-600'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="model[key] ?? item.default ?? (item as any).defaultValue ?? false ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
        <p v-if="item.description" class="text-[10px] text-zinc-400 dark:text-zinc-500">
          {{ item.description }}
        </p>
      </div>

      <!-- Image 图片上传（简单上传方式，用于 ParamPanelRenderer 内嵌） -->
      <div v-else-if="item.type === 'image'" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {{ item.label || key }}
            <span v-if="item.required" class="text-destructive ml-1">*</span>
          </label>
          <button
            v-if="model[key]"
            type="button"
            @click="clearImage(key)"
            class="text-[10px] text-destructive hover:text-destructive/80"
          >
            清除
          </button>
        </div>
        <div
          class="aspect-video bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 overflow-hidden transition-all cursor-pointer"
          :class="model[key]
            ? 'border-zinc-200 dark:border-zinc-700'
            : 'border-dashed border-zinc-200 dark:border-zinc-700 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/10 dark:hover:bg-primary-900/10'"
          @click="model[key] ? undefined : uploadImage(key, $event)"
        >
          <img
            v-if="model[key]"
            :src="model[key]"
            :alt="item.label || key"
            class="w-full h-full object-cover"
          />
          <template v-else>
            <div class="flex flex-col items-center justify-center h-full text-zinc-400 hover:text-primary-600 transition-colors">
              <ImageIcon class="w-6 h-6" />
              <span class="text-[10px] mt-2 font-medium">{{ item.placeholder || '点击上传图片' }}</span>
              <span class="text-[9px] opacity-60">支持 PNG, JPEG, WebP</span>
            </div>
          </template>
        </div>
        <p v-if="item.description" class="text-[10px] text-zinc-400 dark:text-zinc-500">
          {{ item.description }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ParamSchemaItem } from '@/types/playground-basic'
import { ImageIcon, ChevronDown } from 'lucide-vue-next'
import { message } from 'ant-design-vue'

interface Props {
  schema: Record<string, ParamSchemaItem>
  model: Record<string, any>
}

interface Emits {
  update: [key: string, value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function updateValue(key: string, value: any) {
  emit('update', key, value)
}

/**
 * 上传图片（转换为 base64）
 */
function uploadImage(key: string, event: Event) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/png,image/jpeg,image/webp'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    // 文件大小检查（25MB）
    if (file.size > 25 * 1024 * 1024) {
      message.error('图片大小不能超过 25MB')
      return
    }

    // 转换为 base64
    const reader = new FileReader()
    reader.onload = (e) => {
      updateValue(key, e.target?.result as string)
    }
    reader.onerror = () => {
      message.error('图片读取失败')
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

/**
 * 清除图片
 */
function clearImage(key: string) {
  updateValue(key, '')
}
</script>

<style scoped>
/* 自定义滑块样式 */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: hsl(var(--primary) / 1);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: hsl(var(--primary) / 1);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
