<script setup lang="ts">
import { ref, computed } from 'vue'
import { CloseOutlined, SettingOutlined, UserOutlined, BellOutlined, LockOutlined, GlobalOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'

// 定义设置项的接口
interface SettingItem {
  key: string
  label: string
  icon: any
}

// Props 定义
interface Props {
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

// Emits 定义
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

// 当前选中的设置项
const activeKey = ref<string>('general')

// 设置菜单项
const settingItems: SettingItem[] = [
  { key: 'general', label: '常规', icon: SettingOutlined },
  { key: 'profile', label: '个人资料', icon: UserOutlined },
  { key: 'notifications', label: '通知', icon: BellOutlined },
  { key: 'privacy', label: '隐私', icon: LockOutlined },
  { key: 'language', label: '语言', icon: GlobalOutlined },
  { key: 'about', label: '关于', icon: QuestionCircleOutlined },
]

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}

// 切换设置项
const handleMenuClick = (key: string) => {
  activeKey.value = key
}

// 计算当前选中项的标题
const currentTitle = computed(() => {
  const item = settingItems.find(item => item.key === activeKey.value)
  return item?.label || '设置'
})

// 响应式数据（设置选项的默认值）
const selectedTheme = ref('light')
const selectedFontSize = ref('medium')
const selectedLanguage = ref('zh-CN')
</script>

<template>
  <a-modal
    :open="visible"
    :footer="null"
    :closable="false"
    :width="800"
    :centered="true"
    wrap-class-name="settings-modal-wrapper"
    @cancel="handleClose"
  >
    <div class="settings-modal">
      <!-- 头部 -->
      <div class="modal-header">
        <h2 class="modal-title">{{ currentTitle }}</h2>
        <button class="close-btn" @click="handleClose">
          <CloseOutlined />
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="modal-body">
        <!-- 左侧导航 -->
        <div class="nav-sidebar">
          <div
            v-for="item in settingItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: activeKey === item.key }"
            @click="handleMenuClick(item.key)"
          >
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-label">{{ item.label }}</span>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="content-area">
          <!-- 常规设置 -->
          <div v-if="activeKey === 'general'" class="content-section">
            <div class="setting-item">
              <div class="setting-label">主题</div>
              <a-select v-model:value="selectedTheme" style="width: 200px">
                <a-select-option value="light">浅色</a-select-option>
                <a-select-option value="dark">深色</a-select-option>
                <a-select-option value="auto">跟随系统</a-select-option>
              </a-select>
            </div>

            <div class="setting-item">
              <div class="setting-label">字体大小</div>
              <a-select v-model:value="selectedFontSize" style="width: 200px">
                <a-select-option value="small">小</a-select-option>
                <a-select-option value="medium">中</a-select-option>
                <a-select-option value="large">大</a-select-option>
              </a-select>
            </div>
          </div>

          <!-- 个人资料 -->
          <div v-else-if="activeKey === 'profile'" class="content-section">
            <div class="setting-item">
              <div class="setting-label">用户名</div>
              <a-input placeholder="请输入用户名" style="width: 300px" />
            </div>

            <div class="setting-item">
              <div class="setting-label">邮箱</div>
              <a-input placeholder="请输入邮箱" style="width: 300px" />
            </div>
          </div>

          <!-- 通知设置 -->
          <div v-else-if="activeKey === 'notifications'" class="content-section">
            <div class="setting-item">
              <a-checkbox>接收邮件通知</a-checkbox>
            </div>
            <div class="setting-item">
              <a-checkbox>接收桌面通知</a-checkbox>
            </div>
          </div>

          <!-- 隐私设置 -->
          <div v-else-if="activeKey === 'privacy'" class="content-section">
            <div class="setting-item">
              <a-checkbox>允许数据分析</a-checkbox>
            </div>
            <div class="setting-item">
              <a-checkbox>保存聊天历史</a-checkbox>
            </div>
          </div>

          <!-- 语言设置 -->
          <div v-else-if="activeKey === 'language'" class="content-section">
            <div class="setting-item">
              <div class="setting-label">界面语言</div>
              <a-select v-model:value="selectedLanguage" style="width: 200px">
                <a-select-option value="zh-CN">简体中文</a-select-option>
                <a-select-option value="en-US">English</a-select-option>
              </a-select>
            </div>
          </div>

          <!-- 关于 -->
          <div v-else-if="activeKey === 'about'" class="content-section">
            <div class="about-info">
              <h3>Real Agent</h3>
              <p>版本: 1.0.0</p>
              <p>© 2024 Real Agent. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-height: 80vh;
}

// 头部样式
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba($primary-color-200, 0.3);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgba($primary-color-900, 0.9);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: rgba($primary-color-600, 0.7);
  transition: all 0.2s ease;

  &:hover {
    background: rgba($primary-color-100, 0.5);
    color: rgba($primary-color-900, 0.9);
  }
}

// 主体内容区域
.modal-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

// 左侧导航栏
.nav-sidebar {
  width: 200px;
  padding: 20px 12px;
  border-right: 1px solid rgba($primary-color-200, 0.3);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba($primary-color-700, 0.8);
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    background: rgba($primary-color-50, 0.6);
    color: rgba($primary-color-900, 0.9);
  }

  &.active {
    background: rgba($primary-color-100, 0.8);
    color: rgba($primary-color-600, 1);
    font-weight: 500;
  }
}

.nav-icon {
  font-size: 16px;
}

.nav-label {
  flex: 1;
}

// 右侧内容区域
.content-area {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
}

.setting-label {
  min-width: 100px;
  font-weight: 500;
  color: rgba($primary-color-800, 0.9);
}

// 关于信息样式
.about-info {
  h3 {
    margin-bottom: 16px;
    font-size: 18px;
    color: rgba($primary-color-900, 0.9);
  }

  p {
    margin-bottom: 8px;
    color: rgba($primary-color-700, 0.8);
  }
}
</style>

<style lang="scss">
// 全局样式 - 自定义 Modal 包装器
.settings-modal-wrapper {
  .ant-modal {
    top: 50px;
  }

  .ant-modal-content {
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  }

  .ant-modal-body {
    padding: 0;
  }
}
</style>
