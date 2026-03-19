<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Settings, Zap } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import MemberTierProvider from '@/components/MemberTierProvider.vue'
import AvatarWithTierRing from '@/components/ui/AvatarWithTierRing.vue'
import type { TierType } from '@/types/subscription'

const router = useRouter()
const { t } = useI18n()

// Props
interface Props {
  avatarUrl?: string
  avatarVersion?: string | number | null
  username?: string
  isSidebarOpen?: boolean
  tier?: TierType
  credits?: number
  maxCredits?: number
}

const props = withDefaults(defineProps<Props>(), {
  avatarUrl: '',
  avatarVersion: null,
  username: 'User',
  isSidebarOpen: true,
  tier: 'free',
  credits: 0,
  maxCredits: 100,
})



// 跳转到 Profile 页面
const goToProfile = () => {
  router.push('/profile')
}

const emit = defineEmits<{
  (e: 'open-settings'): void
  (e: 'open-pricing'): void
}>()

// 处理设置点击
const handleSettingsClick = () => {
  emit('open-settings')
}

// 处理升级点击
const handleUpgradeClick = () => {
  emit('open-pricing')
}

// Credit 相关计算
const creditPercentage = computed(() => {
  if (props.maxCredits <= 0) return 0
  return Math.min(100, Math.max(0, (props.credits / props.maxCredits) * 100))
})

const formattedCredits = computed(() => {
  if (props.credits >= 1000) {
    return `${Math.round(props.credits / 1000)}k`
  }
  return Math.round(props.credits).toString()
})

const formattedCreditsDetailed = computed(() => {
  if (props.credits >= 1000000) {
    return `${(props.credits / 1000000).toFixed(1)}m`
  }
  return props.credits.toFixed(1)
})

// 根据剩余百分比决定胶囊样式
const creditPillClass = computed(() => {
  if (creditPercentage.value <= 10) return 'credit-pill-critical'
  if (creditPercentage.value <= 30) return 'credit-pill-warning'
  return 'credit-pill-normal'
})
</script>

<template>
  <div class="user-profile-container">
    <!-- 触发按钮 - 点击跳转到 Profile 页面 -->
    <button
      class="trigger-btn glass-panel"
      :class="{
        'collapsed': !isSidebarOpen,
        'items-center gap-3': isSidebarOpen
      }"
      @click="goToProfile"
    >
      <div class="trigger-avatar">
        <AvatarWithTierRing
          :src="avatarUrl"
          :avatar-version="avatarVersion"
          :name="username"
          :tier="tier"
          size="md"
          :show-badge="true"
        />
      </div>
      <div
        class="trigger-info"
        :class="{ 'hidden': !isSidebarOpen }"
      >
        <span class="trigger-name">{{ username || 'User' }}</span>
        <MemberTierProvider>
          <template #ultra>
            <span class="trigger-subtitle tier-badge-ultra">ULTRA PLAN</span>
          </template>
          <template #turbo>
            <span class="trigger-subtitle tier-badge-turbo">TURBO PLAN</span>
          </template>
          <template #pro>
            <span class="trigger-subtitle tier-badge-pro">PRO PLAN</span>
          </template>
          <template #free>
            <span class="trigger-subtitle tier-badge-free">Free Plan</span>
          </template>
          <template #default>
            <span class="trigger-subtitle tier-badge-free">Free Plan</span>
          </template>
        </MemberTierProvider>
      </div>

      <!-- Credit 微型胶囊 (仅展开时显示) -->
      <TooltipProvider v-if="isSidebarOpen" :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <div
              class="credit-pill"
              :class="creditPillClass"
              @click.stop="handleUpgradeClick"
            >
              <Zap :size="12" class="credit-pill-icon" />
              <span class="credit-pill-value">{{ formattedCredits }}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{{ formattedCreditsDetailed }} Credits</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider v-if="isSidebarOpen" :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <span
              role="button"
              tabindex="0"
              :aria-label="t('uiComp.sidebar.openSettings')"
              class="trigger-settings-wrap"
              @click.stop="handleSettingsClick"
              @keydown.enter.stop="handleSettingsClick"
            >
              <Settings :size="16" class="trigger-settings" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">{{ t('uiComp.sidebar.openSettings') }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.user-profile-container {
  position: relative;
  width: 100%;
  overflow: visible;
}

// 玻璃态核心样式（已精简为纯净模式）
.glass-panel {
  background: transparent;
  border: none;
  box-shadow: none;
  position: relative;
}

// 触发按钮
.trigger-btn {
  display: flex;
  padding: 0;
  border-radius: 24px;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  width: 100%;
  justify-content: flex-start;

  &.items-center.gap-3 {
    align-items: center;
    gap: 12px;
  }

  &:hover {
    background: transparent;
  }

  &:active {
    transform: scale(0.98);
  }

  &.collapsed {
    justify-content: center;
    padding: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    margin: 0 auto;
  }

  .trigger-avatar {
    flex-shrink: 0;
  }

  .trigger-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    overflow: hidden;
    gap: 1px;
    transition: all 0.3s;

    &.hidden {
      display: none;
    }

    .trigger-name {
      font-size: 12px;
      font-weight: 600;
      color: rgba($primary-color-900, 0.9);
      line-height: 1.2;
    }

    .trigger-subtitle {
      font-size: 12px;
      line-height: 1.2;
      transition: all 0.3s ease;

      &.tier-badge-free {
        color: rgba($primary-color-600, 0.6);
      }

      &.tier-badge-pro {
        color: var(--color-emerald-600, #059669);
        font-weight: 500;
      }

      &.tier-badge-turbo {
        font-weight: 700;
        background: linear-gradient(135deg, var(--color-amber-600, #d97706) 0%, var(--color-amber-400, #f59e0b) 50%, var(--color-amber-600, #d97706) 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      &.tier-badge-ultra {
        font-weight: 800;
        // Ultra tier rainbow gradient - decorative brand colors, kept as-is
        background: linear-gradient(
          135deg,
          #ff6b6b 0%,
          #feca57 20%,
          #48dbfb 40%,
          #ff9ff3 60%,
          #54a0ff 80%,
          #5f27cd 100%
        );
        background-size: 200% 200%;
        animation: rainbow-shift 3s ease infinite;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
  }

  .trigger-settings-wrap {
    margin-left: auto;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .trigger-settings {
    color: rgba($primary-color-600, 0.5);
    transition: all 0.5s;
  }

  &:hover .trigger-settings {
    color: rgba($primary-color-900, 0.8);
    transform: rotate(90deg);
  }
}

// Ultra 彩钻渐变动画
@keyframes rainbow-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

// ==================== Credit 微型胶囊样式 ====================
.credit-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: auto;
  flex-shrink: 0;

  &.credit-pill-normal {
    background: rgba($secondary-color-100, 0.6);
    border: 1px solid rgba($secondary-color-300, 0.4);
    color: $secondary-color-700;

    .credit-pill-icon {
      color: $secondary-color-500;
    }

    &:hover {
      background: rgba($secondary-color-200, 0.8);
      border-color: rgba($secondary-color-400, 0.6);
      box-shadow: 0 2px 8px rgba($secondary-color-500, 0.2);
    }
  }

  &.credit-pill-warning {
    background: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: var(--color-amber-700, #b45309);

    .credit-pill-icon {
      color: var(--color-amber-400, #f59e0b);
    }

    &:hover {
      background: rgba(251, 191, 36, 0.25);
      border-color: rgba(245, 158, 11, 0.5);
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
    }
  }

  &.credit-pill-critical {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--color-red-600, #dc2626);
    animation: pill-pulse 2s ease-in-out infinite;

    .credit-pill-icon {
      color: var(--color-red-500, #ef4444);
    }

    &:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.5);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
      animation: none;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.credit-pill-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.credit-pill:hover .credit-pill-icon {
  transform: scale(1.1);
}

.credit-pill-value {
  line-height: 1;
}

@keyframes pill-pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  50% {
    opacity: 0.85;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
}

/* 暗色模式适配已移至下方非 scoped <style> 块，避免 :global(.dark) 编译丢失子选择器的 bug */
</style>

<!-- 暗色模式：非 scoped 块，.dark .xxx 正常工作 -->
<style lang="scss">
.dark {
  .trigger-btn {
    &:hover {
      background: transparent;
    }
  }

  .trigger-btn .trigger-info .trigger-name {
    color: rgba(224, 231, 235, 0.9);
  }

  .tier-badge-free {
    color: rgba(124, 183, 180, 0.6);
  }

  .trigger-avatar .avatar-wrapper-inner {
    border-color: rgba(255, 255, 255, 0.1);
  }

  .trigger-settings {
    color: rgba(124, 183, 180, 0.4);
  }

  .trigger-btn:hover .trigger-settings {
    color: rgba(124, 183, 180, 0.8);
  }

  .credit-pill.credit-pill-normal {
    background: rgba(0, 184, 199, 0.1);
    border-color: rgba(0, 184, 199, 0.2);
    color: rgba(0, 184, 199, 0.8);

    .credit-pill-icon {
      color: rgba(0, 184, 199, 0.7);
    }

    &:hover {
      background: rgba(0, 184, 199, 0.15);
      border-color: rgba(0, 184, 199, 0.3);
      box-shadow: 0 2px 8px rgba(0, 184, 199, 0.15);
    }
  }
}
</style>
