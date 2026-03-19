<script setup lang="ts">
/**
 * EmotionCalendar — V3 情绪日历 Overlay
 * 全屏浮层：摘要卡片 + 月历网格 + 图例
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEmotion } from '../composables/useEmotion'

const { t } = useI18n()

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const {
  emotionDays, firstDayOfWeek, monthLabel, summary,
  currentYear, currentMonth,
  generateCalendarDays, prevMonth, nextMonth,
} = useEmotion()

onMounted(() => generateCalendarDays())

const today = new Date().getDate()
const isCurrentMonth = computed(() => {
  const now = new Date()
  return currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth()
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay-panel" :class="{ open: visible }">
      <div class="overlay-header">
        <h2>
          <Calendar :size="20" :stroke-width="1.8" />
          {{ t('playgroundChat.emotionCalendar.title') }}
        </h2>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="overlay-close" :aria-label="t('common.button.close')" @click="emit('close')">
                <X :size="18" :stroke-width="1.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('common.button.close') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div class="overlay-body">
        <!-- 摘要卡片 -->
        <div class="emo-summary">
          <div class="emo-summary-card">
            <div class="es-emoji">{{ summary.mainMoodEmoji }}</div>
            <div class="es-label">{{ t('playgroundChat.emotionCalendar.mainMood') }}</div>
            <div class="es-value">{{ summary.mainMood }}</div>
          </div>
          <div class="emo-summary-card">
            <div class="es-emoji">{{ summary.topEmotionEmoji }}</div>
            <div class="es-label">{{ t('playgroundChat.emotionCalendar.topEmotion') }}</div>
            <div class="es-value">{{ summary.topEmotion }}</div>
          </div>
          <div class="emo-summary-card">
            <div class="es-emoji">{{ summary.streakEmoji }}</div>
            <div class="es-label">{{ t('playgroundChat.emotionCalendar.consecutiveGood') }}</div>
            <div class="es-value">{{ summary.streak }} {{ t('playgroundChat.emotionCalendar.days') }}</div>
          </div>
          <div class="emo-summary-card">
            <div class="es-emoji">{{ summary.avgScore }}</div>
            <div class="es-label">{{ t('playgroundChat.emotionCalendar.avgScore') }}</div>
            <div class="es-value">{{ summary.avgLabel }}</div>
          </div>
        </div>

        <!-- 月份切换 -->
        <div class="emo-cal-month">
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button :aria-label="t('playgroundChat.emotionCalendar.prevMonth')" @click="prevMonth">
                  <ChevronLeft :size="14" :stroke-width="2" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t('playgroundChat.emotionCalendar.prevMonth') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>{{ monthLabel }}</span>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button :aria-label="t('playgroundChat.emotionCalendar.nextMonth')" @click="nextMonth">
                  <ChevronRight :size="14" :stroke-width="2" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t('playgroundChat.emotionCalendar.nextMonth') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 星期标题 -->
        <div class="emo-cal-weekdays">
          <span>{{ t('playgroundChat.emotionCalendar.weekdays.sun') }}</span><span>{{ t('playgroundChat.emotionCalendar.weekdays.mon') }}</span><span>{{ t('playgroundChat.emotionCalendar.weekdays.tue') }}</span><span>{{ t('playgroundChat.emotionCalendar.weekdays.wed') }}</span><span>{{ t('playgroundChat.emotionCalendar.weekdays.thu') }}</span><span>{{ t('playgroundChat.emotionCalendar.weekdays.fri') }}</span><span>{{ t('playgroundChat.emotionCalendar.weekdays.sat') }}</span>
        </div>

        <!-- 日历网格 -->
        <div class="emo-cal-grid">
          <!-- 月初空白 -->
          <div v-for="n in firstDayOfWeek" :key="'e'+n" class="emo-day empty"></div>
          <!-- 日期 -->
          <div
            v-for="day in emotionDays"
            :key="day.date"
            class="emo-day"
            :class="{ today: isCurrentMonth && day.day === today }"
          >
            {{ day.day }}
            <span v-if="day.level" class="emo-dot" :class="day.level"></span>
          </div>
        </div>

        <!-- 图例（颜色 + 文字双重标识，满足 a11y 颜色独立要求） -->
        <div class="emo-legend" role="list" :aria-label="t('playgroundChat.emotionCalendar.legendAriaLabel')">
          <div class="emo-legend-item" role="listitem"><i class="legend-dot great" aria-hidden="true"></i>{{ t('playgroundChat.emotionCalendar.legendGreat') }}</div>
          <div class="emo-legend-item" role="listitem"><i class="legend-dot good" aria-hidden="true"></i>{{ t('playgroundChat.emotionCalendar.legendGood') }}</div>
          <div class="emo-legend-item" role="listitem"><i class="legend-dot ok" aria-hidden="true"></i>{{ t('playgroundChat.emotionCalendar.legendOk') }}</div>
          <div class="emo-legend-item" role="listitem"><i class="legend-dot low" aria-hidden="true"></i>{{ t('playgroundChat.emotionCalendar.legendLow') }}</div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay-panel {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(250, 250, 247, 0.88);
  backdrop-filter: blur(var(--blur-md, 20px));
  opacity: 0; pointer-events: none;
  transition: opacity 0.35s var(--ease-fluid);
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.overlay-panel.open { opacity: 1; pointer-events: auto; }

.overlay-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 40px; flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}
.overlay-header h2 {
  font-size: 1.5rem; font-weight: 600; color: var(--foreground);
  display: flex; align-items: center; gap: 10px;
}
.overlay-header h2 :deep(svg) { opacity: 0.4; }

.overlay-close {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); border: none; background: none;
  color: var(--muted-foreground); cursor: pointer;
  transition: all var(--duration-fast);
}
.overlay-close:hover { color: var(--foreground); background: var(--muted); }
.overlay-close:active { transform: scale(0.95); }

.overlay-body {
  flex: 1; padding: 40px;
  max-width: 720px; width: 100%; margin: 0 auto;
}

/* 摘要卡片 */
.emo-summary {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 16px; margin-bottom: 40px;
}
.emo-summary-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 16px; text-align: center;
  transition: all var(--duration-normal) var(--ease-fluid);
}
.emo-summary-card:hover {
  box-shadow: var(--shadow-sm);
}
.es-emoji { font-size: 1.5rem; margin-bottom: 4px; }
.es-label { font-size: 0.75rem; color: var(--muted-foreground); }
.es-value {
  font-size: 1.125rem; font-weight: 700; color: var(--color-primary-700);
}

/* 月份切换 */
.emo-cal-month {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
}
.emo-cal-month span {
  font-size: 1.125rem; font-weight: 600; color: var(--foreground);
}
.emo-cal-month button {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  background: none; color: var(--muted-foreground); cursor: pointer;
  transition: all var(--duration-fast);
}
.emo-cal-month button:hover { color: var(--foreground); background: var(--muted); }
.emo-cal-month button:active { transform: scale(0.95); }

/* 星期标题 */
.emo-cal-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 4px; margin-bottom: 4px;
}
.emo-cal-weekdays span {
  text-align: center; font-size: 0.75rem; font-weight: 600;
  color: var(--muted-foreground); text-transform: uppercase;
  letter-spacing: 0.5px; padding: 4px 0;
}

/* 日历网格 */
.emo-cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
}
.emo-day {
  aspect-ratio: 1; border-radius: var(--radius-sm);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 3px;
  font-size: 0.75rem; color: var(--foreground);
  opacity: 0.6;
  background: var(--card);
  border: 1px solid transparent; cursor: default;
  transition: all var(--duration-fast); position: relative;
}
.emo-day:not(.empty):hover {
  opacity: 1;
  border-color: var(--border);
  transform: scale(1.06);
}
.emo-day.empty { background: transparent; }
.emo-day.today {
  background: var(--color-primary-100);
  border-color: var(--color-primary-500);
  font-weight: 600; color: var(--color-primary-700);
  opacity: 1;
}

.emo-dot { width: 6px; height: 6px; border-radius: 50%; }
.emo-dot.great  { background: var(--color-green-500, #22c55e); }
.emo-dot.good   { background: var(--color-lime-500, #84cc16); }
.emo-dot.ok     { background: var(--color-yellow-500, #eab308); }
.emo-dot.low    { background: var(--color-orange-500, #f97316); }

/* 图例 */
.emo-legend {
  display: flex; gap: 24px; justify-content: center;
  margin-top: 24px; padding-top: 16px;
  border-top: 1px solid var(--border);
}
.emo-legend-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.75rem; color: var(--muted-foreground);
}
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%; display: inline-block;
}
.legend-dot.great  { background: var(--color-green-500, #22c55e); }
.legend-dot.good   { background: var(--color-lime-500, #84cc16); }
.legend-dot.ok     { background: var(--color-yellow-500, #eab308); }
.legend-dot.low    { background: var(--color-orange-500, #f97316); }
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .overlay-panel {
    background: rgba(20, 20, 20, 0.92);
  }

  .emo-summary-card {
    background: rgba(255, 255, 255, 0.04);
  }

  .es-value {
    color: var(--color-primary-400);
  }

  .emo-day {
    background: rgba(255, 255, 255, 0.03);
  }
  .emo-day:not(.empty):hover {
    background: rgba(255, 255, 255, 0.06);
  }
  .emo-day.today {
    background: var(--color-primary-100);
    border-color: var(--color-primary-500);
    color: var(--color-primary-400);
  }
}
</style>
