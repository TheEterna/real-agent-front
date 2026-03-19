import type { Meta, StoryObj } from '@storybook/vue3-vite'
import StandardWelcome from '../StandardWelcome.vue'

const meta = {
  title: 'Business/StandardWelcome',
  component: StandardWelcome,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StandardWelcome>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { StandardWelcome },
    template: `
      <div class="h-screen bg-background">
        <StandardWelcome @suggestion-click="(s) => console.log('suggestion:', s)" />
      </div>
    `,
  }),
}
