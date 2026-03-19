import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../'
import { Button } from '../../button'
import { Input } from '../../input'
import { Label } from '../../label'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Input, Label },
    template: `
      <Card class="w-[380px]">
        <CardHeader>
          <CardTitle>创建 Agent</CardTitle>
          <CardDescription>配置一个新的 AI Agent 来执行任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4">
            <div class="grid gap-1.5">
              <Label for="name">名称</Label>
              <Input id="name" placeholder="Agent 名称" />
            </div>
            <div class="grid gap-1.5">
              <Label for="desc">描述</Label>
              <Input id="desc" placeholder="Agent 描述" />
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button variant="outline">取消</Button>
          <Button>创建</Button>
        </CardFooter>
      </Card>
    `,
  }),
}

export const Simple: Story = {
  name: '简单卡片',
  render: () => ({
    components: { Card, CardContent, CardHeader, CardTitle },
    template: `
      <Card class="w-[380px]">
        <CardHeader>
          <CardTitle>通知</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            你的 Agent 已经完成了 3 个任务。点击查看详情。
          </p>
        </CardContent>
      </Card>
    `,
  }),
}

export const GridLayout: Story = {
  name: '网格布局',
  render: () => ({
    components: { Card, CardContent, CardHeader, CardTitle, CardDescription },
    template: `
      <div class="grid grid-cols-3 gap-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">VoloAI</CardTitle>
            <CardDescription>智能任务分级</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold">128</p>
            <p class="text-xs text-muted-foreground">已完成任务</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-base">ReAct</CardTitle>
            <CardDescription>推理 + 行动</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold">64</p>
            <p class="text-xs text-muted-foreground">已完成任务</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle class="text-base">ReAct+</CardTitle>
            <CardDescription>增强推理</CardDescription>
          </CardHeader>
          <CardContent>
            <p class="text-2xl font-bold">32</p>
            <p class="text-xs text-muted-foreground">已完成任务</p>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}
