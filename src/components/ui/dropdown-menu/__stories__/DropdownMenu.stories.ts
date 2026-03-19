import type { Meta, StoryObj } from '@storybook/vue3-vite'
import DropdownMenu from '../DropdownMenu.vue'
import DropdownMenuTrigger from '../DropdownMenuTrigger.vue'
import DropdownMenuContent from '../DropdownMenuContent.vue'
import DropdownMenuItem from '../DropdownMenuItem.vue'
import DropdownMenuSeparator from '../DropdownMenuSeparator.vue'
import DropdownMenuLabel from '../DropdownMenuLabel.vue'
import DropdownMenuGroup from '../DropdownMenuGroup.vue'
import { Button } from '../../button'
import { Settings, LogOut, User, CreditCard, MessageSquare, PlusCircle } from 'lucide-vue-next'

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: {
      DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
      DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
      Button, Settings, LogOut, User, CreditCard, MessageSquare, PlusCircle,
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">打开菜单</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>我的账号</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User class="mr-2 size-4" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard class="mr-2 size-4" />
              <span>订阅管理</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings class="mr-2 size-4" />
              <span>设置</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <PlusCircle class="mr-2 size-4" />
              <span>新建对话</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare class="mr-2 size-4" />
              <span>历史对话</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive">
            <LogOut class="mr-2 size-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}
