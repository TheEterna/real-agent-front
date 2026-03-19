<template>
  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
  <div class="flex w-full h-[100dvh] sm:h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-800 dark:text-zinc-200">
    <!-- 左侧配置面板：仅 Classic 模式 -->
    <Transition name="panel">
      <aside
          v-if="mode === 'classic'"
          class="hidden sm:flex w-[280px] border-r border-zinc-200 dark:border-zinc-800 flex-col bg-white dark:bg-zinc-900 shrink-0 z-10 h-full overflow-hidden"
      >
        <div class="h-14 flex items-center px-4 border-b border-zinc-100 dark:border-zinc-800 justify-between">
          <div class="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold">
            <Settings class="w-[18px] h-[18px]" />
            <span>{{ t("playgroundBasic.image.configParams") }}</span>
          </div>
          <Button variant="ghost" size="icon-sm" :aria-label="t('playgroundBasic.image.closeConfig')" @click="mode = 'feed'">
            <PanelLeftClose class="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea class="flex-1">
          <div class="p-4 space-y-6">
            <!-- 模型选择 -->
            <div class="space-y-3">
              <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Model</label>
              <ModelSelector
                  :models="imageModels"
                  :selected-id="selectedModelId"
                  @select="selectModel"
              />
            </div>

            <!-- 动态参数面板（包含所有模型参数） -->
            <ParamPanelRenderer
                v-if="activeParamSchema && Object.keys(activeParamSchema).length > 0"
                :schema="activeParamSchema"
                :model="allParams"
                @update="updateParam"
            />
          </div>
        </ScrollArea>
      </aside>
    </Transition>

    <!-- 中央内容区 -->
    <div class="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-zinc-950">
      <!-- 左上角：返回 -->
      <div class="absolute top-3 sm:top-4 left-3 sm:left-4 z-30">
        <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm" :aria-label="t('playgroundBasic.image.back')" @click="goBack">
          <ArrowLeft class="w-4 h-4" />
        </Button>
      </div>

      <!-- 右上角：视图切换 -->
      <div class="absolute top-3 sm:top-4 right-3 sm:right-4 z-30">
        <div class="flex gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                  type="button"
                  class="w-11 h-11 sm:w-auto sm:h-auto p-2 sm:p-2 rounded-lg transition-all flex items-center justify-center"
                  :class="mode === 'feed' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'"
                  :aria-label="t('playgroundBasic.image.feedView')"
                  @click="mode = 'feed'"
              >
                <List class="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t("playgroundBasic.image.feedView") }}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                  type="button"
                  class="w-11 h-11 sm:w-auto sm:h-auto p-2 sm:p-2 rounded-lg transition-all flex items-center justify-center"
                  :class="mode === 'classic' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'"
                  :aria-label="t('playgroundBasic.image.classicView')"
                  @click="mode = 'classic'"
              >
                <LayoutGrid class="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t("playgroundBasic.image.classicView") }}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- 内容渲染容器 -->
      <div class="flex-1 flex flex-col relative overflow-hidden">
        <!-- Feed 模式 -->
        <ScrollArea v-show="mode === 'feed'" ref="feedScrollRef" class="flex-1 h-full">
          <div class="px-4 sm:px-8 pt-20 sm:pt-24 pb-10 sm:pb-12 space-y-8 sm:space-y-12 max-w-5xl mx-auto min-h-full flex flex-col">
            <!-- 空状态：居中 Hero 卡片 -->
            <div v-if="allItems.length === 0 && !generating" class="flex-1 flex items-center justify-center pb-32">
              <div class="relative overflow-hidden rounded-[32px] mx-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-8 md:p-12 max-w-2xl w-full">
                <!-- 装饰性背景 -->
                <div class="absolute inset-0 overflow-hidden">
                  <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
                  <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s" />
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
                  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
                </div>

                <div class="relative z-10 flex flex-col items-center text-center gap-6">
                  <!-- 装饰图标 -->
                  <div class="relative w-24 h-24">
                    <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-violet-500/20 rounded-3xl blur-2xl animate-pulse" />
                    <div class="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex items-center justify-center">
                      <ImageIcon class="w-12 h-12 text-white/40" :stroke-width="1.5" />
                    </div>
                  </div>

                  <!-- 文案 -->
                  <div class="space-y-3">
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold text-white/70 uppercase tracking-widest">
                      <Sparkles class="w-3 h-3 text-primary-400" />
                      AI Image Generation
                    </div>
                    <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                      {{ t("playgroundBasic.image.emptyHeroTitle") }}<span class="bg-gradient-to-r from-primary-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">{{ t("playgroundBasic.image.emptyHeroHighlight") }}</span>
                    </h1>
                    <p class="text-base text-white/50 max-w-md leading-relaxed">
                      {{ t("playgroundBasic.image.emptyHeroDesc") }}
                    </p>
                  </div>

                  <!-- 获取灵感按钮 -->
                  <button
                    class="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-sm font-semibold text-white/90 transition-all duration-300 hover:scale-105 active:scale-95"
                    @click="getRandomInspiration"
                  >
                    <Lightbulb class="w-4 h-4 text-amber-400 group-hover:animate-pulse" />
                    <span>{{ t("playgroundBasic.image.getInspiration") }}</span>
                    <Sparkles class="w-3.5 h-3.5 text-white/50 group-hover:text-primary-400 transition-colors" />
                  </button>

                  <!-- 支持的模型标签 -->
                  <div class="flex flex-wrap justify-center gap-2 pt-2">
                    <div
                      v-for="model in imageModels.slice(0, 4)"
                      :key="model.id"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                      @click="selectModel(model)"
                    >
                      <ProviderIcon :provider="model.provider" size="xs" colored />
                      <span class="text-xs font-medium text-white/60">{{ model.displayName }}</span>
                    </div>
                    <div
                      v-if="imageModels.length > 4"
                      class="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/40"
                    >
                      +{{ imageModels.length - 4 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Feed 任务列表 -->
            <div class="space-y-12">
              <div
                  v-for="item in allItems"
                  :key="item.id"
                  class="space-y-4 group animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="space-y-1 min-w-0">
                    <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug tracking-tight">{{ item.prompt }}</h3>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-800/50">
                        <ProviderIcon :provider="getModelProvider(item.modelId)" size="xs" colored />
                        {{ getModelDisplayName(item.modelId) }}
                      </span>
                      <span v-if="item.size" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-500 dark:text-zinc-500 border border-zinc-200/50 dark:border-zinc-800/50">
                        {{ formatSizeLabel(item.size) }}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 rounded-xl transition-all" :aria-label="t('playgroundBasic.image.moreActions')">
                        <MoreHorizontal class="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="rounded-2xl p-1.5 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                      <DropdownMenuItem class="rounded-xl p-2.5 font-medium transition-all" @click="selectHistoryItem(item)">
                        <LayoutGrid class="w-4 h-4 mr-2 opacity-50" />
                        {{ t("playgroundBasic.image.viewInCanvas") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive focus:text-destructive rounded-xl p-2.5 font-medium transition-all" @click="removeItem(item.id)">
                        <AlertCircle class="w-4 h-4 mr-2 opacity-50" />
                        {{ t("playgroundBasic.image.removeHistory") }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <!-- 成功：图像网格 -->
                <div
                    v-if="item.status === 'completed' && item.imageUrls?.length"
                    class="grid gap-6"
                    :class="getGridClass(item)"
                >
                  <div
                      v-for="(url, idx) in item.imageUrls"
                      :key="idx"
                      class="group relative rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
                      :class="getImageAspectClass(item)"
                  >
                    <img :src="url" :alt="`Generated ${idx + 1}`" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />
                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex gap-2">
                      <Button variant="secondary" size="icon" class="bg-white/95 dark:bg-zinc-900/95 shadow-2xl rounded-2xl h-10 w-10 backdrop-blur-md border border-white/20" :aria-label="t('playgroundBasic.image.fullscreenPreview')" @click.stop="openFullscreen(url)">
                        <Maximize2 class="w-4 h-4" />
                      </Button>
                      <Button variant="secondary" size="icon" class="bg-white/95 dark:bg-zinc-900/95 shadow-2xl rounded-2xl h-10 w-10 backdrop-blur-md border border-white/20" :aria-label="t('playgroundBasic.image.downloadImage')" @click.stop="downloadImage(url)">
                        <Download class="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <!-- 加载中：占位骨架 -->
                <div
                    v-else-if="item.status === 'processing' || item.status === 'pending'"
                    class="grid gap-6"
                    :class="getGridClass(item)"
                >
                  <div
                      v-for="i in item.n || 1"
                      :key="i"
                      class="aspect-square bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center p-8 gap-4 overflow-hidden"
                  >
                    <div class="relative">
                      <div class="absolute inset-0 blur-2xl bg-primary-500/10 animate-pulse rounded-full"></div>
                      <Loader2 class="w-8 h-8 text-primary-500 animate-spin relative" />
                    </div>
                    <span class="text-xs font-black text-zinc-400 animate-pulse uppercase tracking-widest">Rendering</span>
                  </div>
                </div>

                <!-- 错误 -->
                <div v-else-if="item.status === 'failed'" class="flex items-center gap-4 p-5 bg-destructive/5 dark:bg-destructive/10 rounded-3xl text-destructive border border-destructive/20 shadow-sm animate-in shake duration-500">
                  <AlertCircle class="w-5 h-5 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-bold block">{{ t("playgroundBasic.image.generateAborted") }}</span>
                    <span class="text-xs opacity-70 truncate block leading-relaxed">{{ item.errorMessage || t('playgroundBasic.image.unknownError') }}</span>
                  </div>
                  <Button variant="outline" size="sm" class="rounded-xl border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all font-bold px-4" @click="retryGenerate(item)">{{ t("playgroundBasic.image.regenerate") }}</Button>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        <!-- Classic 模式：画布 + 当前任务图 -->
        <div v-show="mode === 'classic'" class="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 p-6 pt-24 pb-48 relative overflow-hidden animate-in fade-in duration-500">
          <div class="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden relative bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-all">
            <div class="flex-1 flex items-center justify-center p-12 overflow-auto custom-scrollbar">
              <template v-if="currentTask">
                <template v-if="currentTask.status === 'completed' && currentTask.imageUrls?.length">
                  <div class="flex gap-8 items-center justify-center flex-wrap max-w-full">
                    <div
                        v-for="(url, idx) in currentTask.imageUrls"
                        :key="idx"
                        class="group relative rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] bg-white dark:bg-zinc-900 max-h-full transition-all duration-500 hover:scale-[1.02] border border-zinc-100 dark:border-zinc-800"
                        :style="{ maxWidth: currentTask.imageUrls.length > 1 ? '46%' : '95%' }"
                    >
                      <img :src="url" :alt="`Generated ${idx + 1}`" class="w-full h-auto object-contain max-h-[60vh]" />
                      <div class="absolute top-6 right-6 flex gap-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="secondary" size="icon" class="bg-white/95 dark:bg-zinc-900/95 shadow-2xl rounded-2xl w-10 h-10 backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all" :aria-label="t('playgroundBasic.image.fullscreenPreview')" @click.stop="openFullscreen(url)">
                          <Maximize2 class="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="icon" class="bg-white/95 dark:bg-zinc-900/95 shadow-2xl rounded-2xl w-10 h-10 backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all" :aria-label="t('playgroundBasic.image.downloadImage')" @click.stop="downloadImage(url)">
                          <Download class="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="currentTask.status === 'processing' || currentTask.status === 'pending'">
                  <div class="flex flex-col items-center gap-6">
                    <div class="relative">
                      <div class="absolute inset-0 blur-3xl bg-primary-500/20 animate-pulse rounded-full"></div>
                      <Loader2 class="w-12 h-12 text-primary-500 animate-spin relative" />
                    </div>
                    <div class="text-center space-y-1">
                      <span class="text-zinc-400 font-bold text-lg animate-pulse tracking-tight block uppercase">Rendering Masterpiece</span>
                      <span class="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-60">Blending your vision with AI</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center text-zinc-400 space-y-6 max-w-sm">
                    <div class="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-[32px] flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/20">
                      <AlertCircle class="w-10 h-10 text-red-500/60" />
                    </div>
                    <div class="space-y-1">
                      <p class="font-bold text-lg text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">{{ t("playgroundBasic.image.generateFailed") }}</p>
                      <p class="text-xs font-medium opacity-60 leading-relaxed">{{ currentTask.errorMessage || t('playgroundBasic.image.cannotComplete') }}</p>
                    </div>
                    <Button variant="outline" size="sm" class="rounded-2xl border font-bold px-8 h-10 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95" @click="retryGenerate(currentTask)">{{ t("playgroundBasic.image.regenerate") }}</Button>
                  </div>
                </template>
              </template>
              <div v-else class="text-center max-w-md space-y-6">
                <!-- 中央图标 -->
                <div class="relative mx-auto w-24 h-24">
                  <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-[28px] blur-2xl animate-pulse" />
                  <div class="relative w-full h-full bg-zinc-50 dark:bg-zinc-900 rounded-[28px] flex items-center justify-center shadow-inner border border-zinc-100 dark:border-zinc-800 group">
                    <ImageIcon class="w-10 h-10 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-600 transition-all duration-500 group-hover:scale-110" :stroke-width="1.5" />
                  </div>
                </div>

                <!-- 文案 -->
                <div class="space-y-2">
                  <h2 class="text-xl font-black text-zinc-800 dark:text-zinc-200 tracking-tight">Canvas Ready</h2>
                  <p class="text-base text-zinc-400 dark:text-zinc-500 leading-relaxed">{{ t("playgroundBasic.image.canvasDesc") }}</p>
                </div>

                <!-- 获取灵感按钮 -->
                <button
                  class="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 transition-all duration-300 hover:scale-105 active:scale-95"
                  @click="getRandomInspiration"
                >
                  <Lightbulb class="w-3.5 h-3.5 text-amber-500 group-hover:animate-pulse" />
                  <span>{{ t("playgroundBasic.image.getInspiration") }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部浮动输入条 -->
        <div class="absolute bottom-0 left-0 right-0 p-8 pt-0 z-20 pointer-events-none">
          <div class="relative max-w-4xl mx-auto flex flex-col gap-3 pointer-events-auto">
            <!-- 快捷参数 Pills：仅 Feed 模式显示 -->
            <div v-if="mode === 'feed' && quickParams.length > 0" class="flex items-center gap-1.5 pl-4 flex-wrap animate-in slide-in-from-bottom-2 duration-700">
              <QuickParamButton
                  v-for="param in quickParams"
                  :key="param.key"
                  :param="param"
                  :value="allParams[param.key]"
                  @update="updateParam(param.key, $event)"
              />
            </div>

            <!-- Input Box -->
            <div class="relative group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[24px] shadow-2xl border border-zinc-200/50 dark:border-zinc-800 flex items-center p-1 pl-4 transition-all duration-500 focus-within:ring-4 focus-within:ring-primary-500/5 focus-within:border-primary-500/20">
              <!-- 模型选择 Pill -->
              <Popover>
                <PopoverTrigger as-child>
                  <button
                      type="button"
                      class="mr-2 flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shrink-0 active:scale-95"
                  >
                    <ProviderIcon v-if="selectedModel" :provider="selectedModel.provider" size="xs" colored />
                    <span class="max-w-[80px] truncate uppercase tracking-widest">{{ selectedModel?.displayName ?? t('playgroundBasic.image.selectEngine') }}</span>
                    <ChevronDown class="w-3 h-3 opacity-30" />
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-72 p-2 border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-2xl backdrop-blur-2xl" align="start" :side-offset="12">
                  <div class="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1 flex items-center justify-between">
                    <span class="text-xs font-black text-zinc-400 uppercase tracking-widest">Creative Engines</span>
                  </div>
                  <ScrollArea class="h-[min(24rem,50vh)] px-1">
                    <div class="space-y-1">
                      <button
                          v-for="model in imageModels"
                          :key="model.id"
                          class="w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 group/item border border-transparent"
                          :class="selectedModelId === model.id ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'"
                          @click="selectModel(model)"
                      >
                        <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          <ProviderIcon :provider="model.provider" size="sm" colored />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-bold text-xs truncate">{{ model.displayName }}</div>
                          <div
                              class="text-xs font-bold truncate uppercase tracking-widest opacity-50"
                          >
                            {{ model.provider }}
                          </div>
                        </div>
                        <Sparkles v-if="selectedModelId === model.id" class="w-3 h-3 text-primary-500 animate-pulse" />
                      </button>
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <input
                  v-model="prompt"
                  type="text"
                  :placeholder="t('playgroundBasic.image.promptPlaceholder')"
                  :aria-label="t('playgroundBasic.image.promptLabel')"
                  class="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-200 font-medium text-sm placeholder:text-zinc-400 dark:placeholder:placeholder-zinc-600 h-10 caret-primary-500"
                  @keydown.enter="handleGenerate"
              />
              <button
                  :disabled="!canGenerate || generating"
                  :aria-label="generating ? t('playgroundBasic.image.generating') : t('playgroundBasic.image.generateImage')"
                  class="h-10 px-6 bg-zinc-900 dark:bg-zinc-100 hover:bg-black dark:hover:bg-white text-white dark:text-zinc-900 rounded-[18px] font-bold text-xs transition-all duration-300 disabled:opacity-20 disabled:grayscale disabled:scale-95 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 shrink-0"
                  @click="handleGenerate"
              >
                <div v-if="generating" class="relative">
                  <Loader2 :size="14" class="animate-spin" />
                </div>
                <Sparkles v-else :size="14" class="group-hover:rotate-12 transition-transform duration-500" />
                <span class="tracking-widest uppercase">Generate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏预览 Lightbox -->
    <Dialog v-model:open="showFullscreen">
      <DialogContent
        class="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none overflow-hidden [&>button]:hidden"
        @pointer-down-outside="showFullscreen = false"
      >
        <div class="relative flex items-center justify-center">
          <!-- 图片容器 -->
          <div class="relative group">
            <img
              v-if="fullscreenImage"
              :src="fullscreenImage"
              alt="Fullscreen preview"
              class="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />

            <!-- 顶部工具栏 -->
            <div class="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      variant="secondary"
                      size="icon"
                      class="h-10 w-10 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white shadow-xl"
                      :aria-label="t('playgroundBasic.image.downloadImage')"
                      @click="downloadImage(fullscreenImage!)"
                    >
                      <Download class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" class="bg-zinc-900 text-white border-zinc-800">
                    <p>{{ t("playgroundBasic.image.downloadImage") }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <Button
                      variant="secondary"
                      size="icon"
                      class="h-10 w-10 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white shadow-xl"
                      :aria-label="t('playgroundBasic.image.closePreview')"
                      @click="showFullscreen = false"
                    >
                      <X class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" class="bg-zinc-900 text-white border-zinc-800">
                    <p>{{ t("playgroundBasic.image.closeEsc") }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <!-- 底部信息栏 -->
            <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <span class="text-xs font-medium text-white/70">{{ t("playgroundBasic.image.clickOrEscClose") }}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h, type PropType, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft, Settings, Loader2, ImageIcon, Sparkles,
  Download, Maximize2, AlertCircle, MoreHorizontal, List, LayoutGrid,
  PanelLeftClose, ChevronDown, Lightbulb, X
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ProviderIcon from '@/components/ProviderIcon.vue'
import ParamPanelRenderer from '@/components/playground/ParamPanelRenderer.vue'
import { imageApi, getImageModelDisplayName, getImageModelProvider } from '@/api/playground-basic'
import type { ImageModelConfig, ImageGeneration, WorkbenchMode, ParamSchemaItem } from '@/types/playground-basic'
import { message } from 'ant-design-vue'

// =====================================================
// 子组件：模型选择器（避免重复代码）
// =====================================================
const ModelSelector = defineComponent({
  props: {
    models: { type: Array as PropType<ImageModelConfig[]>, required: true },
    selectedId: { type: String, required: true }
  },
  emits: ['select'],
  template: `
    <div class="grid grid-cols-1 gap-2">
      <button
        v-for="model in models"
        :key="model.id"
        type="button"
        class="p-3 rounded-xl border text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3"
        :class="selectedId === model.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 border-primary-500' : 'border-zinc-200 dark:border-zinc-700'"
        @click="$emit('select', model)"
      >
        <ProviderIcon :provider="model.provider" size="md" colored />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">{{ model.displayName }}</p>
          <p class="text-xs text-zinc-500 truncate">{{ model.provider }}</p>
        </div>
      </button>
    </div>
  `
})

// =====================================================
// 子组件：快捷参数按钮（Feed 模式底部 Pill）
// =====================================================
const QuickParamButton = defineComponent({
  props: {
    param: { type: Object as PropType<{ key: string; label: string; options: Array<{value: any; label: string}> }>, required: true },
    value: { required: true }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const currentValue = computed(() => props.value ?? props.param.options?.[0]?.value)

    return () => h('div', { class: 'flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50' },
        props.param.options?.map(opt => h('button', {
          type: 'button',
          key: String(opt.value),
          class: [
            'px-3 h-7 flex items-center justify-center rounded-full text-xs font-black transition-all active:scale-95',
            currentValue.value === opt.value
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'
          ],
          onClick: () => emit('update', opt.value)
        }, opt.label))
    )
  }
})

// =====================================================
// 主逻辑
// =====================================================
const router = useRouter()
const { t } = useI18n()

// 状态
const mode = ref<WorkbenchMode>('feed')

// 监听模式切换，自动触发一次滚动
watch(mode, () => {
  scrollToBottom()
})

const imageModels = ref<ImageModelConfig[]>([])
const selectedModelId = ref<string>('')
const historyItems = ref<ImageGeneration[]>([])
const feedItems = ref<ImageGeneration[]>([])
const loadingHistory = ref(false)
const currentTaskId = ref<string | null>(null)
const prompt = ref('')
const generating = ref(false)
const showFullscreen = ref(false)
const fullscreenImage = ref<string | null>(null)
const feedScrollRef = ref<InstanceType<typeof ScrollArea> | null>(null)

// =====================================================
// 统一参数管理
// =====================================================
/**
 * 所有参数的统一管理
 * 1. 基础参数：size, n, quality, style
 * 2. 动态参数：从 paramSchema 渲染的参数（包括 image, mask 等）
 * 3. referenceImageUrl/maskImageUrl：仅用于 OpenAI edits endpoint
 */
const allParams = ref<Record<string, any>>({
  size: '1024x1024',
  n: 1,
  quality: 'standard',
  style: 'vivid'
})

/**
 * 当前模型的参数 Schema（合并基础参数和动态参数）
 */
const activeParamSchema = computed<Record<string, ParamSchemaItem>>(() => {
  const model = selectedModel.value
  if (!model) return {}

  const schema: Record<string, ParamSchemaItem> = {}

  // 1. 基础参数：{{ t("playgroundBasic.image.sizeShort") }} (如果模型支持)
  if (model.supportedSizes?.length) {
    schema.size = {
      type: 'select',
      label: '{{ t("playgroundBasic.image.sizeLabel") }}',
      default: model.defaultParams?.size || model.supportedSizes[0],
      options: model.supportedSizes.map(size => ({
        value: size,
        label: formatSizeLabel(size)
      }))
    }
  }

  // 2. 基础参数：数量 (如果模型支持多张)
  if (model.maxImages && model.maxImages > 1) {
    const opts = [1, 2, 4, 8].filter(c => c <= model.maxImages)
    schema.n = {
      type: 'select',
      label: '{{ t("playgroundBasic.image.countLabel") }}',
      default: model.defaultParams?.n || 1,
      options: opts.map(v => ({ value: v, label: `${v} 张` }))
    }
  }

  // 3. 模型定义的动态参数（合并并覆盖基础参数中的同名项）
  if (model.paramSchema) {
    for (const [key, item] of Object.entries(model.paramSchema)) {
      schema[key] = {
        ...item,
        label: item.label || key,
        default: allParams.value[key] ?? (item as any).defaultValue ?? item.default
      }
    }
  }

  return schema
})

/**
 * Feed 模式快捷参数
 */
interface QuickParam {
  key: string
  label: string
  options: Array<{ value: any; label: string }>
}
// =====================================================
// 空状态：灵感提示词
// =====================================================
const inspirationPrompts = [
  'A cyberpunk cityscape at night, neon lights reflecting on wet streets, flying cars, holographic advertisements, ultra detailed, 8k',
  'An enchanted forest with bioluminescent plants, magical creatures, ethereal mist, fantasy art style, dreamy atmosphere',
  'A futuristic space station orbiting Earth, sleek metallic design, panoramic windows showing stars, astronauts floating, sci-fi concept art',
  'An adorable fluffy cat wearing a tiny wizard hat, sitting on a stack of ancient books, magical sparkles, studio lighting, photorealistic',
  'Majestic mountain landscape at golden hour, crystal clear lake reflection, snow-capped peaks, dramatic clouds, National Geographic style',
  'Abstract fluid art, vibrant colors blending together, marble texture, gold accents, modern art gallery piece, 4k resolution',
  'A cozy Japanese ramen shop at midnight, steam rising from bowls, warm lighting, rainy street outside, anime style illustration',
  'Ancient Greek temple ruins at sunset, dramatic sky, marble columns, overgrown with vines, cinematic lighting, hyperrealistic',
  'Underwater coral reef city, mermaids and sea creatures, bioluminescent glow, crystal clear water, fantasy concept art',
  'Steampunk airship flying through clouds, brass and copper details, Victorian era aesthetics, dramatic sky, digital painting'
]

/**
 * 获取随机灵感提示词
 */
function getRandomInspiration() {
  const randomIndex = Math.floor(Math.random() * inspirationPrompts.length)
  prompt.value = inspirationPrompts[randomIndex]
}

const quickParams = computed<QuickParam[]>(() => {
  const schema = activeParamSchema.value
  const params: QuickParam[] = []

  // 优先级：{{ t("playgroundBasic.image.sizeShort") }} > 数量 > 宽高比
  if (schema.size?.options) {
    params.push({
      key: 'size',
      label: '{{ t("playgroundBasic.image.sizeShort") }}',
      options: schema.size.options
    })
  }

  if (schema.n?.options) {
    params.push({
      key: 'n',
      label: '{{ t("playgroundBasic.image.countShort") }}',
      options: schema.n.options
    })
  }

  // 自动提取 schema 中类型为 select 的动态参数作为快捷按钮
  for (const [key, item] of Object.entries(schema)) {
    if (key !== 'size' && key !== 'n' && item.type === 'select' && item.options) {
      if (params.length < 4) { // 最多显示 4 个快捷操作
        params.push({
          key,
          label: item.label,
          options: item.options
        })
      }
    }
  }

  return params
})

// =====================================================
// Computed
// =====================================================
const selectedModel = computed(() =>
    imageModels.value.find(m => m.id === selectedModelId.value)
)

const canGenerate = computed(() =>
    Boolean(prompt.value.trim() && selectedModelId.value)
)

// 合并所有任务（Feed 模式显示）
const allItems = computed(() => {
  const feed = feedItems.value ?? []
  const history = historyItems.value ?? []
  // Feed items 优先显示在前
  const feedIds = new Set(feed.map(t => t.id))
  const historyFiltered = history.filter(t => !feedIds.has(t.id))
  return [...feed, ...historyFiltered]
})

// 当前选中的任务
const currentTask = computed(() => {
  if (!currentTaskId.value) return null
  const history = historyItems.value ?? []
  const feed = feedItems.value ?? []
  return history.find(t => t.id === currentTaskId.value)
      || feed.find(t => t.id === currentTaskId.value)
})

// =====================================================
// 滚动控制
// =====================================================
const scrollToBottom = () => {
  if (mode.value === 'feed') {
    setTimeout(() => {
      const scrollEl = feedScrollRef.value?.$el?.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollEl) {
        scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' })
      }
    }, 100)
  }
}

// =====================================================
// 工具函数
// =====================================================
function formatSizeLabel(size: string): string {
  const [w, h] = size.split('x').map(Number)
  if (!w || !h) return size
  if (w === h) return '1:1'
  const ratio = w / h
  if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9'
  if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16'
  if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3'
  if (Math.abs(ratio - 3 / 4) < 0.1) return '3:4'
  return `${w}:${h}`
}

function getModelDisplayName(modelId: string): string {
  return getImageModelDisplayName(imageModels.value, modelId)
}

function getModelProvider(modelId: string): string {
  return getImageModelProvider(imageModels.value, modelId)
}

function getGridClass(item: ImageGeneration): string {
  const n = item.n || 1
  if (n === 1) return 'grid-cols-1 max-w-md'
  if (n === 2) return 'grid-cols-2'
  return 'grid-cols-2 md:grid-cols-4'
}

function getImageAspectClass(item: ImageGeneration): string {
  const size = item.size || '1024x1024'
  const label = formatSizeLabel(size)
  if (label === '16:9' || label === '4:3') return 'aspect-video'
  if (label === '9:16' || label === '3:4') return 'aspect-[9/16]'
  return 'aspect-square'
}

// =====================================================
// 操作函数
// =====================================================
function goBack() {
  router.push('/playground')
}

function createNewTask() {
  currentTaskId.value = null
  prompt.value = ''
}

function selectHistoryItem(task: ImageGeneration) {
  currentTaskId.value = task.id
  prompt.value = task.prompt ?? ''
  // 不再强制切换 mode.value = 'classic'，让用户保持当前视图
}

function removeItem(id: string) {
  feedItems.value = (feedItems.value ?? []).filter(t => t.id !== id)
  if (currentTaskId.value === id) {
    currentTaskId.value = (historyItems.value ?? [])[0]?.id ?? null
  }
}

/**
 * 选择模型并初始化参数
 */
function selectModel(model: ImageModelConfig) {
  selectedModelId.value = model.id
  initializeParamsForModel(model)
}

/**
 * 初始化模型参数（统一的初始化逻辑）
 */
function initializeParamsForModel(model: ImageModelConfig) {
  const newParams: Record<string, any> = {}

  // 1. 先加载所有 Schema 中的默认值 (处理 default 和 defaultValue)
  if (model.paramSchema) {
    for (const [key, schema] of Object.entries(model.paramSchema)) {
      const defaultValue = (schema as any).defaultValue ?? schema.default
      if (defaultValue !== undefined) {
        newParams[key] = defaultValue
      }
    }
  }

  // 2. 使用配置的默认参数覆盖
  if (model.defaultParams) {
    Object.assign(newParams, model.defaultParams)
  }

  // 3. 基础参数兜底
  newParams.size = newParams.size || model.supportedSizes?.[0] || '1024x1024'
  if (newParams.n === undefined) newParams.n = 1

  allParams.value = newParams
}

/**
 * 更新参数（统一的更新入口）
 */
function updateParam(key: string, value: any) {
  allParams.value[key] = value
}

/**
 * 重试生成（恢复参数并重新生成）
 */
function retryGenerate(item: ImageGeneration) {
  prompt.value = item.prompt
  selectedModelId.value = item.modelId

  // 恢复参数（转换为 allParams 格式）
  const paramsToRestore: Record<string, any> = {
    n: item.n || 1
  }
  if (item.size) paramsToRestore.size = item.size
  if (item.quality) paramsToRestore.quality = item.quality
  if (item.style) paramsToRestore.style = item.style

  Object.assign(allParams.value, paramsToRestore)
  handleGenerate()
}

/**
 * 构建生成请求（与后端 ImageGenerateRequest 对齐）
 */
function buildGenerateRequest() {
  const model = selectedModel.value
  if (!model) return null

  // 构建 params 对象（后端 ImageGenerationParams）
  const params: Record<string, any> = {
    numberOfImages: allParams.value.n || 1
  }

  // OpenAI 参数
  if (allParams.value.size) params.size = allParams.value.size
  if (allParams.value.quality) params.quality = allParams.value.quality
  if (allParams.value.style) params.style = allParams.value.style
  if (allParams.value.background) params.background = allParams.value.background

  // Gemini 参数
  if (allParams.value.aspectRatio) params.aspectRatio = allParams.value.aspectRatio
  if (allParams.value.personGeneration) params.personGeneration = allParams.value.personGeneration
  if (allParams.value.safetyFilterLevel) params.safetyFilterLevel = allParams.value.safetyFilterLevel

  // 检查是否有图片参数（用于判断是否使用 edit endpoint）
  const hasImageParam = model.paramSchema?.image?.type === 'image' && allParams.value.image
  const hasMaskParam = model.paramSchema?.mask?.type === 'image' && allParams.value.mask

  return {
    modelId: model.id,
    prompt: prompt.value.trim(),
    negativePrompt: allParams.value.negativePrompt || undefined,
    params,
    referenceImageId: hasImageParam ? allParams.value.image : undefined,
    editType: hasImageParam ? 'edit' : 'generate',
    maskBase64: hasMaskParam ? allParams.value.mask : undefined
  }
}

/**
 * 将后端 ImageMessageVO 转换为前端 ImageGeneration 格式
 */
function convertMessageToGeneration(msg: any, requestParams: any): ImageGeneration {
  const content = msg.content || {}
  const images = content.images || []

  return {
    id: msg.id || `temp-${Date.now()}`,
    modelId: requestParams.modelId,
    prompt: content.prompt || requestParams.prompt,
    negativePrompt: content.negativePrompt,
    size: requestParams.params?.size || '',
    quality: requestParams.params?.quality || '',
    style: requestParams.params?.style || '',
    n: requestParams.params?.numberOfImages || 1,
    imageUrls: images.map((img: any) => img.url).filter(Boolean),
    creditsCharged: msg.creditsCharged || 0,
    status: images.length > 0 ? 'completed' : 'failed',
    errorMessage: content.errorMessage,
    createdTime: msg.createdTime || new Date().toISOString()
  }
}

/**
 * 处理生成
 */
async function handleGenerate() {
  if (!canGenerate.value || generating.value) return

  const request = buildGenerateRequest()
  if (!request) return

  generating.value = true
  const _currentPrompt = prompt.value // 保留用于可能的错误恢复
  prompt.value = ''

  // 创建占位任务（显示加载状态）
  const tempTask: ImageGeneration = {
    id: `temp-${Date.now()}`,
    modelId: request.modelId,
    prompt: request.prompt,
    size: request.params?.size || '',
    quality: request.params?.quality || '',
    style: request.params?.style || '',
    n: request.params?.numberOfImages || 1,
    imageUrls: [],
    creditsCharged: 0,
    status: 'processing',
    createdTime: new Date().toISOString()
  }

  feedItems.value = [tempTask, ...(feedItems.value ?? [])]
  currentTaskId.value = tempTask.id
  scrollToBottom()

  try {
    const response = await imageApi.generate(request)
    const msgVO = response.data

    // 将 ImageMessageVO 转换为 ImageGeneration 格式
    const task = convertMessageToGeneration(msgVO, request)

    // 更新 feedItems 中的占位任务
    feedItems.value = feedItems.value.map(item =>
      item.id === tempTask.id ? task : item
    )
    currentTaskId.value = task.id

    // 完成后加入历史
    if (task.status === 'completed' && task.imageUrls?.length) {
      historyItems.value = [task, ...(historyItems.value ?? []).filter(t => t.id !== task.id)]
      message.success(t('playgroundBasic.image.generateComplete'))
    } else if (task.status === 'failed') {
      message.error(task.errorMessage || t('playgroundBasic.image.generateFailed'))
    }
  } catch (e) {
    // 更新占位任务为失败状态
    feedItems.value = feedItems.value.map(item =>
      item.id === tempTask.id
        ? { ...item, status: 'failed' as const, errorMessage: (e as Error).message || t('playgroundBasic.image.generateFailed') }
        : item
    )
    message.error((e as Error).message || t('playgroundBasic.image.generateFailed'))
  } finally {
    generating.value = false
  }
}

async function downloadImage(url: string) {
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(t('playgroundBasic.image.downloadFailed'))
    const blob = await resp.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `image-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(a.href)
    message.success(t('playgroundBasic.image.downloadSuccess'))
  } catch {
    message.error(t('playgroundBasic.image.downloadNetworkError'))
  }
}

function openFullscreen(url: string) {
  fullscreenImage.value = url
  showFullscreen.value = true
}

// =====================================================
// 生命周期
// =====================================================
onMounted(async () => {
  // 加载模型列表
  try {
    const res = await imageApi.getModels()
    imageModels.value = res.data ?? []
    if (imageModels.value.length > 0) {
      // 选择 sortOrder 最小的（特色模型）
      const featured = [...imageModels.value].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))[0]
      selectModel(featured)
    }
  } catch (e) {
    console.error('加载模型列表失败:', e)
  }

  // 加载历史记录
  loadingHistory.value = true
  try {
    const res = await imageApi.getHistory(0, 50)
    // 将 ImageMessageVO[] 转换为 ImageGeneration[]
    historyItems.value = (res.data ?? []).map(msg => {
      const content = msg.content || {}
      const images = content.images || []
      return {
        id: msg.id,
        modelId: msg.modelId || '',
        prompt: content.prompt || '',
        negativePrompt: content.negativePrompt,
        size: content.params?.size || '',
        quality: content.params?.quality || '',
        style: content.params?.style || '',
        n: content.params?.numberOfImages || 1,
        imageUrls: images.map((img: any) => img.url).filter(Boolean),
        creditsCharged: msg.creditsCharged || 0,
        status: images.length > 0 ? 'completed' as const : 'failed' as const,
        errorMessage: content.errorMessage,
        createdTime: msg.createdTime
      }
    })
    // 选择第一个历史任务
    if (historyItems.value.length > 0) {
      currentTaskId.value = historyItems.value[0].id
    }
  } catch (e) {
    console.error('加载历史失败:', e)
  } finally {
    loadingHistory.value = false
  }
})

// 监听模型切换，自动初始化参数（通过 selectModel 已处理，这里不需要重复）
</script>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: width 0.25s var(--ease-fluid), opacity 0.2s var(--ease-fluid);
}
.panel-enter-from,
.panel-leave-to {
  width: 0;
  opacity: 0;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.5);
}
</style>

<!-- Dark mode scrollbar -->
<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}
</style>
