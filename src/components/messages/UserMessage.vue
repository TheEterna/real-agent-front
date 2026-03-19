<script setup lang="ts">
import { computed } from 'vue'
import type { UIMessage } from '@/types/events'
import { UserOutlined, ExclamationOutlined, FileOutlined, PaperClipOutlined } from '@ant-design/icons-vue'
import { Download, Eye } from 'lucide-vue-next'
import { getRandomGlassColor } from '@/utils/colorUtils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { getFileUrl } from '@/api/file'
import { message, Button as AButton } from 'ant-design-vue'
import http from '@/services/http'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  message: UIMessage
  showAvatar?: boolean      // 是否显示头像,默认不显示
  showTimestamp?: boolean   // 是否显示时间戳
  status?: 'sending' | 'sent' | 'failed'  // 消息状态
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: false,
  showTimestamp: false,
  status: 'sent'
})

const emit = defineEmits<{
  retry: []
}>()

// 头像背景色 (玻璃浅色)
const avatarBg = getRandomGlassColor()

// 根据状态显示不同样式
const statusClass = computed(() => {
  switch (props.status) {
    case 'sending':
      return 'opacity-60'
    case 'failed':
      return 'border-red-300 bg-red-50'
    default:
      return ''
  }
})

// 从 meta 中提取附件信息
const attachments = computed(() => {
  if (props.message.meta && typeof props.message.meta === 'object') {
    const meta = props.message.meta as any
    return meta.attachments || []
  }
  return []
})

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 获取文件图标
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦'
  return '📎'
}

// 判断是否为图片
const isImage = (mimeType: string) => {
  return mimeType.startsWith('image/')
}

// 处理附件点击
const handleAttachmentClick = async (attachment: any) => {
  if (isImage(attachment.mimeType)) {
    // 图片预览 - 使用 Image Preview
    previewImage(attachment)
  } else {
    // 其他文件直接下载
    downloadFile(attachment)
  }
}

// 预览图片
const previewImage = (attachment: any) => {
  const url = getFileUrl(attachment.fileId)
  // 创建新窗口打开图片
  const win = window.open()
  if (win) {
    win.location.href = url
  } else {
    message.warning(t('messages.common.cannotOpenPreview'))
  }
}

// 下载文件
const downloadFile = async (attachment: any) => {
  try {
    const blob = await http.get(`/files/${attachment.fileId}`, { responseType: 'blob' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)

    message.success(t('messages.common.downloadStarted', { fileName: attachment.fileName }))
  } catch (error) {
    console.error('下载文件失败:', error)
    message.error(t('messages.common.downloadFailed'))
  }
}

</script>

<template>
  <div class="w-full relative gap-2 flex flex-row-reverse items-start">
    <!-- 用户消息气泡 -->
    <div class="flex flex-col gap-2 self-end">
      <!-- 附件列表 (显示在消息上方) -->
      <div v-if="attachments.length > 0" class="flex flex-wrap gap-2 justify-end">
        <div
          v-for="(attachment, index) in attachments"
          :key="index"
          class="attachment-item group px-3 py-2 rounded-lg bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-700/50 shadow-sm
                 flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 hover:shadow-md hover:border-teal-300/50 dark:hover:border-teal-600/50
                 transition-all duration-200 cursor-pointer"
          :title="isImage(attachment.mimeType) ? t('messages.common.clickPreview') : t('messages.common.clickDownload')"
          @click="handleAttachmentClick(attachment)"
        >
          <span class="text-lg">{{ getFileIcon(attachment.mimeType) }}</span>
          <div class="flex flex-col">
            <span class="font-medium text-xs truncate max-w-[150px]">{{ attachment.fileName }}</span>
            <span class="text-xs text-slate-500 dark:text-zinc-400">{{ formatFileSize(attachment.size) }}</span>
          </div>
          <!-- 操作图标提示 -->
          <div class="opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye v-if="isImage(attachment.mimeType)" :size="14" class="text-teal-600 dark:text-teal-400" />
            <Download v-else :size="14" class="text-teal-600 dark:text-teal-400" />
          </div>
        </div>
      </div>

      <!-- 消息内容 -->
      <div
        class="peer user-message-bubble px-4 py-2.5 rounded-2xl
          shadow-[2px_1px_6px_1px_theme('--color-primary-100')]
          transition-all duration-200 ease-in-out
          relative"
        :class="statusClass"
      >
        {{ props.message.message }}
      </div>
    </div>

    <!-- 时间戳 (可选) -->
<!--    <p class="absolute opacity-0 peer-hover:!opacity-100 transition text-xs text-slate-400 -bottom-8 right-1">-->
<!--      {{ formatDistanceToNow(props.message.startTime ?? new Date(), { locale: zhCN }) }}-->
<!--    </p>-->

    <!-- 失败重试按钮 -->
    <AButton
      v-if="status === 'failed'"
      danger
      size="small"
      type="primary"
      shape="circle"
      :aria-label="t('messages.common.retryLabel')"
      @click="emit('retry')"
    >
      <template #icon>
        <ExclamationOutlined />
      </template>
    </AButton>

    <!-- 用户头像 (可选) -->
    <div
      v-if="showAvatar"
      class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm select-none"
      :style="{ backgroundColor: avatarBg }"
    >
      <UserOutlined class="text-slate-600 dark:text-zinc-400" />
    </div>
  </div>
</template>

<style scoped>
/* 针对用户消息的自定义样式优化 */
.user-message-bubble {
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .user-message-wrapper {
    max-width: 100%;
  }

  .user-message-wrapper > div {
    max-width: 85%;
  }
}
</style>
