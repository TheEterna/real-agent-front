import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ScrollArea from '../ScrollArea.vue'
import { Separator } from '../../separator'

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { ScrollArea, Separator },
    setup() {
      const sessions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `会话 ${i + 1}: ${['Agent 对话', 'VoloAI 测试', '代码生成', '数据分析', '翻译助手'][i % 5]}`,
        time: `${Math.floor(Math.random() * 12) + 1}小时前`,
      }))
      return { sessions }
    },
    template: `
      <ScrollArea class="h-72 w-60 rounded-md border">
        <div class="p-4">
          <h4 class="mb-4 text-sm font-medium leading-none">会话列表</h4>
          <div v-for="session in sessions" :key="session.id">
            <div class="py-2">
              <div class="text-sm">{{ session.title }}</div>
              <div class="text-xs text-muted-foreground">{{ session.time }}</div>
            </div>
            <Separator />
          </div>
        </div>
      </ScrollArea>
    `,
  }),
}
