<script setup lang="ts">
/**
 * ContactList - 左侧联系人列表
 *
 * 搜索框 + 联系人条目 + [+导入] 按钮
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Plus, Users, Loader2, Trash2 } from 'lucide-vue-next'
import { Modal } from 'ant-design-vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import ContactItem from './ContactItem.vue'

const emit = defineEmits<{
  importClick: []
}>()

const { t } = useI18n()
const store = useChatAnalyzerStore()

const searchQuery = ref('')

const contacts = computed(() => {
  const all = store.contacts.filter(c => !c.isSelf)
  if (!searchQuery.value.trim()) return all
  const q = searchQuery.value.trim().toLowerCase()
  return all.filter(c => c.name.toLowerCase().includes(q))
})

const isLoading = computed(() => store.contactsLoading)

function handleSelect(contactId: string) {
  store.setActiveContactId(contactId)
}

function handleDelete(contactId: string) {
  const contact = store.contacts.find(c => c.id === contactId)
  if (!contact) return
  Modal.confirm({
    title: t('chatAnalyzer.contactList.deleteTitle'),
    content: t('chatAnalyzer.contactList.deleteContent', { name: contact.name }),
    okText: t('common.button.delete'),
    okType: 'danger',
    cancelText: t('common.button.cancel'),
    onOk: () => store.deleteContact(contactId),
  })
}
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-border">
    <!-- Header -->
    <div class="p-3 border-b border-border">
      <div class="flex items-center gap-2 mb-2">
        <Users :size="16" class="text-zinc-500 dark:text-zinc-400 shrink-0" />
        <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('chatAnalyzer.contactList.title') }}</span>
      </div>
      <!-- Search -->
      <div class="relative">
        <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <Input
          v-model="searchQuery"
          :placeholder="t('chatAnalyzer.contactList.searchPlaceholder')"
          class="h-8 pl-8 text-sm"
        />
      </div>
    </div>

    <!-- Contact list -->
    <ScrollArea class="flex-1">
      <div class="p-2">
        <!-- Loading -->
        <div
          v-if="isLoading && contacts.length === 0"
          class="flex items-center justify-center py-8"
        >
          <Loader2 :size="20" class="animate-spin text-zinc-400" />
        </div>

        <!-- Empty -->
        <div
          v-else-if="contacts.length === 0 && !searchQuery"
          class="flex flex-col items-center justify-center py-8 text-center"
        >
          <Users :size="24" class="text-muted-foreground/30 mb-2" />
          <p class="text-xs text-muted-foreground mb-3">
            {{ t('chatAnalyzer.contactList.empty') }}
          </p>
          <Button
            variant="outline"
            size="sm"
            class="text-xs gap-1 active:scale-95"
            @click="emit('importClick')"
          >
            <Plus :size="14" />
            {{ t('chatAnalyzer.contactList.importRecords') }}
          </Button>
        </div>

        <!-- Search empty -->
        <div
          v-else-if="contacts.length === 0 && searchQuery"
          class="py-8 text-center"
        >
          <p class="text-xs text-muted-foreground">
            {{ t('chatAnalyzer.contactList.searchEmpty') }}
          </p>
        </div>

        <!-- Contact items -->
        <div v-else class="space-y-0.5">
          <div
            v-for="contact in contacts"
            :key="contact.id"
            class="group relative"
          >
            <ContactItem
              :contact="contact"
              :active="store.activeContactId === contact.id"
              @select="handleSelect"
            />
            <!-- Delete button (visible on hover) -->
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-95 transition-all duration-200"
                  :aria-label="t('chatAnalyzer.contactList.deleteContact')"
                  @click.stop="handleDelete(contact.id)"
                >
                  <Trash2 :size="14" class="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" :side-offset="4">{{ t('chatAnalyzer.contactList.deleteContact') }}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- Bottom: Import button -->
    <div class="p-2 border-t border-border">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="w-full gap-1.5 text-xs text-zinc-500 active:scale-95"
            @click="emit('importClick')"
          >
            <Plus :size="14" />
            {{ t('chatAnalyzer.contactList.importBtn') }}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" :side-offset="4">{{ t('chatAnalyzer.contactList.importMore') }}</TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>
