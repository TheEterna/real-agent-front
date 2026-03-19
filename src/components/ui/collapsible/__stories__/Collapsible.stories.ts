import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Collapsible from '../Collapsible.vue'
import CollapsibleTrigger from '../CollapsibleTrigger.vue'
import CollapsibleContent from '../CollapsibleContent.vue'
import { Button } from '../../button'
import { ChevronsUpDown } from 'lucide-vue-next'
import { ref } from 'vue'

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, Button, ChevronsUpDown },
    setup() {
      const isOpen = ref(false)
      return { isOpen }
    },
    template: `
      <Collapsible v-model:open="isOpen" class="w-[350px] space-y-2">
        <div class="flex items-center justify-between space-x-4 px-4">
          <h4 class="text-sm font-semibold">Agent 执行日志</h4>
          <CollapsibleTrigger as-child>
            <Button variant="ghost" size="icon-sm">
              <ChevronsUpDown class="size-4" />
              <span class="sr-only">切换</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div class="rounded-md border px-4 py-3 font-mono text-sm">
          ThinkingAgent: 分析用户意图...
        </div>
        <CollapsibleContent class="space-y-2">
          <div class="rounded-md border px-4 py-3 font-mono text-sm">
            ActionAgent: 调用 WebSearchTool
          </div>
          <div class="rounded-md border px-4 py-3 font-mono text-sm">
            ObservationAgent: 结果已获取，正在总结
          </div>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
}
