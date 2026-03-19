/**
 * Chat Analyzer Store
 *
 * 模块状态管理，遵循"谁的数据谁负责"原则。
 * Contact-Centric：无 Session 概念，联系人直接挂在用户下。
 * 联系人切换通过 setActiveContactId() 通知 Store，
 * Store 内部 watch 决定是否加载记录/报告。
 */

import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { message } from 'ant-design-vue'
import i18n from '@/i18n'
import { contactApi, recordApi, analysisApi, dialogApi } from '../api/chatAnalyzer'
import type {
  Contact,
  ChatRecord,
  AnalysisReport,
  DialogMessage,
  DialogMode,
  ImportStatus,
  AnalysisStatus,
  ImportResult,
  ImportHistory,
} from '../types'

// ==================== SWR Cache Infrastructure ====================

const SWR_PREFIX = 'volo_ai_chat_analyzer_'

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${SWR_PREFIX}${key}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(`${SWR_PREFIX}${key}`, JSON.stringify(data))
  } catch { /* quota exceeded */ }
}

function removeCache(key: string) {
  localStorage.removeItem(`${SWR_PREFIX}${key}`)
}

// ==================== Store ====================

export const useChatAnalyzerStore = defineStore('chat-analyzer', () => {
  // ---- Contact State ----
  const contacts = ref<Contact[]>([])
  const activeContactId = ref<string | null>(null)
  const contactsLoading = ref(false)

  const activeContact = computed(() =>
    contacts.value.find(c => c.id === activeContactId.value) ?? null,
  )

  const selfContact = computed(() =>
    contacts.value.find(c => c.isSelf) ?? null,
  )

  // ---- Chat Records ----
  const records = ref<Map<string, ChatRecord[]>>(new Map())
  const recordsLoading = ref(false)

  const activeRecords = computed(() =>
    activeContactId.value ? (records.value.get(activeContactId.value) ?? []) : [],
  )

  // ---- Analysis Report ----
  const reports = ref<Map<string, AnalysisReport | null>>(new Map())
  const analysisStatus = ref<AnalysisStatus>('idle')

  const activeReport = computed(() =>
    activeContactId.value ? (reports.value.get(activeContactId.value) ?? null) : null,
  )

  // ---- AI Dialog ----
  const dialogMessages = ref<Map<string, DialogMessage[]>>(new Map())
  const dialogMode = ref<DialogMode>('advisor')
  const dialogLoading = ref(false)

  const activeDialogMessages = computed(() =>
    activeContactId.value ? (dialogMessages.value.get(activeContactId.value) ?? []) : [],
  )

  // ---- Import ----
  const importStatus = ref<ImportStatus>('idle')
  const importHistory = ref<ImportHistory[]>([])

  // ==================== Request Dedup ====================
  let contactsRequestId = 0
  let recordsRequestId = 0

  // ==================== Contact Actions ====================

  async function loadContacts() {
    // SWR: hydrate from cache
    if (contacts.value.length === 0) {
      const cached = readCache<Contact[]>('contacts')
      if (cached) {
        contacts.value = cached
        if (contacts.value.length > 0 && !activeContactId.value) {
          const lastId = readCache<string>('last_contact_id')
          const firstNonSelf = contacts.value.find(c => !c.isSelf)
          activeContactId.value =
            (lastId && contacts.value.some(c => c.id === lastId))
              ? lastId
              : firstNonSelf?.id ?? contacts.value[0].id
        }
      }
    }

    const requestId = ++contactsRequestId
    const isFirstLoad = contacts.value.length === 0
    if (isFirstLoad) {
      if (contactsLoading.value) return
      contactsLoading.value = true
    }

    try {
      const res = await contactApi.list()
      if (requestId !== contactsRequestId) return
      if (res.code === 200) {
        contacts.value = res.data ?? []
        writeCache('contacts', contacts.value)
        // Auto-select first non-self contact
        if (contacts.value.length > 0 && !activeContactId.value) {
          const firstNonSelf = contacts.value.find(c => !c.isSelf)
          activeContactId.value = firstNonSelf?.id ?? contacts.value[0].id
        }
      }
    } catch (e) {
      if (requestId !== contactsRequestId) return
      console.error('[ChatAnalyzer] Failed to load contacts:', e)
      if (isFirstLoad) message.error(i18n.global.t('chatAnalyzer.store.loadContactsFailed'))
    } finally {
      if (requestId === contactsRequestId) contactsLoading.value = false
    }
  }

  async function updateContact(contactId: string, data: Partial<Pick<Contact, 'name' | 'relationType' | 'avatar'>>) {
    try {
      const res = await contactApi.update(contactId, data)
      if (res.code === 200 && res.data) {
        const idx = contacts.value.findIndex(c => c.id === contactId)
        if (idx !== -1) contacts.value[idx] = res.data
      }
    } catch (e) {
      console.error('[ChatAnalyzer] Failed to update contact:', e)
      message.error(i18n.global.t('chatAnalyzer.store.updateContactFailed'))
    }
  }

  async function deleteContact(contactId: string) {
    try {
      const res = await contactApi.remove(contactId)
      if (res.code === 200) {
        contacts.value = contacts.value.filter(c => c.id !== contactId)
        writeCache('contacts', contacts.value)
        // Clear related caches for this contact
        records.value.delete(contactId)
        reports.value.delete(contactId)
        dialogMessages.value.delete(contactId)
        if (activeContactId.value === contactId) {
          const firstNonSelf = contacts.value.find(c => !c.isSelf)
          activeContactId.value = firstNonSelf?.id ?? (contacts.value.length > 0 ? contacts.value[0].id : null)
        }
        message.success(i18n.global.t('chatAnalyzer.store.deleteSuccess'))
      }
    } catch (e) {
      console.error('[ChatAnalyzer] Failed to delete contact:', e)
      message.error(i18n.global.t('chatAnalyzer.store.deleteContactFailed'))
    }
  }

  function setActiveContactId(id: string | null) {
    activeContactId.value = id
    if (id) writeCache('last_contact_id', id)
  }

  // ==================== Records Actions ====================

  async function loadRecords(contactId?: string) {
    const cid = contactId ?? activeContactId.value
    if (!cid) return

    // Already loaded
    if (records.value.has(cid) && (records.value.get(cid)?.length ?? 0) > 0) return

    const requestId = ++recordsRequestId
    recordsLoading.value = true

    try {
      const res = await recordApi.list(cid, 0, 5000)
      if (requestId !== recordsRequestId) return
      if (res.code === 200) {
        records.value.set(cid, res.data ?? [])
      }
    } catch (e) {
      if (requestId !== recordsRequestId) return
      console.error('[ChatAnalyzer] Failed to load records:', e)
    } finally {
      if (requestId === recordsRequestId) recordsLoading.value = false
    }
  }

  // ==================== Report Actions ====================

  async function loadReport(contactId?: string) {
    const cid = contactId ?? activeContactId.value
    if (!cid) return

    try {
      const res = await analysisApi.getReport(cid)
      if (res.code === 200 && res.data) {
        reports.value.set(cid, res.data)
      }
    } catch {
      // Report may not exist yet - not an error
    }
  }

  function setReport(contactId: string, report: AnalysisReport) {
    reports.value.set(contactId, report)
  }

  function setAnalysisStatus(status: AnalysisStatus) {
    analysisStatus.value = status
  }

  // ==================== Dialog Actions ====================

  async function loadDialogHistory(contactId?: string) {
    const cid = contactId ?? activeContactId.value
    if (!cid) return

    dialogLoading.value = true
    try {
      const res = await dialogApi.getHistory(cid)
      if (res.code === 200) {
        dialogMessages.value.set(cid, res.data ?? [])
      }
    } catch (e) {
      console.error('[ChatAnalyzer] Failed to load dialog history:', e)
    } finally {
      dialogLoading.value = false
    }
  }

  function appendDialogMessage(contactId: string, msg: DialogMessage) {
    const existing = dialogMessages.value.get(contactId) ?? []
    dialogMessages.value.set(contactId, [...existing, msg])
  }

  function updateLastDialogMessage(contactId: string, content: string) {
    const msgs = dialogMessages.value.get(contactId)
    if (msgs && msgs.length > 0) {
      msgs[msgs.length - 1].content = content
    }
  }

  function setDialogMode(mode: DialogMode) {
    dialogMode.value = mode
  }

  // ==================== Import State ====================

  function setImportStatus(status: ImportStatus) {
    importStatus.value = status
  }

  /** After import success, update contacts from ImportResult */
  function handleImportComplete(result: ImportResult) {
    contacts.value = result.contacts
    writeCache('contacts', contacts.value)
    importStatus.value = 'done'
    if (result.contacts.length > 0 && !activeContactId.value) {
      const firstNonSelf = result.contacts.find(c => !c.isSelf)
      activeContactId.value = firstNonSelf?.id ?? result.contacts[0].id
    }
  }

  // ==================== Import History ====================

  async function loadImportHistory(contactId: string) {
    try {
      const res = await contactApi.importHistory(contactId)
      if (res.code === 200) {
        importHistory.value = res.data ?? []
      }
    } catch (e) {
      console.error('[ChatAnalyzer] Failed to load import history:', e)
    }
  }

  // ==================== Internal Watch ====================

  // When activeContactId changes, auto-load records, report, and dialog
  watch(activeContactId, async (newId) => {
    if (!newId) return
    await Promise.all([
      loadRecords(newId),
      loadReport(newId),
      loadDialogHistory(newId),
    ])
  })

  // ==================== Computed Helpers ====================

  const hasData = computed(() => contacts.value.length > 0)
  const isEmptyState = computed(() => !hasData.value)

  return {
    // Contacts
    contacts,
    activeContactId,
    activeContact,
    selfContact,
    contactsLoading,
    loadContacts,
    updateContact,
    deleteContact,
    setActiveContactId,

    // Records
    records,
    activeRecords,
    recordsLoading,
    loadRecords,

    // Reports
    reports,
    activeReport,
    analysisStatus,
    loadReport,
    setReport,
    setAnalysisStatus,

    // Dialog
    dialogMessages,
    activeDialogMessages,
    dialogMode,
    dialogLoading,
    loadDialogHistory,
    appendDialogMessage,
    updateLastDialogMessage,
    setDialogMode,

    // Import
    importStatus,
    setImportStatus,
    handleImportComplete,
    importHistory,
    loadImportHistory,

    // Helpers
    hasData,
    isEmptyState,
  }
})
