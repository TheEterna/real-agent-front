<script setup lang="ts">
import { ref } from 'vue'
import { SettingOutlined } from '@ant-design/icons-vue'
import SettingsModal from './SettingsModal.vue'

// Props(如果需要传入用户头像等信息)
interface Props {
  avatarUrl: string | undefined
  username: string | undefined
}

const props = withDefaults(defineProps<Props>(), {
  avatarUrl: '',
  username: 'User'
})

// Emits
const emit = defineEmits<{
  // (e: 'settingsClick'): void
}>()

// 设置弹窗显示状态
const settingsVisible = ref(false)


// 处理设置图标点击
const handleSettingsClick = () => {
  settingsVisible.value = true
}
</script>

<template>
  <div class="sidebar-action-bar my-3 -mx-2 px-1 flex items-center rounded-lg justify-between hover:bg-primary-75">


    <a-popover placement="topLeft" trigger="click" overlayClassName="user-profile-popover">
      <template #content>
          <div class="flex items-center gap-3 mb-3 px-2 pt-2">
            <div class="user-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" :alt="username?.charAt(0).toUpperCase() || 'H'" />
              <span v-else class="avatar-placeholder">{{ username?.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="overflow-hidden">
              <div class="font-bold text-base truncate text-slate-800">{{ username || '神秘的人' }}</div>
              <div class="text-xs text-slate-500 truncate">{{ username }}</div>
            </div>
          </div>
          <div class="px-2 pb-2">
            <div class="text-xs text-slate-400 mb-1">Role</div>
            <div class="text-sm text-slate-600">Senior Architect</div>
          </div>
      </template>
      <div class="flex items-center gap-3 cursor-pointer flex-1 min-w-0 p-2 rounded-lg transition-colors">
        <a-avatar :size="32" :src="avatarUrl" class="flex-shrink-0 bg-primary-500">
          {{ username || 'U' }}
        </a-avatar>
        <div class="font-medium text-sm truncate text-slate-700 select-none">
          {{ username || 'User' }}
        </div>
      </div>
    </a-popover>
    
    <!-- 右侧：设置图标 -->
    <div class="action-item settings-wrapper" @click="handleSettingsClick">
      <SettingOutlined class="settings-icon" />
    </div>

    <!-- 设置弹窗 -->
    <SettingsModal v-model:visible="settingsVisible" />
  </div>
</template>

<style lang="scss" scoped>
.sidebar-action-bar::before {
  content: '';
  position: absolute;
  // 核心：向上移动 5px (如果是负数则是向外移，正数则是向内移)
  top: 3px;
  left: 0;
  right: 0; // 撑满宽度
  height: 1px; // 线的高度
  background-color: $primary-color-100; // 线的颜色
}
.action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 50%;

}

// 头像样式
.user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba($primary-color-400, 0.8), rgba($primary-color-600, 0.8));
    color: white;
    font-weight: 600;
    font-size: 14px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      user-select: none;
    }
  }

// 设置图标样式
.settings-wrapper {
  width: 36px;
  height: 36px;
  
  .settings-icon {
    font-size: 18px;
    color: rgba($primary-color-700, 0.8);
    transition: all 0.2s ease;
  }

  &:hover .settings-icon {
    color: rgba($primary-color-900, 0.9);
    transform: rotate(30deg);
  }
}
</style>
