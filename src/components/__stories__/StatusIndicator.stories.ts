import type { Meta, StoryObj } from '@storybook/vue3-vite'
import StatusIndicator from '../StatusIndicator.vue'

const meta = {
  title: 'Business/StatusIndicator',
  component: StatusIndicator,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'running', 'completed', 'error'],
    },
  },
} satisfies Meta<typeof StatusIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Running: Story = {
  args: { status: 'running' },
}

export const Completed: Story = {
  args: { status: 'completed' },
}

export const Error: Story = {
  args: { status: 'error' },
}

export const Idle: Story = {
  args: { status: 'idle' },
}

export const AllStates: Story = {
  name: '所有状态',
  render: () => ({
    components: { StatusIndicator },
    template: `
      <div class="flex flex-col gap-4">
        <StatusIndicator status="running" />
        <StatusIndicator status="completed" />
        <StatusIndicator status="error" />
        <StatusIndicator status="idle" />
      </div>
    `,
  }),
}
