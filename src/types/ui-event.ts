// UI Event Protocol - 结构化 UI 组件渲染事件类型定义
// 规范版本: 1.0.0-DRAFT
// 参考: docs/spec/UI_EVENT_PROTOCOL.md

// ===== 核心载荷 =====

/**
 * UI 组件类型，前端组件路由的唯一依据
 */
export type UIComponentType =
  // ===== 表单输入类 =====
  | 'form'           // 复合表单（多字段）
  | 'text_input'     // 单行/多行文本输入
  | 'select'         // 单选下拉
  | 'multi_select'   // 多选
  | 'radio'          // 单选按钮组
  | 'checkbox'       // 复选框组
  | 'slider'         // 滑块
  | 'date_picker'    // 日期选择
  | 'file_upload'    // 文件上传
  | 'confirm'        // 确认对话框
  // ===== 数据展示类 =====
  | 'table'          // 数据表格
  | 'card'           // 信息卡片
  | 'card_list'      // 卡片列表
  | 'key_value'      // 键值对展示
  | 'code'           // 代码块
  | 'image'          // 图片展示
  | 'markdown'       // Markdown 渲染
  | 'progress'       // 进度条
  // ===== 图表类 =====
  | 'bar_chart'      // 柱状图
  | 'line_chart'     // 折线图
  | 'pie_chart'      // 饼图
  | 'radar_chart'    // 雷达图
  | 'stat_card'      // 指标统计卡
  // ===== 复合/特殊类 =====
  | 'steps'          // 步骤条
  | 'tabs'           // 标签页容器
  | 'collapse'       // 折叠面板
  | 'alert'          // 提示信息

/**
 * UI 事件交互模式
 * - "ui": 纯渲染，不阻塞 agent 执行（默认值）
 * - "elicitation": 需要用户填入数据，agent 暂停等待回传
 */
export type UIInteractMode = 'ui' | 'elicitation'

/**
 * UIEventPayload - UI 事件核心载荷
 * 存放于 AgentExecutionEvent.data 中
 */
export interface UIEventPayload {
  /** UI 组件类型，前端组件路由的唯一依据 */
  type: UIComponentType
  /** 组件渲染参数，结构由 type 决定 */
  args: UIComponentArgs
  /** 交互模式，默认 "ui" */
  interact?: UIInteractMode
}

/**
 * UIEventMeta - UI 事件可选元数据
 * 存放于 AgentExecutionEvent.meta 中
 */
export interface UIEventMeta {
  /** 组件版本，用于前端兼容性判断 */
  componentVersion?: string
  /** elicitation 超时秒数，超时后 agent 可自动继续或取消 */
  timeout?: number
  /** 前端不支持该 type 时的降级文本 */
  fallback?: string
  /** 来源标识（哪个工具/服务产生的） */
  source?: string
}

// ===== 通用子结构 =====

/** 选项（select/multi_select/radio/checkbox 共用） */
export interface UIOption {
  label: string
  value: string
  description?: string
  disabled?: boolean
}

/** 表单字段（form 专用） */
export interface UIFormField {
  /** 字段标识符 */
  name: string
  /** 字段使用的组件类型 */
  type: UIComponentType
  /** 该组件的 args */
  args: UIComponentArgs
  /** 是否必填，默认 false */
  required?: boolean
}

/** 键值对 */
export interface UIKeyValue {
  key: string
  value: string | number
  /** 值的渲染方式 */
  type?: 'text' | 'link' | 'tag' | 'badge'
}

/** 图表数据系列 */
export interface UIChartSeries {
  name: string
  data: number[]
}

// ===== 表单输入类 Args =====

/** form - 复合表单 */
export interface FormArgs {
  fields: UIFormField[]
  /** 提交按钮文案，默认 "提交" */
  submitText?: string
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string
  /** 布局方向，默认 "vertical" */
  layout?: 'vertical' | 'horizontal'
}

/** text_input - 单行/多行文本输入 */
export interface TextInputArgs {
  label: string
  placeholder?: string
  /** 多行模式，默认 false */
  multiline?: boolean
  maxLength?: number
  defaultValue?: string
}

/** select - 单选下拉 */
export interface SelectArgs {
  label: string
  options: UIOption[]
  defaultValue?: string
  placeholder?: string
}

/** multi_select - 多选 */
export interface MultiSelectArgs {
  label: string
  options: UIOption[]
  defaultValues?: string[]
  /** 最少选择数 */
  min?: number
  /** 最多选择数 */
  max?: number
}

/** radio - 单选按钮组 */
export interface RadioArgs {
  label: string
  options: UIOption[]
  defaultValue?: string
  direction?: 'horizontal' | 'vertical'
}

/** checkbox - 复选框组 */
export interface CheckboxArgs {
  label: string
  options: UIOption[]
  defaultValues?: string[]
}

/** slider - 滑块 */
export interface SliderArgs {
  label: string
  min: number
  max: number
  /** 步长，默认 1 */
  step?: number
  defaultValue?: number
  /** 单位标签，如 "%" */
  unit?: string
}

/** date_picker - 日期选择 */
export interface DatePickerArgs {
  label: string
  /** 模式，默认 "date" */
  mode?: 'date' | 'datetime' | 'range'
  /** 默认值，ISO 8601 */
  defaultValue?: string
  minDate?: string
  maxDate?: string
}

/** file_upload - 文件上传 */
export interface FileUploadArgs {
  label: string
  /** MIME 类型，如 "image/*,.pdf" */
  accept: string
  /** 最大文件大小 (bytes) */
  maxSize?: number
  /** 是否多选，默认 false */
  multiple?: boolean
  /** 最多文件数 */
  maxCount?: number
}

/** confirm - 确认对话框 */
export interface ConfirmArgs {
  title: string
  description?: string
  /** 确认按钮文案，默认 "确认" */
  confirmText?: string
  /** 取消按钮文案，默认 "取消" */
  cancelText?: string
  /** 危险操作标记（红色确认按钮） */
  danger?: boolean
}

// ===== 数据展示类 Args =====

/** table - 数据表格 */
export interface TableArgs {
  columns: TableColumn[]
  rows: Record<string, string | number | boolean | null>[]
  pagination?: { pageSize: number; total: number }
  title?: string
}

/** table 列定义 */
export interface TableColumn {
  key: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

/** card - 信息卡片 */
export interface CardArgs {
  title: string
  description?: string
  fields?: UIKeyValue[]
  imageUrl?: string
  actions?: { label: string; value: string }[]
}

/** card_list - 卡片列表 */
export interface CardListArgs {
  items: CardArgs[]
  /** 布局模式，默认 "list" */
  layout?: 'grid' | 'list'
  /** grid 模式下的列数，默认 2 */
  columns?: number
}

/** key_value - 键值对展示 */
export interface KeyValueArgs {
  items: UIKeyValue[]
  layout?: 'vertical' | 'horizontal' | 'grid'
  /** grid 模式下的列数 */
  columns?: number
}

/** code - 代码块 */
export interface CodeArgs {
  language: string
  code: string
  title?: string
  highlightLines?: number[]
}

/** image - 图片展示 */
export interface ImageArgs {
  url: string
  alt?: string
  width?: number
  height?: number
  caption?: string
}

/** markdown - Markdown 渲染 */
export interface MarkdownArgs {
  content: string
}

/** progress - 进度条 */
export interface ProgressArgs {
  label: string
  value: number
  /** 最大值，默认 100 */
  max?: number
  status?: 'active' | 'success' | 'error'
  /** 是否显示百分比，默认 true */
  showPercent?: boolean
}

// ===== 图表类 Args =====

/** bar_chart - 柱状图 */
export interface BarChartArgs {
  title?: string
  /** X 轴标签 */
  xAxis: string[]
  yAxis?: { label?: string }
  series: UIChartSeries[]
  stacked?: boolean
}

/** line_chart - 折线图 */
export interface LineChartArgs {
  title?: string
  xAxis: string[]
  yAxis?: { label?: string }
  series: UIChartSeries[]
  /** 平滑曲线 */
  smooth?: boolean
}

/** pie_chart - 饼图 */
export interface PieChartArgs {
  title?: string
  data: { name: string; value: number }[]
  /** 环形图模式 */
  donut?: boolean
}

/** radar_chart - 雷达图 */
export interface RadarChartArgs {
  title?: string
  indicators: { name: string; max: number }[]
  series: { name: string; values: number[] }[]
}

/** stat_card - 指标统计卡 */
export interface StatCardArgs {
  title: string
  value: string | number
  /** 前缀，如 "$" */
  prefix?: string
  /** 后缀，如 "%" */
  suffix?: string
  trend?: { direction: 'up' | 'down' | 'flat'; value: string }
  description?: string
}

// ===== 复合/特殊类 Args =====

/** steps - 步骤条 */
export interface StepsArgs {
  /** 当前步骤索引（0-based） */
  current: number
  items: StepItem[]
}

/** 步骤项 */
export interface StepItem {
  title: string
  description?: string
  status?: 'wait' | 'process' | 'finish' | 'error'
}

/** tabs - 标签页容器 */
export interface TabsArgs {
  activeKey?: string
  items: TabItem[]
}

/** 标签页项（content 为嵌套的 UIEventPayload，允许递归嵌套，前端硬限制 3 层） */
export interface TabItem {
  key: string
  label: string
  content: UIEventPayload
}

/** collapse - 折叠面板 */
export interface CollapseArgs {
  items: CollapseItem[]
  /** 手风琴模式（同时只展开一个） */
  accordion?: boolean
}

/** 折叠面板项（content 为嵌套的 UIEventPayload，允许递归嵌套，前端硬限制 3 层） */
export interface CollapseItem {
  title: string
  content: UIEventPayload
  defaultOpen?: boolean
}

/** alert - 提示信息 */
export interface AlertArgs {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  description?: string
  closable?: boolean
}

// ===== 组件 Args 联合类型 =====

/**
 * 所有 UI 组件 Args 的联合类型
 * 用于 UIEventPayload.args 的类型约束
 */
export type UIComponentArgs =
  // 表单输入类
  | FormArgs
  | TextInputArgs
  | SelectArgs
  | MultiSelectArgs
  | RadioArgs
  | CheckboxArgs
  | SliderArgs
  | DatePickerArgs
  | FileUploadArgs
  | ConfirmArgs
  // 数据展示类
  | TableArgs
  | CardArgs
  | CardListArgs
  | KeyValueArgs
  | CodeArgs
  | ImageArgs
  | MarkdownArgs
  | ProgressArgs
  // 图表类
  | BarChartArgs
  | LineChartArgs
  | PieChartArgs
  | RadarChartArgs
  | StatCardArgs
  // 复合/特殊类
  | StepsArgs
  | TabsArgs
  | CollapseArgs
  | AlertArgs

// ===== 类型映射（type → args 的精确类型推断） =====

/**
 * UIComponentType 到对应 Args 接口的映射
 * 用于根据 type 字段精确推断 args 类型
 */
export interface UIComponentArgsMap {
  form: FormArgs
  text_input: TextInputArgs
  select: SelectArgs
  multi_select: MultiSelectArgs
  radio: RadioArgs
  checkbox: CheckboxArgs
  slider: SliderArgs
  date_picker: DatePickerArgs
  file_upload: FileUploadArgs
  confirm: ConfirmArgs
  table: TableArgs
  card: CardArgs
  card_list: CardListArgs
  key_value: KeyValueArgs
  code: CodeArgs
  image: ImageArgs
  markdown: MarkdownArgs
  progress: ProgressArgs
  bar_chart: BarChartArgs
  line_chart: LineChartArgs
  pie_chart: PieChartArgs
  radar_chart: RadarChartArgs
  stat_card: StatCardArgs
  steps: StepsArgs
  tabs: TabsArgs
  collapse: CollapseArgs
  alert: AlertArgs
}

/**
 * 类型安全的 UIEventPayload 工厂类型
 * 使用示例: TypedUIEventPayload<'bar_chart'> 会精确推断 args 为 BarChartArgs
 */
export type TypedUIEventPayload<T extends UIComponentType> = {
  type: T
  args: UIComponentArgsMap[T]
  interact?: UIInteractMode
}
