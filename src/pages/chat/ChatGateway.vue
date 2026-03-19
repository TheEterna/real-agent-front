<script setup lang="ts">
import {computed, watch, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import { Skeleton } from 'ant-design-vue'
import {useChatStore} from '@/stores/chatStore'

// 动态导入Agent组件
import VoloAIIndex from './VoloAI/Index.vue'

const router = useRouter()
const route = useRoute()
const chat = useChatStore()

// ========== 架构重构：从 Store 读取视图状态（声明式）==========
// 不再在 View 层管理组件选择、temp→real 检测等逻辑
// 所有状态由 chatStore.chatViewState 统一管理

const viewState = computed(() => chat.chatViewState)

// 根据视图类型获取组件（纯函数，无逻辑判断）
const currentComponent = computed(() => {
  switch (viewState.value.type) {
    case 'volo-ai':
      return VoloAIIndex
    default:
      return null
  }
})

// 是否显示加载状态
const isLoading = computed(() => viewState.value.type === 'loading')

// 组件 key（从 Store 读取，View 不管理）
// 使用独立的 componentKey ref，promotion 期间保持不变避免组件重建
const componentKey = computed(() => chat.componentKey ?? undefined)

// ========== 路由监听（仅通知 Store，不处理逻辑）==========

const currentSessionId = computed(() => route.params.sessionId as string | undefined)

// 监听路由变化，通知 Store 更新活跃会话
watch(currentSessionId, (newSessionId) => {
  console.log('[ChatGateway] 路由变化，通知 Store:', newSessionId)
  chat.setActiveSessionId(newSessionId || null)
}, {immediate: false})

// 监听编辑会话变化（新建对话时触发）
watch(() => chat.currentEditingSession, (newSession) => {
  // 只在无 sessionId 时响应编辑会话变化
  if (!currentSessionId.value && newSession) {
    console.log('[ChatGateway] 编辑会话变化:', newSession.id)
    chat.setActiveSessionId(newSession.id)
  }
}, {deep: true})

// 初始化
onMounted(async () => {
  // 确保会话列表已加载（SWR：缓存水合 + API 刷新）
  await chat.loadSessions()

  // 通知 Store 当前路由会话
  const sessionId = route.params.sessionId as string | undefined
  console.log('[ChatGateway] 初始化，设置活跃会话:', sessionId)
  chat.setActiveSessionId(sessionId || null)

  // 修复：如果 activeSessionId 已经是 null（新旧值相同），watch 不会触发
  // 需要手动初始化视图状态
  if (!sessionId && chat.chatViewState.type === 'loading') {
    console.log('[ChatGateway] 检测到 loading 状态，手动初始化视图')
    chat.initViewState()
  }
})
</script>

<template>
  <div class="chat-gateway">
    <!-- 加载骨架屏 -->
    <div v-if="isLoading" class="h-full flex flex-col">
      <!-- 聊天区域骨架 -->
      <div class="flex-1 overflow-hidden px-4 py-6">
        <div class="max-w-[770px] mx-auto space-y-6">
          <!-- 用户消息骨架 -->
          <div class="flex justify-end">
            <div class="max-w-[70%]">
              <Skeleton
                  active
                  :paragraph="{ rows: 1, width: '200px' }"
                  :title="false"
              />
            </div>
          </div>
          <!-- AI 消息骨架 -->
          <div class="flex justify-start">
            <div class="w-full">
              <Skeleton
                  active
                  :paragraph="{ rows: 3, width: ['100%', '90%', '60%'] }"
                  :title="{ width: '120px' }"
              />
            </div>
          </div>
          <!-- 用户消息骨架 -->
          <div class="flex justify-end">
            <div class="max-w-[70%]">
              <Skeleton
                  active
                  :paragraph="{ rows: 1, width: '160px' }"
                  :title="false"
              />
            </div>
          </div>
          <!-- AI 消息骨架 -->
          <div class="flex justify-start">
            <div class="w-full">
              <Skeleton
                  active
                  :paragraph="{ rows: 4, width: ['100%', '95%', '80%', '40%'] }"
                  :title="{ width: '100px' }"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- 输入区域骨架 -->
      <div class="sticky bottom-2 px-4">
        <div class="max-w-[830px] mx-auto">
          <Skeleton
              active
              :paragraph="false"
              :title="{ width: '100%' }"
              class="h-14 rounded-2xl bg-white/60 dark:bg-zinc-800/60"
          />
        </div>
      </div>
    </div>

    <!-- 动态渲染Agent组件 -->
    <component
        :is="currentComponent"
        v-else-if="currentComponent"
        :key="componentKey"
        class="agent-view"
    />
  </div>
</template>

<style scoped>
.chat-gateway {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.agent-view {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.empty-state h3 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 0.75rem;
}

.empty-state p {
  font-size: 1rem;
  color: var(--muted-foreground);
}
</style>
