/**
 * useChatImport
 *
 * 文件选择、格式检测（chatlab/csv/txt）、上传进度、解析状态。
 * 调用 Store actions 完成状态变更。
 */

import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import i18n from '@/i18n'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import { importApi } from '../api/chatAnalyzer'
import type { ImportFormat, ImportStatus, ContactPreset } from '../types'

/** 文件大小限制 (bytes) */
const FILE_SIZE_LIMITS: Record<string, number> = {
  jsonl: 100 * 1024 * 1024,   // 100MB for JSONL
  json: 50 * 1024 * 1024,     // 50MB
  csv: 50 * 1024 * 1024,      // 50MB
  txt: 50 * 1024 * 1024,      // 50MB
}

const PASTE_CHAR_LIMIT = 50_000

export function useChatImport() {
  const store = useChatAnalyzerStore()

  const selectedFile = ref<File | null>(null)
  const pasteText = ref('')
  const detectedFormat = ref<ImportFormat | null>(null)
  const contactPresets = ref<ContactPreset[]>([])
  const isUploading = ref(false)
  const uploadError = ref<string | null>(null)

  const canSubmit = computed(() => {
    if (isUploading.value) return false
    return !!selectedFile.value || pasteText.value.trim().length > 0
  })

  const isPasteMode = computed(() => !selectedFile.value && pasteText.value.trim().length > 0)

  /**
   * Detect format from file extension and content
   */
  function detectFormat(file: File): ImportFormat {
    const name = file.name.toLowerCase()
    if (name.endsWith('.jsonl')) return 'chatlab'
    if (name.endsWith('.json')) return 'chatlab'
    if (name.endsWith('.csv')) return 'csv'
    if (name.endsWith('.txt')) return 'txt'
    // Default based on MIME type
    if (file.type === 'application/json') return 'chatlab'
    if (file.type === 'text/csv') return 'csv'
    return 'txt'
  }

  /**
   * Validate file size
   */
  function validateFileSize(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
    const limit = FILE_SIZE_LIMITS[ext] ?? FILE_SIZE_LIMITS.txt
    if (file.size > limit) {
      const limitMB = Math.round(limit / (1024 * 1024))
      message.error(i18n.global.t('chatAnalyzer.composable.fileSizeExceed', { limit: limitMB }))
      return false
    }
    return true
  }

  /**
   * Handle file selection
   */
  function selectFile(file: File) {
    uploadError.value = null

    if (!validateFileSize(file)) {
      selectedFile.value = null
      detectedFormat.value = null
      return
    }

    selectedFile.value = file
    detectedFormat.value = detectFormat(file)
    pasteText.value = '' // Clear paste text when file selected
  }

  /**
   * Remove selected file
   */
  function clearFile() {
    selectedFile.value = null
    detectedFormat.value = null
    uploadError.value = null
  }

  /**
   * Add a contact preset
   */
  function addPreset(preset: ContactPreset) {
    contactPresets.value.push(preset)
  }

  /**
   * Remove a contact preset by index
   */
  function removePreset(index: number) {
    contactPresets.value.splice(index, 1)
  }

  /**
   * Submit import (file or paste)
   */
  async function submitImport(targetContactId?: string): Promise<boolean> {
    if (isUploading.value) return false
    if (!selectedFile.value && !pasteText.value.trim()) {
      message.warning(i18n.global.t('chatAnalyzer.composable.selectFileOrPaste'))
      return false
    }

    isUploading.value = true
    uploadError.value = null
    store.setImportStatus('uploading')

    try {
      if (selectedFile.value) {
        store.setImportStatus('parsing')
        const res = await importApi.importFile(selectedFile.value, targetContactId)
        if (res.code !== 200) throw new Error(res.message || i18n.global.t('chatAnalyzer.composable.importFailed'))
        store.handleImportComplete(res.data)
        message.success(i18n.global.t('chatAnalyzer.composable.importSuccess', { newCount: res.data.newMessages, dupCount: res.data.duplicateMessages }))
      } else {
        // Paste mode
        if (pasteText.value.length > PASTE_CHAR_LIMIT) {
          throw new Error(i18n.global.t('chatAnalyzer.composable.pasteExceed', { limit: PASTE_CHAR_LIMIT.toLocaleString() }))
        }
        store.setImportStatus('parsing')
        const res = await importApi.importText(pasteText.value, targetContactId)
        if (res.code !== 200) throw new Error(res.message || i18n.global.t('chatAnalyzer.composable.importFailed'))
        store.handleImportComplete(res.data)
        message.success(i18n.global.t('chatAnalyzer.composable.importSuccess', { newCount: res.data.newMessages, dupCount: res.data.duplicateMessages }))
      }

      // Clear form
      selectedFile.value = null
      pasteText.value = ''
      detectedFormat.value = null
      contactPresets.value = []

      return true
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : i18n.global.t('chatAnalyzer.composable.importFailed')
      uploadError.value = msg
      store.setImportStatus('error')
      message.error(msg)
      return false
    } finally {
      isUploading.value = false
    }
  }

  return {
    selectedFile,
    pasteText,
    detectedFormat,
    contactPresets,
    isUploading,
    uploadError,
    canSubmit,
    isPasteMode,
    selectFile,
    clearFile,
    addPreset,
    removePreset,
    submitImport,
  }
}
