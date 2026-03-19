<script setup lang="ts">
/**
 * SettingsPanel — V3 右侧抽屉 + chip 选择
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Personality, ResponseStyle } from '../types'
import { useChatAssistantStore } from '@/stores/chatAssistantStore'

const { t } = useI18n()

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

// ========== 状态初始化 ==========
const chatAssistantStore = useChatAssistantStore()
const settings = computed(() => chatAssistantStore.settings)

const personalities = computed(() => [
  { value: 'WARM' as Personality, label: t('playgroundChat.settings.warm') },
  { value: 'PROFESSIONAL' as Personality, label: t('playgroundChat.settings.professional') },
  { value: 'HUMOROUS' as Personality, label: t('playgroundChat.settings.humorous') },
  { value: 'LEARNED' as Personality, label: t('playgroundChat.settings.learned') },
])

const responseStyles = computed(() => [
  { value: 'CONCISE' as ResponseStyle, label: t('playgroundChat.settings.concise') },
  { value: 'DETAILED' as ResponseStyle, label: t('playgroundChat.settings.detailed') },
  { value: 'CREATIVE' as ResponseStyle, label: t('playgroundChat.settings.creative') },
])

function selectPersonality(val: Personality) {
  chatAssistantStore.updateSettings({ personality: val })
}

function selectStyle(val: ResponseStyle) {
  chatAssistantStore.updateSettings({ responseStyle: val })
}

function updateAssistantName(e: Event) {
  const value = (e.target as HTMLInputElement).value.trim()
  // 防止清空 assistantName 导致意外重触发 onboarding
  if (!value) return
  chatAssistantStore.updateSettings({ assistantName: value })
}

function updateUserName(e: Event) {
  const value = (e.target as HTMLInputElement).value
  chatAssistantStore.updateSettings({ userName: value })
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="drawer"
      :class="{ open: visible }"
      @click="handleBackdropClick"
    >
      <div class="drawer-panel">
        <div class="drawer-header">
          <h3>{{ t('playgroundChat.settings.title') }}</h3>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="ghost-btn" :aria-label="t('common.button.close')" @click="emit('close')">
                  <X :size="16" :stroke-width="1.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="6">{{ t('common.button.close') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div class="drawer-body">
          <!-- 助手昵称 -->
          <label class="setting-row">
            <span class="setting-label">{{ t('playgroundChat.settings.assistantName') }}</span>
            <input
              :value="settings.assistantName"
              type="text"
              class="setting-input"
              @input="updateAssistantName"
            />
          </label>

          <!-- 你的昵称 -->
          <label class="setting-row">
            <span class="setting-label">{{ t('playgroundChat.settings.yourName') }}</span>
            <input
              :value="settings.userName"
              type="text"
              class="setting-input"
              :placeholder="t('playgroundChat.settings.yourNamePlaceholder')"
              @input="updateUserName"
            />
          </label>

          <!-- 性格 -->
          <div class="setting-row">
            <span class="setting-label">{{ t('playgroundChat.settings.personality') }}</span>
            <div class="chip-row">
              <button
                v-for="p in personalities"
                :key="p.value"
                class="chip"
                :class="{ active: settings.personality === p.value }"
                @click="selectPersonality(p.value)"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- 回复风格 -->
          <div class="setting-row">
            <span class="setting-label">{{ t('playgroundChat.settings.responseStyle') }}</span>
            <div class="chip-row">
              <button
                v-for="s in responseStyles"
                :key="s.value"
                class="chip"
                :class="{ active: settings.responseStyle === s.value }"
                @click="selectStyle(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.drawer {
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none; opacity: 0;
  transition: opacity 0.35s var(--ease-fluid);
}
.drawer.open { pointer-events: auto; opacity: 1; }
.drawer::before {
  content: ''; position: absolute; inset: 0;
  background: rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(2px);
}

.drawer-panel {
  position: absolute; top: 0; bottom: 0; right: 0;
  width: 300px; max-width: 82vw;
  background: var(--background);
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s var(--ease-fluid);
  border-left: 1px solid var(--border);
}
.drawer.open .drawer-panel { transform: translateX(0); }

.drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border);
}
.drawer-header h3 {
  font-size: 1.125rem; font-weight: 600;
  color: var(--foreground);
}

.ghost-btn {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); border: none; background: none;
  color: var(--muted-foreground); cursor: pointer;
  transition: all var(--duration-fast);
}
.ghost-btn:hover { color: var(--foreground); background: var(--muted); }
.ghost-btn:active { transform: scale(0.95); }

.drawer-body {
  flex: 1; overflow-y: auto; padding: 24px;
}

.setting-row {
  display: flex; flex-direction: column; gap: 5px;
  margin-bottom: 24px;
}
.setting-label {
  font-size: 0.75rem; font-weight: 600;
  color: var(--muted-foreground);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.setting-input {
  width: 100%; padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm); font-size: 0.8125rem;
  color: var(--foreground); background: var(--card);
  outline: none; transition: border-color var(--duration-fast);
}
.setting-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: var(--glow-focus);
}

.chip-row {
  display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;
}
.chip {
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 9999px; font-size: 0.8125rem;
  color: var(--muted-foreground); cursor: pointer;
  background: none;
  transition: all var(--duration-fast) var(--ease-fluid);
}
.chip:hover { border-color: var(--color-primary-500); color: var(--color-primary-500); }
.chip:active { transform: scale(0.95); }
.chip.active {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: var(--primary-foreground);
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .drawer::before {
    background: rgba(0, 0, 0, 0.3);
  }

  .drawer-panel {
    background: var(--background);
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.4);
  }

  .setting-input {
    background: rgba(255, 255, 255, 0.04);
  }
}
</style>
