import type { Meta, StoryObj } from '@storybook/vue3-vite'
import NeonModeButton from '../NeonModeButton.vue'
import { Sparkles, Zap, Palette } from 'lucide-vue-next'
import { ref } from 'vue'

const meta = {
  title: 'Business/NeonModeButton',
  component: NeonModeButton,
  tags: ['autodocs'],
} satisfies Meta<typeof NeonModeButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { NeonModeButton, Sparkles },
    template: `<NeonModeButton :icon="Sparkles" label="默认模式" />`,
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { NeonModeButton, Sparkles, Zap, Palette },
    template: `
      <div class="flex gap-4 items-center">
        <NeonModeButton :icon="Sparkles" label="默认" variant="default" />
        <NeonModeButton :icon="Zap" label="极客" variant="geek" />
        <NeonModeButton :icon="Palette" label="多模态" variant="multimodal" />
      </div>
    `,
  }),
}

export const ActiveVariants: Story = {
  render: () => ({
    components: { NeonModeButton, Sparkles, Zap, Palette },
    template: `
      <div class="flex gap-4 items-center">
        <NeonModeButton :icon="Sparkles" label="默认" variant="default" active />
        <NeonModeButton :icon="Zap" label="极客" variant="geek" active />
        <NeonModeButton :icon="Palette" label="多模态" variant="multimodal" active />
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { NeonModeButton, Sparkles },
    template: `<NeonModeButton :icon="Sparkles" label="禁用" disabled />`,
  }),
}

export const Interactive: Story = {
  render: () => ({
    components: { NeonModeButton, Sparkles, Zap, Palette },
    setup() {
      const selected = ref('default')
      return { selected }
    },
    template: `
      <div class="space-y-4">
        <div class="flex gap-4 items-center">
          <NeonModeButton :icon="Sparkles" label="默认" variant="default"
            :active="selected === 'default'" @click="selected = 'default'" />
          <NeonModeButton :icon="Zap" label="极客" variant="geek"
            :active="selected === 'geek'" @click="selected = 'geek'" />
          <NeonModeButton :icon="Palette" label="多模态" variant="multimodal"
            :active="selected === 'multimodal'" @click="selected = 'multimodal'" />
        </div>
        <p class="text-sm text-muted-foreground">当前模式: {{ selected }}</p>
      </div>
    `,
  }),
}
