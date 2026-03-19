import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Checkbox from '../Checkbox.vue'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Checkbox, Label },
    setup() {
      const checked = ref(false)
      return { checked }
    },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox id="terms" v-model:checked="checked" />
        <Label for="terms">接受服务条款</Label>
      </div>
    `,
  }),
}

export const Checked: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox id="checked" :default-checked="true" />
        <Label for="checked">已选中</Label>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <Checkbox id="disabled-unchecked" disabled />
          <Label for="disabled-unchecked">禁用（未选中）</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="disabled-checked" disabled :default-checked="true" />
          <Label for="disabled-checked">禁用（已选中）</Label>
        </div>
      </div>
    `,
  }),
}

export const WithForm: Story = {
  render: () => ({
    components: { Checkbox, Label },
    template: `
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <Checkbox id="opt1" :default-checked="true" />
          <Label for="opt1">启用 SSE 流式输出</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="opt2" />
          <Label for="opt2">启用工具调用</Label>
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="opt3" :default-checked="true" />
          <Label for="opt3">启用 ThinkTool 深度推理</Label>
        </div>
      </div>
    `,
  }),
}
