import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RadioGroup from '../RadioGroup.vue'
import RadioGroupItem from '../RadioGroupItem.vue'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() {
      const value = ref('auto')
      return { value }
    },
    template: `
      <RadioGroup v-model="value" class="space-y-2">
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="auto" value="auto" />
          <Label for="auto">自动分级 (Auto)</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="direct" value="direct" />
          <Label for="direct">直接回答 (Direct)</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="complex" value="complex" />
          <Label for="complex">复杂任务 (Complex)</Label>
        </div>
      </RadioGroup>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    template: `
      <RadioGroup default-value="pro" disabled class="space-y-2">
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="free" value="free" />
          <Label for="free">Free</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="pro" value="pro" />
          <Label for="pro">Pro</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="turbo" value="turbo" />
          <Label for="turbo">Turbo</Label>
        </div>
      </RadioGroup>
    `,
  }),
}

export const Horizontal: Story = {
  render: () => ({
    components: { RadioGroup, RadioGroupItem, Label },
    setup() {
      const value = ref('gpt')
      return { value }
    },
    template: `
      <RadioGroup v-model="value" class="flex space-x-4">
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="gpt" value="gpt" />
          <Label for="gpt">GPT-5.3</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="opus" value="opus" />
          <Label for="opus">Opus 4.6</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="gemini" value="gemini" />
          <Label for="gemini">Gemini 3.1</Label>
        </div>
      </RadioGroup>
    `,
  }),
}
