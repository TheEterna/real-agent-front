<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { X, Check, Building2, ChevronDown, ChevronUp, HelpCircle, Loader2 } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { subscriptionApi } from '@/api/subscription'
import { message } from 'ant-design-vue'
import gsap from 'gsap'
import { useI18n } from 'vue-i18n'
import type { TierType, BillingCycle, SubscriptionPlan } from '@/types/subscription'

const { t } = useI18n()

// ==================== Props & Emits ====================
interface Props {
  visible: boolean
  currentTier?: TierType
  currentBilling?: BillingCycle
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  currentTier: 'free',
  currentBilling: 'monthly',
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'subscription-changed'): void
}>()

// ==================== 状态 ====================
const billingCycle = ref<BillingCycle>('monthly')
const loading = ref(false)
const submitting = ref(false)     // 订阅操作中（按钮 loading guard）
const showQrCode = ref(false)
const showFullComparison = ref(false)
const mobileActiveIndex = ref(1) // 默认聚焦 Pro
const isMobileView = ref(false)
const cardRefs = ref<HTMLElement[]>([])

// SWR: 立即用默认数据渲染（Stale），API 返回后替换（Revalidate）
const defaultPlansMap = new Map<string, SubscriptionPlan>()
const plans = ref<SubscriptionPlan[]>([])

// ==================== 响应式检测 ====================
const updateMobileView = () => {
  isMobileView.value = window.matchMedia('(max-width: 768px)').matches
}

// ==================== 数据获取（SWR 模式） ====================
const fetchPlans = async () => {
  loading.value = true
  try {
    const response = await subscriptionApi.getPlans()
    if (response.code === 200 && response.data) {
      // 将 API 数据与默认数据合并：API 字段优先，前端增强字段从 defaults 补全
      plans.value = response.data
        .filter((plan: SubscriptionPlan) => plan.isPublic)
        .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder)
        .map((apiPlan: SubscriptionPlan) => {
          const defaults = defaultPlansMap.get(apiPlan.id)
          if (!defaults) return apiPlan
          return {
            ...defaults,   // 前端增强字段兜底（highlightFeatures, creditsAnchor 等）
            ...apiPlan,    // API 实际数据覆盖
            // 前端增强字段：API 无则从 defaults 补全
            highlightFeatures: apiPlan.highlightFeatures || defaults.highlightFeatures,
            expandedFeatures: apiPlan.expandedFeatures || defaults.expandedFeatures,
            creditsAnchor: apiPlan.creditsAnchor || defaults.creditsAnchor,
            dailyCostAnchor: apiPlan.dailyCostAnchor || defaults.dailyCostAnchor,
            sceneDescription: apiPlan.sceneDescription || defaults.sceneDescription,
          }
        })
    }
  } catch (error) {
    console.error('获取套餐列表失败:', error)
    // 失败保留默认，不清空（SWR 原则）
  } finally {
    loading.value = false
  }
}

// 默认套餐配置（降级方案，与 DB 和 Mock 同步）
const getDefaultPlans = (): SubscriptionPlan[] => [
  {
    id: 'free',
    name: 'Free',
    description: t('uiComp.pricing.plans.freeDesc'),
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlySaving: 0,
    monthlyCredits: 100,
    maxModeUsesPerMonth: 10,
    rechargeBonusRate: 1.0,
    overdraftLimit: -5,
    accessibleModels: ['gpt-4o-mini'],
    features: [t('uiComp.pricing.features.basicModel'), t('uiComp.pricing.features.monthlyCredits100'), t('uiComp.pricing.features.deepThinking10'), t('uiComp.pricing.features.standardSpeed'), t('uiComp.pricing.features.communitySupport')],
    highlightFeatures: [
      t('uiComp.pricing.features.basicModel'),
      t('uiComp.pricing.features.monthlyCredits100'),
      t('uiComp.pricing.features.deepThinking10'),
      t('uiComp.pricing.features.standardSpeed'),
      t('uiComp.pricing.features.communitySupport'),
    ],
    creditsAnchor: t('uiComp.pricing.creditsAnchor.free'),
    sceneDescription: t('uiComp.pricing.scene.free'),
    isPublic: true,
    sortOrder: 0,
    badgeStyle: 'tier-badge-free',
    cardStyle: 'tier-card-free',
    tierLevel: 0,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: t('uiComp.pricing.plans.proDesc'),
    monthlyPrice: 99,
    yearlyPrice: 948,
    yearlyMonthlyPrice: 79,
    yearlySaving: 240,
    monthlyCredits: 2000,
    maxModeUsesPerMonth: null,
    rechargeBonusRate: 1.1,
    overdraftLimit: -25,
    accessibleModels: ['gpt-5.3', 'opus-4.6', 'gemini-3.1-pro'],
    features: [t('uiComp.pricing.features.proModels'), t('uiComp.pricing.features.monthlyCredits2000'), t('uiComp.pricing.features.unlimitedDeepThinking'), t('uiComp.pricing.features.aiDrawing'), t('uiComp.pricing.features.knowledgeRAG'), t('uiComp.pricing.features.priorityAndBonus10')],
    highlightFeatures: [
      t('uiComp.pricing.features.proModelsDetailed'),
      t('uiComp.pricing.features.monthlyCredits2000Detailed'),
      t('uiComp.pricing.features.unlimitedDeepThinking'),
      t('uiComp.pricing.features.aiDrawingDetailed'),
      t('uiComp.pricing.features.knowledgeRAG'),
      t('uiComp.pricing.features.priorityAndBonus10'),
    ],
    expandedFeatures: [t('uiComp.pricing.features.rolePlay'), t('uiComp.pricing.features.mcpTools'), t('uiComp.pricing.features.multiAgent'), t('uiComp.pricing.features.prioritySupport')],
    creditsAnchor: t('uiComp.pricing.creditsAnchor.pro'),
    dailyCostAnchor: t('uiComp.pricing.dailyCost.pro'),
    sceneDescription: t('uiComp.pricing.scene.pro'),
    isPublic: true,
    sortOrder: 1,
    badgeStyle: 'tier-badge-pro',
    cardStyle: 'tier-card-pro',
    tierLevel: 1,
    tag: t('uiComp.pricing.plans.proTag'),
  },
  {
    id: 'turbo',
    name: 'Turbo',
    description: t('uiComp.pricing.plans.turboDesc'),
    monthlyPrice: 299,
    yearlyPrice: 2868,
    yearlyMonthlyPrice: 239,
    yearlySaving: 720,
    monthlyCredits: 10000,
    maxModeUsesPerMonth: null,
    rechargeBonusRate: 1.2,
    overdraftLimit: -50,
    accessibleModels: ['gpt-5.3', 'opus-4.6', 'gemini-3.1-pro', 'o3', 'deepseek-r1'],
    features: [t('uiComp.pricing.features.allFlagshipModels'), t('uiComp.pricing.features.monthlyCredits10000'), t('uiComp.pricing.features.unlimitedDeepThinking'), t('uiComp.pricing.features.multimodal'), t('uiComp.pricing.features.longContext'), t('uiComp.pricing.features.exclusiveAndBonus20')],
    highlightFeatures: [
      t('uiComp.pricing.features.allFlagshipDetailed'),
      t('uiComp.pricing.features.monthlyCredits10000Detailed'),
      t('uiComp.pricing.features.unlimitedDeepThinking'),
      t('uiComp.pricing.features.multimodalDetailed'),
      t('uiComp.pricing.features.longContext'),
      t('uiComp.pricing.features.exclusiveAndBonus20Detailed'),
    ],
    expandedFeatures: [t('uiComp.pricing.features.knowledgeAndRolePlay'), t('uiComp.pricing.features.allMcpTools'), t('uiComp.pricing.features.multiAgentVolo'), t('uiComp.pricing.features.embeddingAnalysis')],
    creditsAnchor: t('uiComp.pricing.creditsAnchor.turbo'),
    dailyCostAnchor: t('uiComp.pricing.dailyCost.turbo'),
    sceneDescription: t('uiComp.pricing.scene.turbo'),
    isPublic: true,
    sortOrder: 2,
    badgeStyle: 'tier-badge-turbo',
    cardStyle: 'tier-card-turbo',
    tierLevel: 2,
  },
]

// SWR 初始化：默认数据立即可用
const _defaults = getDefaultPlans()
_defaults.forEach(p => defaultPlansMap.set(p.id, p))
plans.value = _defaults

// ==================== 生命周期 ====================
watch(() => props.visible, (newVal) => {
  // SWR: 每次打开都尝试刷新（默认数据已立即渲染，后台静默替换）
  if (newVal) fetchPlans()
  // GSAP 卡片入场动画
  if (newVal) {
    nextTick(() => {
      if (cardRefs.value.length) {
        gsap.from(cardRefs.value, {
          y: 20, opacity: 0, scale: 0.97,
          duration: 0.4, stagger: 0.08,
          ease: 'back.out(1.4)', clearProps: 'transform,opacity',
        })
      }
    })
  }
})

onMounted(() => {
  updateMobileView()
  window.addEventListener('resize', updateMobileView)
  if (props.visible) fetchPlans()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileView)
  cardRefs.value.forEach(el => { if (el) gsap.killTweensOf(el) })
})

// ==================== 计算属性 ====================

const getDisplayPrice = (plan: SubscriptionPlan) => {
  if (plan.id === 'free') return '¥0'
  const price = billingCycle.value === 'monthly' ? plan.monthlyPrice : Math.floor(plan.yearlyMonthlyPrice)
  return `¥${price}`
}

const getYearlySaving = (plan: SubscriptionPlan) => {
  if (plan.id === 'free') return 0
  return plan.yearlySaving || (plan.monthlyPrice * 12 - plan.yearlyPrice)
}

const getFeatures = (plan: SubscriptionPlan) => plan.highlightFeatures || plan.features

// 按钮状态和文字
const getButtonConfig = (plan: SubscriptionPlan) => {
  if (plan.id === 'free') {
    return { text: t('uiComp.pricing.button.freeForever'), disabled: true, action: 'none' as const }
  }

  if (props.currentTier === 'ultra') {
    return { text: t('uiComp.pricing.button.eliteUser'), disabled: true, action: 'none' as const }
  }

  const isSameTier = props.currentTier === plan.id
  const currentTierLevel = plans.value.find(p => p.id === props.currentTier)?.tierLevel ?? 0
  const planTierLevel = plan.tierLevel ?? 0

  if (planTierLevel < currentTierLevel) {
    return { text: t('uiComp.pricing.button.hasHigherPlan'), disabled: true, action: 'none' as const }
  }

  if (isSameTier) {
    return { text: t('uiComp.pricing.button.renewPlan'), disabled: false, action: 'renew' as const }
  }

  return { text: t('uiComp.pricing.button.upgradeTo', { name: plan.name }), disabled: false, action: 'upgrade' as const }
}

// 升级差异化提示（Cooper：展示"比当前多解锁什么"）
const getUpgradeHint = (plan: SubscriptionPlan) => {
  if (plan.id === 'pro' && props.currentTier === 'free') {
    return t('uiComp.pricing.upgradeHint.freeToProHint')
  }
  if (plan.id === 'turbo' && (props.currentTier === 'free' || props.currentTier === 'pro')) {
    return t('uiComp.pricing.upgradeHint.proToTurboHint')
  }
  return ''
}

// ==================== 完整对比表格数据 ====================
// 结构化对比矩阵：{ category, rows: [{ label, free, pro, turbo }] }
const comparisonSections = computed(() => [
  {
    category: t('uiComp.pricing.comparison.modelCapability'),
    rows: [
      { label: 'GPT-4o mini', free: true, pro: true, turbo: true },
      { label: 'GPT-5.3 · Opus 4.6 · Gemini 3.1 Pro', free: false, pro: true, turbo: true },
      { label: 'o3 · DeepSeek-R1', free: false, pro: false, turbo: true },
    ],
  },
  {
    category: t('uiComp.pricing.comparison.usageAndQuota'),
    rows: [
      { label: t('uiComp.pricing.comparison.monthlyCreditsLabel'), free: '100', pro: '2,000', turbo: '10,000' },
      { label: t('uiComp.pricing.comparison.deepThinkingLabel'), free: t('uiComp.pricing.comparison.timesPerMonth', { count: 10 }), pro: t('uiComp.pricing.comparison.unlimited'), turbo: t('uiComp.pricing.comparison.unlimited') },
      { label: t('uiComp.pricing.comparison.rechargeBonus'), free: '—', pro: '10%', turbo: '20%' },
    ],
  },
  {
    category: t('uiComp.pricing.comparison.coreFeatures'),
    rows: [
      { label: t('uiComp.pricing.comparison.aiDrawingLabel'), free: false, pro: true, turbo: true },
      { label: t('uiComp.pricing.comparison.knowledgeRAGLabel'), free: false, pro: true, turbo: true },
      { label: t('uiComp.pricing.comparison.multimodalLabel'), free: false, pro: false, turbo: true },
      { label: t('uiComp.pricing.comparison.longContextLabel'), free: false, pro: false, turbo: true },
    ],
  },
  {
    category: t('uiComp.pricing.comparison.collabAndTools'),
    rows: [
      { label: t('uiComp.pricing.comparison.rolePlayLabel'), free: false, pro: true, turbo: true },
      { label: t('uiComp.pricing.comparison.mcpToolsLabel'), free: false, pro: true, turbo: true },
      { label: t('uiComp.pricing.comparison.multiAgentLabel'), free: false, pro: true, turbo: true },
      { label: t('uiComp.pricing.comparison.embeddingLabel'), free: false, pro: false, turbo: true },
    ],
  },
  {
    category: t('uiComp.pricing.comparison.service'),
    rows: [
      { label: t('uiComp.pricing.comparison.responseSpeed'), free: t('uiComp.pricing.comparison.standard'), pro: t('uiComp.pricing.comparison.priority'), turbo: t('uiComp.pricing.comparison.highest') },
      { label: t('uiComp.pricing.comparison.customerSupport'), free: t('uiComp.pricing.comparison.community'), pro: t('uiComp.pricing.comparison.prioritySupportLabel'), turbo: t('uiComp.pricing.comparison.exclusiveSupport') },
    ],
  },
])

// ==================== 事件处理 ====================
const handleClose = () => emit('update:visible', false)

const handleSelectPlan = async (plan: SubscriptionPlan) => {
  const config = getButtonConfig(plan)
  if (config.disabled || submitting.value) return

  submitting.value = true
  try {
    let result
    if (config.action === 'renew') {
      // 续费当前套餐
      result = await subscriptionApi.renew(billingCycle.value)
    } else if (config.action === 'upgrade') {
      // 升级到更高套餐
      result = await subscriptionApi.subscribe({ planId: plan.id, billingCycle: billingCycle.value })
    } else {
      return
    }

    if (result.code === 200 && result.data?.success) {
      const actionText = config.action === 'renew' ? t('uiComp.pricing.actionRenew') : t('uiComp.pricing.actionUpgrade')
      message.success(t('uiComp.pricing.renewSuccess', { action: actionText, name: plan.name }))
      emit('subscription-changed')
      emit('update:visible', false)
    } else {
      message.error(result.data?.errorMessage || result.message || t('uiComp.pricing.operationFailed'))
    }
  } catch (error: any) {
    message.error(error?.message || t('uiComp.pricing.networkError'))
  } finally {
    submitting.value = false
  }
}
const handleContactEnterprise = () => { showQrCode.value = true }
const closeQrCode = () => { showQrCode.value = false }
const setCardRef = (el: any, idx: number) => { if (el) cardRefs.value[idx] = el as HTMLElement }

// ==================== 样式辅助（令牌化） ====================
const getCardStyles = (plan: SubscriptionPlan) => {
  const btnConfig = getButtonConfig(plan)

  // Turbo — 黑金（使用 --tier-turbo-* 令牌）
  if (plan.id === 'turbo') {
    const containerStyle = {
      backgroundColor: 'var(--tier-turbo-bg)',
      borderColor: btnConfig.disabled ? 'var(--tier-turbo-gold)' : 'var(--tier-turbo-border)',
    }
    const btnClass = 'font-semibold'
    const btnStyle = btnConfig.disabled
      ? { backgroundColor: 'var(--tier-turbo-btn-disabled-bg, #333)', color: 'var(--tier-turbo-btn-disabled-text, #666)', cursor: 'not-allowed' }
      : { backgroundColor: 'var(--tier-turbo-btn-bg)', color: 'var(--tier-turbo-btn-text)' }
    return {
      containerStyle, btnClass, btnStyle,
      titleColor: 'var(--tier-turbo-title)', priceColor: 'var(--tier-turbo-price)',
      priceUnitColor: 'var(--tier-turbo-price-unit)', descColor: 'var(--tier-turbo-desc)',
      featureTextColor: 'var(--tier-turbo-feature-text)', featureIconColor: 'var(--tier-turbo-feature-icon)',
      tagBg: 'var(--tier-turbo-tag-bg)', tagColor: 'var(--tier-turbo-tag-text)',
      saveColor: 'var(--tier-turbo-save-text)', saveBg: 'var(--tier-turbo-save-bg)',
      hintBg: 'rgba(212, 175, 55, 0.08)', hintColor: 'var(--tier-turbo-gold)',
    }
  }

  // Pro — 翠绿
  if (plan.id === 'pro') {
    const containerStyle = {
      backgroundColor: 'var(--tier-pro-bg)',
      borderColor: btnConfig.disabled ? 'var(--tier-pro-border-hover)' : 'var(--tier-pro-border)',
      boxShadow: 'var(--tier-pro-shadow)',
    }
    const btnStyle = btnConfig.disabled
      ? { backgroundColor: 'var(--tier-pro-btn-disabled-bg, #f1f5f9)', color: 'var(--tier-pro-btn-disabled-text, #94a3b8)', cursor: 'not-allowed' }
      : { backgroundColor: 'var(--tier-pro-btn-bg)', color: 'var(--tier-pro-btn-text)' }
    return {
      containerStyle, btnClass: '', btnStyle,
      titleColor: 'var(--tier-pro-title)', priceColor: 'var(--tier-pro-price)',
      priceUnitColor: 'var(--tier-pro-price-unit)', descColor: 'var(--tier-pro-desc)',
      featureTextColor: 'var(--tier-pro-feature-text)', featureIconColor: 'var(--tier-pro-feature-icon)',
      tagBg: 'var(--tier-pro-tag-bg)', tagColor: 'var(--tier-pro-tag-text)',
      saveColor: 'var(--tier-pro-save-text)', saveBg: 'var(--tier-pro-save-bg)',
      hintBg: 'rgba(16, 185, 129, 0.06)', hintColor: '#059669',
    }
  }

  // Free — 中性灰
  const containerStyle = {
    backgroundColor: 'var(--tier-free-bg)',
    borderColor: 'var(--tier-free-border)',
  }
  let btnStyle: Record<string, string>
  if (btnConfig.disabled) {
    btnStyle = { backgroundColor: 'var(--tier-free-btn-disabled-bg, #f1f5f9)', color: 'var(--tier-free-btn-disabled-text, #94a3b8)', cursor: 'not-allowed' }
  } else if (btnConfig.action === 'downgrade') {
    btnStyle = { backgroundColor: 'var(--tier-free-btn-bg, #fff)', color: 'var(--tier-free-btn-text, #475569)', border: '1px solid var(--tier-free-btn-border, #e2e8f0)' }
  } else {
    btnStyle = { backgroundColor: 'var(--tier-free-btn-bg)', color: 'var(--tier-free-btn-text)' }
  }
  return {
    containerStyle, btnClass: '', btnStyle,
    titleColor: 'var(--tier-free-title)', priceColor: 'var(--tier-free-price)',
    priceUnitColor: 'var(--tier-free-price-unit)', descColor: 'var(--tier-free-desc)',
    featureTextColor: 'var(--tier-free-feature-text)', featureIconColor: 'var(--tier-free-feature-icon)',
    tagBg: '', tagColor: '',
    saveColor: '', saveBg: '',
    hintBg: '', hintColor: '',
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade" appear>
      <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" :aria-label="t('uiComp.pricing.title')">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose"></div>

        <!-- Fullscreen Content -->
        <Transition name="modal-slide" appear>
          <div v-if="visible" class="relative bg-white dark:bg-zinc-900 w-full h-full z-10 flex flex-col overflow-hidden">
            <!-- Close Button -->
            <button class="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors z-20 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300" :aria-label="t('common.tooltip.close')" @click="handleClose">
              <X :size="24" />
            </button>

            <!-- Scrollable Body -->
            <div class="flex-1 overflow-y-auto custom-scrollbar">
              <!-- Header -->
              <div class="text-center pt-14 pb-8 px-6 md:pt-20 md:pb-10">
                <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">{{ t('uiComp.pricing.title') }}</h2>
                <p class="text-sm text-slate-400 dark:text-zinc-500 mb-6">{{ t('uiComp.pricing.subtitle') }}</p>

                <!-- Billing Cycle Toggle -->
                <div class="inline-flex items-center gap-2">
                  <div class="inline-flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-full relative">
                    <div class="absolute top-1 bottom-1 w-1/2 bg-white dark:bg-zinc-700 rounded-full shadow-sm transition-all duration-300 ease-in-out" :style="{ left: billingCycle === 'monthly' ? '4px' : 'calc(50% - 4px)' }"></div>
                    <button class="relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors" :class="billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'" @click="billingCycle = 'monthly'">{{ t('uiComp.pricing.monthly') }}</button>
                    <button class="relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors" :class="billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-zinc-400'" @click="billingCycle = 'yearly'">{{ t('uiComp.pricing.yearly') }}</button>
                  </div>
                  <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded whitespace-nowrap">{{ t('uiComp.pricing.yearlySave') }}</span>
                </div>
              </div>

              <!-- ========== Mobile: Tab 式切换 ========== -->
              <template v-if="isMobileView">
                <!-- Tab 选择器 -->
                <div class="flex justify-center gap-2 px-4 mb-6">
                  <button v-for="(plan, idx) in plans" :key="'tab-' + plan.id" class="px-4 py-2 rounded-full text-sm font-medium transition-all" :class="mobileActiveIndex === idx ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'" @click="mobileActiveIndex = idx">
                    {{ plan.name }}
                  </button>
                </div>

                <!-- 单卡片显示 -->
                <div class="px-4 pb-10 max-w-md mx-auto">
                  <template v-for="(plan, idx) in plans" :key="'mobile-' + plan.id">
                    <div v-show="mobileActiveIndex === idx" :ref="(el) => setCardRef(el, idx)" class="group flex flex-col p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden" :style="getCardStyles(plan).containerStyle">
                      <!-- Turbo 装饰 -->
                      <template v-if="plan.id === 'turbo'">
                        <div class="shimmer-overlay"></div>
                        <div class="absolute inset-2 border rounded-xl pointer-events-none" :style="{ borderColor: 'var(--tier-turbo-inner-border)' }"></div>
                      </template>

                      <!-- Tag -->
                      <span v-if="plan.tag" class="absolute top-4 right-4 text-[10px] font-bold tracking-wider px-2 py-1 rounded z-10" :style="{ backgroundColor: getCardStyles(plan).tagBg, color: getCardStyles(plan).tagColor }">{{ plan.tag }}</span>

                      <!-- Title -->
                      <h3 class="text-xl font-bold mb-2 relative z-10" :style="{ color: getCardStyles(plan).titleColor }">{{ plan.name }}</h3>

                      <!-- Price -->
                      <div class="flex items-baseline gap-1 mb-1 relative z-10">
                        <span class="text-3xl font-bold" :style="{ color: getCardStyles(plan).priceColor }">{{ getDisplayPrice(plan) }}</span>
                        <span class="text-sm" :style="{ color: getCardStyles(plan).priceUnitColor }">{{ t('uiComp.pricing.perMonth') }}</span>
                      </div>

                      <!-- Credits Anchor + Tooltip -->
                      <div v-if="plan.creditsAnchor" class="mb-1 relative z-10">
                        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <span class="inline-flex items-center gap-1 text-xs cursor-help border-b border-dashed" :style="{ color: getCardStyles(plan).descColor, borderColor: getCardStyles(plan).descColor }">
                                {{ plan.creditsAnchor }}
                                <HelpCircle :size="12" class="opacity-60" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" :side-offset="6" class="max-w-[240px] text-xs">{{ t('uiComp.pricing.creditsTooltip') }}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <!-- Yearly Saving + Daily Cost -->
                      <div class="mb-2 min-h-[20px] relative z-10">
                        <span v-if="billingCycle === 'yearly' && plan.id !== 'free'" class="text-[10px] px-2 py-0.5 rounded mr-2" :style="{ color: getCardStyles(plan).saveColor, backgroundColor: getCardStyles(plan).saveBg }">{{ t('uiComp.pricing.savePerYear', { amount: getYearlySaving(plan) }) }}</span>
                        <span v-if="plan.dailyCostAnchor && plan.id !== 'free'" class="text-[11px]" :style="{ color: getCardStyles(plan).descColor }">{{ plan.dailyCostAnchor }}</span>
                      </div>

                      <!-- Description -->
                      <p class="text-sm mb-4 relative z-10" :style="{ color: getCardStyles(plan).descColor }">{{ plan.description }}</p>

                      <!-- Upgrade Hint (Cooper) -->
                      <p v-if="getUpgradeHint(plan)" class="text-xs rounded-lg px-3 py-1.5 mb-4 relative z-10" :style="{ backgroundColor: getCardStyles(plan).hintBg, color: getCardStyles(plan).hintColor }">{{ getUpgradeHint(plan) }}</p>

                      <!-- Button -->
                      <button :disabled="getButtonConfig(plan).disabled || submitting" class="w-full py-3 rounded-xl text-sm transition-all mb-6 relative z-10 inline-flex items-center justify-center gap-2" :class="getCardStyles(plan).btnClass" :style="getCardStyles(plan).btnStyle" @click="handleSelectPlan(plan)">
                        <Loader2 v-if="submitting && !getButtonConfig(plan).disabled" :size="14" class="animate-spin" />
                        {{ getButtonConfig(plan).text }}
                      </button>

                      <!-- Features -->
                      <div class="flex-1 space-y-3 relative z-10">
                        <div v-for="(feature, idx2) in getFeatures(plan)" :key="idx2" class="flex items-start gap-3">
                          <Check :size="16" class="mt-0.5 shrink-0" :style="{ color: getCardStyles(plan).featureIconColor }" />
                          <span class="text-sm leading-snug" :style="{ color: getCardStyles(plan).featureTextColor }">
                            <template v-if="feature.includes(t('uiComp.pricing.features.unlimitedDeepThinking')) || feature.includes(t('uiComp.pricing.features.deepThinking10'))">
                              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                                <Tooltip>
                                  <TooltipTrigger as-child>
                                    <span class="inline cursor-help">{{ feature }} <HelpCircle :size="12" class="inline ml-0.5 opacity-50" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" :side-offset="6" class="max-w-[220px] text-xs">{{ t('uiComp.pricing.deepThinkingTooltip') }}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </template>
                            <template v-else>{{ feature }}</template>
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </template>

              <!-- ========== Desktop: Grid 布局（居中 max-w 容器） ========== -->
              <template v-else>
                <div class="max-w-6xl mx-auto px-10 pb-8">
                  <div class="grid grid-cols-3 gap-8 items-stretch">
                    <template v-for="(plan, idx) in plans" :key="plan.id">
                      <div :ref="(el) => setCardRef(el, idx)" class="group flex flex-col p-7 rounded-2xl border transition-all duration-300 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg" :style="getCardStyles(plan).containerStyle">
                        <!-- Turbo 装饰 -->
                        <template v-if="plan.id === 'turbo'">
                          <div class="shimmer-overlay"></div>
                          <div class="absolute inset-2 border rounded-xl pointer-events-none" :style="{ borderColor: 'var(--tier-turbo-inner-border)' }"></div>
                        </template>

                        <!-- Tag -->
                        <span v-if="plan.tag" class="absolute top-5 right-5 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded z-10" :style="{ backgroundColor: getCardStyles(plan).tagBg, color: getCardStyles(plan).tagColor }">{{ plan.tag }}</span>

                        <!-- Title -->
                        <h3 class="text-2xl font-bold mb-2 relative z-10" :style="{ color: getCardStyles(plan).titleColor }">{{ plan.name }}</h3>

                        <!-- Price -->
                        <div class="flex items-baseline gap-1 mb-1 relative z-10">
                          <span class="text-4xl font-bold" :style="{ color: getCardStyles(plan).priceColor }">{{ getDisplayPrice(plan) }}</span>
                          <span class="text-sm" :style="{ color: getCardStyles(plan).priceUnitColor }">{{ t('uiComp.pricing.perMonth') }}</span>
                        </div>

                        <!-- Credits Anchor + Tooltip -->
                        <div v-if="plan.creditsAnchor" class="mb-1 relative z-10">
                          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <span class="inline-flex items-center gap-1 text-xs cursor-help border-b border-dashed" :style="{ color: getCardStyles(plan).descColor, borderColor: getCardStyles(plan).descColor }">
                                  {{ plan.creditsAnchor }}
                                  <HelpCircle :size="12" class="opacity-60" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" :side-offset="6" class="max-w-[240px] text-xs">{{ t('uiComp.pricing.creditsTooltip') }}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <!-- Yearly Saving + Daily Cost -->
                        <div class="mb-3 min-h-[20px] relative z-10">
                          <span v-if="billingCycle === 'yearly' && plan.id !== 'free'" class="text-[10px] px-2 py-0.5 rounded mr-2" :style="{ color: getCardStyles(plan).saveColor, backgroundColor: getCardStyles(plan).saveBg }">{{ t('uiComp.pricing.savePerYear', { amount: getYearlySaving(plan) }) }}</span>
                          <span v-if="plan.dailyCostAnchor && plan.id !== 'free'" class="text-[11px]" :style="{ color: getCardStyles(plan).descColor }">{{ plan.dailyCostAnchor }}</span>
                        </div>

                        <!-- Description -->
                        <p class="text-sm mb-5 relative z-10" :style="{ color: getCardStyles(plan).descColor }">{{ plan.description }}</p>

                        <!-- Upgrade Hint (Cooper) -->
                        <p v-if="getUpgradeHint(plan)" class="text-xs rounded-lg px-3 py-2 mb-5 relative z-10" :style="{ backgroundColor: getCardStyles(plan).hintBg, color: getCardStyles(plan).hintColor }">{{ getUpgradeHint(plan) }}</p>

                        <!-- Button -->
                        <button :disabled="getButtonConfig(plan).disabled || submitting" class="w-full py-3.5 rounded-xl text-sm font-medium transition-all mb-7 relative z-10 inline-flex items-center justify-center gap-2" :class="getCardStyles(plan).btnClass" :style="getCardStyles(plan).btnStyle" @click="handleSelectPlan(plan)">
                          <Loader2 v-if="submitting && !getButtonConfig(plan).disabled" :size="14" class="animate-spin" />
                          {{ getButtonConfig(plan).text }}
                        </button>

                        <!-- Features -->
                        <div class="flex-1 space-y-3.5 relative z-10">
                          <div v-for="(feature, idx2) in getFeatures(plan)" :key="idx2" class="flex items-start gap-3">
                            <Check :size="16" class="mt-0.5 shrink-0" :style="{ color: getCardStyles(plan).featureIconColor }" />
                            <span class="text-sm leading-snug" :style="{ color: getCardStyles(plan).featureTextColor }">
                              <template v-if="feature.includes(t('uiComp.pricing.features.unlimitedDeepThinking')) || feature.includes(t('uiComp.pricing.features.deepThinking10'))">
                                <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                                  <Tooltip>
                                    <TooltipTrigger as-child>
                                      <span class="inline cursor-help">{{ feature }} <HelpCircle :size="12" class="inline ml-0.5 opacity-50" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" :side-offset="6" class="max-w-[220px] text-xs">{{ t('uiComp.pricing.deepThinkingTooltip') }}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </template>
                              <template v-else>{{ feature }}</template>
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- 查看完整对比 -->
                  <div class="mt-10 text-center">
                    <button class="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors" @click="showFullComparison = !showFullComparison">
                      <span>{{ showFullComparison ? t('uiComp.pricing.comparison.collapseComparison') : t('uiComp.pricing.comparison.viewFullComparison') }}</span>
                      <component :is="showFullComparison ? ChevronUp : ChevronDown" :size="16" />
                    </button>
                  </div>

                  <!-- Expanded Comparison Table -->
                  <Transition name="comparison-expand">
                    <div v-if="showFullComparison" class="mt-6">
                      <table class="w-full text-sm border-collapse">
                        <thead>
                          <tr class="border-b border-slate-200 dark:border-zinc-700">
                            <th class="text-left py-3 pr-4 font-medium text-slate-400 dark:text-zinc-500 w-[40%]"></th>
                            <th v-for="plan in plans" :key="'th-' + plan.id" class="py-3 px-3 text-center font-semibold" :style="{ color: getCardStyles(plan).titleColor }">
                              {{ plan.name }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <template v-for="section in comparisonSections" :key="section.category">
                            <!-- 分类标题行 -->
                            <tr>
                              <td :colspan="plans.length + 1" class="pt-5 pb-2 text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">{{ section.category }}</td>
                            </tr>
                            <!-- 特性行 -->
                            <tr v-for="row in section.rows" :key="row.label" class="border-b border-slate-100 dark:border-zinc-800 last:border-b-0">
                              <td class="py-2.5 pr-4 text-slate-600 dark:text-zinc-300">{{ row.label }}</td>
                              <td class="py-2.5 px-3 text-center">
                                <template v-if="typeof row.free === 'boolean'">
                                  <Check v-if="row.free" :size="16" class="mx-auto text-emerald-500" />
                                  <span v-else class="text-slate-300 dark:text-zinc-600">—</span>
                                </template>
                                <span v-else class="text-slate-700 dark:text-zinc-200 font-medium">{{ row.free }}</span>
                              </td>
                              <td class="py-2.5 px-3 text-center">
                                <template v-if="typeof row.pro === 'boolean'">
                                  <Check v-if="row.pro" :size="16" class="mx-auto text-emerald-500" />
                                  <span v-else class="text-slate-300 dark:text-zinc-600">—</span>
                                </template>
                                <span v-else class="text-slate-700 dark:text-zinc-200 font-medium">{{ row.pro }}</span>
                              </td>
                              <td class="py-2.5 px-3 text-center">
                                <template v-if="typeof row.turbo === 'boolean'">
                                  <Check v-if="row.turbo" :size="16" class="mx-auto text-emerald-500" />
                                  <span v-else class="text-slate-300 dark:text-zinc-600">—</span>
                                </template>
                                <span v-else class="text-slate-700 dark:text-zinc-200 font-medium">{{ row.turbo }}</span>
                              </td>
                            </tr>
                          </template>
                        </tbody>
                      </table>
                    </div>
                  </Transition>
                </div>
              </template>

              <!-- Footer -->
              <div class="pb-10 md:pb-14 text-center px-6">
                <button class="inline-flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors group" @click="handleContactEnterprise">
                  <Building2 :size="14" class="opacity-60 group-hover:opacity-100" />
                  <span>{{ t('uiComp.pricing.enterprise.needMore') }}</span>
                  <span class="underline">{{ t('uiComp.pricing.enterprise.contactSales') }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- QR Code Modal -->
        <Transition name="qr-fade">
          <div v-if="showQrCode" class="fixed inset-0 z-[110] flex items-center justify-center" @click.self="closeQrCode">
            <div class="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-xs text-center relative border border-slate-100 dark:border-zinc-800">
              <button class="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300" :aria-label="t('common.tooltip.close')" @click="closeQrCode">
                <X :size="18" />
              </button>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">{{ t('uiComp.pricing.enterprise.contactDeveloper') }}</h3>
              <p class="text-sm text-slate-500 dark:text-zinc-400 mb-4">{{ t('uiComp.pricing.enterprise.scanForEnterprise') }}</p>
              <img src="/qrcode.jpg" alt="Developer WeChat QR Code" class="w-48 mx-auto rounded-lg border border-slate-100 dark:border-zinc-800" />
              <p class="text-xs text-slate-400 dark:text-zinc-500 mt-4">{{ t('uiComp.pricing.enterprise.scanToChat') }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 20px;
}

/* 暗色模式已移至下方非 scoped 块 */

/* Modal Backdrop Fade */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Fullscreen Slide-Up Effect */
.modal-slide-enter-active {
  transition: all 0.4s var(--ease-fluid, cubic-bezier(0.23, 1, 0.32, 1));
}

.modal-slide-leave-active {
  transition: all 0.25s ease-in;
}

.modal-slide-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* Shimmer Effect for Turbo Card (令牌化) */
.shimmer-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 40%,
    var(--tier-turbo-shimmer, rgba(212, 175, 55, 0.2)) 50%,
    rgba(255, 255, 255, 0.1) 60%,
    transparent 100%
  );
  transform: skewX(-20deg) translateX(-150%);
  z-index: 1;
  pointer-events: none;
}

.group:hover .shimmer-overlay {
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% {
    transform: skewX(-20deg) translateX(-150%);
  }
  100% {
    transform: skewX(-20deg) translateX(150%);
  }
}

/* 查看完整对比 — 折叠/展开过渡 */
.comparison-expand-enter-active {
  transition: all 0.35s var(--ease-fluid, cubic-bezier(0.23, 1, 0.32, 1));
}
.comparison-expand-leave-active {
  transition: all 0.2s ease-in;
}
.comparison-expand-enter-from,
.comparison-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
  overflow: hidden;
}
.comparison-expand-enter-to,
.comparison-expand-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

/* QR Code Modal Fade */
.qr-fade-enter-active,
.qr-fade-leave-active {
  transition: opacity 0.2s ease;
}

.qr-fade-enter-from,
.qr-fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #3f3f46;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #52525b;
  }
}
</style>
