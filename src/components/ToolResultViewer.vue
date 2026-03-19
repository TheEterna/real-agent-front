<template>
  <Card :title="title" :loading="loading" size="small">
    <Tabs v-model:active-key="activeKey">
      <TabPane key="summary" :tab="t('compTool.result.summary')">
        <Descriptions bordered size="small" :column="1">
          <DescriptionsItem :label="t('compTool.result.status')">
            <Badge :status="statusBadge.status" :text="statusBadge.text" />
          </DescriptionsItem>
          <DescriptionsItem :label="t('compTool.result.toolName')">{{ toolName || '-' }}</DescriptionsItem>
          <DescriptionsItem :label="'turnId'">{{ norm.turnId || '-' }}</DescriptionsItem>
          <DescriptionsItem :label="t('compTool.result.duration')">{{ norm.timing?.durationMs ?? '-' }} ms</DescriptionsItem>
          <DescriptionsItem :label="t('compTool.result.message')">{{ norm.message || '-' }}</DescriptionsItem>
        </Descriptions>
      </TabPane>
      <TabPane key="args" :tab="t('compTool.result.args')">
        <pre class="code">{{ pretty(args) }}</pre>
      </TabPane>
      <TabPane key="result" :tab="t('compTool.result.resultTab')">
        <template v-if="norm.result?.type==='json'">
          <pre class="code">{{ pretty(norm.result.value) }}</pre>
        </template>
        <template v-else-if="norm.result?.type==='text'">
          <MarkdownViewer :message="String(norm.result.value ?? '')" />
        </template>
        <template v-else>
          <pre class="code">{{ pretty(norm.rawData) }}</pre>
        </template>
      </TabPane>
      <TabPane key="logs" :tab="t('compTool.result.logs')">
        <Empty v-if="!norm.logs || !norm.logs.length" />
        <List v-else :data-source="norm.logs">
          <template #renderItem="{ item }">
            <ListItem>
              <Tag :color="logColor(item.level)">{{ item.level || 'INFO' }}</Tag>
              <span style="margin-left:8px">{{ item.ts || '' }}</span>
              <div style="margin-top:4px">{{ item.message }}</div>
            </ListItem>
          </template>
        </List>
      </TabPane>
      <TabPane key="metrics" :tab="t('compTool.result.metrics')">
        <Empty v-if="!norm.metrics || !Object.keys(norm.metrics).length" />
        <Descriptions v-else bordered size="small" :column="1">
          <DescriptionsItem v-for="(v,k) in norm.metrics" :key="k" :label="k">{{ v }}</DescriptionsItem>
        </Descriptions>
      </TabPane>
      <TabPane key="raw" :tab="t('compTool.result.raw')">
        <pre class="code">{{ pretty(raw) }}</pre>
      </TabPane>
    </Tabs>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, Tabs, TabPane, Descriptions, DescriptionsItem, Badge, Empty, List, ListItem, Tag } from 'ant-design-vue'
import MarkdownViewer from './MarkdownViewer.vue'

interface NormalizedResult {
  ok: boolean
  message?: string
  result?: { type: 'text'|'json'|'binary'|'unknown', value: unknown }
  logs?: Array<{ level?: string; message: string; ts?: string }>
  metrics?: Record<string, unknown>
  turnId?: string
  timing?: { startTime?: string; endTime?: string; durationMs?: number }
  rawData?: unknown
}

const props = defineProps<{
  toolName?: string
  args?: unknown
  raw: unknown
  loading?: boolean
}>()

const { t } = useI18n()
const activeKey = ref('summary')

const title = computed(() => t('compTool.result.title'))

function isResponseResult(resp: unknown): resp is { code: unknown; message: unknown; startTime: unknown; data?: unknown }{
  return !!resp && typeof resp === 'object' && 'code' in (resp as any) && 'message' in (resp as any) && 'startTime' in (resp as any)
}

function normalize(raw: unknown): NormalizedResult{
  // 若为统一包装，取 data 继续
  const body = isResponseResult(raw) ? raw.data : raw
  const norm: NormalizedResult = { ok: true, rawData: body }
  // 经验性探测字段
  if (body && typeof body === 'object'){
    const anyBody = body as Record<string, unknown>
    if ('ok' in anyBody) norm.ok = Boolean((anyBody as any).ok)
    if ('message' in anyBody) norm.message = String((anyBody as any).message ?? '')
    if ('turnId' in anyBody) norm.turnId = String((anyBody as any).turnId ?? '')
    const start = (anyBody as any).startTime || (anyBody as any).start || undefined
    const end = (anyBody as any).endTime || (anyBody as any).end || undefined
    const dur = (anyBody as any).durationMs || (anyBody as any).duration || undefined
    if (start || end || dur){
      norm.timing = { startTime: start, endTime: end, durationMs: dur }
    }
    if (Array.isArray((anyBody as any).logs)) norm.logs = (anyBody as any).logs
    if ((anyBody as any).metrics) norm.metrics = (anyBody as any).metrics
    // 结果推断
    const r = (anyBody as any).result ?? (anyBody as any).data ?? (anyBody as any).output
    if (r !== undefined){
      if (typeof r === 'string') norm.result = { type: 'text', value: r as string }
      else if (typeof r === 'object') norm.result = { type: 'json', value: r as object }
      else norm.result = { type: 'unknown', value: r }
    }
  }
  // 若未检测到结果，则以原始 raw 展示
  if (!('result' in (norm as any))) {
    norm.result = { type: 'json', value: isResponseResult(raw) ? raw.data : raw }
  }
  return norm
}

const norm = computed(() => normalize(props.raw))

const statusBadge = computed(() => ({
  status: (props.loading ? 'processing' : (norm.value.ok ? 'success' : 'error')),
  text: (props.loading ? t('compTool.result.running') : (norm.value.ok ? t('compTool.result.success') : t('compTool.result.failed')))
}))

function pretty(v: unknown){
  try{ return JSON.stringify(v, null, 2) }catch{ return String(v as any) }
}

function logColor(level?: string){
  const l = (level||'').toUpperCase()
  if (l==='ERROR') return 'red'
  if (l==='WARN' || l==='WARNING') return 'orange'
  return 'blue'
}
</script>

<style scoped>
.code {
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  /* Code blocks inside ToolResultViewer */
  .code {
    color: rgba(224, 231, 235, 0.9);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 6px;
    padding: 8px;
  }
}
</style>
