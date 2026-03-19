import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Cube2x2 from '../Cube2x2.vue'

const meta = {
  title: 'Business/Cube2x2',
  component: Cube2x2,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'number', min: 16, max: 120 } },
    color: { control: 'color' },
  },
} satisfies Meta<typeof Cube2x2>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: 40,
    color: '#10b981',
  },
}

export const AllSizes: Story = {
  render: () => ({
    components: { Cube2x2 },
    template: `
      <div class="flex items-end gap-4">
        <Cube2x2 :size="20" />
        <Cube2x2 :size="32" />
        <Cube2x2 :size="40" />
        <Cube2x2 :size="60" />
        <Cube2x2 :size="80" />
      </div>
    `,
  }),
}

export const Colors: Story = {
  render: () => ({
    components: { Cube2x2 },
    template: `
      <div class="flex items-center gap-4">
        <Cube2x2 :size="40" color="#10b981" />
        <Cube2x2 :size="40" color="#3b82f6" />
        <Cube2x2 :size="40" color="#f59e0b" />
        <Cube2x2 :size="40" color="#ef4444" />
        <Cube2x2 :size="40" color="#8b5cf6" />
      </div>
    `,
  }),
}
