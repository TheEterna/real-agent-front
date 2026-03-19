import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Badge } from '../'
import { Check, AlertCircle, Clock } from 'lucide-vue-next'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Badge },
    setup() { return { args } },
    template: '<Badge v-bind="args">Badge</Badge>',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    `,
  }),
}

export const WithIcon: Story = {
  render: () => ({
    components: { Badge, Check, AlertCircle, Clock },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Badge variant="default"><Check /> 已完成</Badge>
        <Badge variant="destructive"><AlertCircle /> 错误</Badge>
        <Badge variant="secondary"><Clock /> 等待中</Badge>
      </div>
    `,
  }),
}

export const UseCases: Story = {
  name: '实际场景',
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Badge variant="default">PRO</Badge>
        <Badge variant="secondary">推荐</Badge>
        <Badge variant="outline">v2.0</Badge>
        <Badge variant="destructive">Beta</Badge>
      </div>
    `,
  }),
}
