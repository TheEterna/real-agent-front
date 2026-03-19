<template>
  <div class="flex flex-col h-screen bg-background">
    <header class="flex items-center justify-between h-14 px-6 bg-card border-b border-border shrink-0">
      <h1 class="text-lg font-semibold text-foreground">{{ t('tools.title') || 'Tools' }}</h1>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" :size="14" />
          <input v-model="search" :placeholder="t('tools.search')" class="w-60 pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>
        <button class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors" @click="openServerConfig()">
          <Settings :size="14" />
          <span>{{ t('toolsPage.configServer') }}</span>
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-y-auto">
      <!-- MCP Section -->
      <section class="p-6 border-b border-border">
        <h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">MCP</h2>
        <div class="flex gap-6" style="height: 340px">
          <!-- Left: Client tabs + Server list -->
          <div class="w-[360px] shrink-0 flex flex-col">
            <!-- Client tabs as pills -->
            <div class="flex gap-1 mb-3 flex-wrap">
              <button v-for="client in mcpClients" :key="client"
                class="px-3 py-1.5 rounded-lg text-sm transition-colors"
                :class="selectedClient === client ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
                @click="selectedClient = client">
                {{ client }}
              </button>
            </div>
            <!-- Server list -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1">
              <div v-if="loadingList" class="flex items-center justify-center py-8 text-muted-foreground text-sm">{{ t('common.status.loading') }}</div>
              <button v-for="server in (serversByClient[selectedClient] || [])" :key="server"
                class="w-full p-3 rounded-lg border text-left text-sm transition-all"
                :class="selectedServer === server ? 'bg-primary/5 border-primary/30 text-foreground' : 'border-border text-muted-foreground hover:border-primary/20'"
                @click="selectServer(selectedClient, server)">
                <div class="flex items-center gap-2">
                  <ServerIcon :size="14" class="shrink-0" />
                  <span class="font-medium">{{ server }}</span>
                </div>
              </button>
            </div>
          </div>
          <!-- Right: MCP Tools -->
          <div class="flex-1 overflow-y-auto space-y-2 pr-1">
            <div class="text-sm font-medium text-foreground mb-2">
              {{ selectedClient ? (selectedClient + ' / ' + (selectedServer || '')) : 'MCP' }}
            </div>
            <div v-if="loadingList" class="flex items-center justify-center py-8 text-muted-foreground text-sm">{{ t('common.status.loading') }}</div>
            <div v-for="item in mcpToolsForSelected" :key="item.spec.name"
              class="p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all"
              @click="pick(item)">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm text-foreground">{{ item.spec.name }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">MCP</span>
              </div>
              <p class="text-[0.8125rem] text-muted-foreground line-clamp-2">{{ item.spec.description || '' }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- System Section -->
      <section class="p-6">
        <h2 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">System</h2>
        <div class="flex gap-6" style="min-height: 400px">
          <!-- Left: System tools list -->
          <div class="w-1/2 overflow-y-auto space-y-2 pr-1">
            <div v-if="loadingList" class="flex items-center justify-center py-8 text-muted-foreground text-sm">{{ t('common.status.loading') }}</div>
            <div v-for="item in systemItems" :key="item.spec.name"
              class="p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all"
              @click="pick(item)">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-sm text-foreground">{{ item.spec.name }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{{ item.spec.category || 'system' }}</span>
              </div>
              <p class="text-[0.8125rem] text-muted-foreground line-clamp-2">{{ item.spec.description || '' }}</p>
            </div>
          </div>
          <!-- Right: Executor panel -->
          <div class="w-1/2 space-y-4">
            <ASelect v-model:value="exec.toolName" :placeholder="t('tools.selectTool')" class="w-full">
              <SelectOption v-for="ti in items" :key="ti.id" :value="ti.spec.name">
                <template v-if="isMcp(ti)">
                  {{ ti.spec.name }} ({{ ti.spec.mcpToolSpec?.server }} / {{ ti.spec.mcpToolSpec?.client }})
                </template>
                <template v-else>
                  {{ ti.spec.name }} (system)
                </template>
              </SelectOption>
            </ASelect>

            <!-- 基于工具的 inputSchema 动态渲染参数表单；若没有schema，则回退为JSON文本框 -->
            <template v-if="currentSchema">
              <AForm layout="vertical">
                <template v-for="(prop, key) in (currentSchema.properties || {})" :key="String(key)">
                  <FormItem :label="renderLabel(String(key), prop)" :required="isRequired(String(key))">
                    <template v-if="prop.type === 'string'">
                      <AInput v-model:value="exec.argsObj[key]" :placeholder="prop.description || ''" allow-clear />
                    </template>
                    <template v-else-if="prop.type === 'number' || prop.type === 'integer'">
                      <InputNumber v-model:value="exec.argsObj[key]" :placeholder="prop.description || ''" :style="{ width: '100%' }" />
                    </template>
                    <template v-else-if="prop.type === 'boolean'">
                      <ASwitch v-model:checked="exec.argsObj[key]" />
                    </template>
                    <template v-else-if="prop.type === 'object'">
                      <div class="p-3 rounded-lg border border-border space-y-3 mb-2">
                        <div class="text-sm font-medium text-foreground">{{ prop.title ? (prop.title + ' ('+ String(key) +')') : String(key) }}</div>
                        <template v-if="prop.properties">
                          <template v-for="(subProp, subKey) in prop.properties" :key="String(subKey)">
                            <FormItem :label="renderLabel(String(subKey), subProp)" :required="isRequiredIn(prop, String(subKey))">
                              <template v-if="subProp.type === 'string'">
                                <AInput v-model:value="exec.argsObj[key][subKey]" :placeholder="subProp.description || ''" allow-clear />
                              </template>
                              <template v-else-if="subProp.type === 'number' || subProp.type === 'integer'">
                                <InputNumber v-model:value="exec.argsObj[key][subKey]" :placeholder="subProp.description || ''" :style="{ width: '100%' }" />
                              </template>
                              <template v-else-if="subProp.type === 'boolean'">
                                <ASwitch v-model:checked="exec.argsObj[key][subKey]" />
                              </template>
                              <template v-else>
                                <AInput v-model:value="exec.argsObj[key][subKey]" :placeholder="subProp.description || ''" allow-clear />
                              </template>
                              <div v-if="subProp.description" class="text-[0.8125rem] text-muted-foreground mt-1">{{ subProp.description }}</div>
                            </FormItem>
                          </template>
                        </template>
                        <template v-else>
                          <ATextarea v-model:value="exec.argsObj[key]" :rows="4" :placeholder="(prop.description || '') + ' (JSON)'" />
                        </template>
                      </div>
                    </template>
                    <template v-else>
                      <AInput v-model:value="exec.argsObj[key]" :placeholder="prop.description || ''" allow-clear />
                    </template>
                    <div v-if="prop.description" class="text-[0.8125rem] text-muted-foreground mt-1">{{ prop.description }}</div>
                  </FormItem>
                </template>
              </AForm>
            </template>
            <template v-else>
              <ATextarea v-model:value="exec.argsText" :rows="8" :placeholder="t('tools.toolArgs')"/>
            </template>
            <div class="flex items-center gap-3">
              <AButton type="primary" :loading="executing" @click="onExecute">{{ t('tools.execute') }}</AButton>
              <AButton @click="onReset">{{ t('tools.reset') }}</AButton>
            </div>

            <ToolResultViewer
              v-if="resultRaw"
              :tool-name="exec.toolName"
              :args="safeArgs"
              :raw="resultRaw"
              :loading="executing"
            />
          </div>
        </div>
      </section>
    </main>

    <!-- 服务器配置 Modal -->
    <AModal v-model:open="serverConfigVisible" :title="t('toolsPage.modalTitle', { client: selectedClient || '' })" :footer="null">
      <p class="text-base text-muted-foreground mb-4">{{ t('toolsPage.modalDesc') }}</p>
      <div class="space-y-2">
        <div v-for="srv in currentServers" :key="srv" class="flex items-center gap-2 p-2 rounded-lg border border-border text-sm">
          <span class="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">server</span>
          <span class="text-foreground">{{ srv }}</span>
        </div>
      </div>
      <div class="border-t border-border my-4"></div>
      <AInput :placeholder="t('toolsPage.newServerPlaceholder')" disabled/>
      <AButton type="dashed" block disabled style="margin-top:8px">{{ t('toolsPage.addServerBtn') }}</AButton>
    </AModal>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  Button as AButton, Modal as AModal, Input as AInput, InputNumber,
  Form as AForm, FormItem,
  Switch as ASwitch, Select as ASelect, SelectOption,
  Textarea as ATextarea
} from 'ant-design-vue'
import { Search, Server as ServerIcon, Settings } from 'lucide-vue-next'
import {listTools, executeTool, type ToolListItem} from '@/services/tools'
import ToolResultViewer from '@/components/ToolResultViewer.vue'

const {t} = useI18n()
const items = ref<ToolListItem[]>([])
const loadingList = ref(false)
const search = ref('')

const exec = ref<{ toolName?: string; argsText: string; argsObj: Record<string, any> }>({argsText: '{"": ""}', argsObj: {}})
const executing = ref(false)
const resultRaw = ref<any>(null)

onMounted(async () => {
  try {
    loadingList.value = true
    items.value = await listTools()
    console.log('items', items.value)
  } catch (e) {
    console.warn(e)
  } finally {
    loadingList.value = false
  }
})

// —— 动态表单（基于 inputSchema） ——
const currentTool = computed<ToolListItem | undefined>(() => items.value.find(it => it.spec.name === exec.value.toolName))
const currentSchema = computed<any | null>(() => {
  const raw = currentTool.value?.spec?.inputSchema
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
})
const isRequired = (key: string) => Array.isArray(currentSchema.value?.required) && currentSchema.value.required.includes(key)
const renderLabel = (key: string, prop: any) => {
  const title = prop?.title ? `${prop.title} (${key})` : key
  return title
}

watch(currentSchema, (schema) => {
  // 初始化/重置 form 模型
  const next: Record<string, any> = {}
  const props = schema?.properties || {}
  Object.keys(props).forEach(k => {
    const p = props[k]
    // 简单默认值：string -> '', number/integer -> undefined, boolean -> false, object -> {}
    if (p?.type === 'string') next[k] = ''
    else if (p?.type === 'number' || p?.type === 'integer') next[k] = undefined
    else if (p?.type === 'boolean') next[k] = false
    else if (p?.type === 'object') next[k] = {}
    else next[k] = ''
  })
  exec.value.argsObj = next
  // 同步生成示例 JSON（方便复制/回退）
  try { exec.value.argsText = JSON.stringify(next, null, 2) } catch {}
}, { immediate: true })

function isRequiredIn(parentProp: any, key: string) {
  const req = parentProp?.required
  return Array.isArray(req) && req.includes(key)
}

function buildArgsFromSchema(): any {
  const schema = currentSchema.value
  if (!schema) return null
  const props = schema.properties || {}
  const out: Record<string, any> = {}
  for (const k of Object.keys(props)) {
    const p = props[k]
    let v = exec.value.argsObj[k]
    if (v === undefined || v === null || v === '') {
      if (isRequired(k)) throw new Error(t('toolsPage.missingParam', { key: k }))
      continue
    }
    if (p.type === 'number' || p.type === 'integer') {
      const num = typeof v === 'number' ? v : Number(v)
      if (Number.isNaN(num)) throw new Error(t('toolsPage.paramNeedNumber', { key: k }))
      v = num
    } else if (p.type === 'boolean') {
      v = Boolean(v)
    } else if (p.type === 'object') {
      if (p.properties) {
        const childOut: Record<string, any> = {}
        for (const subKey of Object.keys(p.properties)) {
          const subProp = p.properties[subKey]
          let sv = v ? v[subKey] : undefined
          if (sv === undefined || sv === null || sv === '') {
            if (isRequiredIn(p, subKey)) throw new Error(t('toolsPage.missingParam', { key: `${k}.${subKey}` }))
            continue
          }
          if (subProp.type === 'number' || subProp.type === 'integer') {
            const num2 = typeof sv === 'number' ? sv : Number(sv)
            if (Number.isNaN(num2)) throw new Error(t('toolsPage.paramNeedNumber', { key: `${k}.${subKey}` }))
            sv = num2
          } else if (subProp.type === 'boolean') {
            sv = Boolean(sv)
          } else if (subProp.type === 'object') {
            // 仅处理两级，若还有更深层，作为原值传递（或可选: 解析字符串为对象）
            if (typeof sv === 'string') {
              try { sv = sv ? JSON.parse(sv) : {} } catch { throw new Error(t('toolsPage.paramNeedJson', { key: `${k}.${subKey}` })) }
            }
          }
          childOut[subKey] = sv
        }
        v = childOut
      } else {
        // 无属性定义时，接受 JSON 文本
        if (typeof v === 'string') {
          try { v = v ? JSON.parse(v) : {} } catch (e) { throw new Error(t('toolsPage.paramNeedJson', { key: k })) }
        }
      }
    }
    out[k] = v
  }
  return out
}

async function onExecute() {
  if (!exec.value.toolName) {
    // 简单提示，结果区显示错误
    resultRaw.value = {ok: false, message: t('tools.noToolSelected')}
    return
  }
  let args: any = {}
  if (currentSchema.value) {
    try { args = buildArgsFromSchema() } catch (e) {
      resultRaw.value = { ok: false, message: (e as Error).message }
      return
    }
  } else {
    try { args = exec.value.argsText ? JSON.parse(exec.value.argsText) : {} } catch (e) {
      resultRaw.value = {ok: false, message: t('tools.invalidJson') + ': ' + (e as Error).message}
      return
    }
  }
  executing.value = true
  try {
    const res = await executeTool({toolName: exec.value.toolName!, args})
    resultRaw.value = res
  } catch (e) {
    resultRaw.value = {ok: false, message: t('tools.execError') + ': ' + (e as Error).toString()}
  } finally {
    executing.value = false
  }
}

function onReset() {
  if (currentSchema.value) {
    const init: Record<string, any> = {}
    const props = currentSchema.value.properties || {}
    Object.keys(props).forEach(k => {
      const p = props[k]
      if (p?.type === 'string') init[k] = ''
      else if (p?.type === 'number' || p?.type === 'integer') init[k] = undefined
      else if (p?.type === 'boolean') init[k] = false
      else if (p?.type === 'object') init[k] = {}
      else init[k] = ''
    })
    exec.value.argsObj = init
    try { exec.value.argsText = JSON.stringify(init, null, 2) } catch {}
  } else {
    exec.value = {argsText: '{"": ""}', argsObj: {}}
  }
  resultRaw.value = null
}

function pick(item: ToolListItem) {
  exec.value.toolName = item.spec.name
  // 若 schema 存在，可给出示例（此处仅放空模板，后续可增强）
}

const filteredItems = computed(() => {
  const q = (search.value || '').toLowerCase()
  if (!q) return items.value
  return items.value.filter(it => (it.spec.name || '').toLowerCase().includes(q) || (it.spec.description || '').toLowerCase().includes(q))
})

const safeArgs = computed(() => {
  if (currentSchema.value) return exec.value.argsObj
  try { return exec.value.argsText ? JSON.parse(exec.value.argsText) : {} } catch { return {} }
})

function isMcp(item: ToolListItem) {
  return (item.spec.category === 'MCP')
}

const mcpItems = computed(() => filteredItems.value.filter(it => isMcp(it)))
const systemItems = computed(() => filteredItems.value.filter(it => !isMcp(it)))

// -------- MCP 分组：client -> servers -> tools --------
const mcpClients = computed<string[]>(() => {
  const set = new Set<string>()
  for (const it of mcpItems.value) {
    const c = it.spec.mcpToolSpec?.client
    if (c) set.add(c)
  }
  return Array.from(set)
})

const serversByClient = computed<Record<string, string[]>>(() => {
  const map: Record<string, Set<string>> = {}
  for (const it of mcpItems.value) {
    const c = it.spec.mcpToolSpec?.client
    const s = it.spec.mcpToolSpec?.server
    if (!c || !s) continue
    if (!map[c]) map[c] = new Set<string>()
    map[c].add(s)
  }
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(map)) out[k] = Array.from(v)
  return out
})

const selectedClient = ref<string | undefined>(undefined)
const selectedServer = ref<string | undefined>(undefined)
const serverConfigVisible = ref(false)

// 初始化/联动选中项
onMounted(() => {
  if (!selectedClient.value && mcpClients.value.length) {
    selectedClient.value = mcpClients.value[0]
  }
  if (!selectedServer.value && selectedClient.value) {
    const servers = serversByClient.value[selectedClient.value] || []
    selectedServer.value = servers[0]
  }
})

// 切换 client 时，重置 server
function selectServer(client: string, server: string) {
  selectedClient.value = client
  selectedServer.value = server
}

// 当前选中的 client/server 的 MCP 工具
const mcpToolsForSelected = computed<ToolListItem[]>(() => {
  const c = selectedClient.value
  const s = selectedServer.value
  return mcpItems.value.filter(it => (
      it.spec.mcpToolSpec?.client === c && it.spec.mcpToolSpec?.server === s
  ))
})

function openServerConfig(client?: string) {
  if (client) selectedClient.value = client
  // 默认使用当前选中的 client
  if (!selectedClient.value && mcpClients.value.length) selectedClient.value = mcpClients.value[0]
  serverConfigVisible.value = true
}

const currentServers = computed<string[]>(() => {
  const c = selectedClient.value || ''
  return serversByClient.value[c] || []
})



</script>

<style scoped lang="scss">
/* Tailwind handles all layout/styling; scoped block kept minimal */
</style>
