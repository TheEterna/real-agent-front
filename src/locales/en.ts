/**
 * English translation aggregation file
 * Imports and merges all English translations from modules
 */

// === Infrastructure modules ===
import { commonEn } from './modules/common'

// === Page modules ===
import { chatEn } from './modules/chat'
import { avatarEn } from './modules/avatar'
import { feedEn } from './modules/feed'
import { knowledgeBaseEn } from './modules/knowledgeBase'
import { loginOnboardingEn } from './modules/loginOnboarding'
import { profileEn } from './modules/profile'
import { smallPagesEn } from './modules/smallPages'

// === Playground modules ===
import { playgroundBasicEn } from './modules/playgroundBasic'
import { playgroundChatEn } from './modules/playgroundChat'
import { chatAnalyzerEn } from './modules/chatAnalyzer'
import { playgroundCanvasEn } from './modules/playgroundCanvas'
import { playgroundMiscEn } from './modules/playgroundMisc'
import { thesisWriterEn } from './modules/thesisWriter'

// === Component modules ===
import { messagesEn } from './modules/messages'
import { aiElementsEn } from './modules/aiElements'
import { planEn } from './modules/plan'
import { toolComponentsEn } from './modules/toolComponents'
import { standaloneComponentsEn } from './modules/standaloneComponents'
import { homeWelcomeEn } from './modules/homeWelcome'
import { miscComponentsEn } from './modules/miscComponents'

// === Store modules ===
import { storeSessionEn } from './modules/storeSession'
import { storeFeatureEn } from './modules/storeFeature'
import { storeChatEn } from './modules/storeChat'
import { storeAuthEn } from './modules/storeAuth'

// === UI Event modules ===
import { uiEventEn } from './modules/uiEvent'

// === API modules ===
import { apiEn } from './modules/api'

// === Constants modules ===
import { constantsEn } from './modules/constants'

// === Composables modules ===
import { composablesEn } from './modules/composables'

// === UI Component modules ===
import { uiComponentsEn } from './modules/uiComponents'

export default {
  // Preserve original base translations
  message: {
    hello: 'Hello',
    tools: 'Tools',
    agents: 'Agents',
    workflows: 'Workflows',
    config: 'Config',
    logs: 'Logs',
    playground: 'Playground',
    dashboard: 'Dashboard'
  },
  menu: {
    chat: 'AI Chat',
    'chat/': 'AI Chat',
    dashboard: 'Dashboard',
    tools: 'Tools',
    agents: 'Agents',
    workflows: 'Workflows',
    config: 'Config',
    logs: 'Logs',
    playground: 'Playground'
  },
  tools: {
    title: 'Tools',
    search: 'Search tools…',
    selectTool: 'Select tool',
    toolArgs: 'Tool arguments',
    execute: 'Execute',
    reset: 'Reset',
    result: 'Execution Result',
    noToolSelected: 'Please select a tool',
    invalidJson: 'Invalid JSON format',
    execError: 'Execution error',
    resultViewer: 'Result viewer'
  },
  approval: {
    title: 'Tool Approval',
    toolName: 'Tool Name',
    args: 'Arguments',
    approve: 'Approve & Execute',
    reject: 'Reject',
    openInTools: 'Open in Tools',
    executing: 'Executing…',
    done: 'Execution Complete',
    failed: 'Execution Failed',
    rejected: 'Rejected',
    noToolName: 'Missing tool name'
  },
  'tools.result': {
    title: 'Execution Result',
    summary: 'Summary',
    status: 'Status',
    toolName: 'Tool',
    duration: 'Duration',
    message: 'Message',
    args: 'Arguments',
    result: 'Result',
    logs: 'Logs',
    metrics: 'Metrics',
    raw: 'Raw Data',
    running: 'Running',
    success: 'Success',
    failed: 'Failed'
  },
  dashboard: {
    tools: 'Tools',
    agents: 'Agents',
    runs: 'Runs (24h)',
    errors: 'Errors (24h)'
  },

  // Module translations
  ...commonEn,
  ...chatEn,
  ...avatarEn,
  ...feedEn,
  ...knowledgeBaseEn,
  ...loginOnboardingEn,
  ...profileEn,
  ...smallPagesEn,
  ...playgroundBasicEn,
  ...playgroundChatEn,
  ...chatAnalyzerEn,
  ...playgroundCanvasEn,
  ...playgroundMiscEn,
  ...messagesEn,
  ...aiElementsEn,
  ...planEn,
  ...toolComponentsEn,
  ...standaloneComponentsEn,
  ...homeWelcomeEn,
  ...miscComponentsEn,
  ...storeSessionEn,
  ...storeFeatureEn,
  ...storeChatEn,
  ...storeAuthEn,
  ...uiEventEn,
  ...apiEn,
  ...constantsEn,
  ...thesisWriterEn,
  ...composablesEn,
  ...uiComponentsEn,
}
