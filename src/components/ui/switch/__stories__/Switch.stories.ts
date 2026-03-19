import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Switch from '../Switch.vue'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Switch },
    setup() {
      const checked = ref(false)
      return { checked }
    },
    template: '<Switch v-model:checked="checked" />',
  }),
}

export const WithLabel: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() {
      const checked = ref(true)
      return { checked }
    },
    template: `
      <div class="flex items-center gap-2">
        <Switch id="dark-mode" v-model:checked="checked" />
        <Label for="dark-mode">暗色模式</Label>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Switch, Label },
    template: `
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <Switch disabled />
          <Label>未选中 (禁用)</Label>
        </div>
        <div class="flex items-center gap-2">
          <Switch disabled :checked="true" />
          <Label>已选中 (禁用)</Label>
        </div>
      </div>
    `,
  }),
}

export const SettingsForm: Story = {
  name: '设置表单',
  render: () => ({
    components: { Switch, Label },
    setup() {
      const notifications = ref(true)
      const streaming = ref(true)
      const darkMode = ref(false)
      return { notifications, streaming, darkMode }
    },
    template: `
      <div class="flex flex-col gap-4 w-80">
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>消息通知</Label>
            <p class="text-sm text-muted-foreground">接收新消息推送</p>
          </div>
          <Switch v-model:checked="notifications" />
        </div>
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>流式输出</Label>
            <p class="text-sm text-muted-foreground">实时显示 AI 回复</p>
          </div>
          <Switch v-model:checked="streaming" />
        </div>
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>暗色模式</Label>
            <p class="text-sm text-muted-foreground">切换界面配色方案</p>
          </div>
          <Switch v-model:checked="darkMode" />
        </div>
      </div>
    `,
  }),
}
