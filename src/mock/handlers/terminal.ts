import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody } from '../shared'

// ==================== Types ====================

interface CommandParam {
  name: string
  type: string
  required: boolean
  description: string
  options?: string[]
}

interface Command {
  name: string
  description: string
  aliases: string[]
  category: string
  permission: string
  enabled: boolean
  visible: boolean
  parameters: CommandParam[]
  examples: string[]
  version: string
  createdTime: string
  updatedTime: string
}

// ==================== Mock Data ====================

const NOW = '2026-03-01T00:00:00Z'

function cmd(
  name: string,
  description: string,
  opts: {
    aliases?: string[]
    category?: string
    permission?: string
    enabled?: boolean
    visible?: boolean
    parameters?: CommandParam[]
    examples?: string[]
  } = {},
): Command {
  return {
    name,
    description,
    aliases: opts.aliases ?? [],
    category: opts.category ?? 'system',
    permission: opts.permission ?? 'public',
    enabled: opts.enabled ?? true,
    visible: opts.visible ?? true,
    parameters: opts.parameters ?? [],
    examples: opts.examples ?? [`/${name}`],
    version: '1.0.0',
    createdTime: NOW,
    updatedTime: NOW,
  }
}

function p(name: string, description: string, required = false, options?: string[]): CommandParam {
  return { name, type: 'string', required, description, ...(options ? { options } : {}) }
}

const mockCommands: Command[] = [
  cmd('help', '显示所有可用命令', {
    aliases: ['h', '?'],
    examples: ['/help', '/help status'],
  }),
  cmd('clear', '清空终端屏幕', {
    aliases: ['cls'],
  }),
  cmd('version', '显示系统版本', {
    aliases: ['v'],
    examples: ['/version'],
  }),
  cmd('echo', '回显文本', {
    category: 'utility',
    parameters: [p('text', '要回显的文本', true)],
    examples: ['/echo Hello World', '/echo 你好世界'],
  }),
  cmd('status', '查看系统状态', {
    aliases: ['stat'],
    examples: ['/status'],
  }),
  cmd('model', '查看/切换AI模型', {
    category: 'ai',
    parameters: [p('name', '模型名称')],
    examples: ['/model', '/model gpt-4', '/model qwen-max'],
  }),
  cmd('config', '查看/修改配置', {
    parameters: [p('key', '配置键名'), p('value', '配置值')],
    examples: ['/config', '/config theme dark', '/config language zh-CN'],
  }),
  cmd('search', '搜索对话历史', {
    category: 'utility',
    parameters: [p('query', '搜索关键词', true)],
    examples: ['/search AI模型', '/search 量子计算'],
  }),
  cmd('translate', '翻译文本', {
    category: 'ai',
    parameters: [p('text', '待翻译文本', true), p('target_lang', '目标语言')],
    examples: ['/translate Hello World', '/translate 你好 en'],
  }),
  cmd('calc', '计算数学表达式', {
    category: 'utility',
    parameters: [p('expression', '数学表达式', true)],
    examples: ['/calc 2+3*4', '/calc sqrt(144)', '/calc 3.14*10^2'],
  }),
  cmd('weather', '查询天气', {
    category: 'tool',
    parameters: [p('city', '城市名称')],
    examples: ['/weather', '/weather 北京', '/weather Shanghai'],
  }),
  cmd('time', '显示当前时间', {
    category: 'utility',
    aliases: ['now'],
    examples: ['/time'],
  }),
  cmd('history', '查看命令历史', {
    aliases: ['hist'],
    examples: ['/history'],
  }),
  cmd('export', '导出对话记录', {
    category: 'utility',
    parameters: [p('format', '导出格式', false, ['txt', 'md', 'json'])],
    examples: ['/export', '/export md', '/export json'],
  }),
  cmd('theme', '切换主题', {
    parameters: [p('name', '主题名称', false, ['light', 'dark', 'system'])],
    examples: ['/theme', '/theme dark', '/theme light'],
  }),
]

// ==================== Gateway Execution ====================

function executeCommand(commandName: string, args: string): any {
  switch (commandName) {
    case 'help':
      return {
        output: mockCommands
          .filter((c) => c.visible && c.enabled)
          .map((c) => `  /${c.name.padEnd(12)} ${c.description}`)
          .join('\n'),
        exitCode: 0,
      }

    case 'clear':
      return { output: '', exitCode: 0, action: 'clear' }

    case 'version':
      return {
        output: [
          'VOLO AI v2.1.0',
          `Build: 2026.03.01`,
          'Runtime: Spring Boot 3.4 + Vue 3.5',
          'AI Engine: Spring AI 1.0',
          'Protocol: MCP v1.0',
        ].join('\n'),
        exitCode: 0,
      }

    case 'echo':
      return { output: args || '', exitCode: 0 }

    case 'status':
      return {
        output: JSON.stringify(
          {
            uptime: '3d 12h 45m',
            memory: '45%',
            cpu: '12%',
            activeConnections: 3,
            totalRequests: 15832,
            version: '2.1.0',
            llmModel: 'qwen-max',
            mcpTools: 8,
            agentStrategies: 4,
          },
          null,
          2,
        ),
        exitCode: 0,
      }

    case 'model':
      if (args) {
        return { output: `模型已切换为: ${args}`, exitCode: 0 }
      }
      return {
        output: [
          '当前模型: qwen-max',
          '可用模型:',
          '  - qwen-max (通义千问)',
          '  - gpt-4 (OpenAI)',
          '  - gemini-pro (Google)',
          '  - claude-3-opus (Anthropic)',
          '  - deepseek-v3 (DeepSeek)',
        ].join('\n'),
        exitCode: 0,
      }

    case 'config':
      if (!args) {
        return {
          output: JSON.stringify(
            {
              theme: 'system',
              language: 'zh-CN',
              model: 'qwen-max',
              streamEnabled: true,
              maxTokens: 4096,
              temperature: 0.7,
            },
            null,
            2,
          ),
          exitCode: 0,
        }
      }
      return { output: `配置已更新: ${args}`, exitCode: 0 }

    case 'search':
      return {
        output: args
          ? [
              `搜索 "${args}" 的结果:`,
              '',
              `  [会话 #12] 2026-03-18 - 关于${args}的讨论`,
              `  [会话 #8]  2026-03-15 - ${args}相关问题解答`,
              `  [会话 #3]  2026-03-10 - ${args}学习笔记`,
              '',
              '共找到 3 条相关记录',
            ].join('\n')
          : '请输入搜索关键词',
        exitCode: args ? 0 : 1,
      }

    case 'translate':
      return {
        output: args ? `翻译结果: [Mock] Translation of "${args}"` : '请输入待翻译文本',
        exitCode: args ? 0 : 1,
      }

    case 'calc': {
      if (!args) return { output: '请输入数学表达式', exitCode: 1 }
      try {
        const result = Function(`"use strict"; return (${args})`)()
        return { output: `${args} = ${result}`, exitCode: 0 }
      } catch {
        return { output: `表达式错误: ${args}`, exitCode: 1 }
      }
    }

    case 'weather':
      return {
        output: [
          `${args || '北京'} 天气预报:`,
          '  今天: 晴 18°C ~ 26°C',
          '  明天: 多云 16°C ~ 24°C',
          '  后天: 小雨 14°C ~ 20°C',
          '',
          '  湿度: 45%  风力: 微风',
          '  空气质量: 良 (AQI 68)',
        ].join('\n'),
        exitCode: 0,
      }

    case 'time':
      return {
        output: `当前时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
        exitCode: 0,
      }

    case 'history':
      return {
        output: [
          '命令历史 (最近 10 条):',
          '  1  /status',
          '  2  /model',
          '  3  /help',
          '  4  /weather 北京',
          '  5  /calc 2+3*4',
          '  6  /search AI模型',
          '  7  /time',
          '  8  /config',
          '  9  /theme dark',
          '  10 /version',
        ].join('\n'),
        exitCode: 0,
      }

    case 'export':
      return {
        output: `对话已导出为 ${args || 'txt'} 格式，文件: volo_export_${Date.now()}.${args || 'txt'}`,
        exitCode: 0,
      }

    case 'theme':
      if (args && ['light', 'dark', 'system'].includes(args)) {
        return { output: `主题已切换为: ${args}`, exitCode: 0, action: 'theme', value: args }
      }
      return {
        output: ['当前主题: system', '可选主题: light, dark, system'].join('\n'),
        exitCode: 0,
      }

    default:
      return { output: '命令执行完成', exitCode: 0 }
  }
}

// ==================== Handler ====================

export default function terminalMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // POST /terminal/gateway — execute command
  if (method === 'post' && match('/terminal/gateway', url)) {
    const body = parseBody(config.data)
    const commandName = (body.command || body.name || '').toLowerCase()
    const args = body.args || body.rawArgs || body.text || ''
    const result = executeCommand(commandName, args)
    return ok({
      success: result.exitCode === 0,
      output: result.output,
      metadata: {
        command: commandName,
        executionTime: Math.floor(Math.random() * 100) + 20,
        exitCode: result.exitCode,
        ...(result.action ? { action: result.action, value: result.value } : {}),
      },
    })
  }

  // GET /terminal/commands/visible — must be before /:name
  if (method === 'get' && match('/terminal/commands/visible', url)) {
    return ok(mockCommands.filter((c) => c.visible && c.enabled))
  }

  // PATCH /terminal/commands/:name/toggle — must be before /:name
  if (method === 'patch' && match('/terminal/commands/:name/toggle', url)) {
    const name = param('/terminal/commands/:name/toggle', url, 'name')
    const cmd = mockCommands.find((c) => c.name === name)
    if (cmd) {
      return ok({ ...cmd, enabled: !cmd.enabled })
    }
    return ok(null)
  }

  // GET /terminal/commands/:name
  if (method === 'get' && match('/terminal/commands/:name', url)) {
    const name = param('/terminal/commands/:name', url, 'name')
    return ok(mockCommands.find((c) => c.name === name) || null)
  }

  // PUT /terminal/commands/:name
  if (method === 'put' && match('/terminal/commands/:name', url)) {
    const name = param('/terminal/commands/:name', url, 'name')
    const body = parseBody(config.data)
    const existing = mockCommands.find((c) => c.name === name)
    return ok({ ...existing, ...body, updatedTime: new Date().toISOString() })
  }

  // DELETE /terminal/commands/:name
  if (method === 'delete' && match('/terminal/commands/:name', url)) {
    return ok(null)
  }

  // POST /terminal/commands — create
  if (method === 'post' && match('/terminal/commands', url)) {
    const body = parseBody(config.data)
    const now = new Date().toISOString()
    return ok({
      name: body.name || 'new-command',
      description: body.description || '',
      aliases: body.aliases || [],
      category: body.category || 'utility',
      permission: body.permission || 'public',
      enabled: true,
      visible: true,
      parameters: body.parameters || [],
      examples: body.examples || [],
      version: '1.0.0',
      createdTime: now,
      updatedTime: now,
    })
  }

  // GET /terminal/commands — list all
  if (method === 'get' && match('/terminal/commands', url)) {
    return ok(mockCommands)
  }

  return null
}
