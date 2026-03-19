import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue },
    setup() {
      const value = ref('')
      return { value }
    },
    template: `
      <Select v-model="value">
        <SelectTrigger class="w-[250px]">
          <SelectValue placeholder="选择一个模型" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>OpenAI</SelectLabel>
            <SelectItem value="gpt-5.3">GPT-5.3</SelectItem>
            <SelectItem value="o3">O3</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Anthropic</SelectLabel>
            <SelectItem value="opus-4.6">Opus 4.6</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Google</SelectLabel>
            <SelectItem value="gemini-3.1-pro">Gemini 3.1 Pro</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>DeepSeek</SelectLabel>
            <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    `,
  }),
}

export const WithLabel: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label },
    template: `
      <div class="grid gap-1.5 w-[250px]">
        <Label>Agent 策略</Label>
        <Select default-value="voloai">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="voloai">VoloAI (推荐)</SelectItem>
            <SelectItem value="react">ReAct</SelectItem>
            <SelectItem value="react-plus">ReAct+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Select, SelectContent, SelectItem, SelectTrigger, SelectValue },
    template: `
      <Select disabled>
        <SelectTrigger class="w-[250px]">
          <SelectValue placeholder="不可选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">选项 A</SelectItem>
        </SelectContent>
      </Select>
    `,
  }),
}
