<script setup lang="ts">
import {ref, computed, watch, onMounted, shallowRef} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useChatStore} from '@/stores/chatStore'
import {AgentType} from '@/types/session'

// 动态导入Agent组件
import ReAct from './ReAct.vue'
import Index from './reactplus/Index.vue'
import WelcomeInput from '@/components/home/WelcomeInput.vue'

const router = useRouter()
const route = useRoute()
const chat = useChatStore()

// 页面初始化加载状态（仅首次加载时显示骨架屏）
const isInitialLoading = ref(true)
// 会话切换时的加载状态（切换会话时显示）
const isSessionLoading = ref(false)

// 响应式获取当前会话ID (从路由获取)
const currentSessionId = computed(() => route.params.sessionId as string | undefined)

// 开始新对话
const handleStartChat = async (message: string) => {
  try {
    // 1. 重置编辑会话
    const newSession = chat.resetEditingSession(AgentType.ReAct_Plus, '新对话')

    // 2. 跳转到 /chat（无参数），让路由逻辑处理编辑会话的初始化
    if (newSession) {
      await router.push({name: 'Chat'})

      console.log('Starting new chat session:', newSession.id, 'Message:', message)
      // TODO: 可以通过 store 传递初始消息，在组件中读取
    }
  } catch (error) {
    console.error('Failed to start chat:', error)
  }
}

// 使用shallowRef优化性能
const currentComponent = shallowRef<any>(null)

// Agent组件映射
const agentComponentMap: Record<AgentType, any> = {
  [AgentType.ReAct]: ReAct,
  [AgentType.ReAct_Plus]: Index,
  [AgentType.Coding]: Index, // todo 暂时使用ReAct作为placeholder
}

// 获取当前应该渲染的组件
const getComponentForAgent = (type: AgentType) => {
  return agentComponentMap[type] || Index
}

// 处理会话切换的核心逻辑
const loadSessionAndComponent = async (sessionId: string | undefined) => {
  if (sessionId) {
    // URL 中有 sessionId，加载会话数据
    const isLoadSuccess = await chat.loadSession(sessionId)
    if (!isLoadSuccess) {
      // 回到默认 /chat 页面 ，不加参数
      await router.replace('/chat')
    }
    const session = chat.getSession(sessionId)
    if (session) {
      currentComponent.value = getComponentForAgent(session.type)
    } else {
      // 会话不存在，清空组件（显示欢迎页）
      currentComponent.value = null
    }
  } else {
    // /chat 根路径，检查是否有编辑会话
    const editingSession = chat.currentEditingSession
    if (editingSession && editingSession.id.startsWith('temp-editing-')) {
      // 有编辑会话，加载对应的 Agent 组件
      currentComponent.value = getComponentForAgent(editingSession.type)
    } else {
      // 没有编辑会话，显示欢迎页
      currentComponent.value = null
    }
  }
}

// 监听路由参数变化，处理会话切换
watch(currentSessionId, async (newSessionId, oldSessionId) => {
  // 跳过首次加载（由 onMounted 处理）
  if (isInitialLoading.value) return

  // 会话切换时显示加载状态
  isSessionLoading.value = true
  try {
    await loadSessionAndComponent(newSessionId)
  } finally {
    isSessionLoading.value = false
  }
})

// 监听编辑会话变化（新建对话时触发）
watch(() => chat.currentEditingSession, (newSession, oldSession) => {
  // 跳过首次加载
  if (isInitialLoading.value) return

  // 只在无 sessionId 时响应编辑会话变化
  if (!currentSessionId.value && newSession) {
    currentComponent.value = getComponentForAgent(newSession.type)
  }
}, { deep: true })

// 初始化：加载会话列表，然后根据路由参数加载当前会话
onMounted(async () => {
  try {
    await chat.loadSessions()
    await loadSessionAndComponent(route.params.sessionId as string | undefined)
  } finally {
    isInitialLoading.value = false
  }
})
</script>

<template>
  <div class="chat-gateway">

    <!-- 加载骨架屏（初始加载 / 会话切换） -->
    <div v-if="isInitialLoading || isSessionLoading" class="h-full flex flex-col">
      <!-- 聊天区域骨架 -->
      <div class="flex-1 overflow-hidden px-4 py-6">
        <div class="max-w-[770px] mx-auto space-y-6">
          <!-- 用户消息骨架 -->
          <div class="flex justify-end">
            <div class="max-w-[70%]">
              <a-skeleton
                  active
                  :paragraph="{ rows: 1, width: '200px' }"
                  :title="false"
              />
            </div>
          </div>
          <!-- AI 消息骨架 -->
          <div class="flex justify-start">
            <div class="w-full">
              <a-skeleton
                  active
                  :paragraph="{ rows: 3, width: ['100%', '90%', '60%'] }"
                  :title="{ width: '120px' }"
              />
            </div>
          </div>
          <!-- 用户消息骨架 -->
          <div class="flex justify-end">
            <div class="max-w-[70%]">
              <a-skeleton
                  active
                  :paragraph="{ rows: 1, width: '160px' }"
                  :title="false"
              />
            </div>
          </div>
          <!-- AI 消息骨架 -->
          <div class="flex justify-start">
            <div class="w-full">
              <a-skeleton
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
          <a-skeleton
              active
              :paragraph="false"
              :title="{ width: '100%' }"
              class="h-14 rounded-2xl bg-white/60"
          />
        </div>
      </div>
    </div>

    <!-- 动态渲染Agent组件 -->
    <component
        v-else-if="currentComponent"
        :is="currentComponent"
        :key="currentSessionId"
        class="agent-view"
    />

    <!-- 欢迎页 -->
    <div v-else class="h-full flex items-center justify-center">
      <WelcomeInput
          :is-authenticated="true"
          title="欢迎回来，最近怎么样"
          subtitle="今天想聊点什么？"
          @send-message="handleStartChat"
      />
    </div>
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
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 16px;
  color: #666;
}
</style>
