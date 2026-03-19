import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '../'
import { Loader2, Mail, Plus, Download, Trash2, Settings } from 'lucide-vue-next'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
    },
    disabled: { control: 'boolean' },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Button },
    setup() { return { args } },
    template: '<Button v-bind="args">按钮</Button>',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    `,
  }),
}

export const AllSizes: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    `,
  }),
}

export const WithIcon: Story = {
  render: () => ({
    components: { Button, Mail, Plus, Download },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Button><Mail /> 发送邮件</Button>
        <Button variant="secondary"><Plus /> 新建</Button>
        <Button variant="outline"><Download /> 下载</Button>
      </div>
    `,
  }),
}

export const IconOnly: Story = {
  render: () => ({
    components: { Button, Plus, Settings, Trash2 },
    template: `
      <div class="flex items-center gap-4">
        <Button size="icon" aria-label="添加"><Plus /></Button>
        <Button size="icon-sm" variant="ghost" aria-label="设置"><Settings /></Button>
        <Button size="icon-lg" variant="destructive" aria-label="删除"><Trash2 /></Button>
      </div>
    `,
  }),
}

export const Loading: Story = {
  render: () => ({
    components: { Button, Loader2 },
    template: `
      <div class="flex items-center gap-4">
        <Button disabled><Loader2 class="animate-spin" /> 加载中...</Button>
        <Button variant="outline" disabled><Loader2 class="animate-spin" /> 请稍候</Button>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Button disabled>Default</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="destructive" disabled>Destructive</Button>
        <Button variant="outline" disabled>Outline</Button>
        <Button variant="ghost" disabled>Ghost</Button>
      </div>
    `,
  }),
}
