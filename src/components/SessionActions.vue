<script setup lang="ts">
import { ref } from 'vue'
import { Dropdown, Modal, Input, message } from 'ant-design-vue'
import { DeleteOutlined, EditOutlined, PushpinOutlined, EllipsisOutlined } from '@ant-design/icons-vue'
import { deleteSession, renameSession, pinSession, unpinSession } from '@/api/session'
import type { Session } from '@/types/session'

interface Props {
  session: Session
}

interface Emits {
  (e: 'rename', id: string, title: string): void
  (e: 'delete', id: string): void
  (e: 'pin', id: string, isPin: boolean): void
  (e: 'update:session', id: string, session: Session): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isRenaming = ref(false)
const newTitle = ref(props.session.title)
const loading = ref(false)
const visibleDropdown = ref(false)

// 打开重命名对话框
const handleRenameClick = () => {
  isRenaming.value = true
  newTitle.value = props.session.title
}

// 确认重命名
const confirmRename = async () => {
  if (!newTitle.value.trim()) {
    message.error('会话标题不能为空')
    return
  }

  if (newTitle.value === props.session.title) {
    isRenaming.value = false
    return
  }

  loading.value = true
  try {
    const result = await renameSession(props.session.id, newTitle.value)
    if (result.code === 200) {
      message.success('重命名成功')
      emit('rename', props.session.id, newTitle.value)
      // 更新本地会话数据
      const updated = { ...props.session, title: newTitle.value }
      emit('update:session', props.session.id, updated)
    } else {
      message.error(result.message || '重命名失败')
    }
  } catch (error: any) {
    message.error(error.message || '重命名失败，请稍后重试')
  } finally {
    loading.value = false
    isRenaming.value = false
  }
}

// 取消重命名
const cancelRename = () => {
  isRenaming.value = false
  newTitle.value = props.session.title
}

// 删除会话
const handleDelete = () => {
  Modal.confirm({
    title: '删除会话',
    content: `确定要删除会话 "${props.session.title}" 吗？此操作不可撤销。`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      loading.value = true
      try {
        const result = await deleteSession(props.session.id)
        if (result.code === 200) {
          message.success('删除成功')
          emit('delete', props.session.id)
        } else {
          message.error(result.message || '删除失败')
        }
      } catch (error: any) {
        message.error(error.message || '删除失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 置顶/取消置顶
const handlePin = async () => {
  loading.value = true
  try {
    const isCurrentlyPinned = props.session.isPin
    const result = isCurrentlyPinned
      ? await unpinSession(props.session.id)
      : await pinSession(props.session.id)

    if (result.code === 200) {
      message.success(isCurrentlyPinned ? '已取消置顶' : '已置顶')
      emit('pin', props.session.id, !isCurrentlyPinned)
      // 更新本地会话数据
      const updated = { ...props.session, isPin: !isCurrentlyPinned }
      emit('update:session', props.session.id, updated)
    } else {
      message.error(result.message || '操作失败')
    }
  } catch (error: any) {
    message.error(error.message || '操作失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const menuItems = [
  {
    label: props.session.isPin ? '取消置顶' : '置顶',
    key: 'pin',
    icon: PushpinOutlined,
    onClick: handlePin
  },
  {
    label: '重命名',
    key: 'rename',
    icon: EditOutlined,
    onClick: handleRenameClick
  },
  {
    type: 'divider'
  },
  {
    label: '删除',
    key: 'delete',
    danger: true,
    icon: DeleteOutlined,
    onClick: handleDelete
  }
]

// 显示下拉菜单
const showDropdown = () => {
  visibleDropdown.value = true
}

// 隐藏下拉菜单
const hideDropdown = () => {
  visibleDropdown.value = false
}
</script>

<template>
  <div class="session-actions">
    <!-- 操作菜单 -->
    <a-dropdown 
      :menu-props="{ items: menuItems }" 
      trigger="contextMenu"
      v-model:open="visibleDropdown"
    >
      <div class="session-item-wrapper">
        <slot></slot>
        <div class="session-actions-btn" @click.stop="showDropdown">
          <ellipsis-outlined />
        </div>
      </div>
    </a-dropdown>

    <!-- 重命名对话框 -->
    <a-modal
      v-model:open="isRenaming"
      title="重命名会话"
      ok-text="确定"
      cancel-text="取消"
      :loading="loading"
      @ok="confirmRename"
      @cancel="cancelRename"
    >
      <a-input
        v-model:value="newTitle"
        placeholder="输入新的会话名称"
        @keyup.enter="confirmRename"
      />
    </a-modal>
  </div>
</template>

<style scoped lang="scss">
.session-actions {
  width: 100%;
}

.session-item-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.session-actions-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
}

.session-item-wrapper:hover .session-actions-btn {
  opacity: 1;
}
</style>