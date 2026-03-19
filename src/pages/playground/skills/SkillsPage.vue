<template>
  <div class="skills-page h-[100dvh] sm:h-screen w-full bg-background flex flex-col">
    <!-- Header -->
    <header class="px-6 sm:px-12 pt-8 pb-6 space-y-3">
      <h1 class="text-2xl font-semibold text-foreground">{{ t("skillsPage.title") }}</h1>
      <p class="text-base text-muted-foreground">{{ t("skillsPage.subtitle") }}</p>
      <div class="relative w-full sm:w-[400px]">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" :size="16" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('skillsPage.searchPlaceholder')"
          class="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>
    </header>

    <!-- Tab Navigation -->
    <div class="px-6 sm:px-12 border-b border-border">
      <div class="flex gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-4 py-3 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.key
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            class="ml-1.5"
          >
            ({{ tab.count }})
          </span>
          <div
            v-if="activeTab === tab.key"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden flex flex-col">
      <!-- Content Area -->
      <section class="flex-1 overflow-y-auto">
        <!-- Gallery Tab -->
        <div v-if="activeTab === 'gallery'" class="px-6 sm:px-12 py-6">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              v-for="skill in filteredGallerySkills"
              :key="skill.id"
              class="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              role="button"
              tabindex="0"
              :aria-label="skill.name"
              @click="openSkillDetail(skill)"
              @keydown.enter="openSkillDetail(skill)"
            >
              <!-- Card Header: icon + toggle/action -->
              <div class="flex items-center justify-between mb-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  :class="getSkillIconBg(skill.category)"
                >
                  <component :is="skill.icon" :size="18" />
                </div>
                <button
                  v-if="!isSkillInstalled(skill.id)"
                  class="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  @click.stop="installSkill(skill)"
                >
                  <Plus :size="14" />
                  {{ t("skillsPage.add") }}
                </button>
                <span v-else class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check :size="14" />
                  {{ t("skillsPage.added") }}
                </span>
              </div>
              <!-- Title -->
              <h3 class="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{{ skill.name }}</h3>
              <!-- Description -->
              <p class="text-[0.8125rem] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">{{ skill.description }}</p>
              <!-- Tags -->
              <div class="flex flex-wrap gap-2 mt-3">
                <span
                  v-for="tag in skill.tags.slice(0, 3)"
                  :key="tag"
                  class="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- My Skills Tab -->
        <div v-else-if="activeTab === 'my-skills'" class="px-6 sm:px-12 py-6">
          <div v-if="installedSkills.length === 0" class="flex flex-col items-center justify-center h-96">
            <Sparkles :size="48" class="mb-4 text-muted-foreground/30" />
            <p class="text-lg font-medium text-foreground mb-2">{{ t("skillsPage.noSkillsYet") }}</p>
            <p class="text-base text-muted-foreground">{{ t("skillsPage.noSkillsHint") }}</p>
            <button
              class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:bg-primary/90 transition-colors active:scale-95"
              @click="activeTab = 'gallery'"
            >
              {{ t("skillsPage.browseGallery") }}
            </button>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              v-for="skill in filteredInstalledSkills"
              :key="skill.id"
              class="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
            >
              <!-- Card Header: icon + actions -->
              <div class="flex items-center justify-between mb-3">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  :class="getSkillIconBg(skill.category)"
                >
                  <component :is="skill.icon" :size="18" />
                </div>
                <div class="flex items-center gap-1">
                  <ASwitch
                    v-model:checked="skill.isEnabled"
                    size="small"
                    @change="toggleSkillStatus(skill)"
                  />
                  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          :aria-label="t('skillsPage.skillSettings')"
                          class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          @click="openSkillDetail(skill)"
                        >
                          <Settings :size="15" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" :side-offset="6">{{ t("skillsPage.skillSettings") }}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          :aria-label="t('skillsPage.removeSkill')"
                          class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          @click="removeSkill(skill)"
                        >
                          <Trash2 :size="15" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" :side-offset="6">{{ t("skillsPage.removeSkill") }}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <!-- Title -->
              <h3 class="text-base font-semibold text-foreground">{{ skill.name }}</h3>
              <!-- Description -->
              <p class="text-[0.8125rem] text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">{{ skill.description }}</p>
              <!-- Status -->
              <div class="flex items-center gap-2 mt-3">
                <span class="text-xs text-muted-foreground">{{ skill.isEnabled ? t('skillsPage.enabled') : t('skillsPage.disabled') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Tab -->
        <div v-else-if="activeTab === 'create'" class="px-6 sm:px-12 py-6">
          <div class="max-w-2xl mx-auto">
            <div class="bg-card rounded-xl border border-border p-6">
              <h2 class="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Wand2 :size="20" class="text-primary" />
                {{ t("skillsPage.createCustomSkill") }}
              </h2>

              <AForm layout="vertical">
                <FormItem :label="t('skillsPage.formName')">
                  <AInput
                    v-model:value="createForm.name"
                    :placeholder="t('skillsPage.formNamePlaceholder')"
                    size="large"
                  />
                </FormItem>

                <FormItem :label="t('skillsPage.formDesc')">
                  <ATextarea
                    v-model:value="createForm.description"
                    :placeholder="t('skillsPage.formDescPlaceholder')"
                    :rows="3"
                  />
                </FormItem>

                <FormItem :label="t('skillsPage.formCategory')">
                  <ASelect v-model:value="createForm.category" :placeholder="t('skillsPage.formCategoryPlaceholder')" size="large">
                    <SelectOption value="writing">{{ t("skillsPage.selectCategoryWriting") }}</SelectOption>
                    <SelectOption value="code">{{ t("skillsPage.selectCategoryCode") }}</SelectOption>
                    <SelectOption value="analysis">{{ t("skillsPage.selectCategoryAnalysis") }}</SelectOption>
                    <SelectOption value="research">{{ t("skillsPage.selectCategoryResearch") }}</SelectOption>
                    <SelectOption value="productivity">{{ t("skillsPage.selectCategoryProductivity") }}</SelectOption>
                    <SelectOption value="creative">{{ t("skillsPage.selectCategoryCreative") }}</SelectOption>
                  </ASelect>
                </FormItem>

                <FormItem :label="t('skillsPage.formPrompt')">
                  <ATextarea
                    v-model:value="createForm.prompt"
                    :placeholder="t('skillsPage.formPromptPlaceholder')"
                    :rows="6"
                  />
                  <template #extra>
                    <span class="text-xs text-muted-foreground">{{ t("skillsPage.formPromptHint") }}</span>
                  </template>
                </FormItem>

                <FormItem :label="t('skillsPage.formExample')">
                  <div class="space-y-3">
                    <div class="p-3 bg-muted rounded-lg">
                      <div class="text-xs text-muted-foreground mb-1">{{ t("skillsPage.userInput") }}</div>
                      <div class="text-base text-foreground">{{ createForm.exampleInput || t('skillsPage.exampleInputPlaceholder') }}</div>
                    </div>
                    <div class="p-3 bg-primary/5 rounded-lg">
                      <div class="text-xs text-primary mb-1">{{ t("skillsPage.aiResponse") }}</div>
                      <div class="text-base text-foreground">{{ createForm.exampleOutput || t('skillsPage.exampleOutputPlaceholder') }}</div>
                    </div>
                  </div>
                </FormItem>

                <FormItem :label="t('skillsPage.formLinkedTools')">
                  <ASelect
                    v-model:value="createForm.selectedTools"
                    mode="multiple"
                    :placeholder="t('skillsPage.formToolsPlaceholder')"
                    :options="toolOptions"
                  />
                </FormItem>

                <FormItem>
                  <div class="flex gap-3">
                    <button
                      type="button"
                      :disabled="isCreating"
                      class="flex-1 sm:flex-none px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50"
                      @click="createSkill"
                    >
                      {{ t('skillsPage.createSkill') }}
                    </button>
                    <button
                      type="button"
                      class="flex-1 sm:flex-none px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors active:scale-95"
                      @click="activeTab = 'gallery'"
                    >
                      {{ t('common.button.cancel') }}
                    </button>
                  </div>
                </FormItem>
              </AForm>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Skill Detail Drawer -->
    <ADrawer
      v-model:open="drawerVisible"
      :title="selectedSkill?.name"
      placement="right"
      :width="500"
    >
      <template v-if="selectedSkill">
        <div class="space-y-6">
          <!-- Skill Header -->
          <div class="flex items-start gap-4">
            <div
              class="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
              :class="getSkillIconBg(selectedSkill.category)"
            >
              <component :is="selectedSkill.icon" :size="28" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-foreground">{{ selectedSkill.name }}</h2>
                <span v-if="selectedSkill.isOfficial" class="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{{ t("skillsPage.official") }}</span>
              </div>
              <div class="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span class="flex items-center gap-1">
                  <User :size="14" />
                  {{ selectedSkill.author }}
                </span>
                <span class="flex items-center gap-1">
                  <Download :size="14" />
                  {{ selectedSkill.downloadCount || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <h3 class="text-base font-medium text-foreground mb-2">{{ t("skillsPage.description") }}</h3>
            <p class="text-base text-muted-foreground leading-relaxed">{{ selectedSkill.description }}</p>
          </div>

          <!-- Tags -->
          <div>
            <h3 class="text-base font-medium text-foreground mb-2">{{ t("skillsPage.tagsLabel") }}</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in selectedSkill.tags"
                :key="tag"
                class="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Prompt Template -->
          <div>
            <h3 class="text-base font-medium text-foreground mb-2">{{ t("skillsPage.skillPrompt") }}</h3>
            <div class="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
              <pre class="text-xs text-muted-foreground whitespace-pre-wrap">{{ selectedSkill.prompt || t('skillsPage.noPreview') }}</pre>
            </div>
          </div>

          <!-- Linked Tools -->
          <div v-if="selectedSkill.tools && selectedSkill.tools.length > 0">
            <h3 class="text-base font-medium text-foreground mb-2">{{ t("skillsPage.linkedTools") }}</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tool in selectedSkill.tools"
                :key="tool"
                class="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground"
              >
                {{ tool }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-border">
            <button
              v-if="!isSkillInstalled(selectedSkill.id)"
              class="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-95"
              @click="installSkill(selectedSkill); drawerVisible = false"
            >
              <Plus :size="16" />
              {{ t("skillsPage.addToMySkills") }}
            </button>
            <button
              v-else
              class="flex-1 py-2.5 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors active:scale-95"
              @click="activeTab = 'my-skills'; drawerVisible = false"
            >
              {{ t("skillsPage.viewMySkills") }}
            </button>
          </div>
        </div>
      </template>
    </ADrawer>

    <!-- Quick Create Modal -->
    <AModal
      v-model:open="showCreateModal"
      :title="t('skillsPage.quickCreate')"
      :footer="null"
      width="500"
    >
      <div class="space-y-4">
        <AInput
          v-model:value="quickCreateName"
          :placeholder="t('skillsPage.skillNamePlaceholder')"
          size="large"
        />
        <ATextarea
          v-model:value="quickCreateDesc"
          :placeholder="t('skillsPage.quickDescPlaceholder')"
          :rows="3"
        />
        <div class="flex justify-end gap-2">
          <AButton @click="showCreateModal = false">{{ t("common.button.cancel") }}</AButton>
          <AButton type="primary" @click="quickCreateSkill">{{ t("skillsPage.createSkill") }}</AButton>
        </div>
      </div>
    </AModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Button as AButton, Modal as AModal, Form as AForm, FormItem, Input as AInput, Switch as ASwitch, Select as ASelect, SelectOption, Textarea as ATextarea, Drawer as ADrawer } from 'ant-design-vue'
import {
  Sparkles,
  Plus,
  Search,
  Download,
  Check,
  Settings,
  Trash2,
  Wand2,
  User,
  PenTool,
  Code,
  BarChart3,
  Microscope,
  Zap,
  Lightbulb,
  Globe,
  Mail,
  FileText
} from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const { t } = useI18n()

// State
const activeTab = ref<'gallery' | 'my-skills' | 'create'>('gallery')
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedTags = ref<Set<string>>(new Set())
const drawerVisible = ref(false)
const selectedSkill = ref<Skill | null>(null)
const showCreateModal = ref(false)
const isCreating = ref(false)
const quickCreateName = ref('')
const quickCreateDesc = ref('')

// Create Form
const createForm = ref({
  name: '',
  description: '',
  category: '',
  prompt: '',
  exampleInput: '',
  exampleOutput: '',
  selectedTools: [] as string[]
})

// Types
interface Skill {
  id: string
  name: string
  description: string
  category: string
  icon: any
  tags: string[]
  author: string
  isOfficial: boolean
  downloadCount: number
  likeCount: number
  prompt?: string
  tools?: string[]
  isEnabled?: boolean
}

// Icon mapping
const iconMap = {
  PenTool,
  Code,
  BarChart3,
  Microscope,
  Zap,
  Lightbulb,
  Mail,
  FileText,
  Globe
}

// Mock Data - Skills Gallery
const gallerySkills = ref<Skill[]>([
  {
    id: 'code-reviewer',
    name: '代码审查专家',
    description: '深度分析代码质量，发现潜在 bug，提供优化建议。支持多种编程语言。',
    category: 'code',
    icon: Code,
    tags: ['开发', '代码质量', '调试'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 1280,
    likeCount: 342,
    prompt: '你是一位资深的代码审查专家。请仔细分析以下代码，指出潜在的问题、改进建议，并解释原因。',
    tools: ['code_linter', 'code_formatter']
  },
  {
    id: 'writing-polisher',
    name: '文章润色师',
    description: '优化文章表达，改善行文流畅度，增强可读性。支持中英文润色。',
    category: 'writing',
    icon: PenTool,
    tags: ['写作', '润色', '翻译'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 980,
    likeCount: 256,
    prompt: '你是一位专业的文字编辑。请对以下文本进行润色，保持原意的同时，让表达更加流畅、准确、优雅。'
  },
  {
    id: 'data-analyst',
    name: '数据分析助手',
    description: '快速理解数据结构，生成分析报告，发现数据中的趋势和异常。',
    category: 'analysis',
    icon: BarChart3,
    tags: ['数据', '分析', '报表'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 756,
    likeCount: 189,
    prompt: '你是一位数据分析师。请分析以下数据，提供关键发现、趋势分析，以及可行的建议。'
  },
  {
    id: 'email-writer',
    name: '邮件写作助手',
    description: '根据要点自动生成专业邮件，支持多种语气和场景。',
    category: 'productivity',
    icon: Mail,
    tags: ['邮件', '办公', '效率'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 642,
    likeCount: 145,
    prompt: '你是一位专业的商务沟通专家。请根据以下要点，生成一封专业、得体的邮件。'
  },
  {
    id: 'brainstorm-partner',
    name: '创意风暴伙伴',
    description: '激发创意思维，提供多角度思考，帮助突破思维定式。',
    category: 'creative',
    icon: Lightbulb,
    tags: ['创意', '头脑风暴', '思考'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 523,
    likeCount: 178,
    prompt: '你是一位创意思维专家。请从多个角度对以下主题进行思考，提供新颖、独特的想法和观点。'
  },
  {
    id: 'research-helper',
    name: '研究助手',
    description: '辅助学术研究，整理文献要点，生成研究框架。',
    category: 'research',
    icon: Microscope,
    tags: ['研究', '学术', '文献'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 445,
    likeCount: 123,
    prompt: '你是一位学术研究助手。请协助分析以下内容，提炼关键信息，构建研究框架。'
  },
  // ── writing 分类 ──
  {
    id: 'seo-copywriter',
    name: 'SEO 文案专家',
    description: '生成高转化率的 SEO 友好文案，优化标题、描述和关键词布局，助力内容在搜索引擎中脱颖而出。',
    category: 'writing',
    icon: PenTool,
    tags: ['SEO', '文案', '营销'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 430,
    likeCount: 118,
    prompt: '你是一位资深 SEO 文案专家。请根据给定的主题和目标关键词，撰写搜索引擎友好的高转化文案，包含优化的标题、元描述和正文结构。'
  },
  {
    id: 'social-media-creator',
    name: '社交媒体创作者',
    description: '为微信公众号、小红书、抖音等平台创作吸引眼球的内容，精准把握各平台调性与传播规律。',
    category: 'writing',
    icon: PenTool,
    tags: ['社交媒体', '内容创作', '运营'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 415,
    likeCount: 112,
    prompt: '你是一位社交媒体内容创作专家。请根据指定的平台和主题，创作符合该平台调性的爆款内容，包括标题、正文和话题标签。'
  },
  // ── code 分类 ──
  {
    id: 'api-designer',
    name: 'API 设计顾问',
    description: '设计 RESTful/GraphQL API，生成 OpenAPI 文档，审查接口规范，确保接口一致性与可维护性。',
    category: 'code',
    icon: Code,
    tags: ['API', '架构', '文档'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 398,
    likeCount: 105,
    prompt: '你是一位资深 API 架构师。请根据业务需求设计符合最佳实践的 RESTful API，包括端点定义、请求/响应结构和错误处理规范。',
    tools: ['code_formatter']
  },
  {
    id: 'sql-optimizer',
    name: 'SQL 优化器',
    description: '分析 SQL 查询性能，优化慢查询，建议索引策略，帮助数据库运行更快更稳定。',
    category: 'code',
    icon: Code,
    tags: ['SQL', '数据库', '性能'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 382,
    likeCount: 98,
    prompt: '你是一位数据库性能优化专家。请分析以下 SQL 查询，识别性能瓶颈，提供优化后的查询语句和索引建议。',
    tools: ['code_execute']
  },
  // ── analysis 分类 ──
  {
    id: 'competitor-analyst',
    name: '竞品分析师',
    description: '系统化分析竞争对手产品，生成 SWOT 报告和市场定位建议，助力产品战略决策。',
    category: 'analysis',
    icon: BarChart3,
    tags: ['竞品', '市场', '策略'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 365,
    likeCount: 92,
    prompt: '你是一位市场竞品分析专家。请对指定的竞争对手进行全面分析，输出 SWOT 矩阵、功能对比表和差异化策略建议。'
  },
  {
    id: 'financial-reporter',
    name: '财务报告助手',
    description: '解读财务数据，生成可视化报告，分析关键财务指标，让数字讲出商业故事。',
    category: 'analysis',
    icon: BarChart3,
    tags: ['财务', '报告', '数据'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 348,
    likeCount: 87,
    prompt: '你是一位财务分析师。请解读以下财务数据，提炼关键指标趋势，生成结构化的财务分析报告及改善建议。',
    tools: ['data_process']
  },
  // ── research 分类 ──
  {
    id: 'paper-summarizer',
    name: '论文摘要生成器',
    description: '快速提取学术论文核心观点，生成结构化摘要，涵盖研究背景、方法、结论与创新点。',
    category: 'research',
    icon: Microscope,
    tags: ['论文', '摘要', '学术'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 332,
    likeCount: 82,
    prompt: '你是一位学术论文摘要专家。请阅读以下论文内容，提取核心观点，生成包含研究背景、方法论、主要发现和结论的结构化摘要。',
    tools: ['file_read']
  },
  {
    id: 'patent-searcher',
    name: '专利检索助手',
    description: '基于关键技术搜索相关专利，分析技术趋势和专利布局，辅助知识产权决策。',
    category: 'research',
    icon: Microscope,
    tags: ['专利', '技术', '检索'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 315,
    likeCount: 76,
    prompt: '你是一位专利检索与分析专家。请根据给定的技术关键词，检索相关专利信息，分析技术发展趋势和竞争格局。',
    tools: ['web_search']
  },
  // ── productivity 分类 ──
  {
    id: 'meeting-minutes',
    name: '会议纪要生成器',
    description: '将会议录音或文字转化为结构化会议纪要，自动提取行动项与决议事项，提升团队协作效率。',
    category: 'productivity',
    icon: Zap,
    tags: ['会议', '纪要', '效率'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 298,
    likeCount: 71,
    prompt: '你是一位高效的会议纪要助手。请将以下会议内容整理为结构化纪要，包括议题摘要、关键决议、行动项及责任人。'
  },
  {
    id: 'knowledge-organizer',
    name: '知识整理师',
    description: '将碎片化信息整理为体系化知识库，生成思维导图结构，让知识有序可查。',
    category: 'productivity',
    icon: Zap,
    tags: ['知识管理', '整理', '笔记'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 280,
    likeCount: 65,
    prompt: '你是一位知识管理专家。请将以下碎片化信息进行分类、归纳和结构化，输出清晰的知识框架和思维导图大纲。'
  },
  // ── creative 分类 ──
  {
    id: 'naming-master',
    name: '产品命名大师',
    description: '基于品牌定位和目标受众，生成创意产品名称和 Slogan，兼顾记忆度与传播性。',
    category: 'creative',
    icon: Lightbulb,
    tags: ['命名', '品牌', '创意'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 262,
    likeCount: 58,
    prompt: '你是一位品牌命名与创意策划专家。请根据产品定位、目标受众和品牌调性，提供多组创意名称方案及配套 Slogan。'
  },
  {
    id: 'story-writer',
    name: '故事创作家',
    description: '根据主题和设定创作短篇故事、剧本或游戏叙事，构建引人入胜的情节与角色。',
    category: 'creative',
    icon: Lightbulb,
    tags: ['故事', '创作', '叙事'],
    author: 'VOLO Official',
    isOfficial: true,
    downloadCount: 245,
    likeCount: 53,
    prompt: '你是一位富有想象力的故事创作家。请根据给定的主题、背景设定和角色，创作一个结构完整、情节引人入胜的故事。'
  }
])

// User's installed skills
// Tab type
type TabType = 'gallery' | 'my-skills' | 'create'

interface TabItem {
  key: TabType
  label: string
  count?: number
}

const mySkills = ref<Skill[]>([])

const tabs = computed<TabItem[]>(() => [
  { key: 'gallery', label: t('skillsPage.tabGallery'), count: gallerySkills.value.length },
  { key: 'my-skills', label: t('skillsPage.tabMySkills'), count: mySkills.value.length },
  { key: 'create', label: t('skillsPage.tabCreate') }
])

const categories = [
  { key: 'all', label: t('skillsPage.categoryAll'), icon: Sparkles },
  { key: 'writing', label: t('skillsPage.categoryWriting'), icon: PenTool },
  { key: 'code', label: t('skillsPage.categoryCode'), icon: Code },
  { key: 'analysis', label: t('skillsPage.categoryAnalysis'), icon: BarChart3 },
  { key: 'research', label: t('skillsPage.categoryResearch'), icon: Microscope },
  { key: 'productivity', label: t('skillsPage.categoryProductivity'), icon: Zap },
  { key: 'creative', label: t('skillsPage.categoryCreative'), icon: Lightbulb }
]

const popularTags = ['AI', '效率', '开发', '写作', '分析', '创意', '办公']

const toolOptions = [
  { label: t('skillsPage.toolWebSearch'), value: 'web_search' },
  { label: t('skillsPage.toolCodeExecute'), value: 'code_execute' },
  { label: t('skillsPage.toolFileRead'), value: 'file_read' },
  { label: t('skillsPage.toolDataProcess'), value: 'data_process' }
]

// Computed
const featuredSkills = computed(() => gallerySkills.value.filter(s => s.isOfficial).slice(0, 4))

const filteredGallerySkills = computed(() => {
  let skills = gallerySkills.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.tags.some(t => t.toLowerCase().includes(query))
    )
  }

  if (selectedCategory.value !== 'all') {
    skills = skills.filter(s => s.category === selectedCategory.value)
  }

  if (selectedTags.value.size > 0) {
    skills = skills.filter(s => s.tags.some(t => selectedTags.value.has(t)))
  }

  return skills
})

const filteredInstalledSkills = computed(() => {
  let skills = mySkills.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value !== 'all') {
    skills = skills.filter(s => s.category === selectedCategory.value)
  }

  return skills
})

const installedSkills = computed(() => mySkills.value)

// Methods
const getCategoryCount = (category: string) => {
  if (category === 'all') return gallerySkills.value.length
  return gallerySkills.value.filter(s => s.category === category).length
}

const getSkillIconBg = (category: string) => {
  const bgMap: Record<string, string> = {
    writing: 'bg-gradient-to-br from-rose-500 to-pink-500',
    code: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    analysis: 'bg-gradient-to-br from-emerald-500 to-green-500',
    research: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    productivity: 'bg-gradient-to-br from-amber-500 to-orange-500',
    creative: 'bg-gradient-to-br from-fuchsia-500 to-pink-500'
  }
  return bgMap[category] || 'bg-gradient-to-br from-violet-500 to-purple-500'
}

const isSkillInstalled = (id: string) => {
  return mySkills.value.some(s => s.id === id)
}

const installSkill = (skill: Skill) => {
  if (isSkillInstalled(skill.id)) return

  mySkills.value.push({
    ...skill,
    isEnabled: true
  })

  saveMySkills()
  message.success(t('skillsPage.addedSkill', { name: skill.name }))
}

const removeSkill = (skill: Skill) => {
  mySkills.value = mySkills.value.filter(s => s.id !== skill.id)
  saveMySkills()
  message.success(t('skillsPage.removedSkill', { name: skill.name }))
}

const toggleSkillStatus = (skill: Skill) => {
  saveMySkills()
  message.success(skill.isEnabled ? t('skillsPage.enabledSkill', { name: skill.name }) : t('skillsPage.disabledSkill', { name: skill.name }))
}

const openSkillDetail = (skill: Skill) => {
  selectedSkill.value = skill
  drawerVisible.value = true
}

const toggleTag = (tag: string) => {
  if (selectedTags.value.has(tag)) {
    selectedTags.value.delete(tag)
  } else {
    selectedTags.value.add(tag)
  }
}

const createSkill = () => {
  if (isCreating.value) return
  if (!createForm.value.name || !createForm.value.description) {
    message.warning(t('skillsPage.fillRequired'))
    return
  }
  isCreating.value = true

  const newSkill: Skill = {
    id: `custom-${Date.now()}`,
    name: createForm.value.name,
    description: createForm.value.description,
    category: createForm.value.category || 'productivity',
    icon: Zap,
    tags: [t('skillsPage.custom')],
    author: t('skillsPage.me'),
    isOfficial: false,
    downloadCount: 0,
    likeCount: 0,
    prompt: createForm.value.prompt,
    tools: createForm.value.selectedTools,
    isEnabled: true
  }

  mySkills.value.push(newSkill)
  saveMySkills()

  // Reset form
  createForm.value = {
    name: '',
    description: '',
    category: '',
    prompt: '',
    exampleInput: '',
    exampleOutput: '',
    selectedTools: []
  }

  activeTab.value = 'my-skills'
  message.success(t('skillsPage.createSuccess'))
  isCreating.value = false
}

const quickCreateSkill = () => {
  if (isCreating.value) return
  if (!quickCreateName.value) {
    message.warning(t('skillsPage.enterSkillName'))
    return
  }

  const newSkill: Skill = {
    id: `custom-${Date.now()}`,
    name: quickCreateName.value,
    description: quickCreateDesc.value || t('skillsPage.customSkill'),
    category: 'productivity',
    icon: Zap,
    tags: [t('skillsPage.custom')],
    author: t('skillsPage.me'),
    isOfficial: false,
    downloadCount: 0,
    likeCount: 0,
    isEnabled: true
  }

  mySkills.value.push(newSkill)
  saveMySkills()

  quickCreateName.value = ''
  quickCreateDesc.value = ''
  showCreateModal.value = false

  activeTab.value = 'my-skills'
  message.success(t('skillsPage.createSuccess'))
  isCreating.value = false
}

const saveMySkills = () => {
  localStorage.setItem('volo_my_skills', JSON.stringify(mySkills.value))
}

const loadMySkills = () => {
  const saved = localStorage.getItem('volo_my_skills')
  if (saved) {
    const data = JSON.parse(saved)
    // Rehydrate icon functions
    mySkills.value = data.map((s: Skill) => ({
      ...s,
      icon: iconMap[s.category as keyof typeof iconMap] || Zap
    }))
  }
}

// Lifecycle
onMounted(() => {
  loadMySkills()
})
</script>

<style scoped>
/* Custom scrollbar */
section::-webkit-scrollbar {
  width: 6px;
}

section::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

section::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}
</style>

<style lang="scss">
.dark {
  .skills-page section::-webkit-scrollbar-thumb {
    background: rgba(161, 161, 170, 0.2);
  }

  .skills-page section::-webkit-scrollbar-thumb:hover {
    background: rgba(161, 161, 170, 0.4);
  }
}
</style>
