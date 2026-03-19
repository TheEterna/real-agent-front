<script setup lang="ts">
/**
 * UsageLogsSection - "使用记录" 标签页
 *
 * 卡片网格布局：
 *   第一行 — 今日（含 7 日活跃 + 关键指标）| 模型偏好 | 任务类型
 *   第二行 — 明细日志（固定高度内滚动）
 *
 * 所有 mini 可视化均用纯 CSS 实现（无外部图表库）
 */
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { billingApi, type UsageLogVO } from '@/api/billing'
import {
  Clock, TrendingUp, MessageSquare, Calendar,
  Zap, Activity, Timer, Sparkles, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-vue-next'
import ProviderIcon from '@/components/ProviderIcon.vue'
import { getProviderColor, resolveProviderFromModel } from '@/types/llm'
import type { UserStats } from '@/api/auth'
import type { MaxModeInfo } from '../types'

const { t } = useI18n()

const props = defineProps<{
  userStats: UserStats | null
  formattedTotalUsed: string
  maxMode: MaxModeInfo
}>()

const logs = ref<UsageLogVO[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    logs.value = await billingApi.getUserUsageLogs()
  } finally {
    loading.value = false
  }
})

// ==================== 格式化工具 ====================

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days === 0) return t('profile.usage.dateToday')
  if (days === 1) return t('profile.usage.dateYesterday')
  if (days < 7) return t('profile.usage.dateDaysAgo', { n: days })
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatCredits = (credits: number) => credits.toFixed(4)

const TAG_STYLES = computed<Record<string, { label: string; classes: string; dotClass: string }>>(() => ({
  llm_call: { label: t('profile.usage.tagLlmCall'), classes: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', dotClass: 'bg-violet-500' },
  playground_chat: { label: t('profile.usage.tagPlaygroundChat'), classes: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', dotClass: 'bg-indigo-500' },
  roleplay_chat: { label: t('profile.usage.tagRoleplayChat'), classes: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400', dotClass: 'bg-pink-500' },
  web_search: { label: t('profile.usage.tagWebSearch'), classes: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400', dotClass: 'bg-sky-500' },
  image_gen: { label: t('profile.usage.tagImageGen'), classes: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500' },
  speech_gen: { label: t('profile.usage.tagSpeechGen'), classes: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', dotClass: 'bg-rose-500' },
  video_gen: { label: t('profile.usage.tagVideoGen'), classes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', dotClass: 'bg-emerald-500' },
  embedding: { label: t('profile.usage.tagEmbedding'), classes: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400', dotClass: 'bg-teal-500' },
}))

const DEFAULT_TAG = { label: '', classes: 'bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400', dotClass: 'bg-slate-400' }

function getTag(type: string) {
  return TAG_STYLES.value[type] || { ...DEFAULT_TAG, label: type }
}

function getIconBgStyle(source: string) {
  const color = getProviderColor(resolveProviderFromModel(source))
  return { backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }
}

// ==================== 派生数据 ====================

/** 按日期分组的日志 */
const groupedLogs = computed(() => {
  const groups: Record<string, UsageLogVO[]> = {}
  logs.value.forEach(log => {
    const date = formatDate(log.callTime)
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  })
  return groups
})

/** 今日快照 */
const todayStats = computed(() => {
  const today = new Date().toDateString()
  const todayLogs = logs.value.filter(l => new Date(l.callTime).toDateString() === today)
  return {
    count: todayLogs.length,
    credits: todayLogs.reduce((s, l) => s + l.creditsCharged, 0)
  }
})

/** 模型使用分布（Top 5） */
const modelDistribution = computed(() => {
  const counts: Record<string, { count: number; credits: number }> = {}
  logs.value.forEach(log => {
    if (!counts[log.source]) counts[log.source] = { count: 0, credits: 0 }
    counts[log.source].count++
    counts[log.source].credits += log.creditsCharged
  })
  const total = logs.value.length || 1
  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([model, data]) => ({
      model,
      count: data.count,
      credits: data.credits,
      percentage: Math.round(data.count / total * 100),
      color: getProviderColor(resolveProviderFromModel(model))
    }))
})

/** 任务类型分布 */
const typeDistribution = computed(() => {
  const counts: Record<string, number> = {}
  logs.value.forEach(log => {
    counts[log.businessType] = (counts[log.businessType] || 0) + 1
  })
  const total = logs.value.length || 1
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round(count / total * 100),
      ...getTag(type)
    }))
})

/** 7 日活跃度 */
const weeklyActivity = computed(() => {
  const dayNames = [
    t('profile.usage.daySun'), t('profile.usage.dayMon'), t('profile.usage.dayTue'),
    t('profile.usage.dayWed'), t('profile.usage.dayThu'), t('profile.usage.dayFri'), t('profile.usage.daySat')
  ]
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return { date, dayName: dayNames[date.getDay()], count: 0, credits: 0 }
  })
  logs.value.forEach(log => {
    const logDate = new Date(log.callTime)
    const dayIdx = days.findIndex(d => d.date.toDateString() === logDate.toDateString())
    if (dayIdx >= 0) {
      days[dayIdx].count++
      days[dayIdx].credits += log.creditsCharged
    }
  })
  const maxCount = Math.max(...days.map(d => d.count), 1)
  return days.map(d => ({ ...d, heightPercent: Math.max(d.count / maxCount * 100, 4) }))
})

/** 平均响应速度 */
const avgSpeed = computed(() => {
  const withTime = logs.value.filter(l => l.elapsedMs > 0)
  if (!withTime.length) return '-'
  const avg = withTime.reduce((s, l) => s + l.elapsedMs, 0) / withTime.length
  return avg >= 1000 ? `${(avg / 1000).toFixed(1)}s` : `${Math.round(avg)}ms`
})

/** 总 Token */
const totalTokens = computed(() => {
  const sum = logs.value.reduce((s, l) => s + l.totalTokens, 0)
  if (sum >= 1000000) return `${(sum / 1000000).toFixed(1)}M`
  if (sum >= 1000) return `${(sum / 1000).toFixed(1)}k`
  return sum.toString()
})

// ==================== 消耗洞察（第四卡片） ====================

/** 7 日消耗趋势（按 credits，区别于 weeklyActivity 的次数） */
const weeklySpend = computed(() => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return { date, credits: 0 }
  })
  logs.value.forEach(log => {
    const logDate = new Date(log.callTime)
    const idx = days.findIndex(d => d.date.toDateString() === logDate.toDateString())
    if (idx >= 0) days[idx].credits += log.creditsCharged
  })
  const max = Math.max(...days.map(d => d.credits), 0.01)
  return days.map(d => ({ ...d, heightPercent: Math.max(d.credits / max * 100, 3) }))
})

/** 昨日 vs 今日 趋势 */
const spendTrend = computed(() => {
  const today = weeklySpend.value[6].credits
  const yesterday = weeklySpend.value[5].credits
  if (yesterday === 0 && today === 0) return { direction: 'flat' as const, label: '-' }
  if (yesterday === 0) return { direction: 'up' as const, label: 'NEW' }
  const change = ((today - yesterday) / yesterday) * 100
  if (Math.abs(change) < 5) return { direction: 'flat' as const, label: `${Math.abs(Math.round(change))}%` }
  return {
    direction: change > 0 ? 'up' as const : 'down' as const,
    label: `${Math.abs(Math.round(change))}%`
  }
})

/** 平均每次消耗 */
const avgCostPerCall = computed(() => {
  if (!logs.value.length) return '-'
  const avg = logs.value.reduce((s, l) => s + l.creditsCharged, 0) / logs.value.length
  return avg.toFixed(4)
})

/** Input / Output Token 比 */
const ioRatio = computed(() => {
  const totalIn = logs.value.reduce((s, l) => s + l.inputTokens, 0)
  const totalOut = logs.value.reduce((s, l) => s + l.outputTokens, 0)
  if (!totalOut) return '-'
  return `1:${(totalOut / totalIn).toFixed(1)}`
})

/** 最贵单次调用 */
const maxSingleCost = computed(() => {
  if (!logs.value.length) return { cost: '-', model: '' }
  const max = logs.value.reduce((a, b) => a.creditsCharged > b.creditsCharged ? a : b)
  return { cost: max.creditsCharged.toFixed(4), model: max.source }
})
</script>

<template>
  <!-- flex 列布局：顶部卡片 shrink-0 + 明细卡片 flex-1，整体不超一屏 -->
  <div class="flex flex-col gap-3 h-full">
    <!-- ============ 第一行：三张洞察卡片（紧凑） ============ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">

      <!-- 卡片 1：今日 + 7 日活跃 + 关键指标 -->
      <div class="usage-card p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <Sparkles :size="12" class="text-amber-500" />
            <span class="card-title">{{ t('profile.usage.today') }}</span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-[10px] text-slate-400 dark:text-zinc-500">{{ t('profile.usage.cost') }}</span>
            <span class="text-xs font-bold font-mono tabular-nums text-slate-700 dark:text-zinc-200">{{ todayStats.credits.toFixed(2) }}</span>
            <span class="text-[10px] text-slate-400 dark:text-zinc-500">cr</span>
          </div>
        </div>

        <!-- 今日核心数字 + 7日柱状图并排 -->
        <div class="flex items-end gap-3 mb-3">
          <div class="shrink-0">
            <span class="text-3xl font-bold tabular-nums text-slate-900 dark:text-white font-mono leading-none">{{ todayStats.count }}</span>
            <span class="text-[10px] text-slate-400 dark:text-zinc-500 ml-0.5">{{ t('profile.usage.countUnit') }}</span>
          </div>
          <!-- 7 日活跃柱状图（紧凑） -->
          <div class="flex items-end gap-1 flex-1 h-9">
            <div
              v-for="(day, i) in weeklyActivity"
              :key="i"
              class="flex-1 flex flex-col items-center gap-0.5"
            >
              <div
                class="w-full rounded-sm transition-all duration-300"
                :class="day.count > 0
                  ? 'bg-teal-400/80 dark:bg-teal-500/60'
                  : 'bg-slate-100 dark:bg-zinc-700/40'"
                :style="{ height: `${day.heightPercent}%` }"
              />
              <span class="text-[8px] text-slate-400 dark:text-zinc-500 leading-none">{{ day.dayName }}</span>
            </div>
          </div>
        </div>

        <!-- 关键指标行 -->
        <div class="grid grid-cols-3 gap-1 pt-2 border-t border-border/30">
          <div class="text-center">
            <div class="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ props.userStats?.conversationCount ?? '-' }}</div>
            <div class="text-[9px] text-slate-400 dark:text-zinc-500">{{ t('profile.usage.totalConversations') }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ avgSpeed }}</div>
            <div class="text-[9px] text-slate-400 dark:text-zinc-500">{{ t('profile.usage.response') }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ totalTokens }}</div>
            <div class="text-[9px] text-slate-400 dark:text-zinc-500">Tokens</div>
          </div>
        </div>
      </div>

      <!-- 卡片 2：模型偏好 -->
      <div class="usage-card p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <Activity :size="12" class="text-teal-500 dark:text-teal-400" />
            <span class="card-title">{{ t('profile.usage.modelPreference') }}</span>
          </div>
          <span class="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">{{ props.formattedTotalUsed }} cr</span>
        </div>

        <div v-if="modelDistribution.length" class="space-y-2">
          <div v-for="item in modelDistribution" :key="item.model">
            <div class="flex items-center justify-between mb-0.5">
              <div class="flex items-center gap-1.5 min-w-0">
                <ProviderIcon :provider="item.model" size="xs" colored />
                <span class="text-[11px] font-medium text-slate-600 dark:text-zinc-300 truncate">{{ item.model }}</span>
              </div>
              <span class="text-[10px] font-mono font-semibold tabular-nums text-slate-500 dark:text-zinc-400">{{ item.percentage }}%</span>
            </div>
            <div class="h-1 rounded-full bg-slate-100 dark:bg-zinc-700/60 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"
              />
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Activity :size="18" class="mb-1.5 opacity-40" />
          <span class="text-xs text-muted-foreground">{{ t('profile.usage.noData') }}</span>
        </div>
      </div>

      <!-- 卡片 3：任务类型 -->
      <div class="usage-card p-3">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <Zap :size="12" class="text-violet-500 dark:text-violet-400" />
            <span class="card-title">{{ t('profile.usage.taskType') }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-[10px] text-slate-400 dark:text-zinc-500">MAX</span>
            <span class="text-[10px] font-mono font-bold tabular-nums text-slate-700 dark:text-zinc-200">{{ props.maxMode.isUnlimited ? '∞' : props.maxMode.remaining }}</span>
          </div>
        </div>

        <div v-if="typeDistribution.length">
          <!-- 堆叠条形图 -->
          <div class="flex h-2 rounded-full overflow-hidden mb-3">
            <div
              v-for="item in typeDistribution"
              :key="item.type"
              class="h-full transition-all duration-500"
              :class="item.dotClass"
              :style="{ width: `${item.percentage}%` }"
            />
          </div>
          <!-- 图例 -->
          <div class="space-y-1">
            <div
              v-for="item in typeDistribution"
              :key="item.type"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-1.5">
                <div class="h-2 w-2 rounded-full shrink-0" :class="item.dotClass" />
                <span class="text-[11px] text-slate-600 dark:text-zinc-300">{{ item.label }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">{{ item.count }}</span>
                <span class="text-[11px] font-mono font-semibold tabular-nums text-slate-500 dark:text-zinc-400 w-7 text-right">{{ item.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Zap :size="18" class="mb-1.5 opacity-40" />
          <span class="text-xs text-muted-foreground">{{ t('profile.usage.noData') }}</span>
        </div>
      </div>
    </div>

    <!-- ============ 第二行：消耗洞察 + 明细（左右结构，flex-1 填满） ============ -->
    <div class="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

      <!-- 左侧：消耗洞察 -->
      <div class="usage-card p-3 lg:w-52 shrink-0 flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <TrendingUp :size="12" class="text-rose-500 dark:text-rose-400" />
            <span class="card-title">{{ t('profile.usage.spendInsight') }}</span>
          </div>
          <!-- 趋势标签 -->
          <div
            class="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            :class="{
              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400': spendTrend.direction === 'down',
              'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400': spendTrend.direction === 'up',
              'bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400': spendTrend.direction === 'flat'
            }"
          >
            <ArrowDownRight v-if="spendTrend.direction === 'down'" :size="10" />
            <ArrowUpRight v-else-if="spendTrend.direction === 'up'" :size="10" />
            <Minus v-else :size="10" />
            {{ spendTrend.label }}
          </div>
        </div>

        <!-- 7日消耗柱状图（渐变色，区别于今日卡片的活跃度） -->
        <div class="flex items-end gap-1 h-14 mb-3">
          <div
            v-for="(day, i) in weeklySpend"
            :key="i"
            class="flex-1 flex flex-col items-center gap-0.5"
          >
            <div
              class="w-full rounded-sm transition-all duration-300"
              :class="day.credits > 0
                ? 'bg-rose-400/70 dark:bg-rose-500/50'
                : 'bg-slate-100 dark:bg-zinc-700/40'"
              :style="{ height: `${day.heightPercent}%` }"
            />
          </div>
        </div>

        <!-- 效率指标 -->
        <div class="space-y-0 divide-y divide-border/30 flex-1">
          <div class="flex items-center justify-between py-2">
            <span class="text-[10px] text-slate-500 dark:text-zinc-400">{{ t('profile.usage.avgCost') }}</span>
            <span class="text-[11px] font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ avgCostPerCall }}<span class="text-[9px] font-normal text-slate-400 dark:text-zinc-500 ml-0.5">cr</span></span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-[10px] text-slate-500 dark:text-zinc-400">{{ t('profile.usage.ioRatio') }}</span>
            <span class="text-[11px] font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ ioRatio }}</span>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-[10px] text-slate-500 dark:text-zinc-400">{{ t('profile.usage.maxSingle') }}</span>
            <div class="text-right">
              <div class="text-[11px] font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ maxSingleCost.cost }}</div>
              <div v-if="maxSingleCost.model" class="text-[9px] text-slate-400 dark:text-zinc-500 truncate max-w-20">{{ maxSingleCost.model }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between py-2">
            <span class="text-[10px] text-slate-500 dark:text-zinc-400">{{ t('profile.usage.member') }}</span>
            <span class="text-[11px] font-bold font-mono tabular-nums text-slate-900 dark:text-white">{{ props.userStats?.memberDays ?? '-' }}<span class="text-[9px] font-normal text-slate-400 dark:text-zinc-500 ml-0.5">{{ t('profile.usage.dayUnit') }}</span></span>
          </div>
        </div>
      </div>

      <!-- 右侧：明细卡片 -->
      <div class="usage-card flex flex-col flex-1 min-h-0">
        <div class="flex items-center justify-between px-3 py-2 border-b border-border/30 shrink-0">
          <div class="flex items-center gap-1.5">
            <Clock :size="12" class="text-slate-400 dark:text-zinc-500" />
            <span class="card-title">{{ t('profile.usage.detail') }}</span>
          </div>
          <span v-if="logs.length" class="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">{{ t('profile.usage.logCount', { count: logs.length }) }}</span>
        </div>

        <!-- 加载态 -->
        <div v-if="loading" class="p-3 space-y-2">
          <div v-for="i in 4" :key="i" class="flex items-center gap-3">
            <div class="h-7 w-7 rounded-lg bg-slate-100 dark:bg-zinc-700 animate-pulse" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3 w-20 rounded bg-slate-100 dark:bg-zinc-700 animate-pulse" />
              <div class="h-2 w-14 rounded bg-slate-100 dark:bg-zinc-700 animate-pulse" />
            </div>
            <div class="h-3 w-10 rounded bg-slate-100 dark:bg-zinc-700 animate-pulse" />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="logs.length === 0" class="flex flex-col items-center justify-center flex-1 py-10">
          <div class="flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-muted text-muted-foreground mb-2">
            <TrendingUp :size="20" />
          </div>
          <p class="text-base text-muted-foreground">{{ t('profile.usage.noUsageData') }}</p>
          <p class="mt-1 text-[11px] text-muted-foreground/70">{{ t('profile.usage.noUsageHint') }}</p>
        </div>

        <!-- 日志列表（flex-1 自适应高度，内滚动） -->
        <div v-else class="flex-1 min-h-0 overflow-y-auto usage-scroll">
          <div v-for="(items, date) in groupedLogs" :key="date">
            <div class="sticky top-0 z-10 px-3 py-1 bg-background/95 backdrop-blur-sm">
              <h4 class="text-[10px] font-semibold text-muted-foreground">{{ date }}</h4>
            </div>
            <div class="divide-y divide-border/20">
              <div
                v-for="log in items"
                :key="log.id"
                class="flex items-center gap-2.5 px-3 py-2 transition-colors duration-150 ease-[var(--ease-snap)] hover:bg-muted/50"
              >
                <!-- Provider Icon -->
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  :style="getIconBgStyle(log.source)"
                >
                  <ProviderIcon :provider="log.source" size="sm" colored />
                </div>

                <!-- 信息 -->
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <span class="truncate text-[13px] font-medium text-slate-700 dark:text-zinc-200">{{ log.source }}</span>
                  <span class="rounded px-1.5 py-0.5 text-[10px] font-medium" :class="getTag(log.businessType).classes">
                    {{ getTag(log.businessType).label }}
                  </span>
                  <span class="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                    <TrendingUp :size="9" />
                    {{ log.totalTokens }}
                  </span>
                  <span v-if="log.elapsedMs" class="hidden md:flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                    <Clock :size="9" />
                    {{ log.elapsedMs }}ms
                  </span>
                </div>

                <!-- Credits -->
                <div class="shrink-0">
                  <span class="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white font-mono">
                    {{ formatCredits(log.creditsCharged) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-card {
  border-radius: var(--radius-xl, 0.75rem);
  border: 1px solid rgb(from var(--border) r g b / 0.4);
  background: rgb(255 255 255 / 0.8);
  backdrop-filter: blur(var(--blur-sm));
}

.card-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted-foreground);
}

/* 滚动条美化 */
.usage-scroll::-webkit-scrollbar {
  width: 4px;
}
.usage-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.usage-scroll::-webkit-scrollbar-thumb {
  background: rgb(0 0 0 / 0.1);
  border-radius: 2px;
}
.usage-scroll::-webkit-scrollbar-thumb:hover {
  background: rgb(0 0 0 / 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .usage-card,
  .usage-card * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>

<style lang="scss">
.dark {
  .usage-card {
    background: rgb(39 39 42 / 0.8);
  }

  .usage-scroll::-webkit-scrollbar-thumb {
    background: rgb(255 255 255 / 0.1);
  }
  .usage-scroll::-webkit-scrollbar-thumb:hover {
    background: rgb(255 255 255 / 0.2);
  }
}
</style>
