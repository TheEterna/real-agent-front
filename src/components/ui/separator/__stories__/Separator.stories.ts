import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Separator from '../Separator.vue'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="max-w-md">
        <div class="space-y-1">
          <h4 class="text-sm font-medium leading-none">VOLO AI</h4>
          <p class="text-sm text-muted-foreground">多 Agent 协作框架</p>
        </div>
        <Separator class="my-4" />
        <div class="flex h-5 items-center space-x-4 text-sm">
          <span>VoloAI</span>
          <Separator orientation="vertical" />
          <span>ReAct</span>
          <Separator orientation="vertical" />
          <span>ReAct+</span>
        </div>
      </div>
    `,
  }),
}
