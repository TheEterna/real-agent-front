<template>
  <ACard size="small" :title="t('compTool.approval.title')" :bordered="true" class="approval-card">
    <Descriptions :column="1" size="small" bordered>
      <DescriptionsItem :label="t('compTool.approval.toolName')">
        {{ approval?.toolName || '-' }}
      </DescriptionsItem>
      <DescriptionsItem :label="t('compTool.approval.args')">
        <pre class="code">{{ pretty(approval?.args) }}</pre>
      </DescriptionsItem>
    </Descriptions>
    <div class="actions">
      <Space>
        <AButton type="primary" :loading="executing" @click="onApprove">{{ t('compTool.approval.approve') }}</AButton>
        <AButton danger :disabled="executing" @click="onReject">{{ t('compTool.approval.reject') }}</AButton>
        <AButton :disabled="executing" @click="openInTools">{{ t('compTool.approval.openInTools') }}</AButton>
      </Space>
    </div>
    <div v-if="statusMsg" class="status">{{ statusMsg }}</div>
  </ACard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Card as ACard, Descriptions, DescriptionsItem, Space, Button as AButton } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { approveExecute } from '@/services/tools'

const props = defineProps<{ approval: { toolName?: string; args?: any } }>()
const { t } = useI18n()
const router = useRouter()

const executing = ref(false)
const statusMsg = ref('')

function pretty(v:any){
  try{ return JSON.stringify(v ?? {}, null, 2) }catch{ return String(v) }
}

async function onApprove(){
  if(!props.approval?.toolName){ statusMsg.value = t('compTool.approval.noToolName'); return }
  executing.value = true
  statusMsg.value = t('compTool.approval.executing')
  try{
    const res = await approveExecute(props.approval.toolName!, props.approval.args || {})
    statusMsg.value = t('compTool.approval.done')
    // 可选：在全局事件总线中广播执行结果，或直接依赖后端SSE返回后续消息
    console.debug('approve result', res)
  }catch(e:any){
    statusMsg.value = t('compTool.approval.failed') + ': ' + (e?.message || String(e))
  }finally{
    executing.value = false
  }
}

function onReject(){
  statusMsg.value = t('compTool.approval.rejected')
}

function openInTools(){
  const q: any = { }
  if (props.approval?.toolName) q.toolName = props.approval.toolName
  if (props.approval?.args) q.args = encodeURIComponent(JSON.stringify(props.approval.args))
  router.push({ name: 'Tools', query: q }).catch(()=>{})
}
</script>

<style scoped>
.approval-card { margin-top: 8px; }
.code { white-space: pre-wrap; font-family: var(--font-mono); font-size: 0.75rem; }
.actions { margin-top: 12px; }
.status { margin-top: 8px; color: var(--muted-foreground); }
</style>
