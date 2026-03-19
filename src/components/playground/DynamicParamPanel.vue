<template>
  <div class="space-y-4">
    <div v-for="(config, key) in schema" :key="key" class="space-y-2">
      <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {{ config.label }}
      </label>

      <!-- Slider -->
      <div v-if="config.type === 'slider'" class="space-y-2">
        <Slider
          :model-value="[getSliderValue(key, config)]"
          :min="config.min"
          :max="config.max"
          :step="config.step"
          @update:model-value="(val) => val && updateValue(key, val[0])"
        />
        <div class="flex justify-between text-xs text-zinc-500">
          <span>{{ config.min }}</span>
          <span class="font-medium text-zinc-700 dark:text-zinc-300">
            {{ modelValue[key] ?? config.default }}
          </span>
          <span>{{ config.max }}</span>
        </div>
      </div>

      <!-- Select -->
      <Select
        v-else-if="config.type === 'select'"
        :model-value="String(modelValue[key] ?? config.default ?? '')"
        @update:model-value="(val) => updateValue(key, val)"
      >
        <SelectTrigger>
          <SelectValue :placeholder="config.label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in config.options"
            :key="String(option.value)"
            :value="String(option.value)"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Input -->
      <Input
        v-else-if="config.type === 'input'"
        :model-value="String(modelValue[key] ?? config.default ?? '')"
        :placeholder="config.placeholder"
        @update:model-value="(val: string | number) => updateValue(key, val)"
      />

      <!-- Textarea -->
      <Textarea
        v-else-if="config.type === 'textarea'"
        :model-value="String(modelValue[key] ?? config.default ?? '')"
        :placeholder="config.placeholder"
        class="min-h-[80px]"
        @update:model-value="(val: string | number) => updateValue(key, val)"
      />

      <!-- Switch -->
      <div v-else-if="config.type === 'switch'" class="flex items-center justify-between">
        <span class="text-sm text-zinc-600 dark:text-zinc-400">
          {{ config.description }}
        </span>
        <Switch
          :checked="Boolean(modelValue[key] ?? config.default)"
          @update:checked="(val: boolean) => updateValue(key, val)"
        />
      </div>

      <!-- Description -->
      <p v-if="config.description && config.type !== 'switch'" class="text-xs text-zinc-500">
        {{ config.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { ParamSchemaItem } from '@/types/playground-basic'

interface Props {
  schema: Record<string, ParamSchemaItem>
  modelValue: Record<string, unknown>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function getSliderValue(key: string, config: ParamSchemaItem): number {
  const val = props.modelValue[key]
  if (typeof val === 'number') return val
  if (typeof config.default === 'number') return config.default
  return config.min ?? 0
}

function updateValue(key: string, value: unknown) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>
