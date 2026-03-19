import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Tooltip from '../Tooltip.vue'
import TooltipProvider from '../TooltipProvider.vue'
import TooltipTrigger from '../TooltipTrigger.vue'
import { Button } from '../../button'
import { Plus, Settings, Trash2, Copy } from 'lucide-vue-next'
import { h } from 'vue'

// Tooltip needs TooltipContent which is likely a separate file
// Let's check and import it
const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  decorators: [
    () => ({
      components: { TooltipProvider },
      template: '<TooltipProvider :delay-duration="300" :skip-delay-duration="100"><story /></TooltipProvider>',
    }),
  ],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Tooltip, TooltipTrigger, Button, Plus },
    template: `
      <Tooltip>
        <TooltipTrigger as-child>
          <Button size="icon" variant="outline" aria-label="添加">
            <Plus />
          </Button>
        </TooltipTrigger>
      </Tooltip>
    `,
  }),
}

export const IconButtons: Story = {
  name: '图标按钮 Tooltip',
  render: () => ({
    components: { Tooltip, TooltipTrigger, Button, Plus, Settings, Trash2, Copy },
    template: `
      <div class="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button size="icon" variant="ghost" aria-label="新建对话">
              <Plus />
            </Button>
          </TooltipTrigger>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button size="icon" variant="ghost" aria-label="复制">
              <Copy />
            </Button>
          </TooltipTrigger>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button size="icon" variant="ghost" aria-label="设置">
              <Settings />
            </Button>
          </TooltipTrigger>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button size="icon" variant="ghost" aria-label="删除">
              <Trash2 />
            </Button>
          </TooltipTrigger>
        </Tooltip>
      </div>
    `,
  }),
}
