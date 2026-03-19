export const knowledgeBaseZh = {
  knowledge: {
    // === 通用/共享 ===
    common: {
      back: '返回',
      close: '关闭',
      cancel: '取消',
      confirm: '确定',
      save: '保存',
      retry: '重试',
      refresh: '刷新',
      details: '详情',
      download: '下载',
      delete: '删除',
      rename: '重命名',
      move: '移动',
      edit: '编辑',
      upload: '上传文件',
      uploading: '上传中...',
      create: '创建',
      creating: '创建中...',
      saving: '保存中...',
      selectKb: '请先选择一个知识库',
      selectKbLabel: '选择知识库',
      currentKb: '当前知识库：',
      noKbSelected: '未选择知识库',
      unknownDate: '未知日期',
      standardStorage: '标准存储',
      folder: '文件夹',
      moreActions: '更多操作',
      moveDeveloping: '移动功能开发中...',
      noDownloadSupport: '该文件暂不支持下载（缺少文件ID）',
    },

    // === 知识库页面 (KnowledgeBasePage) ===
    base: {
      title: '知识库',
      cloudDrive: '云盘',
      retrievalTest: '检索测试',
      searchPlaceholder: '搜索文件...',
      listView: '列表视图',
      gridView: '网格视图',
      newKb: '新建库',
      refreshKbList: '刷新知识库列表',
      refreshSuccess: '列表已刷新',
      refreshFailed: '刷新列表失败，请稍后重试',
      loadFailed: '加载失败',
      loadKbListFailed: '获取知识库列表失败',
      loadDocListFailed: '获取文件列表失败',
      noKb: '还没有知识库',
      noKbHint: '先创建一个知识库开始吧',
      createKb: '新建知识库',
      kbList: '知识库列表',
      // 表格列
      colFileName: '文件名',
      colSize: '大小',
      colParseStatus: '解析状态',
      colUpdateTime: '更新时间',
      colActions: '操作',
      // 空状态
      noFiles: '暂无文件',
      noFilesHint: '上传文件后系统会自动解析并可用于检索测试',
      // 创建知识库弹窗
      createKbTitle: '配置新知识库',
      createKbSubtitle: '从图标到描述，一次配置到位。',
      kbIcon: '库图标',
      kbIconHint: '随机生成或上传。推荐使用方形图标以获得最佳显示效果。',
      selectIcon: '选择图标',
      kbName: '知识库名称',
      kbNamePlaceholder: '为你的知识库起一个响亮的名字',
      kbDescription: '核心描述',
      kbDescriptionPlaceholder: '简单说明该知识库的语料范围和应用场景...',
      submitCreate: '立即开启知识空间',
      createFailed: '创建失败',
      kbNameRequired: '请完善基本信息',
      iconTooLarge: '图标文件过大，请换一张更小的图片（建议 256x256 以内）',
      // 编辑知识库弹窗
      editKbTitle: '编辑知识库',
      labelName: '名称',
      labelDescription: '描述',
      labelIcon: '图标',
      ragflowInfo: 'RagFlow 信息',
      ragflowDocs: '文档',
      ragflowChunks: 'Chunks',
      ragflowTokens: 'Tokens',
      ragflowChunkMethod: 'Chunk 方法',
      ragflowEmbedding: 'Embedding',
      ragflowPermission: '权限',
      ragflowDatasetId: 'Dataset ID',
      updateSuccess: '更新成功',
      updateFailed: '更新失败',
      updateRetryFailed: '更新失败，请稍后重试',
      // 删除知识库
      deleteKbTitle: '删除知识库',
      deleteKbConfirm: '确定要删除知识库 "{name}" 吗？',
      // 编辑文档弹窗
      editDocTitle: '重命名文件',
      newName: '新名称',
      // 知识库默认名
      defaultKbName: '知识库',
    },

    // === 云盘页面 (DrivePage) ===
    drive: {
      title: '云盘',
      knowledgeBase: '知识库',
      currentList: '当前列表 ({count})',
      searchPlaceholder: '搜索文件...',
      listView: '列表视图',
      gridView: '网格视图',
      upload: '上传文件',
      uploading: '上传中...',
      uploadFailed: '上传失败',
      // 侧边栏
      mySpace: '我的空间',
      media: '媒体',
      imageVideo: '图片 / 视频',
      documents: '文档',
      myDrive: '我的云盘',
      // 表格列
      colFileName: '文件名',
      colSize: '大小',
      colStorageType: '存储类型',
      colUpdateTime: '更新时间',
      colActions: '操作',
      colType: '类型',
      // 操作
      enter: '进入',
      details: '详情',
      download: '下载',
      rename: '重命名',
      move: '移动',
      delete: '删除',
      // 过滤器
      all: '全部',
      images: '图片',
      videos: '视频',
      spreadsheets: '表格',
      code: '代码',
      // 属性详情
      propertyDetails: '属性详情',
      metadata: '元数据',
      size: '大小',
      updateTime: '更新时间',
      // 文件夹创建
      createFolder: '创建文件夹',
      folderName: '文件夹名称',
      // 重命名
      renameTitle: '重命名',
      newName: '新名称',
      confirmRename: '确认重命名',
      renameSuccess: '重命名成功',
      // 删除
      deleteFileTitle: '确认删除文件',
      deleteFileContent: '「{name}」删除后将无法恢复，确定继续吗？',
      deleteConfirm: '删除文件',
      deleteConfirmContent: '确定要删除 "{name}" 吗？',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败，请稍后重试',
      // 下载
      downloadEmpty: '下载失败：文件内容为空',
      downloadNetworkError: '下载遇到网络问题，请重试',
      // 刷新
      refreshSuccess: '列表已刷新',
      refreshFailed: '刷新列表失败，请稍后重试',
      // 文件操作
      openFile: '打开文件: {name}',
      itemCount: '{count} 项',
    },

    // === 文档详情页 (KnowledgeDocument) ===
    document: {
      title: '文档详情',
      subtitle: '查看该文档的分块内容',
      refreshChunks: '刷新分块列表',
      chunks: '分块',
      chunkCount: '{count} 条',
      missingDocId: '缺少 docId',
      noChunks: '暂无分块（可能仍在解析中）',
      chunkList: '分块列表',
      loadChunksFailed: '加载分块失败',
    },

    // === 检索测试页 (KnowledgeRetrieve) ===
    retrieve: {
      title: '检索测试',
      subtitle: '把问题交给知识库，看看能召回哪些片段',
      inputTitle: '输入问题',
      queryPlaceholder: '例如：这个项目的登录流程是什么？',
      queryLabel: '检索问题',
      executeRetrieval: '执行检索',
      retrieving: '检索中...',
      retrieve: '检索',
      resultsTitle: '召回结果',
      resultCount: '{count} 条',
      noResults: '暂无结果',
      resultList: '检索结果',
      retrievalFailed: '检索失败',
    },

    // === DatasetItem 组件 ===
    dataset: {
      moreActions: '更多操作',
      edit: '编辑',
      delete: '删除',
    },

    // === FolderTreeItem 组件 ===
    folderTree: {
      collapse: '收起文件夹',
      expand: '展开文件夹',
    },

    // === KnowledgeChatPanel 组件 ===
    chat: {
      openAssistant: '打开知识库助手',
      assistantName: '知识库助手',
      closePanel: '关闭助手面板',
      closeTooltip: '关闭',
      welcome: '你好，我是知识库助手。试试问我关于文档的问题吧！',
      thinking: '思考中...',
      generating: '生成中...',
      citation: '引用 {index} ({similarity}%)',
      closeError: '关闭错误提示',
      inputPlaceholder: '输入你的问题...',
      send: '发送',
      sendMessage: '发送消息',
      dialogMessages: '对话消息',
    },

    // === StatusBadge 组件 ===
    status: {
      indexed: '已索引',
      parsing: '解析中',
      failed: '失败',
      pending: '等待',
    },

    // === useKnowledgeChat composable ===
    chatComposable: {
      systemPromptEmpty: '你是一个知识库助手。请根据用户的问题提供准确、有帮助的回答。',
      systemPromptWithRef: '你是一个知识库助手。请根据以下参考资料回答用户的问题。如果参考资料中没有相关信息，请如实说明。',
      referenceTitle: '参考资料：',
      answerRequirements: '回答要求：\n- 基于参考资料回答，不要编造信息\n- 回答要简洁、准确\n- 如有需要，可以指出信息来源于哪个参考片段',
      snippetLabel: '片段 {index}',
      sendFailed: '发送失败，请重试',
    },
  },
}

export const knowledgeBaseEn = {
  knowledge: {
    // === Common/Shared ===
    common: {
      back: 'Back',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      retry: 'Retry',
      refresh: 'Refresh',
      details: 'Details',
      download: 'Download',
      delete: 'Delete',
      rename: 'Rename',
      move: 'Move',
      edit: 'Edit',
      upload: 'Upload',
      uploading: 'Uploading...',
      create: 'Create',
      creating: 'Creating...',
      saving: 'Saving...',
      selectKb: 'Please select a knowledge base first',
      selectKbLabel: 'Select knowledge base',
      noKbSelected: 'No knowledge base selected',
      currentKb: 'Current knowledge base: ',
      unknownDate: 'Unknown date',
      standardStorage: 'Standard',
      folder: 'Folder',
      moreActions: 'More actions',
      moveDeveloping: 'Move feature is under development...',
      noDownloadSupport: 'This file does not support download (missing file ID)',
    },

    // === Knowledge Base Page (KnowledgeBasePage) ===
    base: {
      title: 'Knowledge Base',
      cloudDrive: 'Drive',
      retrievalTest: 'Retrieval Test',
      searchPlaceholder: 'Search files...',
      listView: 'List view',
      gridView: 'Grid view',
      newKb: 'New',
      refreshKbList: 'Refresh knowledge base list',
      refreshSuccess: 'List refreshed',
      refreshFailed: 'Failed to refresh, please try again later',
      loadFailed: 'Failed to load',
      loadKbListFailed: 'Failed to load knowledge base list',
      loadDocListFailed: 'Failed to load document list',
      noKb: 'No knowledge bases yet',
      noKbHint: 'Create your first knowledge base to get started',
      createKb: 'Create Knowledge Base',
      kbList: 'Knowledge base list',
      // Table columns
      colFileName: 'File Name',
      colSize: 'Size',
      colParseStatus: 'Parse Status',
      colUpdateTime: 'Updated',
      colActions: 'Actions',
      // Empty state
      noFiles: 'No files yet',
      noFilesHint: 'Uploaded files will be automatically parsed and available for retrieval',
      // Create KB modal
      createKbTitle: 'Configure New Knowledge Base',
      createKbSubtitle: 'From icon to description, set up everything at once.',
      kbIcon: 'Icon',
      kbIconHint: 'Auto-generate or upload. Square icons are recommended for best display.',
      selectIcon: 'Select Icon',
      kbName: 'Knowledge Base Name',
      kbNamePlaceholder: 'Give your knowledge base a memorable name',
      kbDescription: 'Description',
      kbDescriptionPlaceholder: 'Briefly describe the corpus scope and use cases...',
      submitCreate: 'Launch Knowledge Space',
      createFailed: 'Creation failed',
      kbNameRequired: 'Please complete the basic information',
      iconTooLarge: 'Icon file is too large, please use a smaller image (256x256 recommended)',
      // Edit KB modal
      editKbTitle: 'Edit Knowledge Base',
      labelName: 'Name',
      labelDescription: 'Description',
      labelIcon: 'Icon',
      ragflowInfo: 'RagFlow Info',
      ragflowDocs: 'Documents',
      ragflowChunks: 'Chunks',
      ragflowTokens: 'Tokens',
      ragflowChunkMethod: 'Chunk Method',
      ragflowEmbedding: 'Embedding',
      ragflowPermission: 'Permission',
      ragflowDatasetId: 'Dataset ID',
      updateSuccess: 'Updated successfully',
      updateFailed: 'Update failed',
      updateRetryFailed: 'Update failed, please try again later',
      // Delete KB
      deleteKbTitle: 'Delete Knowledge Base',
      deleteKbConfirm: 'Are you sure you want to delete knowledge base "{name}"?',
      // Edit document modal
      editDocTitle: 'Rename File',
      newName: 'New Name',
      // Default KB name
      defaultKbName: 'Knowledge Base',
    },

    // === Drive Page (DrivePage) ===
    drive: {
      title: 'Drive',
      knowledgeBase: 'Knowledge Base',
      currentList: 'Current List ({count})',
      searchPlaceholder: 'Search files...',
      listView: 'List view',
      gridView: 'Grid view',
      upload: 'Upload',
      uploading: 'Uploading...',
      uploadFailed: 'Upload failed',
      // Sidebar
      mySpace: 'My Space',
      media: 'Media',
      imageVideo: 'Images / Videos',
      documents: 'Documents',
      myDrive: 'My Drive',
      // Table columns
      colFileName: 'File Name',
      colSize: 'Size',
      colStorageType: 'Storage Type',
      colUpdateTime: 'Updated',
      colActions: 'Actions',
      colType: 'Type',
      // Actions
      enter: 'Open',
      details: 'Details',
      download: 'Download',
      rename: 'Rename',
      move: 'Move',
      delete: 'Delete',
      // Filters
      all: 'All',
      images: 'Images',
      videos: 'Videos',
      spreadsheets: 'Spreadsheets',
      code: 'Code',
      // Property details
      propertyDetails: 'Properties',
      metadata: 'Metadata',
      size: 'Size',
      updateTime: 'Updated',
      // Folder creation
      createFolder: 'Create Folder',
      folderName: 'Folder name',
      // Rename
      renameTitle: 'Rename',
      newName: 'New name',
      confirmRename: 'Confirm Rename',
      renameSuccess: 'Renamed successfully',
      // Delete
      deleteFileTitle: 'Confirm Delete File',
      deleteFileContent: '"{name}" cannot be recovered after deletion. Continue?',
      deleteConfirm: 'Delete File',
      deleteConfirmContent: 'Are you sure you want to delete "{name}"?',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Deletion failed, please try again later',
      // Download
      downloadEmpty: 'Download failed: file is empty',
      downloadNetworkError: 'Download encountered a network issue, please retry',
      // Refresh
      refreshSuccess: 'List refreshed',
      refreshFailed: 'Failed to refresh, please try again later',
      // File operations
      openFile: 'Open file: {name}',
      itemCount: '{count} items',
    },

    // === Document Detail Page (KnowledgeDocument) ===
    document: {
      title: 'Document Details',
      subtitle: 'View chunk content of this document',
      refreshChunks: 'Refresh chunks',
      chunks: 'Chunks',
      chunkCount: '{count} items',
      missingDocId: 'Missing docId',
      noChunks: 'No chunks yet (may still be parsing)',
      chunkList: 'Chunk list',
      loadChunksFailed: 'Failed to load chunks',
    },

    // === Retrieval Test Page (KnowledgeRetrieve) ===
    retrieve: {
      title: 'Retrieval Test',
      subtitle: 'Submit a question to the knowledge base and see what fragments are recalled',
      inputTitle: 'Enter Question',
      queryPlaceholder: 'e.g., What is the login process of this project?',
      queryLabel: 'Retrieval query',
      executeRetrieval: 'Execute retrieval',
      retrieving: 'Retrieving...',
      retrieve: 'Retrieve',
      resultsTitle: 'Results',
      resultCount: '{count} items',
      noResults: 'No results',
      resultList: 'Retrieval results',
      retrievalFailed: 'Retrieval failed',
    },

    // === DatasetItem Component ===
    dataset: {
      moreActions: 'More actions',
      edit: 'Edit',
      delete: 'Delete',
    },

    // === FolderTreeItem Component ===
    folderTree: {
      collapse: 'Collapse folder',
      expand: 'Expand folder',
    },

    // === KnowledgeChatPanel Component ===
    chat: {
      openAssistant: 'Open knowledge assistant',
      assistantName: 'Knowledge Assistant',
      closePanel: 'Close assistant panel',
      closeTooltip: 'Close',
      welcome: 'Hi, I\'m the Knowledge Assistant. Try asking me questions about your documents!',
      thinking: 'Thinking...',
      generating: 'Generating...',
      citation: 'Ref {index} ({similarity}%)',
      closeError: 'Dismiss error',
      inputPlaceholder: 'Type your question...',
      send: 'Send',
      sendMessage: 'Send message',
      dialogMessages: 'Conversation messages',
    },

    // === StatusBadge Component ===
    status: {
      indexed: 'Indexed',
      parsing: 'Parsing',
      failed: 'Failed',
      pending: 'Pending',
    },

    // === useKnowledgeChat composable ===
    chatComposable: {
      systemPromptEmpty: 'You are a knowledge base assistant. Please provide accurate and helpful answers based on the user\'s questions.',
      systemPromptWithRef: 'You are a knowledge base assistant. Please answer the user\'s questions based on the following references. If the references do not contain relevant information, please state so honestly.',
      referenceTitle: 'References:',
      answerRequirements: 'Requirements:\n- Answer based on references, do not fabricate information\n- Be concise and accurate\n- If needed, indicate which reference fragment the information comes from',
      snippetLabel: 'Snippet {index}',
      sendFailed: 'Failed to send, please try again',
    },
  },
}
