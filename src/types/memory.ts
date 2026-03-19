// Memory 记忆项（对齐后端 MemoryVO）
export interface MemoryItem {
  id: string
  content: string
  summary: string
  tier: 'CORE' | 'SEMANTIC' | 'EPISODIC'
  importanceScore: number
  accessCount?: number
  sourceType?: string
  isPinned?: boolean
  accessIntervalSum?: number
  lastAccessedTime?: string
  createdTime: string
  updatedTime?: string
  meta?: Record<string, any>
}

// Onboarding 数据
export interface OnboardingData {
  userName: string
  communicationStyle: 'formal' | 'casual' | 'concise'
  useCases: string[]
  interests: string
  customPreferences?: string
}

// 记忆统计（对齐后端 MemoryStatsVO）
export interface MemoryTierCount {
  tier: string
  count: number
}

export interface MemoryStats {
  userId: string
  tiers: MemoryTierCount[]
  total: number
}
