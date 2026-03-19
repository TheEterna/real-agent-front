import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Input from '../Input.vue'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'url'],
    },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
  },
  args: {
    placeholder: '请输入内容...',
    disabled: false,
    readonly: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Input },
    setup() { return { args } },
    template: '<Input v-bind="args" class="max-w-sm" />',
  }),
}

export const WithLabel: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="grid w-full max-w-sm gap-1.5">
        <Label for="email">邮箱</Label>
        <Input id="email" type="email" placeholder="your@email.com" />
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Input },
    template: '<Input disabled placeholder="不可编辑" class="max-w-sm" />',
  }),
}

export const WithValue: Story = {
  render: () => ({
    components: { Input },
    setup() {
      const value = ref('VOLO AI')
      return { value }
    },
    template: '<Input v-model="value" class="max-w-sm" />',
  }),
}

export const Types: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="flex flex-col gap-4 max-w-sm">
        <div class="grid gap-1.5">
          <Label>文本</Label>
          <Input type="text" placeholder="输入文本" />
        </div>
        <div class="grid gap-1.5">
          <Label>密码</Label>
          <Input type="password" placeholder="输入密码" />
        </div>
        <div class="grid gap-1.5">
          <Label>数字</Label>
          <Input type="number" placeholder="输入数字" />
        </div>
        <div class="grid gap-1.5">
          <Label>搜索</Label>
          <Input type="search" placeholder="搜索..." />
        </div>
      </div>
    `,
  }),
}
