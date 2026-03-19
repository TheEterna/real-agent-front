import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

const meta = {
  title: 'Design System/Colors',
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj

export const BrandColors: Story = {
  name: '品牌色板',
  render: () => ({
    template: `
      <div class="space-y-8">
        <div>
          <h3 class="text-lg font-semibold mb-3">Primary (Teal)</h3>
          <div class="flex gap-2">
            <div v-for="n in ['50','75','100','200','300','400','500','600','700','800','900']" :key="n"
              :class="'w-16 h-16 rounded-lg flex items-center justify-center text-xs font-mono bg-primary-' + n"
              :style="{ color: parseInt(n) >= 500 ? 'white' : 'black' }">
              {{ n }}
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-3">Secondary (Cyan)</h3>
          <div class="flex gap-2">
            <div v-for="n in ['50','100','200','300','400','500','600','700','800','900']" :key="n"
              :class="'w-16 h-16 rounded-lg flex items-center justify-center text-xs font-mono bg-secondary-' + n"
              :style="{ color: parseInt(n) >= 500 ? 'white' : 'black' }">
              {{ n }}
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-3">Accent Warm</h3>
          <div class="flex gap-2">
            <div v-for="n in ['50','100','200','300','400','500','600','700','800','900']" :key="n"
              :class="'w-16 h-16 rounded-lg flex items-center justify-center text-xs font-mono bg-accent-warm-' + n"
              :style="{ color: parseInt(n) >= 500 ? 'white' : 'black' }">
              {{ n }}
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const SemanticColors: Story = {
  name: '语义色',
  render: () => ({
    template: `
      <div class="grid grid-cols-4 gap-4 max-w-2xl">
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-background border" />
          <p class="text-xs font-mono">background</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-foreground" />
          <p class="text-xs font-mono">foreground</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-card border" />
          <p class="text-xs font-mono">card</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-muted" />
          <p class="text-xs font-mono">muted</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-primary" />
          <p class="text-xs font-mono">primary</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-secondary" />
          <p class="text-xs font-mono">secondary</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-accent" />
          <p class="text-xs font-mono">accent</p>
        </div>
        <div class="space-y-2 text-center">
          <div class="h-20 rounded-lg bg-destructive" />
          <p class="text-xs font-mono">destructive</p>
        </div>
      </div>
    `,
  }),
}

export const Typography: Story = {
  name: '排版层级',
  render: () => ({
    template: `
      <div class="space-y-6 max-w-2xl">
        <div>
          <p class="text-xs text-muted-foreground mb-1">Display / 2.5-3rem / font-200</p>
          <h1 class="text-5xl font-extralight">VOLO AI</h1>
        </div>
        <div>
          <p class="text-xs text-muted-foreground mb-1">Heading / 1.5-2rem / font-600</p>
          <h2 class="text-3xl font-semibold">智能任务分级</h2>
        </div>
        <div>
          <p class="text-xs text-muted-foreground mb-1">Subheading / 1.125-1.25rem / font-500</p>
          <h3 class="text-xl font-medium">Agent 策略配置</h3>
        </div>
        <div>
          <p class="text-xs text-muted-foreground mb-1">Body / 1rem / font-400</p>
          <p>VOLO AI 是一个对标 Gemini/ChatGPT/Claude 的多 Agent 协作框架，基于 Spring AI + Vue 3 实现。支持智能任务分级、MCP 工具调用、SSE 流式响应。</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground mb-1">Caption / 0.75rem / font-400</p>
          <p class="text-xs text-muted-foreground">最后更新: 2026-03-04 | 文档版本: 2.0</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground mb-1">Code / JetBrains Mono</p>
          <code class="text-sm font-mono bg-muted px-2 py-1 rounded">const agent = new VoloAI()</code>
        </div>
      </div>
    `,
  }),
}

export const Spacing: Story = {
  name: '间距系统',
  render: () => ({
    template: `
      <div class="space-y-4">
        <div v-for="s in [1, 2, 3, 4, 6, 8, 12, 16, 24]" :key="s" class="flex items-center gap-4">
          <span class="w-12 text-right text-sm text-muted-foreground font-mono">{{ s * 4 }}px</span>
          <div :class="'bg-primary-400 h-4 rounded'" :style="{ width: s * 4 + 'px' }" />
          <span class="text-sm text-muted-foreground">space-{{ s }}</span>
        </div>
      </div>
    `,
  }),
}

export const Shadows: Story = {
  name: '阴影',
  render: () => ({
    template: `
      <div class="flex gap-8 p-8">
        <div class="w-32 h-32 rounded-lg bg-card flex items-center justify-center text-sm shadow-sm">shadow-sm</div>
        <div class="w-32 h-32 rounded-lg bg-card flex items-center justify-center text-sm shadow-md">shadow-md</div>
        <div class="w-32 h-32 rounded-lg bg-card flex items-center justify-center text-sm shadow-lg">shadow-lg</div>
        <div class="w-32 h-32 rounded-lg bg-card flex items-center justify-center text-sm shadow-xl">shadow-xl</div>
      </div>
    `,
  }),
}

export const BorderRadius: Story = {
  name: '圆角',
  render: () => ({
    template: `
      <div class="flex gap-6 p-8">
        <div class="w-24 h-24 bg-primary-200 flex items-center justify-center text-xs rounded-sm">sm</div>
        <div class="w-24 h-24 bg-primary-200 flex items-center justify-center text-xs rounded-md">md</div>
        <div class="w-24 h-24 bg-primary-200 flex items-center justify-center text-xs rounded-lg">lg</div>
        <div class="w-24 h-24 bg-primary-200 flex items-center justify-center text-xs rounded-xl">xl</div>
        <div class="w-24 h-24 bg-primary-200 flex items-center justify-center text-xs rounded-full">full</div>
      </div>
    `,
  }),
}
