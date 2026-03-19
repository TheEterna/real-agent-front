export const playgroundCanvasZh = {
  playgroundCanvas: {
    // Index.vue 空状态
    empty: {
      title: '开始创作',
      description: '从左侧面板拖拽节点到画布，或双击画布创建文本节点',
    },
    // Index.vue 默认项目名
    defaultProjectName: '未命名画布',

    // CanvasToolbar.vue
    toolbar: {
      undo: '撤销 (Ctrl+Z)',
      redo: '重做 (Ctrl+Shift+Z)',
      zoomOut: '缩小',
      zoomIn: '放大',
      zoomReset: '重置缩放',
      toggleGrid: '切换网格',
      unsaved: '未保存',
      saving: '保存中...',
      save: '保存',
      share: '分享',
    },

    // NodePalette.vue
    palette: {
      title: '节点面板',
      description: '拖拽节点到画布',
      categoryBasic: '基础',
      categoryMedia: '媒体',
      categoryAi: 'AI 生成',
      hint: '画布创建文本节点',
      hintKey: '双击',
    },

    // PropertyPanel.vue
    property: {
      title: '属性',
      editNode: '编辑节点',
      selectedCount: '已选 {count} 个节点',
      deleteNode: '删除节点',
      labelType: '类型',
      labelPosition: '位置',
      labelContent: '内容',
      labelColor: '颜色',
      labelPrompt: '提示词',
      labelStatus: '状态',
      labelInputMaterial: '输入素材',
      inputMaterialHint: '连接图像节点到此节点作为输入素材',
      textPlaceholder: '输入文本内容...',
      stickyPlaceholder: '输入便签内容...',
      aiImagePlaceholder: '描述你想生成的图像...',
      aiVideoPlaceholder: '描述转场效果或视频内容...',
      aiChatPlaceholder: '输入你的问题或指令...',
      multiSelectTitle: '已选中 {count} 个节点',
      multiSelectHint: '批量操作功能开发中',
      unknownNode: '未知节点',
    },

    // PropertyPanel.vue 节点类型标签
    nodeType: {
      text: '文本节点',
      sticky: '便签节点',
      image: '图像节点',
      video: '视频节点',
      audio: '音频节点',
      group: '分组节点',
      aiChat: 'AI 对话节点',
      aiImage: 'AI 图像节点',
      aiVideo: 'AI 视频节点',
      aiAudio: 'AI 音频节点',
    },

    // PropertyPanel.vue 便签颜色
    stickyColor: {
      yellow: '黄色',
      pink: '粉色',
      blue: '蓝色',
      green: '绿色',
      purple: '紫色',
      orange: '橙色',
    },

    // NodePaletteItem.vue 节点面板项
    paletteItem: {
      text: { label: '文本', description: '添加文本或 Markdown 内容' },
      sticky: { label: '便签', description: '添加彩色便签笔记' },
      group: { label: '分组', description: '将多个节点分组' },
      image: { label: '图像', description: '上传或添加图像' },
      video: { label: '视频', description: '上传或添加视频' },
      audio: { label: '音频', description: '上传或添加音频' },
      aiChat: { label: 'AI 对话', description: '与 AI 进行对话生成文本' },
      aiImage: { label: 'AI 图像', description: '使用 AI 生成图像' },
      aiVideo: { label: 'AI 视频', description: '使用 AI 生成视频或转场' },
      aiAudio: { label: 'AI 音频', description: '使用 AI 生成语音或音乐' },
    },

    // 通用播放控制
    playControl: {
      play: '播放',
      pause: '暂停',
    },

    // AI 节点通用状态
    aiStatus: {
      idle: '等待生成',
      generating: '生成中...',
      success: '生成完成',
      error: '生成失败',
    },

    // AI 节点通用
    aiGenerate: {
      processing: '处理中...',
      preparing: '准备中...',
      done: '完成',
      generateBtn: '生成',
      generatingBtn: '生成中...',
      regenerateBtn: '重新生成',
    },

    // AiAudioNode.vue
    aiAudio: {
      title: 'AI 音频生成',
      labelGenerateType: '生成类型',
      typeTts: '语音合成',
      typeMusic: '音乐生成',
      typeSfx: '音效',
      labelTts: '要朗读的文本',
      labelMusic: '音乐风格描述',
      labelSfx: '音效描述',
      labelDefault: '提示词',
      placeholderTts: '输入要转换为语音的文本...',
      placeholderMusic: '描述音乐风格，如：轻快的钢琴曲...',
      placeholderSfx: '描述音效，如：雨声、脚步声...',
      placeholderDefault: '输入提示词...',
      generateAudio: '生成音频',
      downloadAudio: '下载音频',
      errorTitle: '生成失败',
    },

    // AiChatNode.vue
    aiChat: {
      title: 'AI 对话',
      promptLabel: '提示词',
      promptPlaceholder: '输入你的问题或指令...',
      resultTitle: '生成结果',
      errorTitle: '生成失败',
    },

    // AiImageNode.vue
    aiImage: {
      title: 'AI 图像生成',
      promptLabel: '提示词',
      promptPlaceholder: '描述你想生成的图像...',
      generateImage: '生成图像',
      downloadImage: '下载图像',
      fullPreview: '全屏预览',
      revisedPrompt: '优化提示词：',
      generatedAlt: '生成的图像',
      errorTitle: '生成失败',
    },

    // AiVideoNode.vue
    aiVideo: {
      title: 'AI 视频生成',
      connectHint: '连接图像节点作为输入素材',
      connectedAlt: '关联图片素材',
      promptLabel: '转场/效果描述',
      promptPlaceholder: '描述转场效果，如：平滑渐变、缩放过渡...',
      generateVideo: '生成视频',
      errorTitle: '生成失败',
    },

    // AudioNode.vue
    audio: {
      title: '音频',
      uploadAudio: '点击上传音频',
    },

    // ImageNode.vue
    image: {
      title: '图像',
      fullPreview: '全屏预览',
      uploadImage: '点击上传图像',
      uploadHint: '或拖拽图像到此处',
      defaultAlt: '图像',
    },

    // StickyNode.vue
    sticky: {
      placeholder: '输入便签内容...',
      editHint: '双击编辑...',
    },

    // TextNode.vue
    text: {
      title: '文本',
      placeholder: '输入文本内容...',
      editHint: '双击编辑...',
    },

    // VideoNode.vue
    video: {
      title: '视频',
      uploadVideo: '点击上传视频',
      uploadHint: '支持 MP4, WebM 格式',
    },
  },
}

export const playgroundCanvasEn = {
  playgroundCanvas: {
    empty: {
      title: 'Start Creating',
      description: 'Drag nodes from the left panel to the canvas, or double-click to create a text node',
    },
    defaultProjectName: 'Untitled Canvas',

    toolbar: {
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Shift+Z)',
      zoomOut: 'Zoom Out',
      zoomIn: 'Zoom In',
      zoomReset: 'Reset Zoom',
      toggleGrid: 'Toggle Grid',
      unsaved: 'Unsaved',
      saving: 'Saving...',
      save: 'Save',
      share: 'Share',
    },

    palette: {
      title: 'Node Palette',
      description: 'Drag nodes to canvas',
      categoryBasic: 'Basic',
      categoryMedia: 'Media',
      categoryAi: 'AI Generation',
      hint: 'canvas to create a text node',
      hintKey: 'Double-click',
    },

    property: {
      title: 'Properties',
      editNode: 'Edit Node',
      selectedCount: '{count} nodes selected',
      deleteNode: 'Delete Node',
      labelType: 'Type',
      labelPosition: 'Position',
      labelContent: 'Content',
      labelColor: 'Color',
      labelPrompt: 'Prompt',
      labelStatus: 'Status',
      labelInputMaterial: 'Input Material',
      inputMaterialHint: 'Connect an image node as input material',
      textPlaceholder: 'Enter text content...',
      stickyPlaceholder: 'Enter sticky note content...',
      aiImagePlaceholder: 'Describe the image you want to generate...',
      aiVideoPlaceholder: 'Describe transition effects or video content...',
      aiChatPlaceholder: 'Enter your question or instruction...',
      multiSelectTitle: '{count} nodes selected',
      multiSelectHint: 'Batch operations coming soon',
      unknownNode: 'Unknown Node',
    },

    nodeType: {
      text: 'Text Node',
      sticky: 'Sticky Note',
      image: 'Image Node',
      video: 'Video Node',
      audio: 'Audio Node',
      group: 'Group Node',
      aiChat: 'AI Chat Node',
      aiImage: 'AI Image Node',
      aiVideo: 'AI Video Node',
      aiAudio: 'AI Audio Node',
    },

    stickyColor: {
      yellow: 'Yellow',
      pink: 'Pink',
      blue: 'Blue',
      green: 'Green',
      purple: 'Purple',
      orange: 'Orange',
    },

    paletteItem: {
      text: { label: 'Text', description: 'Add text or Markdown content' },
      sticky: { label: 'Sticky Note', description: 'Add colorful sticky notes' },
      group: { label: 'Group', description: 'Group multiple nodes together' },
      image: { label: 'Image', description: 'Upload or add an image' },
      video: { label: 'Video', description: 'Upload or add a video' },
      audio: { label: 'Audio', description: 'Upload or add audio' },
      aiChat: { label: 'AI Chat', description: 'Chat with AI to generate text' },
      aiImage: { label: 'AI Image', description: 'Use AI to generate images' },
      aiVideo: { label: 'AI Video', description: 'Use AI to generate video or transitions' },
      aiAudio: { label: 'AI Audio', description: 'Use AI to generate speech or music' },
    },

    playControl: {
      play: 'Play',
      pause: 'Pause',
    },

    aiStatus: {
      idle: 'Waiting',
      generating: 'Generating...',
      success: 'Completed',
      error: 'Failed',
    },

    aiGenerate: {
      processing: 'Processing...',
      preparing: 'Preparing...',
      done: 'Done',
      generateBtn: 'Generate',
      generatingBtn: 'Generating...',
      regenerateBtn: 'Regenerate',
    },

    aiAudio: {
      title: 'AI Audio Generation',
      labelGenerateType: 'Type',
      typeTts: 'Text to Speech',
      typeMusic: 'Music Generation',
      typeSfx: 'Sound Effects',
      labelTts: 'Text to read',
      labelMusic: 'Music style description',
      labelSfx: 'Sound effect description',
      labelDefault: 'Prompt',
      placeholderTts: 'Enter text to convert to speech...',
      placeholderMusic: 'Describe music style, e.g.: upbeat piano melody...',
      placeholderSfx: 'Describe sound effect, e.g.: rain, footsteps...',
      placeholderDefault: 'Enter prompt...',
      generateAudio: 'Generate Audio',
      downloadAudio: 'Download Audio',
      errorTitle: 'Generation Failed',
    },

    aiChat: {
      title: 'AI Chat',
      promptLabel: 'Prompt',
      promptPlaceholder: 'Enter your question or instruction...',
      resultTitle: 'Result',
      errorTitle: 'Generation Failed',
    },

    aiImage: {
      title: 'AI Image Generation',
      promptLabel: 'Prompt',
      promptPlaceholder: 'Describe the image you want to generate...',
      generateImage: 'Generate Image',
      downloadImage: 'Download Image',
      fullPreview: 'Full Preview',
      revisedPrompt: 'Revised Prompt: ',
      generatedAlt: 'Generated image',
      errorTitle: 'Generation Failed',
    },

    aiVideo: {
      title: 'AI Video Generation',
      connectHint: 'Connect image nodes as input material',
      connectedAlt: 'Connected image material',
      promptLabel: 'Transition/Effect Description',
      promptPlaceholder: 'Describe transition effects, e.g.: smooth fade, zoom transition...',
      generateVideo: 'Generate Video',
      errorTitle: 'Generation Failed',
    },

    audio: {
      title: 'Audio',
      uploadAudio: 'Click to upload audio',
    },

    image: {
      title: 'Image',
      fullPreview: 'Full Preview',
      uploadImage: 'Click to upload image',
      uploadHint: 'or drag an image here',
      defaultAlt: 'Image',
    },

    sticky: {
      placeholder: 'Enter sticky note content...',
      editHint: 'Double-click to edit...',
    },

    text: {
      title: 'Text',
      placeholder: 'Enter text content...',
      editHint: 'Double-click to edit...',
    },

    video: {
      title: 'Video',
      uploadVideo: 'Click to upload video',
      uploadHint: 'Supports MP4, WebM formats',
    },
  },
}
