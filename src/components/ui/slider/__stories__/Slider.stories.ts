import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Slider from '../Slider.vue'
import { Label } from '../../label'
import { ref } from 'vue'

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref([50])
      return { value }
    },
    template: `
      <div class="w-60 space-y-2">
        <Label>Temperature: {{ value[0] / 100 }}</Label>
        <Slider v-model="value" :max="100" :step="1" />
      </div>
    `,
  }),
}

export const Range: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref([25, 75])
      return { value }
    },
    template: `
      <div class="w-60 space-y-2">
        <Label>Token 范围: {{ value[0] }} - {{ value[1] }}</Label>
        <Slider v-model="value" :max="100" :step="5" />
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Slider, Label },
    template: `
      <div class="w-60 space-y-2">
        <Label>禁用状态</Label>
        <Slider :default-value="[30]" :max="100" disabled />
      </div>
    `,
  }),
}

export const CustomStep: Story = {
  render: () => ({
    components: { Slider, Label },
    setup() {
      const value = ref([2048])
      return { value }
    },
    template: `
      <div class="w-60 space-y-2">
        <Label>Max Tokens: {{ value[0] }}</Label>
        <Slider v-model="value" :max="8192" :step="256" :min="256" />
      </div>
    `,
  }),
}
