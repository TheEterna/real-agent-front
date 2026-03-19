import { ref, onScopeDispose, type Ref, type ComputedRef } from 'vue'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, type LanguageModel } from 'ai'
import { nanoid } from 'nanoid'
import { useAuthStore } from '@/stores/authStore'
import { retrieve, type RetrievalChunk } from '@/api/knowledge'
import { useI18n } from 'vue-i18n'

/** 发送给 API 的最大历史消息对数（user+assistant = 1 对），避免超过上下文窗口 */
const MAX_HISTORY_PAIRS = 10

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Array<{ documentName: string; content: string; similarity: number }>
}

interface UseKnowledgeChatOptions {
  datasetIds: Ref<string[]> | ComputedRef<string[]>
  modelName?: string
}

export function useKnowledgeChat(options: UseKnowledgeChatOptions) {
  const { datasetIds, modelName = 'qwen-max' } = options
  const authStore = useAuthStore()
  const { t } = useI18n()

  function buildSystemPrompt(chunks: RetrievalChunk[]): string {
    if (chunks.length === 0) {
      return t('knowledge.chatComposable.systemPromptEmpty')
    }

    const context = chunks
      .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
      .join('\n\n')

    return `${t('knowledge.chatComposable.systemPromptWithRef')}\n\n${t('knowledge.chatComposable.referenceTitle')}\n${context}\n\n${t('knowledge.chatComposable.answerRequirements')}`
  }

  const messages = ref<ChatMessage[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  // AbortController for cancelling in-flight requests
  let abortController: AbortController | null = null

  async function retrieveChunks(question: string): Promise<{
    chunks: RetrievalChunk[]
    sources: ChatMessage['sources']
  }> {
    try {
      const result = await retrieve({
        question,
        datasetIds: datasetIds.value,
        topK: 5,
        similarityThreshold: 0.3,
      })
      if (result.code === 200 && result.data?.length > 0) {
        const sources = result.data.map((chunk, i) => ({
          documentName: t('knowledge.chatComposable.snippetLabel', { index: i + 1 }),
          content: chunk.content,
          similarity: chunk.similarity ?? 0,
        }))
        return { chunks: result.data, sources }
      }
    } catch (e) {
      console.warn('[KnowledgeChat] Retrieval failed, falling back to pure chat:', e)
    }
    return { chunks: [], sources: undefined }
  }

  async function sendMessage(question: string) {
    const trimmed = question.trim()
    if (!trimmed || isStreaming.value) return

    error.value = null
    isStreaming.value = true

    // Add user message
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: trimmed,
    }
    messages.value.push(userMessage)

    // Prepare assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content: '',
    }

    try {
      // Step 1: Retrieve relevant chunks
      const { chunks, sources } = await retrieveChunks(trimmed)
      assistantMessage.sources = sources

      // Add assistant message to list (will be updated incrementally)
      messages.value.push(assistantMessage)

      // Step 2: Build conversation history for the API (sliding window to stay within context limit)
      const conversationMessages = messages.value
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
        .slice(0, -1) // exclude the empty assistant placeholder
        .slice(-(MAX_HISTORY_PAIRS * 2)) // sliding window: keep last N pairs
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      // Step 3: Create OpenAI provider and stream
      // Note: @ai-sdk/openai v3 returns LanguageModelV3 while ai@5 expects LanguageModelV2.
      // This is a known version mismatch; cast is safe as both versions share the same runtime API.
      const openai = createOpenAI({
        baseURL: '/v1',
        apiKey: authStore.accessToken || 'anonymous',
      })

      abortController = new AbortController()

      const result = streamText({
        model: openai(modelName) as unknown as LanguageModel,
        system: buildSystemPrompt(chunks),
        messages: conversationMessages,
        abortSignal: abortController.signal,
      })

      // Assistant message is always the last item in the array
      const assistantIdx = messages.value.length - 1

      for await (const text of result.textStream) {
        assistantMessage.content += text
        // Trigger Vue reactivity by replacing the message in the array
        messages.value[assistantIdx] = { ...assistantMessage }
      }
    } catch (e: unknown) {
      // Ignore abort errors
      if (e instanceof Error && e.name === 'AbortError') {
        return
      }
      const errorMessage = e instanceof Error ? e.message : t('knowledge.chatComposable.sendFailed')
      error.value = errorMessage
      console.error('[KnowledgeChat] Stream error:', e)
      // If assistant message is empty, remove it
      if (!assistantMessage.content) {
        const idx = messages.value.findIndex((m) => m.id === assistantMessage.id)
        if (idx !== -1) {
          messages.value.splice(idx, 1)
        }
      }
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function clearMessages() {
    messages.value = []
    error.value = null
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  // Automatically abort in-flight stream when the composable's scope is disposed
  onScopeDispose(() => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  })

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  }
}
