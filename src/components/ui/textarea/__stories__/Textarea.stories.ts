import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Textarea from '../Textarea.vue'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    rows: { control: 'number' },
  },
  args: {
    placeholder: '请输入内容...',
    disabled: false,
    readonly: false,
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Textarea },
    setup() { return { args } },
    template: '<Textarea v-bind="args" class="max-w-lg" />',
  }),
}

export const WithLabel: Story = {
  render: () => ({
    components: { Textarea, Label },
    template: `
      <div class="grid w-full max-w-lg gap-1.5">
        <Label for="message">消息</Label>
        <Textarea id="message" placeholder="输入你的消息..." />
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Textarea },
    template: '<Textarea disabled placeholder="不可编辑" class="max-w-lg" />',
  }),
}

export const WithValue: Story = {
  render: () => ({
    components: { Textarea },
    setup() {
      const value = ref('VOLO AI 是一个对标 Gemini/ChatGPT/Claude 的多 Agent 协作框架。')
      return { value }
    },
    template: '<Textarea v-model="value" class="max-w-lg" />',
  }),
}
