<script setup lang="ts">
/**
 * FloatingInputBar - 底部悬浮输入框
 *
 * 毛玻璃效果 + 渐变遮罩 + 发送按钮
 * 当前阶段 submit 仅触发 Toast，后续接入后端
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, Plus, HelpCircle } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const { t } = useI18n()

defineProps<{
  placeholder?: string
}>()

const emit = defineEmits<{
  submit: [text: string]
}>()

const inputText = ref('')

const handleSubmit = () => {
  const text = inputText.value.trim()
  if (!text) return
  emit('submit', text)
  inputText.value = ''
}
</script>

<template>
  <div class="fixed inset-x-0 bottom-10 z-30 flex justify-center px-4 pointer-events-none">
    <div class="w-full max-w-2xl pointer-events-auto relative">
      <div class="flex items-center gap-3 rounded-full border border-border/40 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md p-2 pl-2 shadow-[var(--shadow-lg)] ring-1 ring-slate-900/5 dark:ring-zinc-100/5 transition-all duration-200 ease-[var(--ease-fluid)] hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.5)]">
        <!-- Plus 按钮 -->
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('profile.floatingInput.addAttachment')" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors duration-150 ease-[var(--ease-snap)] hover:bg-muted hover:text-foreground active:scale-95">
                <Plus :size="20" :stroke-width="2" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">{{ t('profile.floatingInput.addAttachment') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <!-- 输入框 -->
        <input
          v-model="inputText"
          type="text"
          :placeholder="placeholder || t('profile.floatingInput.placeholder')"
          class="h-full flex-1 border-none bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
          @keydown.enter="handleSubmit"
        />

        <!-- 发送按钮 -->
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                :aria-label="t('profile.floatingInput.sendMessage')"
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-150 ease-[var(--ease-snap)]"
                :class="inputText.trim()
                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 active:scale-95'
                  : 'bg-muted/60 text-muted-foreground'"
                :disabled="!inputText.trim()"
                @click="handleSubmit"
              >
                <ArrowUp :size="20" :stroke-width="2.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">{{ t('profile.floatingInput.sendMessage') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- 帮助图标 -->
    <div class="absolute right-8 bottom-1 pointer-events-auto">
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button :aria-label="t('profile.floatingInput.help')" class="flex h-11 w-11 items-center justify-center rounded-full border border-border/40 bg-background/80 backdrop-blur-sm text-muted-foreground shadow-[var(--shadow-sm)] transition-all duration-150 ease-[var(--ease-snap)] hover:text-foreground hover:shadow-[var(--shadow-md)] active:scale-95">
              <HelpCircle :size="18" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">{{ t('profile.floatingInput.help') }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>
