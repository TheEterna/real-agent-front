export const storeFeatureZh = {
  storeCanvas: {
    untitledProject: '未命名项目',
  },
  storeMemoryAlbum: {
    uploadFailed: '上传失败',
  },
  storeRole: {
    defaultDesc: '这个角色正等你创造故事。',
    loadFailed: '角色列表加载失败',
  },
  storeTerminal: {
    // 系统命令
    helpDesc: '显示帮助信息',
    helpUsage: 'help [command]',
    helpParamCommand: '要查看帮助的命令名称',
    clearDesc: '清空终端屏幕',
    clearUsage: 'clear',
    historyDesc: '显示命令历史',
    historyUsage: 'history [-n number]',
    historyParamNumber: '显示最近的N条命令',

    // AI 命令
    chatDesc: '与AI助手对话',
    chatUsage: 'chat <message>',
    chatParamMessage: '要发送给AI的消息',
    planDesc: '让AI制定计划',
    planUsage: 'plan <task> [--detail]',
    planParamTask: '要制定计划的任务',
    planParamDetail: '生成详细计划',

    // 连接命令
    connectDesc: '连接到远程服务器',
    connectUsage: 'connect <server> [--port port] [--user username]',
    connectParamServer: '服务器地址或名称',
    connectParamPort: 'SSH端口号',
    connectParamUser: '用户名',
    disconnectDesc: '断开服务器连接',
    disconnectUsage: 'disconnect',

    // 文件命令
    lsDesc: '列出目录内容',
    lsUsage: 'ls [path] [-l] [-a]',
    lsParamPath: '要列出的目录路径',
    lsParamLong: '详细格式显示',
    lsParamAll: '显示隐藏文件',
    pwdDesc: '显示当前工作目录',
    pwdUsage: 'pwd',
    catDesc: '显示文件内容',
    catUsage: 'cat <file>',
    catParamFile: '要查看的文件路径',

    // 解析错误
    emptyInput: '请输入命令',
    mustStartWithSlash: '命令必须以 / 开头',
    emptyCommandName: '命令名称不能为空',
    invalidFormat: '无效的命令格式',
    unknownCommand: '未知命令: {name}',
    didYouMean: '您是否想输入: {name}?',
    trySuggestion: '尝试: /{input}',
  },
}

export const storeFeatureEn = {
  storeCanvas: {
    untitledProject: 'Untitled Project',
  },
  storeMemoryAlbum: {
    uploadFailed: 'Upload failed',
  },
  storeRole: {
    defaultDesc: 'This character is waiting for you to create a story.',
    loadFailed: 'Failed to load role list',
  },
  storeTerminal: {
    // System commands
    helpDesc: 'Show help information',
    helpUsage: 'help [command]',
    helpParamCommand: 'Command name to view help for',
    clearDesc: 'Clear terminal screen',
    clearUsage: 'clear',
    historyDesc: 'Show command history',
    historyUsage: 'history [-n number]',
    historyParamNumber: 'Show last N commands',

    // AI commands
    chatDesc: 'Chat with AI assistant',
    chatUsage: 'chat <message>',
    chatParamMessage: 'Message to send to AI',
    planDesc: 'Let AI create a plan',
    planUsage: 'plan <task> [--detail]',
    planParamTask: 'Task to plan for',
    planParamDetail: 'Generate detailed plan',

    // Connection commands
    connectDesc: 'Connect to remote server',
    connectUsage: 'connect <server> [--port port] [--user username]',
    connectParamServer: 'Server address or name',
    connectParamPort: 'SSH port number',
    connectParamUser: 'Username',
    disconnectDesc: 'Disconnect from server',
    disconnectUsage: 'disconnect',

    // File commands
    lsDesc: 'List directory contents',
    lsUsage: 'ls [path] [-l] [-a]',
    lsParamPath: 'Directory path to list',
    lsParamLong: 'Display in long format',
    lsParamAll: 'Show hidden files',
    pwdDesc: 'Print working directory',
    pwdUsage: 'pwd',
    catDesc: 'Display file contents',
    catUsage: 'cat <file>',
    catParamFile: 'File path to view',

    // Parse errors
    emptyInput: 'Please enter a command',
    mustStartWithSlash: 'Command must start with /',
    emptyCommandName: 'Command name cannot be empty',
    invalidFormat: 'Invalid command format',
    unknownCommand: 'Unknown command: {name}',
    didYouMean: 'Did you mean: {name}?',
    trySuggestion: 'Try: /{input}',
  },
}
