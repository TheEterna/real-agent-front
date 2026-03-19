<script setup lang="ts">
import { computed } from 'vue'
import type { UIMessage } from '@/types/events'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { getFileUrl } from '@/api/file'
import { message } from 'ant-design-vue'
import http from '@/services/http'
import { Eye, Download } from 'lucide-vue-next'
import { PaperClipOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  message: UIMessage
  isArtifactOpen?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'open-code-artifact', payload: { code: string; language?: string }): void
  (e: 'close-code-artifact'): void
}>()

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

// 判断是否为 PDF（可在浏览器中预览）
const isPdf = (mimeType: string) => {
  return mimeType.includes('pdf')
}

// 判断是否为文本文件（可预览内容）
const isTextFile = (mimeType: string, fileName: string) => {
  if (mimeType.startsWith('text/')) return true
  const textExts = ['.md', '.json', '.yaml', '.yml', '.xml', '.html', '.css', '.js', '.ts', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.sh']
  return textExts.some(ext => fileName.toLowerCase().endsWith(ext))
}

// 处理附件点击
const handleAttachmentClick = async (attachment: any) => {
  if (isImage(attachment.mimeType)) {
    // 图片预览
    previewImage(attachment)
  } else if (isPdf(attachment.mimeType)) {
    // PDF 预览
    previewPdf(attachment)
  } else if (isTextFile(attachment.mimeType, attachment.fileName)) {
    // 文本文件预览（打开代码面板）
    await previewTextFile(attachment)
  } else {
    // 其他文件直接下载
    downloadFile(attachment)
  }
}

// 预览图片
const previewImage = (attachment: any) => {
  const url = getFileUrl(attachment.fileId)
  // 使用 Image 组件预览（ant-design-vue 内置）
  const img = new Image()
  img.src = url
  const win = window.open()
  if (win) {
    win.document.write('<img src="' + url + '" alt="' + (attachment.fileName || t('messages.common.attachmentPreview')) + '" style="max-width:100%;height:auto;" />')
    win.document.title = attachment.fileName
  } else {
    message.warning(t('messages.common.cannotOpenPreview'))
  }
}

// 预览 PDF
const previewPdf = (attachment: any) => {
  const url = getFileUrl(attachment.fileId)
  const win = window.open()
  if (win) {
    win.location.href = url
  } else {
    message.warning(t('messages.common.cannotOpenPreview'))
  }
}

// 预览文本文件（打开代码面板）
const previewTextFile = async (attachment: any) => {
  try {
    const text = await http.get(`/files/${attachment.fileId}`, { responseType: 'text' })
    // 触发代码面板事件
    const language = getLanguageFromFileName(attachment.fileName)
    emit('open-code-artifact', { code: text, language })
  } catch (error) {
    console.error('预览文件失败:', error)
    message.error(t('messages.common.previewFallback'))
    downloadFile(attachment)
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

// 根据文件名获取语言类型
const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop()
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'md': 'markdown',
    'sql': 'sql'
  }
  return languageMap[ext || ''] || 'text'
}

// 获取附件操作类型提示
const getAttachmentAction = (attachment: any) => {
  if (isImage(attachment.mimeType)) return t('messages.common.preview')
  if (isPdf(attachment.mimeType)) return t('messages.common.preview')
  if (isTextFile(attachment.mimeType, attachment.fileName)) return t('messages.common.view')
  return t('messages.common.download')
}
</script>

<template>
  <div class="w-full relative">
    <Message from="assistant">
      <!-- 消息内容 -->
      <MessageContent>
        <MessageResponse
          :content="props.message.message"
          :is-artifact-open="props.isArtifactOpen"
          @open-code-artifact="(payload) => emit('open-code-artifact', payload)"
          @close-code-artifact="() => emit('close-code-artifact')"
        />
      </MessageContent>

      <!-- AI 生成的附件 (显示在回复下方) -->
      <div v-if="attachments.length > 0" class="mt-3 flex flex-col gap-2">
        <div class="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-1 flex items-center gap-1">
          <PaperClipOutlined class="text-slate-400 dark:text-zinc-500" />
          {{ t('messages.common.generatedFiles', { count: attachments.length }) }}
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(attachment, index) in attachments"
            :key="index"
            role="button"
            tabindex="0"
            class="attachment-item group px-3 py-2 rounded-lg bg-slate-50/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-700/50 shadow-sm
                   flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-200 hover:shadow-md hover:border-teal-300/50
                   transition-all duration-200 cursor-pointer select-none"
            :title="`${getAttachmentAction(attachment)}: ${attachment.fileName}`"
            :aria-label="`${getAttachmentAction(attachment)}: ${attachment.fileName}`"
            @click="handleAttachmentClick(attachment)"
            @keydown.enter="handleAttachmentClick(attachment)"
            @keydown.space.prevent="handleAttachmentClick(attachment)"
          >
            <!-- 文件图标 -->
            <span class="text-lg">{{ getFileIcon(attachment.mimeType) }}</span>
            <div class="flex flex-col">
              <span class="font-medium text-xs truncate max-w-[200px]">{{ attachment.fileName }}</span>
              <span class="text-xs text-slate-500 dark:text-zinc-400">{{ formatFileSize(attachment.size) }}</span>
            </div>
            <!-- 操作图标提示 -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye v-if="isImage(attachment.mimeType)" :size="14" class="text-teal-600 dark:text-teal-400" />
              <Eye v-else-if="isPdf(attachment.mimeType)" :size="14" class="text-teal-600 dark:text-teal-400" />
              <Download v-else :size="14" class="text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>
      </div>
    </Message>
  </div>
</template>

<style scoped>
</style>
