import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ButtonGroup from '../ButtonGroup.vue'
import ButtonGroupSeparator from '../ButtonGroupSeparator.vue'
import { Button } from '../../button'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next'

const meta = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { ButtonGroup, Button },
    template: `
      <ButtonGroup>
        <Button variant="outline">VoloAI</Button>
        <Button variant="outline">ReAct</Button>
        <Button variant="outline">ReAct+</Button>
      </ButtonGroup>
    `,
  }),
}

export const WithIcons: Story = {
  name: '带图标',
  render: () => ({
    components: { ButtonGroup, ButtonGroupSeparator, Button, Bold, Italic, Underline },
    template: `
      <ButtonGroup>
        <Button variant="outline" size="icon"><Bold /></Button>
        <Button variant="outline" size="icon"><Italic /></Button>
        <Button variant="outline" size="icon"><Underline /></Button>
      </ButtonGroup>
    `,
  }),
}

export const AlignmentGroup: Story = {
  name: '对齐工具栏',
  render: () => ({
    components: { ButtonGroup, Button, AlignLeft, AlignCenter, AlignRight },
    template: `
      <ButtonGroup>
        <Button variant="outline" size="icon"><AlignLeft /></Button>
        <Button variant="outline" size="icon"><AlignCenter /></Button>
        <Button variant="outline" size="icon"><AlignRight /></Button>
      </ButtonGroup>
    `,
  }),
}
