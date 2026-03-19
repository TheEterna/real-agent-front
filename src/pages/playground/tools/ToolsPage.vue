<template>
  <div class="tools-page h-[100dvh] sm:h-screen w-full bg-background flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between h-14 px-6 bg-card border-b border-border shrink-0">
      <h1 class="text-lg font-semibold text-foreground">{{ t("toolsHub.title") }}</h1>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" :size="14" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('toolsHub.searchPlaceholder')"
            class="w-60 pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <button
          :aria-label="t('toolsHub.refreshTooltip')"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50 active:scale-95"
          @click="refreshTools"
        >
          <Settings :size="14" :class="{ 'animate-spin': loading }" />
          <span>{{ t('toolsHub.refreshTooltip') }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-8 space-y-8">
      <!-- MCP TOOLS Section -->
      <section>
        <h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{{ t("toolsHub.mcpServers") }}</h2>
        <div class="flex gap-6 h-[340px]">
          <!-- Server List -->
          <div class="w-[360px] shrink-0 space-y-2 overflow-y-auto pr-2">
            <div
              v-for="server in mcpServers"
              :key="server.name"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all"
              :class="selectedMcpServer === server.name
                ? 'bg-primary/5 border-primary/20 text-foreground'
                : 'bg-card border-border text-foreground hover:bg-muted/50'"
              role="button"
              tabindex="0"
              :aria-label="server.name"
              @click="selectedMcpServer = selectedMcpServer === server.name ? '' : server.name"
              @keydown.enter="selectedMcpServer = selectedMcpServer === server.name ? '' : server.name"
            >
              <Server :size="16" class="shrink-0 text-muted-foreground" />
              <span class="flex-1 truncate text-sm font-medium">{{ server.name }}</span>
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="server.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'"
              />
            </div>
            <div v-if="mcpServers.length === 0" class="flex flex-col items-center justify-center h-full text-center">
              <Server :size="32" class="mb-3 text-muted-foreground/30" />
              <p class="text-sm text-muted-foreground">{{ t("toolsHub.noMcpServers") }}</p>
            </div>
          </div>
          <!-- MCP Tools Grid -->
          <div class="flex-1 overflow-y-auto pr-2">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div
                v-for="tool in mcpTools"
                :key="tool.name"
                class="bg-card rounded-xl border border-border p-4 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                role="button"
                tabindex="0"
                :aria-label="tool.name"
                @click="openToolDetail(tool)"
                @keydown.enter="openToolDetail(tool)"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                    :class="getToolIconBg(tool.category)"
                  >
                    <component :is="getToolIcon(tool.category)" :size="18" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{{ tool.name }}</h3>
                    <p class="text-xs text-muted-foreground line-clamp-2 mt-1">{{ tool.description }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                    MCP
                  </span>
                  <button
                    v-if="!isToolInstalled(tool.name)"
                    class="text-xs text-primary hover:text-primary/80 font-medium"
                    @click.stop="installTool(tool)"
                  >
                    + {{ t('toolsHub.install') }}
                  </button>
                  <span v-else class="text-xs text-green-600 flex items-center gap-1">
                    <Check :size="12" />
                    {{ t('toolsHub.installed') }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="mcpTools.length === 0" class="flex flex-col items-center justify-center h-full text-center">
              <Package :size="32" class="mb-3 text-muted-foreground/30" />
              <p class="text-sm text-muted-foreground">{{ t("toolsHub.noMcpTools") }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- SYSTEM TOOLS Section -->
      <section>
        <h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{{ t('toolsHub.allTools') }}</h2>
        <!-- Category Pills -->
        <div class="flex gap-1 mb-4 flex-wrap">
          <button
            v-for="category in categories"
            :key="category.key"
            class="px-4 py-1.5 rounded-full text-sm transition-all active:scale-95"
            :class="selectedCategory === category.key
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
            @click="selectedCategory = category.key"
          >
            {{ category.label }}
          </button>
        </div>
        <!-- System Tools Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <div
            v-for="tool in filteredSystemTools"
            :key="tool.name"
            class="bg-card rounded-xl border border-border p-4 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            role="button"
            tabindex="0"
            :aria-label="tool.name"
            @click="openToolDetail(tool)"
            @keydown.enter="openToolDetail(tool)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                :class="getToolIconBg(tool.category)"
              >
                <component :is="getToolIcon(tool.category)" :size="18" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{{ tool.name }}</h3>
                <p class="text-xs text-muted-foreground line-clamp-2 mt-1">{{ tool.description }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                SYSTEM
              </span>
              <div class="flex items-center gap-2">
                <ASwitch
                  v-model:checked="tool.isActive"
                  :disabled="tool.type === 'SYSTEM'"
                  size="small"
                  @click.stop
                  @change="toggleToolStatus(tool)"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredSystemTools.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <Package :size="48" class="mb-4 text-muted-foreground/30" />
          <p class="text-sm text-muted-foreground">{{ t("toolsHub.noSystemTools") }}</p>
        </div>
      </section>
    </main>

    <!-- Tool Detail Drawer -->
    <ADrawer
      v-model:open="drawerVisible"
      :title="selectedTool?.name"
      placement="right"
      :width="480"
    >
      <template v-if="selectedTool">
        <div class="space-y-6">
          <!-- Tool Header -->
          <div class="flex items-start gap-4">
            <div
              class="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
              :class="getToolIconBg(selectedTool.category)"
            >
              <component :is="getToolIcon(selectedTool.category)" :size="28" />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-foreground">{{ selectedTool.name }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="selectedTool.type === 'SYSTEM'
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'"
                >
                  {{ selectedTool.type }}
                </span>
                <span class="text-xs text-muted-foreground">{{ selectedTool.category }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <h3 class="text-sm font-medium text-foreground mb-2">{{ t("toolsHub.description") }}</h3>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ selectedTool.description }}</p>
          </div>

          <!-- Input Schema -->
          <div v-if="selectedTool.inputSchema">
            <h3 class="text-sm font-medium text-foreground mb-2">{{ t("toolsHub.inputParams") }}</h3>
            <div class="bg-muted rounded-lg p-4 overflow-x-auto">
              <pre class="text-xs text-muted-foreground">{{ JSON.stringify(selectedTool.inputSchema, null, 2) }}</pre>
            </div>
          </div>

          <!-- MCP Info -->
          <div v-if="selectedTool.type === 'MCP' && selectedTool.mcpInfo">
            <h3 class="text-sm font-medium text-foreground mb-2">{{ t("toolsHub.mcpInfo") }}</h3>
            <div class="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">{{ t('toolsHub.server') }}</span>
                <span class="text-cyan-700 dark:text-cyan-400 font-medium">{{ selectedTool.mcpInfo.server }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">{{ t('toolsHub.client') }}</span>
                <span class="text-cyan-700 dark:text-cyan-400 font-medium">{{ selectedTool.mcpInfo.client }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-border">
            <button
              v-if="!isToolInstalled(selectedTool.name)"
              class="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors active:scale-95"
              @click="installTool(selectedTool); drawerVisible = false"
            >
              {{ t("toolsHub.installToInventory") }}
            </button>
            <button
              v-else
              class="flex-1 py-2.5 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors active:scale-95"
              @click="uninstallTool(selectedTool); drawerVisible = false"
            >
              {{ t("toolsHub.removeFromInventory") }}
            </button>
          </div>
        </div>
      </template>
    </ADrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Switch as ASwitch, Drawer as ADrawer } from 'ant-design-vue'
import {
  Wrench,
  Search,
  Server,
  Check,
  Package,
  Settings,
  Globe,
  Database,
  Brain,
  FileText,
  Code,
  MessageSquare,
  Layers
} from 'lucide-vue-next'
// Tooltip retained for potential future use in drawer
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import http from '@/services/http'

const { t } = useI18n()

// State
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedMcpServer = ref('')
const drawerVisible = ref(false)
const selectedTool = ref<Tool | null>(null)

// Types
interface Tool {
  id?: string
  name: string
  description: string
  type: 'SYSTEM' | 'MCP'
  category: string
  inputSchema?: Record<string, unknown>
  mcpInfo?: {
    server: string
    client: string
  }
  isActive: boolean
  usageCount?: number
}

interface McpServer {
  name: string
  url: string
  isActive: boolean
}

// Data
const allTools = ref<Tool[]>([])
const installedToolNames = ref<Set<string>>(new Set())
const mcpServers = ref<McpServer[]>([])

const categories = [
  { key: 'all', label: t('toolsHub.categoryAll'), icon: Layers },
  { key: 'web', label: t('toolsHub.categoryWeb'), icon: Globe },
  { key: 'data', label: t('toolsHub.categoryData'), icon: Database },
  { key: 'ai', label: t('toolsHub.categoryAi'), icon: Brain },
  { key: 'document', label: t('toolsHub.categoryDocument'), icon: FileText },
  { key: 'code', label: t('toolsHub.categoryCode'), icon: Code },
  { key: 'chat', label: t('toolsHub.categoryChat'), icon: MessageSquare }
]

// Computed
const mcpTools = computed(() => {
  let tools = allTools.value.filter(t => t.type === 'MCP')

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }

  if (selectedMcpServer.value) {
    tools = tools.filter(t => t.mcpInfo?.server === selectedMcpServer.value)
  }

  return tools
})

const filteredSystemTools = computed(() => {
  let tools = allTools.value.filter(t => t.type === 'SYSTEM')

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value !== 'all') {
    tools = tools.filter(t => t.category === selectedCategory.value)
  }

  return tools
})

const installedTools = computed(() => {
  return allTools.value.filter(t => installedToolNames.value.has(t.name))
})

// Methods
const getCategoryCount = (category: string) => {
  if (category === 'all') return allTools.value.length
  return allTools.value.filter(t => t.category === category).length
}

const getToolIconBg = (category: string) => {
  const bgMap: Record<string, string> = {
    web: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    data: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    ai: 'bg-gradient-to-br from-amber-500 to-orange-500',
    document: 'bg-gradient-to-br from-green-500 to-emerald-500',
    code: 'bg-gradient-to-br from-slate-600 to-slate-800',
    chat: 'bg-gradient-to-br from-pink-500 to-rose-500'
  }
  return bgMap[category] || 'bg-gradient-to-br from-teal-500 to-cyan-500'
}

const getToolIcon = (category: string) => {
  const iconMap: Record<string, typeof Globe> = {
    web: Globe,
    data: Database,
    ai: Brain,
    document: FileText,
    code: Code,
    chat: MessageSquare
  }
  return iconMap[category] || Wrench
}

const isToolInstalled = (name: string) => {
  return installedToolNames.value.has(name)
}

const installTool = (tool: Tool) => {
  installedToolNames.value.add(tool.name)
  message.success(t('toolsHub.installedTool', { name: tool.name }))
  // 持久化到 localStorage
  saveInstalledTools()
}

const uninstallTool = (tool: Tool) => {
  if (tool.type === 'SYSTEM') {
    message.warning(t('toolsHub.systemToolCannotUninstall'))
    return
  }
  installedToolNames.value.delete(tool.name)
  message.success(t('toolsHub.uninstalledTool', { name: tool.name }))
  saveInstalledTools()
}

const toggleToolStatus = async (tool: Tool) => {
  try {
    // 调用后端 API 更新工具状态
    // await http.patch(`/api/tools/${tool.name}/status`, { isActive: tool.isActive })
    message.success(tool.isActive ? t('toolsHub.enabledTool', { name: tool.name }) : t('toolsHub.disabledTool', { name: tool.name }))
  } catch {
    message.error(t('toolsHub.statusUpdateFailed'))
    tool.isActive = !tool.isActive
  }
}

const openToolDetail = (tool: Tool) => {
  selectedTool.value = tool
  drawerVisible.value = true
}

const saveInstalledTools = () => {
  localStorage.setItem('volo_installed_tools', JSON.stringify(Array.from(installedToolNames.value)))
}

const loadInstalledTools = () => {
  const saved = localStorage.getItem('volo_installed_tools')
  if (saved) {
    installedToolNames.value = new Set(JSON.parse(saved))
  }
}

const refreshTools = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const response = await http.get('/api/tools_refresh')
    if (response.data?.data) {
      allTools.value = response.data.data.map((t: Record<string, unknown>) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        type: t.type || 'SYSTEM',
        category: mapCategory(t.category as string),
        inputSchema: t.inputSchema,
        mcpInfo: t.mcpServer ? { server: t.mcpServer, client: t.mcpClient } : undefined,
        isActive: t.isActive ?? true
      }))

      // 提取 MCP 服务器列表
      const servers = new Map<string, McpServer>()
      allTools.value.forEach(t => {
        if (t.mcpInfo?.server && !servers.has(t.mcpInfo.server)) {
          servers.set(t.mcpInfo.server, {
            name: t.mcpInfo.server,
            url: '',
            isActive: true
          })
        }
      })
      mcpServers.value = Array.from(servers.values())
    }
    message.success(t('toolsHub.refreshed'))
  } catch {
    message.error(t('toolsHub.refreshFailed'))
  } finally {
    loading.value = false
  }
}

const mapCategory = (category: string | undefined): string => {
  if (!category) return 'ai'
  const categoryMap: Record<string, string> = {
    'TOOL_SYSTEM': 'ai',
    'TOOL_WEB': 'web',
    'TOOL_DATA': 'data',
    'TOOL_DOCUMENT': 'document',
    'TOOL_CODE': 'code'
  }
  return categoryMap[category] || 'ai'
}

// Lifecycle
onMounted(async () => {
  loadInstalledTools()
  await refreshTools()

  // 系统工具默认安装
  allTools.value.forEach(t => {
    if (t.type === 'SYSTEM') {
      installedToolNames.value.add(t.name)
    }
  })
  saveInstalledTools()
})
</script>

<style scoped>
/* Custom scrollbar */
main::-webkit-scrollbar,
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

main::-webkit-scrollbar-thumb,
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

main::-webkit-scrollbar-thumb:hover,
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>

<style lang="scss">
.dark {
  .tools-page main::-webkit-scrollbar-thumb,
  .tools-page .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(161, 161, 170, 0.2);
  }

  .tools-page main::-webkit-scrollbar-thumb:hover,
  .tools-page .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(161, 161, 170, 0.4);
  }
}
</style>
