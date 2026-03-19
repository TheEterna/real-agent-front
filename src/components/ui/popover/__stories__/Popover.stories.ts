import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Popover from '../Popover.vue'
import PopoverTrigger from '../PopoverTrigger.vue'
import PopoverContent from '../PopoverContent.vue'
import { Button } from '../../button'
import { Input } from '../../input'
import { Label } from '../../label'

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Popover, PopoverTrigger, PopoverContent, Button, Input, Label },
    template: `
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline">打开 Popover</Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="grid gap-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">模型配置</h4>
              <p class="text-sm text-muted-foreground">调整当前会话的模型参数</p>
            </div>
            <div class="grid gap-2">
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="temperature">Temperature</Label>
                <Input id="temperature" type="number" value="0.7" class="col-span-2 h-8" />
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="max-tokens">Max Tokens</Label>
                <Input id="max-tokens" type="number" value="4096" class="col-span-2 h-8" />
              </div>
              <div class="grid grid-cols-3 items-center gap-4">
                <Label for="top-p">Top P</Label>
                <Input id="top-p" type="number" value="0.9" class="col-span-2 h-8" />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    `,
  }),
}
