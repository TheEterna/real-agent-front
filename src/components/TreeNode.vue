<template>
  <div
    :class="['tree-node', data.role, { 
      active: data.isActive,
      'has-branches': data.hasBranches 
    }]"
  >
    <div class="node-header">
      <div class="flex items-center gap-2">
        <span class="node-role">{{ data.role === 'user' ? '👤' : '🤖' }}</span>
        <span class="node-type">{{ data.role === 'user' ? '用户' : 'AI' }}</span>
      </div>
      <span v-if="data.hasBranches" class="branch-indicator">
        v{{ data.branchIndex + 1 }}/{{ data.branchCount }}
      </span>
    </div>
    <div class="node-content">
      {{ data.preview }}
    </div>
    <div v-if="data.messageCount > 1" class="message-count">
      +{{ data.messageCount - 1 }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: {
    role: 'user' | 'assistant'
    preview: string
    messageCount: number
    isActive: boolean
    hasBranches: boolean
    branchIndex: number
    branchCount: number
  }
}

defineProps<Props>()
</script>

<style scoped>
/* === iOS 风格树节点 === */

.tree-node {
  padding: 14px 16px;
  border-radius: 16px;
  min-width: 260px;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 2px solid transparent;
  backdrop-filter: blur(10px);
}

.tree-node:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.tree-node:active {
  transform: translateY(-2px);
}

/* 用户消息 - 蓝色系 */
.tree-node.user {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #0d47a1;
  border: 2px solid rgba(13, 71, 161, 0.1);
}

.tree-node.user.active {
  background: linear-gradient(135deg, #90caf9 0%, #64b5f6 100%);
  border-color: #0d47a1;
  box-shadow: 0 8px 20px rgba(13, 71, 161, 0.2);
  transform: translateY(-4px) scale(1.02);
}

/* AI 消息 - 绿色系 */
.tree-node.assistant {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #1b5e20;
  border: 2px solid rgba(27, 94, 32, 0.1);
}

.tree-node.assistant.active {
  background: linear-gradient(135deg, #a5d6a7 0%, #81c784 100%);
  border-color: #1b5e20;
  box-shadow: 0 8px 20px rgba(27, 94, 32, 0.2);
  transform: translateY(-4px) scale(1.02);
}

/* 有分支的节点特殊样式 */
.tree-node.has-branches {
  box-shadow: 0 4px 12px rgba(107, 154, 152, 0.15), 
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.tree-node.has-branches.active {
  box-shadow: 0 8px 20px rgba(107, 154, 152, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* 节点头部 */
.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.node-role {
  font-size: 16px;
  display: inline-flex;
}

.node-type {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

.branch-indicator {
  background: rgba(255, 255, 255, 0.4);
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
  backdrop-filter: blur(4px);
}

/* 节点内容 */
.node-content {
  font-size: 13px;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  word-break: break-word;
  margin-bottom: 8px;
  opacity: 0.85;
}

/* 消息数量标签 */
.message-count {
  font-size: 11px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  opacity: 0.7;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .tree-node {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .tree-node.user {
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    color: #b3e5fc;
    border-color: rgba(179, 229, 252, 0.2);
  }

  .tree-node.assistant {
    background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%);
    color: #c8e6c9;
    border-color: rgba(200, 230, 201, 0.2);
  }

  .node-content {
    opacity: 0.9;
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .tree-node {
    min-width: 200px;
    max-width: 240px;
    padding: 12px 14px;
  }

  .node-content {
    font-size: 12px;
    max-height: 48px;
    -webkit-line-clamp: 2;
  }

  .node-header {
    margin-bottom: 8px;
    padding-bottom: 6px;
  }
}
</style>
