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
            <span>{{ t("playgroundBasic.video.configParams") }}</span>
          </div>
          <Button variant="ghost" size="icon-sm" :aria-label="t('playgroundBasic.video.closeConfig')" @click="mode = 'feed'">
            <PanelLeftClose class="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea class="flex-1">
          <div class="p-4 space-y-6">
            <!-- 模型选择 -->
            <div class="space-y-3">
              <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Model</label>
              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="model in models"
                  :key="model.id"
                  type="button"
                  class="p-3 rounded-xl border text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-3"
                  :class="selectedModelId === model.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-zinc-200 dark:border-zinc-700'"
                  @click="selectModel(model)"
                >
                  <ProviderIcon :provider="model.provider" size="md" colored />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm truncate">{{ model.displayName }}</p>
                    <p class="text-xs text-zinc-500 truncate">{{ model.provider }}</p>
                  </div>
                </button>
              </div>
            </div>

            <!-- 动态参数面板 -->
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
        <Button
          variant="ghost"
          size="icon"
          class="w-11 h-11 sm:w-auto sm:h-auto rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
          :aria-label="t('playgroundBasic.video.back')"
          @click="goBack"
        >
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
                :aria-label="t('playgroundBasic.video.feedView')"
                @click="mode = 'feed'"
              >
                <List class="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t("playgroundBasic.video.feedView") }}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                type="button"
                class="w-11 h-11 sm:w-auto sm:h-auto p-2 sm:p-2 rounded-lg transition-all flex items-center justify-center"
                :class="mode === 'classic' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'"
                :aria-label="t('playgroundBasic.video.classicView')"
                @click="mode = 'classic'"
              >
                <LayoutGrid class="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t("playgroundBasic.video.classicView") }}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- 内容渲染容器 -->
      <div class="flex-1 flex flex-col relative overflow-hidden">
        <!-- Feed 模式 -->
        <ScrollArea v-show="mode === 'feed'" ref="feedScrollRef" class="flex-1 h-full">
          <div class="px-4 sm:px-8 pt-20 sm:pt-24 pb-10 sm:pb-12 space-y-8 sm:space-y-12 max-w-5xl mx-auto min-h-full flex flex-col pb-42">
            <!-- 空状态：居中 Hero 卡片 -->
            <div v-if="allItems.length === 0 && !generating" class="flex-1 flex items-center justify-center">
              <div class="relative overflow-hidden rounded-[32px] mx-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-8 md:p-12 max-w-2xl w-full">
                <!-- 装饰性背景 -->
                <div class="absolute inset-0 overflow-hidden">
                  <div class="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
                  <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s" />
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
                </div>

                <div class="relative z-10 flex flex-col items-center text-center gap-6">
                  <!-- 装饰图标 -->
                  <div class="relative w-24 h-24">
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-3xl blur-2xl animate-pulse" />
                    <div class="relative w-full h-full bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 flex items-center justify-center">
                      <Video class="w-12 h-12 text-white/40" :stroke-width="1.5" />
                    </div>
                  </div>

                  <!-- 文案 -->
                  <div class="space-y-3">
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-bold text-white/70 uppercase tracking-widest">
                      <Film class="w-3 h-3 text-cyan-400" />
                      AI Video Generation
                    </div>
                    <h1 class="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                      {{ t("playgroundBasic.video.emptyHeroTitle") }}<span class="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">{{ t("playgroundBasic.video.emptyHeroHighlight") }}</span>
                    </h1>
                    <p class="text-base text-white/50 max-w-md leading-relaxed">
                      {{ t("playgroundBasic.video.emptyHeroDesc") }}
                    </p>
                  </div>

                  <!-- 获取灵感按钮 -->
                  <button
                    class="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30 text-sm font-semibold text-white/90 transition-all duration-300 hover:scale-105 active:scale-95"
                    @click="getRandomInspiration"
                  >
                    <Lightbulb class="w-4 h-4 text-amber-400 group-hover:animate-pulse" />
                    <span>{{ t("playgroundBasic.video.getInspiration") }}</span>
                    <Sparkles class="w-3.5 h-3.5 text-white/50 group-hover:text-cyan-400 transition-colors" />
                  </button>

                  <!-- 支持的模型标签 -->
                  <div class="flex flex-wrap justify-center gap-2 pt-2">
                    <div
                      v-for="model in models.slice(0, 4)"
                      :key="model.id"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                      @click="selectModel(model)"
                    >
                      <ProviderIcon :provider="model.provider" size="xs" colored />
                      <span class="text-xs font-medium text-white/60">{{ model.displayName }}</span>
                    </div>
                    <div
                      v-if="models.length > 4"
                      class="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/40"
                    >
                      +{{ models.length - 4 }}
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
                <!-- 标题与操作 -->
                <div class="flex items-start justify-between gap-4">
                  <div class="space-y-1 min-w-0">
                    <h3 class="text-base font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug tracking-tight">{{ item.prompt }}</h3>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-800/50">
                        <ProviderIcon :provider="getModelProvider(item.modelId)" size="xs" colored />
                        {{ getModelDisplayName(item.modelId) }}
                      </span>
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-bold text-zinc-500 border border-zinc-200/50 dark:border-zinc-800/50">
                        {{ item.resolution }} · {{ formatDuration(item.durationSec) }}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 rounded-xl transition-all" :aria-label="t('playgroundBasic.video.moreActions')">
                        <MoreHorizontal class="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" class="rounded-2xl p-1.5 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                      <DropdownMenuItem class="rounded-xl p-2.5 font-medium transition-all" @click="viewGeneration(item)">
                        <LayoutGrid class="w-4 h-4 mr-2 opacity-50" />
                        {{ t("playgroundBasic.video.viewInCanvas") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem class="text-destructive focus:text-destructive rounded-xl p-2.5 font-medium transition-all" @click="removeItem(item.id)">
                        <Trash2 class="w-4 h-4 mr-2 opacity-50" />
                        {{ t("playgroundBasic.video.removeHistory") }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <!-- 成功：视频播放器 -->
                <div
                  v-if="item.status === 'completed' && item.videoUrl"
                  class="group relative rounded-3xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 aspect-video"
                >
                  <video
                    :src="item.videoUrl"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    loop
                    muted
                    playsinline
                    @mouseenter="($event.target as HTMLVideoElement).play()"
                    @mouseleave="($event.target as HTMLVideoElement).pause()"
                  />
                  <!-- 播放图标覆盖层 -->
                  <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-0 transition-all duration-500 pointer-events-none">
                    <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play class="w-8 h-8 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <!-- 操作按钮 -->
                  <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex gap-2">
                    <Button variant="secondary" size="icon" class="bg-white/95 dark:bg-zinc-900/95 shadow-2xl rounded-2xl h-10 w-10 backdrop-blur-md border border-white/20" :aria-label="t('playgroundBasic.video.fullscreenPreview')" @click.stop="openFullscreen(item)">
                      <Maximize2 class="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon" class="bg-white/95 dark:bg-zinc-900/95 shadow-2xl rounded-2xl h-10 w-10 backdrop-blur-md border border-white/20" :aria-label="t('playgroundBasic.video.downloadVideo')" @click.stop="downloadVideo(item.videoUrl!)">
                      <Download class="w-4 h-4" />
                    </Button>
                  </div>
                  <!-- 时长标签 -->
                  <div class="absolute bottom-4 right-4 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs font-bold text-white">
                    {{ formatDuration(item.durationSec) }}
                  </div>
                </div>

                <!-- 加载中：进度骨架 -->
                <div
                  v-else-if="item.status === 'processing' || item.status === 'pending'"
                  class="aspect-video bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 flex flex-col items-center justify-center p-8 gap-6 overflow-hidden relative"
                >
                  <!-- 动态光效背景 -->
                  <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
                  </div>
                  <div class="relative flex flex-col items-center gap-4">
                    <div class="relative">
                      <div class="absolute inset-0 blur-2xl bg-cyan-500/20 animate-pulse rounded-full" />
                      <Loader2 class="w-10 h-10 text-cyan-500 animate-spin relative" />
                    </div>
                    <span class="text-xs font-black text-zinc-400 animate-pulse uppercase tracking-widest">
                      {{ item.status === 'pending' ? 'Queued' : 'Rendering' }}
                    </span>
                    <!-- 进度条 -->
                    <div v-if="item.progress > 0" class="w-48 space-y-1">
                      <div class="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                          :style="{ width: `${item.progress}%` }"
                        />
                      </div>
                      <p class="text-xs text-zinc-500 text-center font-mono">{{ item.progress }}%</p>
                    </div>
                  </div>
                </div>

                <!-- 错误状态 -->
                <div v-else-if="item.status === 'failed'" class="flex items-center gap-4 p-5 bg-destructive/5 dark:bg-destructive/10 rounded-3xl text-destructive border border-destructive/20 shadow-sm">
                  <AlertCircle class="w-5 h-5 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-bold block">{{ t("playgroundBasic.video.generateFailed") }}</span>
                    <span class="text-xs opacity-70 truncate block leading-relaxed">{{ item.errorMessage || t('playgroundBasic.video.unknownError') }}</span>
                  </div>
                  <Button variant="outline" size="sm" class="rounded-xl border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all font-bold px-4" @click="retryGenerate(item)">{{ t("playgroundBasic.video.regenerate") }}</Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <!-- Classic 模式：画布 + 当前任务视频 -->
        <div v-show="mode === 'classic'" class="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 p-3 sm:p-6 pt-20 sm:pt-24 pb-40 sm:pb-48 relative overflow-hidden animate-in fade-in duration-500">
          <div class="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-[40px] overflow-hidden relative bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-all">
            <div class="flex-1 flex items-center justify-center p-12 overflow-auto custom-scrollbar">
              <template v-if="currentTask">
                <!-- 完成状态：视频播放器 -->
                <template v-if="currentTask.status === 'completed' && currentTask.videoUrl">
                  <div class="relative rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] bg-black max-w-4xl w-full aspect-video">
                    <video
                      ref="classicVideoRef"
                      :src="currentTask.videoUrl"
                      class="w-full h-full object-contain"
                      controls
                      autoplay
                      loop
                    />
                    <!-- 视频信息覆盖层 -->
                    <div class="absolute top-4 left-4 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <div class="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-bold text-white flex items-center gap-2">
                        <ProviderIcon :provider="getModelProvider(currentTask.modelId)" size="xs" colored />
                        {{ getModelDisplayName(currentTask.modelId) }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 生成中状态 -->
                <template v-else-if="currentTask.status === 'processing' || currentTask.status === 'pending'">
                  <div class="flex flex-col items-center gap-6">
                    <div class="relative">
                      <div class="absolute inset-0 blur-3xl bg-cyan-500/20 animate-pulse rounded-full" />
                      <Loader2 class="w-12 h-12 text-cyan-500 animate-spin relative" />
                    </div>
                    <div class="text-center space-y-2">
                      <span class="text-zinc-400 font-bold text-lg animate-pulse tracking-tight block uppercase">
                        {{ currentTask.status === 'pending' ? 'Queued' : 'Rendering Masterpiece' }}
                      </span>
                      <span class="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-60">Bringing your vision to life</span>
                      <!-- 进度条 -->
                      <div v-if="currentTask.progress > 0" class="w-64 space-y-1 pt-4">
                        <div class="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                            :style="{ width: `${currentTask.progress}%` }"
                          />
                        </div>
                        <p class="text-xs text-zinc-500 text-center font-mono">{{ currentTask.progress }}%</p>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 失败状态 -->
                <template v-else>
                  <div class="text-center text-zinc-400 space-y-6 max-w-sm">
                    <div class="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-[32px] flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/20">
                      <AlertCircle class="w-10 h-10 text-red-500/60" />
                    </div>
                    <div class="space-y-1">
                      <p class="font-bold text-lg text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">{{ t("playgroundBasic.video.generateFailed") }}</p>
                      <p class="text-xs font-medium opacity-60 leading-relaxed">{{ currentTask.errorMessage || t('playgroundBasic.video.cannotComplete') }}</p>
                    </div>
                    <Button variant="outline" size="sm" class="rounded-2xl border font-bold px-8 h-10 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95" @click="retryGenerate(currentTask)">{{ t("playgroundBasic.video.regenerate") }}</Button>
                  </div>
                </template>
              </template>

              <!-- 空状态 -->
              <div v-else class="text-center max-w-md space-y-6">
                <div class="relative mx-auto w-24 h-24">
                  <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-[28px] blur-2xl animate-pulse" />
                  <div class="relative w-full h-full bg-zinc-50 dark:bg-zinc-900 rounded-[28px] flex items-center justify-center shadow-inner border border-zinc-100 dark:border-zinc-800 group">
                    <Video class="w-10 h-10 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-600 transition-all duration-500 group-hover:scale-110" :stroke-width="1.5" />
                  </div>
                </div>
                <div class="space-y-2">
                  <h2 class="text-xl font-black text-zinc-800 dark:text-zinc-200 tracking-tight">Canvas Ready</h2>
                  <p class="text-base text-zinc-400 dark:text-zinc-500 leading-relaxed">{{ t("playgroundBasic.video.canvasDesc") }}</p>
                </div>
                <button
                  class="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 transition-all duration-300 hover:scale-105 active:scale-95"
                  @click="getRandomInspiration"
                >
                  <Lightbulb class="w-3.5 h-3.5 text-amber-500 group-hover:animate-pulse" />
                  <span>{{ t("playgroundBasic.video.getInspiration") }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部浮动输入条 -->
        <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-8 pt-0 z-20 pointer-events-none">
          <div class="relative max-w-4xl mx-auto flex flex-col gap-2 sm:gap-3 pointer-events-auto">
            <!-- 快捷参数 Pills：仅 Feed 模式显示 -->
            <div v-if="mode === 'feed' && quickParams.length > 0" class="flex items-center gap-1.5 pl-4 flex-wrap animate-in slide-in-from-bottom-2 duration-700">
              <div
                v-for="param in quickParams"
                :key="param.key"
                class="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
              >
                <button
                  v-for="opt in param.options"
                  :key="String(opt.value)"
                  type="button"
                  class="px-3 h-7 flex items-center justify-center rounded-full text-xs font-black transition-all active:scale-95"
                  :class="allParams[param.key] === opt.value
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50'"
                  @click="updateParam(param.key, opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Input Box -->
            <div class="relative group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[24px] shadow-2xl border border-zinc-200/50 dark:border-zinc-800 flex items-center p-1 pl-4 transition-all duration-500 focus-within:ring-4 focus-within:ring-cyan-500/5 focus-within:border-cyan-500/20">
              <!-- 模型选择 Pill -->
              <Popover>
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    class="mr-2 flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shrink-0 active:scale-95"
                  >
                    <ProviderIcon v-if="selectedModel" :provider="selectedModel.provider" size="xs" colored />
                    <span class="max-w-[80px] truncate uppercase tracking-widest">{{ selectedModel?.displayName ?? t('playgroundBasic.video.selectEngine') }}</span>
                    <ChevronDown class="w-3 h-3 opacity-30" />
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-72 p-2 border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-2xl backdrop-blur-2xl" align="start" :side-offset="12">
                  <div class="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1 flex items-center justify-between">
                    <span class="text-xs font-black text-zinc-400 uppercase tracking-widest">Video Engines</span>
                  </div>
                  <ScrollArea class="h-[min(24rem,50vh)] px-1">
                    <div class="space-y-1">
                      <button
                        v-for="model in models"
                        :key="model.id"
                        class="w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-3 group/item border border-transparent"
                        :class="selectedModelId === model.id ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'"
                        @click="selectModel(model)"
                      >
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
                          <ProviderIcon :provider="model.provider" size="sm" colored />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-bold text-xs truncate">{{ model.displayName }}</div>
                          <div class="text-xs font-bold truncate uppercase tracking-widest opacity-50">{{ model.provider }} · Max {{ model.maxDurationSec }}s</div>
                        </div>
                        <Sparkles v-if="selectedModelId === model.id" class="w-3 h-3 text-cyan-500 animate-pulse" />
                      </button>
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <input
                v-model="prompt"
                type="text"
                :placeholder="t('playgroundBasic.video.promptPlaceholder')"
                :aria-label="t('playgroundBasic.video.promptLabel')"
                class="flex-1 bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-200 font-medium text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 h-10 caret-cyan-500"
                @keydown.enter="handleGenerate"
              />
              <button
                :disabled="!canGenerate || generating"
                :aria-label="generating ? t('playgroundBasic.video.generating') : t('playgroundBasic.video.generateVideo')"
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

    <!-- 全屏预览 Dialog -->
    <Dialog v-model:open="showFullscreen">
      <DialogContent
        class="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-none bg-transparent shadow-none overflow-hidden [&>button]:hidden"
        @pointer-down-outside="showFullscreen = false"
      >
        <div class="relative flex items-center justify-center">
          <div class="relative group">
            <video
              v-if="fullscreenVideo"
              :src="fullscreenVideo.videoUrl"
              class="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              controls
              autoplay
              loop
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
                      :aria-label="t('playgroundBasic.video.downloadVideo')"
                      @click="downloadVideo(fullscreenVideo!.videoUrl!)"
                    >
                      <Download class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" class="bg-zinc-900 text-white border-zinc-800">
                    <p>{{ t("playgroundBasic.video.downloadVideo") }}</p>
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
                      :aria-label="t('playgroundBasic.video.closePreview')"
                      @click="showFullscreen = false"
                    >
                      <X class="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" class="bg-zinc-900 text-white border-zinc-800">
                    <p>{{ t("playgroundBasic.video.closeEsc") }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <!-- 底部信息栏 -->
            <div class="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
                <span class="text-xs font-medium text-white/70">{{ t("playgroundBasic.video.clickOrEscClose") }}</span>
              </div>
              <div class="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <ProviderIcon v-if="fullscreenVideo" :provider="getModelProvider(fullscreenVideo.modelId)" size="xs" colored />
                <span class="text-xs font-medium text-white/70">{{ fullscreenVideo?.resolution }} · {{ formatDuration(fullscreenVideo?.durationSec || 0) }}</span>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Settings, Loader2, Video, Sparkles, Film,
  Download, Maximize2, AlertCircle, MoreHorizontal, List, LayoutGrid,
  PanelLeftClose, ChevronDown, Lightbulb, X, Play, Trash2
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
import { useVideoPlaygroundMock } from '@/__mocks__/useVideoPlaygroundMock'
import type { VideoGeneration, WorkbenchMode } from '@/types/playground-basic'
import { message } from 'ant-design-vue'

// =====================================================
// 主逻辑
// =====================================================
const router = useRouter()
const { t } = useI18n()

// 视图模式
const mode = ref<WorkbenchMode>('feed')

// 全屏预览
const showFullscreen = ref(false)
const fullscreenVideo = ref<VideoGeneration | null>(null)

// 滚动容器
const feedScrollRef = ref<InstanceType<typeof ScrollArea> | null>(null)
const classicVideoRef = ref<HTMLVideoElement | null>(null)

// 使用 Mock Composable
const {
  loadingModels,
  loadingHistory,
  generating,
  models,
  history,
  feedItems,
  selectedModelId,
  selectedModel,
  prompt,
  currentTaskId,
  currentTask,
  allItems,
  allParams,
  activeParamSchema,
  quickParams,
  loadModels,
  loadHistory,
  generateVideo,
  viewGeneration,
  selectModel,
  updateParam,
  stopPolling,
  retryGenerate,
  removeItem,
  getRandomInspiration,
  getStatusText,
  getStatusClass,
  formatTime,
  formatDuration,
  getModelDisplayName,
  getModelProvider
} = useVideoPlaygroundMock()

// =====================================================
// Computed
// =====================================================
const canGenerate = computed(() =>
  Boolean(prompt.value.trim() && selectedModelId.value)
)

// =====================================================
// 监听模式切换，自动滚动
// =====================================================
watch(mode, () => {
  scrollToBottom()
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
// 操作函数
// =====================================================
function goBack() {
  router.push('/playground')
}

function handleGenerate() {
  generateVideo()
  scrollToBottom()
}

function openFullscreen(item: VideoGeneration) {
  fullscreenVideo.value = item
  showFullscreen.value = true
}

async function downloadVideo(url: string) {
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(t('playgroundBasic.video.downloadFailed'))
    const blob = await resp.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `video-${Date.now()}.mp4`
    a.click()
    URL.revokeObjectURL(a.href)
    message.success(t('playgroundBasic.video.downloadStart'))
  } catch {
    message.error(t('playgroundBasic.video.downloadFailed'))
  }
}

// =====================================================
// 生命周期
// =====================================================
onMounted(() => {
  loadModels()
  loadHistory()
})

onUnmounted(() => {
  stopPolling()
})
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

/* 自定义滚动条 */
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
