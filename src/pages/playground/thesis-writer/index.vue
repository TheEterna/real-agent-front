<template>
  <div class="h-[100dvh] sm:h-screen w-full bg-slate-50/80 dark:bg-slate-900/80 flex flex-col overflow-hidden">
    <!-- Header - Glassmorphism -->
    <header class="backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50 px-3 sm:px-6 py-2.5 sm:py-4 flex flex-nowrap items-center shrink-0 z-20 relative gap-1.5 sm:gap-2">
      <!-- Left: Mobile Menu + Logo -->
      <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <!-- Mobile Sidebar Toggle (Left) -->
        <button
          class="lg:hidden w-9 min-w-9 h-9 sm:w-11 sm:min-w-11 sm:h-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 active:scale-95 shrink-0"
          :title="t('thesisWriter.index.outlineTitle')"
          :aria-label="t('thesisWriter.index.openOutline')"
          @click="mobileSidebarOpen = true"
        >
          <Menu :size="18" class="sm:hidden" />
          <Menu :size="20" class="hidden sm:block" />
        </button>
        <button
          class="hidden sm:flex w-9 min-w-9 h-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 active:scale-95 shrink-0"
          :title="t('thesisWriter.index.backToPlayground')"
          :aria-label="t('thesisWriter.index.backToPlayground')"
          @click="goBack"
        >
          <ArrowLeft :size="20" class="transition-transform duration-200 hover:-translate-x-0.5" />
        </button>
        <div class="w-8 min-w-8 h-8 sm:w-10 sm:min-w-10 sm:h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm shadow-slate-200/50 dark:shadow-black/20 shrink-0">
          <GraduationCap :size="16" class="sm:hidden" />
          <GraduationCap :size="20" class="hidden sm:block" />
        </div>
        <div class="hidden sm:block">
          <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100 tracking-tight">{{ t('thesisWriter.index.thesisWriterTitle') }}</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide">THESIS_WRITER_ASSISTANT</p>
        </div>
      </div>

      <!-- Center: Project Selector — 唯一可压缩区域 -->
      <div class="group flex items-center gap-1 min-w-0 flex-1 justify-center sm:justify-start overflow-hidden">
        <template v-if="!isEditingTitle">
          <Select :model-value="currentProjectId" @update:model-value="(val: any) => thesisStore.setCurrentProjectId(String(val))">
            <SelectTrigger class="h-8 px-2 sm:px-3 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-600/50 rounded-lg text-xs sm:text-sm text-slate-700 dark:text-slate-200 cursor-pointer transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-500 min-w-0">
              <SelectValue :placeholder="t('thesisWriter.index.selectProject')" />
            </SelectTrigger>
            <SelectContent class="backdrop-blur-md bg-white/95 dark:bg-slate-800/95 border-slate-200/50 dark:border-slate-600/50 rounded-lg shadow-lg shadow-slate-200/30 dark:shadow-black/30">
              <SelectItem
                v-for="project in projects"
                :key="project.id"
                :value="project.id"
                class="text-sm text-slate-700 dark:text-slate-200 cursor-pointer rounded-md transition-colors"
              >
                {{ project.title }}
              </SelectItem>
            </SelectContent>
          </Select>
          <button
            v-if="currentProject"
            class="hidden sm:flex w-6 min-w-6 h-6 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 shrink-0"
            :title="t('thesisWriter.index.editTitle')"
            :aria-label="t('thesisWriter.index.editTitleAria')"
            @click.stop="startEditTitle"
          >
            <Pencil :size="12" />
          </button>
          <button
            v-if="currentProject"
            class="hidden sm:flex w-6 min-w-6 h-6 items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
            :title="t('thesisWriter.index.deleteProject')"
            :aria-label="t('thesisWriter.index.deleteProjectAria')"
            @click.stop="openDeleteProjectConfirm"
          >
            <Trash2 :size="12" />
          </button>
        </template>
        <input
          v-else
          ref="titleInputRef"
          v-model="editingTitleValue"
          class="h-8 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded-lg px-3 outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 dark:focus:border-slate-500 text-slate-700 dark:text-slate-200 w-full min-w-0 sm:min-w-[320px]"
          :placeholder="t('thesisWriter.index.titlePlaceholder')"
          @keydown.enter="confirmEditTitle"
          @keydown.escape="cancelEditTitle"
          @blur="confirmEditTitle"
        />
      </div>

      <!-- Right: Actions + Mobile AI Toggle -->
      <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <!-- Mobile AI Panel Toggle -->
        <button
          class="lg:hidden w-9 min-w-9 h-9 sm:w-11 sm:min-w-11 sm:h-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 active:scale-95 shrink-0"
          :title="t('thesisWriter.index.mobileAIAssistant')"
          :aria-label="t('thesisWriter.index.openAIAssistant')"
          @click="mobileAIPanelOpen = true"
        >
          <Sparkles :size="18" class="sm:hidden" />
          <Sparkles :size="20" class="hidden sm:block" />
        </button>

        <!-- 选题工坊 — lg 以下只显示 icon，xl 以上显示文字 -->
        <button
          class="hidden lg:flex shrink-0 whitespace-nowrap px-2 xl:px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('thesisWriter.index.topicWorkshop')"
          :aria-label="t('thesisWriter.index.topicWorkshop')"
          :disabled="showTopicWorkshop"
          @click="showTopicWorkshop = true"
        >
          <Lightbulb :size="16" />
          <span class="hidden xl:inline">{{ t('thesisWriter.index.topicWorkshop') }}</span>
        </button>
        <!-- 历史记录 — lg 以下只显示 icon，xl 以上显示文字 -->
        <button
          class="hidden lg:flex shrink-0 whitespace-nowrap px-2 xl:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('thesisWriter.index.historyLabel')"
          :aria-label="t('thesisWriter.index.historyLabel')"
          :disabled="showHistory"
          @click="showHistory = true"
        >
          <History :size="16" />
          <span class="hidden xl:inline">{{ t('thesisWriter.index.historyLabel') }}</span>
        </button>
        <!-- 导出菜单 -->
        <div class="hidden lg:block shrink-0">
          <ExportMenu
            :project-id="currentProjectId"
            :project-title="currentProject?.title"
            :disabled="!currentProjectId"
          />
        </div>
        <!-- 新建论文 — lg 以下 icon-only，xl 以上显示文字 -->
        <button
          class="hidden lg:flex shrink-0 whitespace-nowrap px-2 xl:px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-white/10 transition-all duration-200 items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('thesisWriter.index.newProject')"
          :aria-label="t('thesisWriter.index.newProject')"
          :disabled="showNewProjectModal || isCreatingProject"
          @click="showNewProjectModal = true"
        >
          <Plus :size="16" />
          <span class="hidden xl:inline">{{ t('thesisWriter.index.newProject') }}</span>
        </button>

        <!-- Mobile/Tablet New Project Button (icon only, < lg) -->
        <button
          class="lg:hidden w-9 min-w-9 h-9 sm:w-11 sm:min-w-11 sm:h-11 flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all duration-200 active:scale-95 shrink-0"
          :title="t('thesisWriter.index.newProject')"
          :aria-label="t('thesisWriter.index.newProject')"
          :disabled="showNewProjectModal || isCreatingProject"
          @click="showNewProjectModal = true"
        >
          <Plus :size="18" class="sm:hidden" />
          <Plus :size="20" class="hidden sm:block" />
        </button>
      </div>
    </header>

    <!-- Mobile Sidebar Backdrop -->
    <div
      v-if="mobileSidebarOpen"
      class="lg:hidden fixed inset-0 bg-black/30 z-30 transition-opacity duration-200"
      @click="mobileSidebarOpen = false"
    ></div>

    <!-- Mobile AI Panel Backdrop -->
    <div
      v-if="mobileAIPanelOpen"
      class="lg:hidden fixed inset-0 bg-black/30 z-30 transition-opacity duration-200"
      @click="mobileAIPanelOpen = false"
    ></div>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden flex relative">
      <!-- Sidebar / Outline - Glassmorphism -->
      <!-- Mobile: Fixed overlay with slide animation -->
      <aside
        class="w-72 backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col z-10
               fixed lg:relative inset-y-0 left-0 z-40
               transform transition-transform duration-300 ease-out
               lg:translate-x-0"
        :class="mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        :aria-label="t('thesisWriter.index.outlineNav')"
      >
        <!-- Mobile Header -->
        <div class="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('thesisWriter.index.outlineLabel') }}</span>
          <button
            class="w-11 min-w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 active:scale-95 shrink-0"
            :title="t('thesisWriter.index.closeLabel')"
            :aria-label="t('thesisWriter.index.closeOutline')"
            @click="mobileSidebarOpen = false"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Outline Tree -->
        <div class="flex-1 overflow-y-auto p-2">
          <div class="flex items-center justify-between px-2 py-1.5 mb-2">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">{{ t('thesisWriter.index.outlineLabel') }}</span>
            <button
              class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              :title="t('thesisWriter.index.aiGenerateOutline')"
              :aria-label="t('thesisWriter.index.aiGenerateOutline')"
              :disabled="outlineStreaming"
              @click="generateOutline"
            >
              <Sparkles :size="14" class="transition-transform duration-200 hover:rotate-12 hover:scale-110" />
            </button>
          </div>

          <!-- Loading skeleton -->
          <template v-if="outlineLoading">
            <div v-for="i in 5" :key="i" class="p-3 mb-1">
              <div class="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
            </div>
          </template>

          <!-- Empty state -->
          <template v-else-if="outline.length === 0">
            <div class="flex flex-col items-center justify-center py-12">
              <FileText :size="32" class="mb-2 text-muted-foreground/50" />
              <p class="text-base text-muted-foreground">{{ t('thesisWriter.index.emptyOutline') }}</p>
              <button
                class="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="outlineStreaming"
                @click="generateOutline"
              >
                {{ outlineStreaming ? t('thesisWriter.index.generatingOutline') : t('thesisWriter.index.clickToGenerate') }}
              </button>
            </div>
          </template>

          <!-- Outline items -->
          <template v-else>
            <OutlineItem
              v-for="node in outline"
              :key="node.id"
              :node="node"
              :selected-id="selectedNodeId"
              @select="selectNode"
              @rename="handleOutlineRename"
              @add-child="handleOutlineAddChild"
              @delete="handleOutlineDelete"
              @move="handleOutlineMove"
            />
          </template>
        </div>

        <!-- 全文生成初稿按钮 -->
        <div v-if="currentProjectId && outline.length > 0" class="px-3 py-2 border-t border-slate-100/50 dark:border-slate-700/50">
          <button
            class="w-full px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium rounded-lg
                   hover:bg-amber-100 dark:hover:bg-amber-900/30 active:scale-[0.98] transition-all
                   flex items-center justify-center gap-2 border border-amber-200/50 dark:border-amber-700/30
                   disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="showBatchDraftModal"
            @click="showBatchDraftModal = true"
          >
            <Sparkles :size="14" />
            {{ t('thesisWriter.index.batchGenerateDraft') }}
          </button>
        </div>

        <!-- Health Dashboard (替换原来的简单进度条) -->
        <div class="border-t border-slate-100 dark:border-slate-700">
          <HealthDashboard :metrics="healthMetrics" />
        </div>
      </aside>

      <!-- Content Area -->
      <section class="flex-1 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col overflow-hidden" :aria-label="t('thesisWriter.index.editorArea')">
        <!-- No project selected -->
        <template v-if="!currentProjectId">
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <BookOpen :size="36" class="text-slate-400 dark:text-slate-500" />
              </div>
              <h2 class="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2 tracking-tight">{{ t('thesisWriter.index.startJourney') }}</h2>
              <p class="text-base text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {{ t('thesisWriter.index.startJourneyDesc') }}
              </p>
              <div class="flex gap-3 justify-center">
                <button
                  class="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="showTopicWorkshop"
                  @click="showTopicWorkshop = true"
                >
                  <Lightbulb :size="16" class="transition-transform duration-200 group-hover:rotate-12" />
                  {{ t('thesisWriter.index.smartTopic') }}
                </button>
                <button
                  class="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="showNewProjectModal || isCreatingProject"
                  @click="showNewProjectModal = true"
                >
                  {{ t('thesisWriter.index.createThesis') }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Editor Area (有项目时) -->
        <template v-else>
          <!-- View Mode Toggle -->
          <div class="shrink-0 px-4 py-2 border-b border-slate-100/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm flex items-center justify-between">
            <div class="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-700/50 rounded-lg p-0.5">
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                :class="viewMode === 'section'
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
                @click="thesisStore.setViewMode('section')"
              >
                <LayoutList :size="13" />
                {{ t('thesisWriter.index.sectionEdit') }}
              </button>
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                :class="viewMode === 'document'
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
                @click="thesisStore.setViewMode('document')"
              >
                <FileType :size="13" />
                {{ t('thesisWriter.index.fullView') }}
              </button>
            </div>
            <span v-if="viewMode === 'section' && selectedNodeTitle" class="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
              {{ selectedNodeTitle }}
            </span>
          </div>

          <!-- Section Mode: 分节编辑器 -->
          <template v-if="viewMode === 'section'">
            <div v-if="selectedNodeId" class="flex-1 flex flex-col overflow-hidden">
              <ChapterEditor
                ref="chapterEditorRef"
                :node-id="selectedNodeId"
                :project-id="currentProjectId"
                @content-saved="onContentSaved"
                @content-change="onContentChange"
                @show-version-history="showVersionHistory = true"
              />
            </div>
            <!-- No chapter selected -->
            <div v-else class="flex-1 flex items-center justify-center">
              <div class="text-center">
                <FileText :size="48" class="mx-auto mb-4 text-slate-400 dark:text-slate-500" />
                <p class="text-slate-500 dark:text-slate-400">{{ t('thesisWriter.index.selectChapterHint') }}</p>
              </div>
            </div>
          </template>

          <!-- Document Mode: 全文编辑器 -->
          <FullDocumentEditor
            v-else
            ref="fullDocEditorRef"
            :project-id="currentProjectId"
            :project-title="currentProject?.title || ''"
            :outline="outline"
            @content-saved="onContentSaved"
          />
        </template>
      </section>

      <!-- AI Assistant Panel - Glassmorphism -->
      <!-- Mobile/Tablet: Fixed overlay with slide animation from right -->
      <!-- Desktop (lg+): Always visible sidebar -->
      <aside
        class="w-80 lg:w-96 backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border-l border-slate-200/50 dark:border-slate-700/50 flex flex-col
               fixed lg:relative inset-y-0 right-0 z-40
               transform transition-transform duration-300 ease-out
               lg:translate-x-0"
        :class="mobileAIPanelOpen ? 'translate-x-0' : 'translate-x-full'"
        :aria-label="t('thesisWriter.index.aiAssistantLabel')"
      >
        <!-- Mobile Header -->
        <div class="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('thesisWriter.index.mobileAIAssistant') }}</span>
          <button
            class="w-11 min-w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 active:scale-95 shrink-0"
            :title="t('thesisWriter.index.closeLabel')"
            :aria-label="t('thesisWriter.index.closeAIAssistant')"
            @click="mobileAIPanelOpen = false"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- 模式切换 Tab -->
        <div class="shrink-0 p-3 border-b border-slate-100/50 dark:border-slate-700/50">
          <div class="flex bg-slate-100/80 dark:bg-slate-700/50 rounded-lg p-1 backdrop-blur-sm">
            <button
              v-for="mode in assistantModes"
              :key="mode.id"
              class="flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1.5 duration-200"
              :class="currentAssistantMode === mode.id
                ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600/50'"
              :title="mode.label"
              :aria-label="mode.label"
              @click="currentAssistantMode = mode.id"
            >
              <component :is="mode.icon" class="w-4 h-4 shrink-0 transition-transform duration-200" :class="{ 'rotate-12': currentAssistantMode === mode.id }" />
              <span class="hidden sm:inline whitespace-nowrap">{{ mode.label }}</span>
            </button>
          </div>
        </div>

        <!-- AI 助手内容 -->
        <div class="flex-1 overflow-hidden">
          <!-- 写作指导 -->
          <WritingGuidance
            v-if="currentAssistantMode === 'guidance'"
            :project-id="currentProjectId"
            :node-id="selectedNodeId"
            @insert-content="insertContent"
          />

          <!-- 对话模式 -->
          <AIAssistant
            v-else-if="currentAssistantMode === 'chat'"
            :project-id="currentProjectId"
            :node-id="selectedNodeId"
            @insert-content="insertContent"
          />

          <!-- 引用管理 -->
          <CitationPanel
            v-else-if="currentAssistantMode === 'citation'"
            :project-id="currentProjectId"
            @insert-citation="insertContent"
          />
        </div>
      </aside>
    </main>

    <!-- AI 生成大纲 Drawer -->
    <ADrawer
      v-model:open="outlineDrawerVisible"
      :title="t('thesisWriter.index.aiGenerateOutline')"
      placement="right"
      :width="outlineDrawerWidth"
    >
      <div class="space-y-4">
        <div v-if="outlineStreaming" class="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
          <Sparkles :size="16" class="animate-pulse" />
          <span>{{ t('thesisWriter.index.generatingOutline') }}</span>
        </div>
        <pre class="whitespace-pre-wrap text-sm text-slate-700 dark:text-zinc-300 leading-relaxed bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">{{ generatedOutlineText || t('thesisWriter.index.waitingGenerate') }}</pre>
        <div v-if="!outlineStreaming && generatedOutlineText" class="flex gap-2 pt-2 border-t border-slate-200 dark:border-zinc-700">
          <button
            class="px-4 py-2 text-sm bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isApplyingOutline"
            @click="applyGeneratedOutlineThrottled"
          >
            {{ isApplyingOutline ? t('thesisWriter.index.applyingOutline') : t('thesisWriter.index.applyOutline') }}
          </button>
          <button
            class="px-4 py-2 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isApplyingOutline"
            @click="generatedOutlineText = ''; generateOutline()"
          >
            {{ t('thesisWriter.index.regenerate') }}
          </button>
          <button
            class="px-4 py-2 text-sm bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isApplyingOutline"
            @click="outlineDrawerVisible = false"
          >
            {{ t('thesisWriter.index.closeLabel') }}
          </button>
        </div>
      </div>
    </ADrawer>

    <!-- 选题工坊 Modal -->
    <TopicWorkshop
      v-if="showTopicWorkshop"
      @select="handleTopicSelect"
      @close="showTopicWorkshop = false"
    />

    <!-- New Project Modal -->
    <AModal
      v-model:open="showNewProjectModal"
      :title="t('thesisWriter.index.newProjectModalTitle')"
      :footer="null"
      width="520px"
      centered
    >
      <NewProjectForm
        :initial-title="selectedTopicTitle"
        @submit="handleCreateProject"
        @cancel="showNewProjectModal = false"
      />
    </AModal>

    <!-- Version History Drawer -->
    <VersionHistory
      :node-id="selectedNodeId"
      :visible="showVersionHistory"
      @close="showVersionHistory = false"
      @restored="handleVersionRestored"
    />

    <!-- Command Palette (Cmd+K) -->
    <CommandPalette
      :visible="showCommandPalette"
      :project-id="currentProjectId"
      :node-id="selectedNodeId"
      @close="showCommandPalette = false"
      @execute="handleCommandExecute"
    />

    <!-- Writing History Panel -->
    <WritingHistoryPanel
      :visible="showHistory"
      :project-id="currentProjectId"
      @close="showHistory = false"
    />

    <!-- Batch Draft Modal -->
    <BatchDraftModal
      :visible="showBatchDraftModal"
      :project-id="currentProjectId"
      @close="showBatchDraftModal = false"
      @completed="handleBatchDraftCompleted"
    />

    <!-- 删除确认 Dialog -->
    <Dialog v-model:open="showDeleteConfirm">
      <DialogContent class="sm:max-w-md" :show-close-button="false">
        <DialogHeader>
          <DialogTitle class="text-slate-900 dark:text-slate-100">{{ deleteConfirmTitle }}</DialogTitle>
          <DialogDescription class="text-slate-500 dark:text-slate-400">
            {{ deleteConfirmDescription }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-3 pt-4">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            @click="showDeleteConfirm = false"
          >
            {{ t('thesisWriter.index.cancelBtn') }}
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isDeletingProject"
            @click="executeDeleteConfirm"
          >
            {{ isDeletingProject ? t('thesisWriter.index.deletingBtn') : t('thesisWriter.index.confirmDeleteBtn') }}
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 应用大纲确认 Dialog -->
    <Dialog v-model:open="showApplyOutlineConfirm">
      <DialogContent class="sm:max-w-lg" :show-close-button="false">
        <DialogHeader>
          <DialogTitle class="text-slate-900 dark:text-slate-100">{{ t('thesisWriter.index.applyOutline') }}</DialogTitle>
          <DialogDescription class="text-slate-500 dark:text-slate-400">
            {{ t('thesisWriter.index.applyOutlineDesc', { count: contentNodeCount }) }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-3 pt-2">
          <button
            class="w-full text-left p-3 rounded-lg border-2 transition-all duration-200"
            :class="applyOutlineMode === 'merge'
              ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-700/50'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'"
            @click="applyOutlineMode = 'merge'"
          >
            <div class="flex items-center gap-2 mb-1">
              <div
                class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                :class="applyOutlineMode === 'merge' ? 'border-slate-900 dark:border-slate-100' : 'border-slate-300 dark:border-slate-500'"
              >
                <div v-if="applyOutlineMode === 'merge'" class="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100" />
              </div>
              <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t('thesisWriter.index.mergeRecommended') }}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 ml-6">{{ t('thesisWriter.index.mergeDesc') }}</p>
          </button>
          <button
            class="w-full text-left p-3 rounded-lg border-2 transition-all duration-200"
            :class="applyOutlineMode === 'replace'
              ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-700/50'
              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'"
            @click="applyOutlineMode = 'replace'"
          >
            <div class="flex items-center gap-2 mb-1">
              <div
                class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                :class="applyOutlineMode === 'replace' ? 'border-slate-900 dark:border-slate-100' : 'border-slate-300 dark:border-slate-500'"
              >
                <div v-if="applyOutlineMode === 'replace'" class="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100" />
              </div>
              <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ t('thesisWriter.index.fullReplace') }}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 ml-6">{{ t('thesisWriter.index.fullReplaceDesc') }}</p>
          </button>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            @click="showApplyOutlineConfirm = false"
          >
            {{ t('thesisWriter.index.cancelBtn') }}
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isApplyingOutline"
            @click="confirmApplyOutline"
          >
            {{ isApplyingOutline ? t('thesisWriter.index.applyingOutline') : t('thesisWriter.index.confirmApply') }}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThrottleFn } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  ArrowLeft,
  GraduationCap,
  History,
  Plus,
  Sparkles,
  FileText,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Quote,
  LayoutList,
  FileType,
  Pencil,
  Trash2,
  Menu,
  X,
} from 'lucide-vue-next'
import { message, Modal as AModal, Drawer as ADrawer } from 'ant-design-vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CreateThesisRequest, TopicSuggestion, OutlineNode } from '@/types/thesis-writer'
import { useThesisSSE } from './composables/useThesisSSE'
import { useThesisStore } from './stores/thesisStore'

// 组件导入
import OutlineItem from './components/OutlineItem.vue'
import ChapterEditor from './components/ChapterEditor.vue'
import FullDocumentEditor from './components/FullDocumentEditor.vue'
import AIAssistant from './components/AIAssistant.vue'
import NewProjectForm from './components/NewProjectForm.vue'
import HealthDashboard from './components/HealthDashboard.vue'
import TopicWorkshop from './components/TopicWorkshop.vue'
import WritingGuidance from './components/WritingGuidance.vue'
import CitationPanel from './components/CitationPanel.vue'
import ExportMenu from './components/ExportMenu.vue'
import VersionHistory from './components/VersionHistory.vue'
import CommandPalette from './components/CommandPalette.vue'
import WritingHistoryPanel from './components/WritingHistoryPanel.vue'
import BatchDraftModal from './components/BatchDraftModal.vue'

const { t } = useI18n()
const router = useRouter()
const goBack = () => router.push('/playground')

// ==================== Store ====================
const thesisStore = useThesisStore()
const {
  projects,
  currentProjectId,
  currentProject,
  outline,
  outlineLoading,
  selectedNodeId,
  selectedNodeTitle,
  healthMetrics,
  viewMode,
} = storeToRefs(thesisStore)

// ==================== 模态框状态 ====================
const showNewProjectModal = ref(false)
const showHistory = ref(false)
const showTopicWorkshop = ref(false)
const selectedTopicTitle = ref('')
const showVersionHistory = ref(false)
const showCommandPalette = ref(false)
const showBatchDraftModal = ref(false)

// ==================== 移动端侧边栏状态 ====================
const mobileSidebarOpen = ref(false)
const mobileAIPanelOpen = ref(false)

// 切换节点时自动关闭移动端侧边栏
watch(selectedNodeId, () => {
  mobileSidebarOpen.value = false
  mobileAIPanelOpen.value = false
})

// ==================== 删除确认 Dialog ====================
const showDeleteConfirm = ref(false)
const deleteConfirmTitle = ref('')
const deleteConfirmDescription = ref('')
const deleteConfirmCallback = ref<(() => Promise<void>) | null>(null)
const isDeletingProject = ref(false)

// ==================== AI 助手模式 ====================
const currentAssistantMode = ref<'guidance' | 'chat' | 'citation'>('guidance')
const assistantModes = computed(() => [
  { id: 'guidance' as const, label: t('thesisWriter.index.tabWritingGuide'), icon: BookOpen },
  { id: 'chat' as const, label: t('thesisWriter.index.tabAI'), icon: MessageCircle },
  { id: 'citation' as const, label: t('thesisWriter.index.tabCitation'), icon: Quote },
])

// ==================== SSE ====================
const { streamWrite, isStreaming: outlineStreaming } = useThesisSSE()

// ==================== 大纲生成 ====================
const outlineDrawerVisible = ref(false)
const generatedOutlineText = ref('')
const isApplyingOutline = ref(false)

// 响应式 Drawer 宽度：小屏自适应，大屏最大 480px
const outlineDrawerWidth = computed(() => {
  if (typeof window === 'undefined') return 480
  return Math.min(480, window.innerWidth * 0.92)
})

// 应用大纲确认
const showApplyOutlineConfirm = ref(false)
const applyOutlineMode = ref<'merge' | 'replace'>('merge')
const contentNodeCount = ref(0)
const pendingParsedNodes = ref<{ level: number; title: string; description: string }[]>([])

// ==================== 编辑器相关 ====================
const chapterEditorRef = ref<InstanceType<typeof ChapterEditor> | null>(null)
const fullDocEditorRef = ref<InstanceType<typeof FullDocumentEditor> | null>(null)

// ==================== 论文标题编辑 ====================
const isEditingTitle = ref(false)
const editingTitleValue = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)

function startEditTitle() {
  if (!currentProject.value) return
  editingTitleValue.value = currentProject.value.title
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

async function confirmEditTitle() {
  const trimmed = editingTitleValue.value.trim()
  if (trimmed && currentProject.value && trimmed !== currentProject.value.title) {
    await thesisStore.handleUpdateProject(currentProject.value.id, { title: trimmed })
  }
  isEditingTitle.value = false
}

function cancelEditTitle() {
  isEditingTitle.value = false
}

// ==================== 删除确认操作 ====================
function openDeleteProjectConfirm() {
  if (!currentProject.value) return
  deleteConfirmTitle.value = t('thesisWriter.index.deleteProjectTitle')
  deleteConfirmDescription.value = t('thesisWriter.index.deleteProjectDesc', { title: currentProject.value.title })
  deleteConfirmCallback.value = async () => {
    isDeletingProject.value = true
    try {
      await thesisStore.handleDeleteProject(currentProject.value!.id)
    } finally {
      isDeletingProject.value = false
    }
  }
  showDeleteConfirm.value = true
}

async function executeDeleteConfirm() {
  if (deleteConfirmCallback.value) {
    await deleteConfirmCallback.value()
  }
  showDeleteConfirm.value = false
  deleteConfirmCallback.value = null
}

// ==================== 创建项目 ====================
const isCreatingProject = ref(false)

async function handleCreateProject(request: CreateThesisRequest) {
  if (isCreatingProject.value) return
  isCreatingProject.value = true

  try {
    const project = await thesisStore.handleCreateProject(request)
    if (project) {
      showNewProjectModal.value = false
      selectedTopicTitle.value = ''
    }
  } finally {
    isCreatingProject.value = false
  }
}

// ==================== 选题处理 ====================
function handleTopicSelect(topic: TopicSuggestion) {
  selectedTopicTitle.value = topic.title
  showTopicWorkshop.value = false
  showNewProjectModal.value = true
}

// ==================== 大纲操作 ====================
function selectNode(nodeId: string) {
  thesisStore.setSelectedNodeId(nodeId)
  // 全文模式下，滚动定位到对应章节
  if (viewMode.value === 'document' && fullDocEditorRef.value) {
    fullDocEditorRef.value.scrollTo(nodeId)
  }
}

// ==================== 大纲节点操作 ====================
const isOutlineOperating = ref(false)

async function handleOutlineRename(nodeId: string, newTitle: string) {
  if (isOutlineOperating.value) return
  isOutlineOperating.value = true
  try {
    const node = thesisStore.getNode(nodeId)
    if (!node) return
    const result = await thesisStore.handleOperateOutline({
      action: 'update',
      projectId: currentProjectId.value,
      nodeId,
      title: newTitle,
    })
    if (result) {
      await thesisStore.loadOutline()
      message.success(t('thesisWriter.index.chapterRenamed'))
    }
  } finally {
    isOutlineOperating.value = false
  }
}

async function handleOutlineAddChild(parentId: string, level: number) {
  if (isOutlineOperating.value) return
  isOutlineOperating.value = true
  try {
    const result = await thesisStore.handleOperateOutline({
      action: 'add',
      projectId: currentProjectId.value,
      parentId,
      level,
      title: t(level === 2 ? 'thesisWriter.index.newSection' : 'thesisWriter.index.newSubSection'),
      sortOrder: 999,
    })
    if (result) {
      await thesisStore.loadOutline()
      message.success(t('thesisWriter.index.subChapterAdded'))
    }
  } finally {
    isOutlineOperating.value = false
  }
}

function handleOutlineDelete(nodeId: string) {
  if (isOutlineOperating.value) return
  const node = thesisStore.getNode(nodeId)
  if (!node) return

  deleteConfirmTitle.value = t('thesisWriter.index.deleteChapterTitle')
  deleteConfirmDescription.value = t('thesisWriter.index.deleteChapterDesc', { title: node.title, hasChildren: node.children?.length ? 'true' : 'false' })
  deleteConfirmCallback.value = async () => {
    isOutlineOperating.value = true
    try {
      const result = await thesisStore.handleOperateOutline({
        action: 'delete',
        projectId: currentProjectId.value,
        nodeId,
      })
      if (result) {
        if (selectedNodeId.value === nodeId) {
          thesisStore.setSelectedNodeId('')
        }
        await thesisStore.loadOutline()
        message.success(t('thesisWriter.index.chapterDeleted'))
      }
    } finally {
      isOutlineOperating.value = false
    }
  }
  showDeleteConfirm.value = true
}

async function handleOutlineMove(nodeId: string, direction: 'up' | 'down') {
  if (isOutlineOperating.value) return
  isOutlineOperating.value = true
  try {
    const node = thesisStore.getNode(nodeId)
    if (!node) return

    // 找到同级兄弟节点
    const siblings = findSiblings(nodeId, outline.value)
    if (!siblings) return

    const currentIndex = siblings.findIndex(n => n.id === nodeId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= siblings.length) return

    const targetNode = siblings[targetIndex]

    // 交换两个节点的 sortOrder
    await thesisStore.handleOperateOutline({
      action: 'move',
      projectId: currentProjectId.value,
      nodeId,
      sortOrder: targetNode.sortOrder,
    })
    await thesisStore.handleOperateOutline({
      action: 'move',
      projectId: currentProjectId.value,
      nodeId: targetNode.id,
      sortOrder: node.sortOrder,
    })
    await thesisStore.loadOutline()
  } finally {
    isOutlineOperating.value = false
  }
}

/** 找到某节点的同级兄弟节点列表 */
function findSiblings(nodeId: string, nodes: OutlineNode[]): OutlineNode[] | null {
  for (const n of nodes) {
    if (n.id === nodeId) return nodes
    if (n.children) {
      const found = findSiblings(nodeId, n.children)
      if (found) return found
    }
  }
  return null
}

function generateOutline() {
  if (outlineStreaming.value) return
  if (!currentProjectId.value) {
    message.warning(t('thesisWriter.index.selectProjectFirst'))
    return
  }
  outlineDrawerVisible.value = true
  generatedOutlineText.value = ''

  streamWrite(
    {
      projectId: currentProjectId.value,
      action: 'generate_outline',
      prompt: `论文题目：${currentProject.value?.title || ''}`,
    },
    {
      onContent(chunk) { generatedOutlineText.value += chunk },
      onDone() { message.success(t('thesisWriter.index.outlineGenerated')) },
      onError(err) { message.error(t('thesisWriter.index.outlineGenerateFailed', { error: err })) },
    }
  )
}

// ==================== 大纲解析与应用 ====================

interface ParsedNode {
  level: number
  title: string
  description: string
  children: ParsedNode[]
}

/** 解析大纲文本为扁平节点列表 */
function parseOutlineText(text: string): { level: number; title: string; description: string }[] {
  const lines = text.split('\n').filter(l => l.includes('|'))
  const result: { level: number; title: string; description: string }[] = []

  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim())
    if (parts.length >= 2) {
      const level = parseInt(parts[0])
      const title = parts[1]
      const description = parts[2] || ''
      if (!isNaN(level) && level >= 1 && level <= 3 && title) {
        result.push({ level, title, description })
      }
    }
  }
  return result
}

/** 将扁平解析列表构建为树结构 */
function buildParsedTree(flat: { level: number; title: string; description: string }[]): ParsedNode[] {
  const roots: ParsedNode[] = []
  const stack: ParsedNode[] = []

  for (const item of flat) {
    const node: ParsedNode = { ...item, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    stack.push(node)
  }
  return roots
}

/** 检查节点或其后代是否有内容 */
function hasContent(node: OutlineNode): boolean {
  if (node.actualWordCount > 0) return true
  return (node.children || []).some(child => hasContent(child))
}

/** 统计有内容的节点数 */
function countContentNodes(nodes: OutlineNode[]): number {
  let count = 0
  for (const node of nodes) {
    if (node.actualWordCount > 0) count++
    count += countContentNodes(node.children || [])
  }
  return count
}

/** 入口：应用生成的大纲 */
async function applyGeneratedOutline() {
  if (isApplyingOutline.value) return

  const parsed = parseOutlineText(generatedOutlineText.value)
  if (parsed.length === 0) {
    message.warning(t('thesisWriter.index.parseOutlineFailed'))
    return
  }

  // 无现有大纲 → 直接全量添加
  if (outline.value.length === 0) {
    await executeFullReplace(parsed)
    return
  }

  // 有现有大纲但无内容 → 直接全量替换
  const count = countContentNodes(outline.value)
  if (count === 0) {
    await executeFullReplace(parsed)
    return
  }

  // 有内容 → 弹出确认 Dialog
  contentNodeCount.value = count
  pendingParsedNodes.value = parsed
  applyOutlineMode.value = 'merge'
  showApplyOutlineConfirm.value = true
}

/** 确认应用大纲 */
async function confirmApplyOutline() {
  showApplyOutlineConfirm.value = false
  if (applyOutlineMode.value === 'replace') {
    await executeFullReplace(pendingParsedNodes.value)
  } else {
    await executeIncrementalMerge(pendingParsedNodes.value)
  }
}

/** 全量替换（清空后重建） */
async function executeFullReplace(parsedNodes: { level: number; title: string; description: string }[]) {
  if (isApplyingOutline.value) return
  isApplyingOutline.value = true

  try {
    if (outline.value.length > 0) {
      await thesisStore.handleOperateOutline({
        action: 'clear_all',
        projectId: currentProjectId.value,
      })
    }

    const parentStack: Record<number, string> = {}
    for (let i = 0; i < parsedNodes.length; i++) {
      const node = parsedNodes[i]
      const parentId = node.level > 1 ? parentStack[node.level - 1] || undefined : undefined

      const result = await thesisStore.handleOperateOutline({
        action: 'add',
        projectId: currentProjectId.value,
        parentId,
        sortOrder: i,
        title: node.title,
        description: node.description,
        level: node.level,
      })
      if (result) {
        parentStack[node.level] = result.id
      }
    }

    await thesisStore.loadOutline()
    outlineDrawerVisible.value = false
    message.success(t('thesisWriter.index.outlineCreated', { count: parsedNodes.length }))
  } catch (e) {
    console.error('Failed to create outline nodes:', e)
    message.error(t('thesisWriter.index.createOutlineFailed'))
  } finally {
    isApplyingOutline.value = false
  }
}

/** 增量合并：按位置匹配，保留已有内容 */
async function executeIncrementalMerge(parsedNodes: { level: number; title: string; description: string }[]) {
  if (isApplyingOutline.value) return
  isApplyingOutline.value = true

  try {
    const parsedTree = buildParsedTree(parsedNodes)
    await mergeTree(outline.value, parsedTree, undefined, currentProjectId.value)

    await thesisStore.loadOutline()
    outlineDrawerVisible.value = false
    message.success(t('thesisWriter.index.outlineMerged'))
  } catch (e) {
    console.error('Failed to merge outline:', e)
    message.error(t('thesisWriter.index.mergeOutlineFailed'))
  } finally {
    isApplyingOutline.value = false
  }
}

/** 递归合并树：逐层按位置匹配 */
async function mergeTree(
  existing: OutlineNode[],
  parsed: ParsedNode[],
  parentId: string | undefined,
  projectId: string,
) {
  const maxLen = Math.max(existing.length, parsed.length)

  for (let i = 0; i < maxLen; i++) {
    const existNode = existing[i]
    const parsedNode = parsed[i]

    if (existNode && parsedNode) {
      // 两者都存在：更新标题/描述，递归子节点
      if (existNode.title !== parsedNode.title || (existNode.description || '') !== (parsedNode.description || '')) {
        await thesisStore.handleOperateOutline({
          action: 'update',
          projectId,
          nodeId: existNode.id,
          title: parsedNode.title,
          description: parsedNode.description || undefined,
        })
      }
      await mergeTree(existNode.children || [], parsedNode.children || [], existNode.id, projectId)
    } else if (parsedNode && !existNode) {
      // 仅在新大纲中存在：添加新子树
      await addSubtree(parsedNode, parentId, projectId, i)
    } else if (existNode && !parsedNode) {
      // 仅在旧大纲中存在：有内容则保留，无内容则删除
      if (!hasContent(existNode)) {
        await thesisStore.handleOperateOutline({
          action: 'delete',
          projectId,
          nodeId: existNode.id,
        })
      }
    }
  }
}

/** 递归添加全新子树 */
async function addSubtree(
  node: ParsedNode,
  parentId: string | undefined,
  projectId: string,
  sortOrder: number,
) {
  const result = await thesisStore.handleOperateOutline({
    action: 'add',
    projectId,
    parentId,
    sortOrder,
    title: node.title,
    description: node.description || undefined,
    level: node.level,
  })

  if (result && node.children.length > 0) {
    for (let i = 0; i < node.children.length; i++) {
      await addSubtree(node.children[i], result.id, projectId, i)
    }
  }
}

// 限流包装：防止高频重复点击
const applyGeneratedOutlineThrottled = useThrottleFn(applyGeneratedOutline, 1000)

// ==================== 编辑器操作 ====================
function onContentSaved() {
  thesisStore.loadOutline()
}

function onContentChange(_content: string) {
  // 预留给 Inline AI diff 等后续功能
}

function insertContent(content: string) {
  if (!selectedNodeId.value) {
    message.warning(t('thesisWriter.index.selectChapterFirst'))
    return
  }
  if (chapterEditorRef.value) {
    chapterEditorRef.value.insertText(content)
    message.success(t('thesisWriter.index.contentInserted'))
  }
}

// ==================== 批量生成初稿 ====================
function handleBatchDraftCompleted() {
  showBatchDraftModal.value = false
  thesisStore.loadOutline()
  // 刷新当前编辑器内容
  if (viewMode.value === 'document' && fullDocEditorRef.value) {
    fullDocEditorRef.value.reload()
  } else if (chapterEditorRef.value && selectedNodeId.value) {
    chapterEditorRef.value.reloadContent?.()
  }
}

// ==================== 版本历史 ====================
function handleVersionRestored() {
  if (chapterEditorRef.value && selectedNodeId.value) {
    thesisStore.loadOutline()
  }
}

// ==================== 命令面板 (Cmd+K) ====================
let commandAccumulator = ''

function handleCommandExecute(command: string) {
  if (!currentProjectId.value) {
    message.warning(t('thesisWriter.index.selectProjectFirst'))
    return
  }

  const knownActions = ['write_chapter', 'polish', 'format_check', 'expand_content', 'cite_suggestion']
  const action = knownActions.includes(command) ? command : 'write_chapter'
  const prompt = knownActions.includes(command) ? undefined : command
  commandAccumulator = ''

  streamWrite(
    {
      projectId: currentProjectId.value,
      nodeId: selectedNodeId.value || undefined,
      action: action as any,
      prompt,
    },
    {
      onContent(chunk) {
        commandAccumulator += chunk
      },
      onDone() {
        if (commandAccumulator) {
          insertContent(commandAccumulator)
        }
        commandAccumulator = ''
        message.success(t('thesisWriter.index.commandExecuted'))
      },
      onError(err) {
        commandAccumulator = ''
        message.error(t('thesisWriter.index.commandFailed', { error: err }))
      },
    }
  )
}

// ==================== 全局快捷键 ====================
function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Custom scrollbar */
aside::-webkit-scrollbar {
  width: 4px;
}

aside::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb {
  background: var(--color-slate-200, #e2e8f0);
  border-radius: 2px;
}

aside::-webkit-scrollbar-thumb:hover {
  background: var(--color-slate-300, #cbd5e1);
}
</style>

<!-- Dark mode scrollbar (non-scoped) -->
<style>
.dark aside::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
}

.dark aside::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
