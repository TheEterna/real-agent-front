import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Tabs from '../Tabs.vue'
import TabsList from '../TabsList.vue'
import TabsTrigger from '../TabsTrigger.vue'
import TabsContent from '../TabsContent.vue'
import { Card, CardContent, CardHeader, CardTitle } from '../../card'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent },
    template: `
      <Tabs default-value="overview" class="w-[400px]">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
          <TabsTrigger value="settings">设置</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p class="text-sm text-muted-foreground p-4">
            Agent 系统运行概览，包含任务完成率、活跃会话数等核心指标。
          </p>
        </TabsContent>
        <TabsContent value="analytics">
          <p class="text-sm text-muted-foreground p-4">
            分析面板展示 Token 使用量、响应延迟分布等详细数据。
          </p>
        </TabsContent>
        <TabsContent value="settings">
          <p class="text-sm text-muted-foreground p-4">
            系统设置包含 LLM 模型配置、MCP 工具管理等选项。
          </p>
        </TabsContent>
      </Tabs>
    `,
  }),
}

export const WithCards: Story = {
  name: '带卡片内容',
  render: () => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, CardHeader, CardTitle },
    template: `
      <Tabs default-value="voloai" class="w-[500px]">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="voloai">VoloAI</TabsTrigger>
          <TabsTrigger value="react">ReAct</TabsTrigger>
          <TabsTrigger value="react-plus">ReAct+</TabsTrigger>
        </TabsList>
        <TabsContent value="voloai">
          <Card>
            <CardHeader>
              <CardTitle>VoloAI 策略</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              智能任务分级策略，自动分析请求复杂度并选择最优执行路径。
              支持 DIRECT/SIMPLE/THOUGHT/COMPLEX 四个级别。
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="react">
          <Card>
            <CardHeader>
              <CardTitle>ReAct 策略</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              基础推理+行动策略，适合简单的工具调用场景。
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="react-plus">
          <Card>
            <CardHeader>
              <CardTitle>ReAct+ 策略</CardTitle>
            </CardHeader>
            <CardContent class="text-sm text-muted-foreground">
              增强推理策略，支持多轮深度推理和复杂任务分解。
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    `,
  }),
}
