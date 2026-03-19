import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ErrorMessage from '../ErrorMessage.vue'

const meta = {
  title: 'Business/ErrorMessage',
  component: ErrorMessage,
  tags: ['autodocs'],
  argTypes: {
    collapsible: { control: 'boolean' },
  },
  args: {
    collapsible: true,
  },
} satisfies Meta<typeof ErrorMessage>

export default meta
type Story = StoryObj<typeof meta>

export const TimeoutError: Story = {
  name: '请求超时',
  args: {
    message: {
      type: 'ERROR',
      message: '请求超时：AI 模型响应超过 30 秒 timeout 限制',
      sender: 'VoloAI',
      messageId: 'msg-001',
      startTime: new Date().toISOString(),
    },
  },
}

export const AuthError: Story = {
  name: '认证失败',
  args: {
    message: {
      type: 'ERROR',
      message: 'API authentication 失败：无效的 API Key',
      sender: 'VoloAI',
      messageId: 'msg-002',
      startTime: new Date().toISOString(),
    },
  },
}

export const NetworkError: Story = {
  name: '网络连接错误',
  args: {
    message: {
      type: 'ERROR',
      message: '连接失败 connection refused：无法访问 LLM 服务',
      sender: 'ActionAgent',
      messageId: 'msg-003',
      startTime: new Date().toISOString(),
    },
  },
}

export const ToolError: Story = {
  name: '工具执行错误',
  args: {
    message: {
      type: 'ERROR',
      message: '工具执行异常：WebSearchTool 返回空结果',
      sender: 'ActionAgent',
      messageId: 'msg-004',
      startTime: new Date().toISOString(),
      data: {
        toolName: 'WebSearchTool',
        errorCode: 'TOOL_EXECUTION_FAILED',
        detail: '搜索引擎返回 HTTP 429 Too Many Requests',
      },
    },
  },
}

export const RateLimitError: Story = {
  name: 'API 限流',
  args: {
    message: {
      type: 'ERROR',
      message: 'API rate limit 已达上限，请稍后重试',
      sender: 'VoloAI',
      messageId: 'msg-005',
      startTime: new Date().toISOString(),
    },
  },
}

export const NonCollapsible: Story = {
  name: '不可折叠',
  args: {
    collapsible: false,
    message: {
      type: 'ERROR',
      message: 'LLM 模型返回异常：上下文长度超出限制',
      sender: 'ThinkingAgent',
      messageId: 'msg-006',
      startTime: new Date().toISOString(),
    },
  },
}
