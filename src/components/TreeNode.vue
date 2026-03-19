<template>
  <div
    :class="['tree-node', data.role, { 
      active: data.isActive,
      'has-branches': data.hasBranches 
    }]"
  >
    <div class="node-header">
      <div class="flex items-center gap-2">
        <span class="node-role">
          <User v-if="data.role === 'user'" :size="14" />
          <Bot v-else :size="14" />
        </span>
        <span class="node-type">{{ data.role === 'user' ? t('comp.treeNode.user') : t('comp.treeNode.ai') }}</span>
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
import { useI18n } from 'vue-i18n'
import { Bot, User } from 'lucide-vue-next'

const { t } = useI18n()

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
  --node-accent: #64748b;
  --node-ink: #0f172a;
  --node-muted: rgba(15, 23, 42, 0.62);
  --node-border: rgba(15, 23, 42, 0.10);
  --node-surface: rgba(255, 255, 255, 0.78);

  padding: 12px 14px;
  border-radius: 14px;
  min-width: 260px;
  max-width: 300px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.72));
  color: var(--node-ink);
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition: box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 220ms cubic-bezier(0.4, 0, 0.2, 1),
              background 220ms cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid var(--node-border);
  backdrop-filter: blur(14px) saturate(170%);
  -webkit-backdrop-filter: blur(14px) saturate(170%);
}

.tree-node::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.55) inset;
  opacity: 0.9;
}

.tree-node {
  position: relative;
}

.tree-node:hover {
  border-color: rgba(15, 23, 42, 0.16);
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.tree-node:focus-visible {
  outline: none;
  border-color: rgba(59, 130, 246, 0.45);
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.18),
    0 14px 34px rgba(15, 23, 42, 0.10),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.tree-node:active {
  box-shadow:
    0 10px 26px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

@media (prefers-reduced-motion: reduce) {
  .tree-node {
    transition: none;
  }
}

/* 用户消息 - 蓝色系 */
.tree-node.user {
  --node-accent: #2563eb;
  --node-ink: #0f172a;
  --node-border: rgba(37, 99, 235, 0.18);
  background:
    radial-gradient(110% 90% at 12% 0%, rgba(37, 99, 235, 0.12) 0%, transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.90), rgba(255, 255, 255, 0.72));
}

.tree-node.user.active {
  border-color: rgba(37, 99, 235, 0.40);
  box-shadow:
    0 16px 38px rgba(37, 99, 235, 0.18),
    0 10px 26px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.70);
}

/* AI 消息 - 绿色系 */
.tree-node.assistant {
  --node-accent: #16a34a;
  --node-ink: #0f172a;
  --node-border: rgba(22, 163, 74, 0.18);
  background:
    radial-gradient(110% 90% at 12% 0%, rgba(22, 163, 74, 0.12) 0%, transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.90), rgba(255, 255, 255, 0.72));
}

.tree-node.assistant.active {
  border-color: rgba(22, 163, 74, 0.40);
  box-shadow:
    0 16px 38px rgba(22, 163, 74, 0.16),
    0 10px 26px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.70);
}

/* 有分支的节点特殊样式 */
.tree-node.has-branches {
  border-style: dashed;
  border-color: rgba(15, 23, 42, 0.14);
}

.tree-node.has-branches.active {
  border-style: solid;
}

/* 节点头部 */
.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.node-role {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(15, 23, 42, 0.10);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.node-role :deep(svg) {
  width: 14px;
  height: 14px;
}

.node-type {
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 0.2px;
  color: var(--node-ink);
  opacity: 0.86;
}

.branch-indicator {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(15, 23, 42, 0.10);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.625rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.70);
  font-family: var(--font-mono);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* 节点内容 */
.node-content {
  font-size: 0.8125rem;
  line-height: 1.55;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  word-break: break-word;
  margin-bottom: 8px;
  color: var(--node-muted);
}

/* 消息数量标签 */
.message-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 999px;
  text-align: center;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.62);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  width: fit-content;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .tree-node {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.68));
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .tree-node.user {
    --node-accent: #60a5fa;
    --node-ink: rgba(241, 245, 249, 0.96);
    --node-muted: rgba(226, 232, 240, 0.74);
    background:
      radial-gradient(110% 90% at 12% 0%, rgba(96, 165, 250, 0.22) 0%, transparent 55%),
      linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.70));
  }

  .tree-node.assistant {
    --node-accent: #4ade80;
    --node-ink: rgba(241, 245, 249, 0.96);
    --node-muted: rgba(226, 232, 240, 0.74);
    background:
      radial-gradient(110% 90% at 12% 0%, rgba(74, 222, 128, 0.18) 0%, transparent 55%),
      linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.70));
  }

  .node-content {
    color: var(--node-muted);
  }

  .node-header {
    border-bottom-color: rgba(148, 163, 184, 0.16);
  }

  .node-role {
    background: rgba(15, 23, 42, 0.35);
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
  }

  .branch-indicator,
  .message-count {
    background: rgba(15, 23, 42, 0.35);
    border-color: rgba(148, 163, 184, 0.18);
    color: rgba(226, 232, 240, 0.72);
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
    font-size: 0.75rem;
    max-height: 48px;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }

  .node-header {
    margin-bottom: 8px;
    padding-bottom: 6px;
  }
}
</style>

<style lang="scss">
/* Dark mode overrides for TreeNode (class-based toggle) */
.dark {
  .tree-node {
    --node-accent: #94a3b8;
    --node-ink: rgba(241, 245, 249, 0.96);
    --node-muted: rgba(226, 232, 240, 0.74);
    --node-border: rgba(148, 163, 184, 0.18);
    --node-surface: rgba(30, 41, 59, 0.78);

    background: linear-gradient(180deg, rgba(30, 41, 59, 0.78), rgba(15, 23, 42, 0.68));
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.36),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);

    &::before {
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
      opacity: 0.7;
    }

    &:hover {
      border-color: rgba(148, 163, 184, 0.28);
      box-shadow:
        0 14px 34px rgba(0, 0, 0, 0.42),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    &:focus-visible {
      border-color: rgba(96, 165, 250, 0.50);
      box-shadow:
        0 0 0 3px rgba(96, 165, 250, 0.22),
        0 14px 34px rgba(0, 0, 0, 0.42),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    &:active {
      box-shadow:
        0 10px 26px rgba(0, 0, 0, 0.36),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
    }
  }

  /* User node - blue accent (dark) */
  .tree-node.user {
    --node-accent: #60a5fa;
    --node-ink: rgba(241, 245, 249, 0.96);
    --node-muted: rgba(226, 232, 240, 0.74);
    --node-border: rgba(96, 165, 250, 0.22);

    background:
      radial-gradient(110% 90% at 12% 0%, rgba(96, 165, 250, 0.22) 0%, transparent 55%),
      linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.70));

    &.active {
      border-color: rgba(96, 165, 250, 0.45);
      box-shadow:
        0 16px 38px rgba(96, 165, 250, 0.14),
        0 10px 26px rgba(0, 0, 0, 0.36),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
  }

  /* Assistant node - green accent (dark) */
  .tree-node.assistant {
    --node-accent: #4ade80;
    --node-ink: rgba(241, 245, 249, 0.96);
    --node-muted: rgba(226, 232, 240, 0.74);
    --node-border: rgba(74, 222, 128, 0.22);

    background:
      radial-gradient(110% 90% at 12% 0%, rgba(74, 222, 128, 0.18) 0%, transparent 55%),
      linear-gradient(180deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.70));

    &.active {
      border-color: rgba(74, 222, 128, 0.45);
      box-shadow:
        0 16px 38px rgba(74, 222, 128, 0.12),
        0 10px 26px rgba(0, 0, 0, 0.36),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
  }

  /* Branching nodes */
  .tree-node.has-branches {
    border-color: rgba(148, 163, 184, 0.16);
  }

  /* Header */
  .node-header {
    border-bottom-color: rgba(148, 163, 184, 0.16);
  }

  /* Role icon badge */
  .node-role {
    background: rgba(15, 23, 42, 0.35);
    border-color: rgba(148, 163, 184, 0.18);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  }

  /* Branch indicator pill */
  .branch-indicator {
    background: rgba(15, 23, 42, 0.35);
    border-color: rgba(148, 163, 184, 0.18);
    color: rgba(226, 232, 240, 0.72);
  }

  /* Message count badge */
  .message-count {
    background: rgba(15, 23, 42, 0.35);
    border-color: rgba(148, 163, 184, 0.18);
    color: rgba(226, 232, 240, 0.72);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  }
}
</style>
