export const apiZh = {
  api: {
    canvas: {
      newGroup: '新分组',
    },
    chatAssistant: {
      streamUnavailable: '无法获取响应流',
    },
  },
  http: {
    unauthenticated: '未认证，且无法重试请求',
    refreshTokenFailed: '刷新Token失败',
    sessionExpired: '登录状态已过期，请重新登录',
    authExpiredTitle: '身份验证过期',
    authExpiredDesc: '登录状态已过期，请重新登录',
    requestFailed: '请求失败',
    error400: '请求参数错误',
    error403: '无权限访问',
    error404: '请求资源不存在',
    error408: '请求超时',
    error429: 'API 请求过于频繁，请稍后再试',
    error500: '服务器错误',
    error502: '网关错误',
    error503: '服务暂时不可用',
    error504: '网关超时',
    errorWithCode: '请求失败 ({code})',
    apiError: '接口错误',
  },
  serviceTools: {
    httpRequestDesc: 'HTTP 请求工具',
    mathEvalDesc: '数学表达式求值',
    timeNowDesc: '获取当前时间',
  },
  terminal: {
    toolCall: '工具调用',
    thinking: '思考中...',
    renderError: '渲染错误',
  },
}

export const apiEn = {
  api: {
    canvas: {
      newGroup: 'New Group',
    },
    chatAssistant: {
      streamUnavailable: 'Unable to get response stream',
    },
  },
  http: {
    unauthenticated: 'Unauthenticated, unable to retry request',
    refreshTokenFailed: 'Failed to refresh token',
    sessionExpired: 'Session expired, please log in again',
    authExpiredTitle: 'Authentication Expired',
    authExpiredDesc: 'Session expired, please log in again',
    requestFailed: 'Request failed',
    error400: 'Bad request parameters',
    error403: 'Access denied',
    error404: 'Resource not found',
    error408: 'Request timed out',
    error429: 'Too many API requests, please try again later',
    error500: 'Server error',
    error502: 'Bad gateway',
    error503: 'Service temporarily unavailable',
    error504: 'Gateway timeout',
    errorWithCode: 'Request failed ({code})',
    apiError: 'API Error',
  },
  serviceTools: {
    httpRequestDesc: 'HTTP Request Tool',
    mathEvalDesc: 'Math Expression Evaluator',
    timeNowDesc: 'Get Current Time',
  },
  terminal: {
    toolCall: 'Tool Call',
    thinking: 'Thinking...',
    renderError: 'Render Error',
  },
}
