import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Avatar from '../Avatar.vue'
import AvatarImage from '../AvatarImage.vue'
import AvatarFallback from '../AvatarFallback.vue'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    `,
  }),
}

export const Fallback: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <Avatar>
        <AvatarImage src="" />
        <AvatarFallback>VA</AvatarFallback>
      </Avatar>
    `,
  }),
}

export const Sizes: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <div class="flex items-center gap-4">
        <Avatar class="size-6">
          <AvatarFallback class="text-xs">S</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>M</AvatarFallback>
        </Avatar>
        <Avatar class="size-12">
          <AvatarFallback class="text-lg">L</AvatarFallback>
        </Avatar>
        <Avatar class="size-16">
          <AvatarFallback class="text-xl">XL</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
}

export const Group: Story = {
  name: '头像组',
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <div class="flex -space-x-3">
        <Avatar class="border-2 border-background">
          <AvatarFallback class="bg-primary text-primary-foreground">A</AvatarFallback>
        </Avatar>
        <Avatar class="border-2 border-background">
          <AvatarFallback class="bg-secondary text-secondary-foreground">B</AvatarFallback>
        </Avatar>
        <Avatar class="border-2 border-background">
          <AvatarFallback class="bg-destructive text-white">C</AvatarFallback>
        </Avatar>
        <Avatar class="border-2 border-background">
          <AvatarFallback class="bg-muted text-muted-foreground">+3</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
}
