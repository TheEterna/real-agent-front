/**
 * 极客模式终端命令存储
 * 简单的命令定义和管理，去除过度设计
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '@/i18n'
const { t } = i18n.global

// 简化的命令接口
export interface SimpleCommand {
  name: string
  aliases?: string[]
  description: string
  usage: string
  parameters?: SimpleParameter[]
  examples?: string[]
  category: 'system' | 'ai' | 'file' | 'connection'
}

export interface SimpleParameter {
  name: string
  required: boolean
  description: string
  shortFlag?: string
  longFlag?: string
  defaultValue?: any
}

// 解析结果 - 匹配后端 TerminalCommandRequest
export interface ParsedCommand {
  original: string      // 原始输入
  command: string       // 命令名称（不含 /）
  options: string[]     // 选项参数列表（--开头的参数）
  arguments: string[]   // 普通参数列表
}

// 简化的错误类型
export interface ParseError {
  message: string
  suggestion?: string
}

export const useTerminalStore = defineStore('terminal', () => {
  // 命令列表（computed 以响应语言切换）
  const commands = computed<SimpleCommand[]>(() => [
    // 系统控制命令
    {
      name: 'help',
      aliases: ['h', '?'],
      description: t('storeTerminal.helpDesc'),
      usage: t('storeTerminal.helpUsage'),
      examples: ['help', 'help connect'],
      category: 'system',
      parameters: [
        {
          name: 'command',
          required: false,
          description: t('storeTerminal.helpParamCommand')
        }
      ]
    },

    {
      name: 'clear',
      aliases: ['cls'],
      description: t('storeTerminal.clearDesc'),
      usage: t('storeTerminal.clearUsage'),
      category: 'system'
    },

    {
      name: 'history',
      description: t('storeTerminal.historyDesc'),
      usage: t('storeTerminal.historyUsage'),
      examples: ['history', 'history -n 10'],
      category: 'system',
      parameters: [
        {
          name: 'number',
          required: false,
          shortFlag: '-n',
          longFlag: '--number',
          description: t('storeTerminal.historyParamNumber'),
          defaultValue: 20
        }
      ]
    },

    // AI交互命令
    {
      name: 'chat',
      aliases: ['ask'],
      description: t('storeTerminal.chatDesc'),
      usage: t('storeTerminal.chatUsage'),
      examples: ['chat 你好', 'chat 帮我写一个Python函数'],
      category: 'ai',
      parameters: [
        {
          name: 'message',
          required: true,
          description: t('storeTerminal.chatParamMessage')
        }
      ]
    },

    {
      name: 'plan',
      description: t('storeTerminal.planDesc'),
      usage: t('storeTerminal.planUsage'),
      examples: ['plan 学习Vue3', 'plan 开发网站 --detail'],
      category: 'ai',
      parameters: [
        {
          name: 'task',
          required: true,
          description: t('storeTerminal.planParamTask')
        },
        {
          name: 'detail',
          required: false,
          longFlag: '--detail',
          description: t('storeTerminal.planParamDetail'),
          defaultValue: false
        }
      ]
    },

    // 连接命令
    {
      name: 'connect',
      description: t('storeTerminal.connectDesc'),
      usage: t('storeTerminal.connectUsage'),
      examples: [
        'connect example.com',
        'connect 192.168.1.100 --port 2222 --user admin'
      ],
      category: 'connection',
      parameters: [
        {
          name: 'server',
          required: true,
          description: t('storeTerminal.connectParamServer')
        },
        {
          name: 'port',
          required: false,
          longFlag: '--port',
          description: t('storeTerminal.connectParamPort'),
          defaultValue: 22
        },
        {
          name: 'user',
          required: false,
          longFlag: '--user',
          description: t('storeTerminal.connectParamUser')
        }
      ]
    },

    {
      name: 'disconnect',
      description: t('storeTerminal.disconnectDesc'),
      usage: t('storeTerminal.disconnectUsage'),
      category: 'connection'
    },

    // 文件操作命令
    {
      name: 'ls',
      aliases: ['dir'],
      description: t('storeTerminal.lsDesc'),
      usage: t('storeTerminal.lsUsage'),
      examples: ['ls', 'ls /home', 'ls -la'],
      category: 'file',
      parameters: [
        {
          name: 'path',
          required: false,
          description: t('storeTerminal.lsParamPath'),
          defaultValue: '.'
        },
        {
          name: 'long',
          required: false,
          shortFlag: '-l',
          description: t('storeTerminal.lsParamLong'),
          defaultValue: false
        },
        {
          name: 'all',
          required: false,
          shortFlag: '-a',
          description: t('storeTerminal.lsParamAll'),
          defaultValue: false
        }
      ]
    },

    {
      name: 'pwd',
      description: t('storeTerminal.pwdDesc'),
      usage: t('storeTerminal.pwdUsage'),
      category: 'file'
    },

    {
      name: 'cat',
      description: t('storeTerminal.catDesc'),
      usage: t('storeTerminal.catUsage'),
      examples: ['cat readme.txt', 'cat /etc/hosts'],
      category: 'file',
      parameters: [
        {
          name: 'file',
          required: true,
          description: t('storeTerminal.catParamFile')
        }
      ]
    }
  ])

  // 计算属性：按分类分组的命令
  const commandsByCategory = computed(() => {
    const grouped: Record<string, SimpleCommand[]> = {
      system: [],
      ai: [],
      file: [],
      connection: []
    }

    commands.value.forEach(cmd => {
      grouped[cmd.category].push(cmd)
    })

    return grouped
  })

  // 获取单个命令
  const getCommand = (name: string): SimpleCommand | undefined => {
    return commands.value.find(cmd =>
      cmd.name === name.toLowerCase() ||
      cmd.aliases?.includes(name.toLowerCase())
    )
  }

  // 获取所有命令
  const getAllCommands = (): SimpleCommand[] => {
    return commands.value
  }

  // 获取命令建议（用于自动补全）
  const getCommandSuggestions = (query: string): SimpleCommand[] => {
    if (!query) return commands.value

    const lowerQuery = query.toLowerCase()

    return commands.value.filter(cmd => {
      // 匹配命令名称
      if (cmd.name.toLowerCase().includes(lowerQuery)) return true

      // 匹配别名
      if (cmd.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery))) return true

      return false
    }).sort((a, b) => {
      // 精确匹配优先
      const aExact = a.name.toLowerCase() === lowerQuery
      const bExact = b.name.toLowerCase() === lowerQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      // 按名称排序
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * 命令解析 - 新规则
   * 1. 命令部分：必须在开头，只能有一个（如 /plan）
   * 2. 选项参数：--开头，有多个时只取第一个
   * 3. 普通参数：其余所有内容作为字符串数组
   * 
   * 示例：
   * /plan --detailed 规划一下 我去马来西亚的旅游
   * => command: "plan", options: ["detailed"], arguments: ["规划一下", "我去马来西亚的旅游"]
   * 
   * /plan 规划一下 --detailed 我去马来西亚的旅游
   * => command: "plan", options: ["detailed"], arguments: ["规划一下", "我去马来西亚的旅游"]
   */
  const parseCommand = (input: string): { command?: ParsedCommand; error?: ParseError } => {
    const trimmed = input.trim()
    if (!trimmed) {
      return { error: { message: t('storeTerminal.emptyInput') } }
    }

    if (!trimmed.startsWith('/')) {
      return {
        error: {
          message: t('storeTerminal.mustStartWithSlash'),
          suggestion: t('storeTerminal.trySuggestion', { input: trimmed })
        }
      }
    }

    const withoutPrefix = trimmed.slice(1)
    if (!withoutPrefix) {
      return { error: { message: t('storeTerminal.emptyCommandName') } }
    }

    // 按空格分词
    const tokens = withoutPrefix.split(/\s+/).filter(tk => tk.length > 0)
    if (tokens.length === 0) {
      return { error: { message: t('storeTerminal.invalidFormat') } }
    }

    // 1. 提取命令名称（第一个token）
    const commandName = tokens[0]
    const command = getCommand(commandName)

    if (!command) {
      const suggestions = getCommandSuggestions(commandName)
      const suggestion = suggestions.length > 0
        ? t('storeTerminal.didYouMean', { name: suggestions[0].name })
        : undefined

      return {
        error: {
          message: t('storeTerminal.unknownCommand', { name: commandName }),
          suggestion
        }
      }
    }

    // 2. 解析选项和参数
    const options: string[] = []
    const args: string[] = []
    let firstOptionFound = false

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i]
      
      if (token.startsWith('--')) {
        // 选项参数：只取第一个
        if (!firstOptionFound) {
          const optionName = token.substring(2) // 去掉 --
          if (optionName) {
            options.push(optionName)
            firstOptionFound = true
          }
        }
        // 后续的选项参数被忽略
      } else {
        // 普通参数
        args.push(token)
      }
    }

    return {
      command: {
        original: input,
        command: commandName,
        options: options,
        arguments: args
      }
    }
  }

  return {
    commands,
    commandsByCategory,
    getCommand,
    getAllCommands,
    getCommandSuggestions,
    parseCommand
  }
})