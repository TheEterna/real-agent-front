import type { Meta, StoryObj } from '@storybook/vue3-vite'
import GeekModeButton from '../GeekModeButton.vue'
import { Terminal } from 'lucide-vue-next'
import { ref } from 'vue'

const meta = {
  title: 'Business/GeekModeButton',
  component: GeekModeButton,
  tags: ['autodocs'],
} satisfies Meta<typeof GeekModeButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { GeekModeButton, Terminal },
    template: `<GeekModeButton :icon="Terminal" label="GEEK MODE" />`,
  }),
}

export const Active: Story = {
  render: () => ({
    components: { GeekModeButton, Terminal },
    template: `<GeekModeButton :icon="Terminal" label="GEEK MODE" active />`,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { GeekModeButton, Terminal },
    template: `<GeekModeButton :icon="Terminal" label="GEEK MODE" disabled />`,
  }),
}

export const Interactive: Story = {
  render: () => ({
    components: { GeekModeButton, Terminal },
    setup() {
      const active = ref(false)
      const toggle = () => { active.value = !active.value }
      return { active, toggle }
    },
    template: `
      <div class="space-y-4">
        <GeekModeButton :icon="Terminal" label="GEEK MODE" :active="active" @click="toggle" />
        <p class="text-sm text-muted-foreground">状态: {{ active ? '激活' : '未激活' }}</p>
      </div>
    `,
  }),
}
