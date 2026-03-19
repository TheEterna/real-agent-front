import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Dialog from '../Dialog.vue'
import DialogContent from '../DialogContent.vue'
import DialogDescription from '../DialogDescription.vue'
import DialogFooter from '../DialogFooter.vue'
import DialogHeader from '../DialogHeader.vue'
import DialogTitle from '../DialogTitle.vue'
import DialogTrigger from '../DialogTrigger.vue'
import DialogClose from '../DialogClose.vue'
import { Button } from '../../button'
import { Input } from '../../input'
import { Label } from '../../label'

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label },
    template: `
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="outline">打开对话框</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新建会话</DialogTitle>
            <DialogDescription>创建一个新的 Agent 对话会话</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label for="title">会话标题</Label>
              <Input id="title" placeholder="输入会话标题" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}

export const Confirmation: Story = {
  name: '确认对话框',
  render: () => ({
    components: { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose, Button },
    template: `
      <Dialog>
        <DialogTrigger as-child>
          <Button variant="destructive">删除会话</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              此操作不可撤销。删除后会话及其所有消息将永久丢失。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive">确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}
