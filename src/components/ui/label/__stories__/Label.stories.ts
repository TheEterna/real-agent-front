import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Label from '../Label.vue'
import { Input } from '../../input'

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Label },
    template: `<Label>模型名称</Label>`,
  }),
}

export const WithInput: Story = {
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="api-key">API Key</Label>
        <Input id="api-key" type="password" placeholder="sk-..." />
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Label, Input },
    template: `
      <div class="grid w-full max-w-sm items-center gap-1.5" data-disabled="true">
        <Label for="disabled-input">禁用字段</Label>
        <Input id="disabled-input" disabled placeholder="不可编辑" />
      </div>
    `,
  }),
}
