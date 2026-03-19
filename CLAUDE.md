# 前端开发规范

> 此文件只包含必须遵守的规则和红线。
> 设计哲学、交互理论、动画模板等参考性知识见 `docs/reference/frontend-*.md`
> 完整品牌设计上下文（品牌四层模型、用户画像、反参考清单）见根目录 `.impeccable.md`

> **设计宪法** — Don Norman
>
> 1. 用户的每一次操作，系统必须在 200ms 内可见地回应
> 2. 不要展示系统的复杂性，要展示用户的可能性
> 3. 动画不是装饰，是物理世界在屏幕上的延伸
> 4. 任何可以丢失用户数据的操作，都不该被允许发生
> 5. 先确保"能用且可靠"，再追求"好看且惊艳"

> **铁律：前端设计必须经由 Skill 驱动**
>
> 任何涉及前端设计的操作——包括但不限于：新建/修改组件 UI、页面布局、样式调整、动效添加、响应式适配、暗色模式实现、设计系统变更——**必须**优先调用 `/h-frontend-design`（或对应的 `i-frontend-design`）Skill。
>
> - **为什么**：Skill 内置了 `.impeccable.md` 品牌上下文、Design Token 体系、Norman 原则检查、WCAG 合规验证等完整链路，能避免脱离设计系统的"野生实现"。
> - **怎么做**：在动手写任何设计相关代码之前，先调用 Skill 获取设计指导，再按其输出实施。如果任务同时涉及多个设计维度（如排版 + 动效 + 暗色），可叠加调用 `h-typeset`、`h-animate`、`h-audit` 等专项 Skill。
> - **违反后果**：未经 Skill 驱动的设计代码视为不合规，Code Review 时必须打回重做。

---

## 1. 技术选型

| 模块 | 选型 | 意图 |
|------|------|------|
| 组件系统 | shadcn-vue (Reka UI) | Headless 极致可控 |
| 样式引擎 | Tailwind CSS 4 | 原子化构建 |
| 动效引擎 | **GSAP 3.x（强制）** | 复杂序列动画唯一选择，禁止 CSS transition 替代 |
| 图标 | Lucide Vue | 统一图标语言 + hover/active 动效 |
| 字体 | 系统字体栈(UI) / JetBrains Mono(代码) / Inter(长文编辑) | 零加载成本 + 等宽数据 |
| 备选 | ant-design-vue / sass | shadcn-vue 无法满足时的后备 |

---

## 2. 交互规范

### Tooltip 规范

所有 icon-only 按钮**必须**用 `<Tooltip>` 包裹（Norman 可发现性原则），同时保留 `aria-label`：

```vue
<TooltipProvider :delay-duration="300" :skip-delay-duration="100">
  <Tooltip>
    <TooltipTrigger as-child>
      <button aria-label="复制代码"><Copy :size="16" /></button>
    </TooltipTrigger>
    <TooltipContent side="top" :side-offset="6"
      class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
      复制代码
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

- `delay: 300ms` 防划过闪烁，`skip-delay: 100ms` 连续悬停跳过延迟
- 单行 ≤ 20 字，需要更多信息用 Popover
- 触摸设备不显示 Tooltip，依赖 `aria-label`

### 异步操作双保险

触发异步操作的交互，**必须**同时满足两层防护：

```typescript
// UI 层：:disabled="isSubmitting" + Loader2 旋转图标
// 逻辑层：handler 入口 guard
async function handleSubmit() {
  if (isSubmitting.value) return        // Guard: 防重入
  isSubmitting.value = true
  try { await someAsyncOperation() }
  finally { isSubmitting.value = false }
}
```

Store Action 同理：`if (loading.value) return` 防并发。模态框触发按钮：已打开时 disabled。

> 📖 微交互词典、Saffer 四柱模型、克制三原则等详见 `docs/reference/frontend-interaction-patterns.md`

## 3. 设计令牌速查

| 场景 | 正确 | 禁止 |
|------|------|------|
| 颜色 | `var(--color-primary-500)` / Tailwind `text-primary-500` | 硬编码 `#6b9a98` |
| 圆角 | `var(--radius-md)` / `rounded-xl` | 硬编码 `border-radius: 12px` |
| 缓动 | `--ease-fluid` / `--ease-spring` / `--ease-snap` 三选一 | 每组件自定义 cubic-bezier |
| 阴影 | `var(--shadow-md)` / `shadow-md` | 硬编码 box-shadow |

**三条缓动曲线**：

| Token | 物理隐喻 | 场景 |
|-------|---------|------|
| `--ease-fluid` | 水流感（ease-out） | 元素进入、面板展开 |
| `--ease-spring` | 弹簧感（过冲回弹） | 卡片插入、弹窗出现 |
| `--ease-snap` | 干脆利落（ease-in-out） | 排序变化、布局重排 |

> 📖 完整 Token 定义（色值、排版、间距、阴影等）详见 `docs/reference/frontend-visual-system.md`
> 📖 动画分级、GSAP 模板、编舞原则详见 `docs/reference/frontend-animation.md`

### Color Token 架构（源自 `.impeccable.md`）

```
tailwind.css (@theme)          ← 品牌色 canonical source（primary/secondary/accent-warm）
  ↓                               + shadcn/ui base vars（oklch）
  ↓                               + .dark {} overrides
variables.scss                 ← SCSS 编译时 tokens（jelly palette, plan colors）
  ↓
index.scss (:root / .dark)     ← 运行时 CSS variables（blur/glow/ease/shadow/fluid-spacing）
  ↓                               不重复定义 tailwind.css 中已有的变量
theme-base.css                 ← Agent 执行阶段状态色（THINKING/ACTION/TOOL/ERROR）
ant-theme-tokens.ts            ← Ant Design 主题桥接（JS 可访问）
```

### 动效架构

```
GSAP 3.x (mandatory)
  ├── useFluidAnimation.ts     ← 标准动效（breathe/springIn/confirmSuccess/shakeError）
  ├── useVideoAnimations.ts    ← 视频 Playground 状态机动效
  ├── useReducedMotion.ts      ← prefers-reduced-motion 守卫
  └── 组件内 GSAP               ← onUnmounted 必须 killTweensOf

Duration tokens:  fast=100ms | normal=200ms | slow=320ms
Easing tokens:    fluid=0.23,1,0.32,1 | spring=0.34,1.56,0.64,1 | snap=0.4,0,0.2,1
Stagger:          30-60ms between items
GPU rule:         only transform + opacity (no width/height/top/left)
Signature moments: AI 开始思考（静默→脉冲）、消息流第一个字符出现（等待→流动）
```

### 间距 & 圆角 & 阴影

```
Spacing:  xs=4px | sm=8px | md=12px | lg=16px | xl=24px
Fluid:    clamp(4px,1vw,8px) → clamp(16px,4vw,32px)
Radius:   xs=4px | sm=12px | md=14px | lg=16px | xl=20px | full=9999px
Base:     --radius: 1rem (16px)

Shadow Light:  sm = 0 1px 3px rgba(0,0,0,0.06)
               md = 0 4px 12px rgba(0,0,0,0.08)
               lg = 0 8px 30px rgba(0,0,0,0.12)
               glow = 0 4px 20px rgba(90,132,130,0.15)
Shadow Dark:   amplified opacity (0.4/0.5/0.6), glow tinted rgba(124,183,180,0.2)
```

## 4. 暗色模式规范

> *"暗色模式不是简单的颜色反转，而是重新设计光的层级关系。"*

### Root Cause #1: Vue SFC `:global(.dark)` 编译 Bug

**问题**：在 scoped `<style>` 块中使用 `:global(.dark) .child { }` 时，Vue 编译器会丢失子选择器。

```scss
// ❌ 错误：scoped 块中的 :global(.dark)
<style lang="scss" scoped>
:global(.dark) .trigger-name {
  color: white;  // 编译后变成 .dark { color: white; } — 子选择器丢失！
}
</style>
```

**修复**：使用独立的非 scoped 块，直接嵌套 `.dark {}`。

```scss
// ✅ 正确：非 scoped 块
<style lang="scss">
.dark {
  .trigger-name {
    color: rgba(224, 231, 235, 0.9);
  }
}
</style>
```

### Root Cause #2: Tailwind CSS v4 Dark Mode 配置

**问题**：Tailwind v4 的 dark mode 通过 `@custom-variant` 定义，必须在 `tailwind.css` 中正确配置。

```css
/* tailwind.css */
@custom-variant dark (&:is(.dark *));
```

`.dark` 类必须添加到祖先元素（`<html>` 或 `<body>`），后代元素的 `dark:` 变体才会生效。

### Root Cause #3: `@theme` vs `@theme inline`

**问题**：`@theme inline` 会将颜色值硬编码到生成的 CSS 中，无法通过 `.dark {}` 覆盖。

```css
/* ❌ 错误：@theme inline 硬编码值 */
@theme inline {
  --color-primary-500: #6db8ac;  /* 编译为固定值，.dark 无法覆盖 */
}

/* ✅ 正确：@theme 生成 CSS 变量 */
@theme {
  --color-primary-500: #6db8ac;  /* 生成 var(--color-primary-500) */
}

.dark {
  --color-primary-500: #7cb7b4;  /* 可以覆盖 */
}
```

### Root Cause #4: CSS 变量级联冲突（最关键）

**问题**：`index.scss`（通过 `main.ts` 加载）晚于 `tailwind.css`（`index.html` `<link>`）。两者都定义 `:root { --foreground }` 时，后加载的 `index.scss` 覆盖 `tailwind.css` 的 `.dark` 定义（特异性相同但加载更晚）。

```
加载顺序：
1. index.html <link> → tailwind.css 加载
   :root { --foreground: light-color; }
   .dark { --foreground: dark-color; }

2. main.ts import → index.scss 加载
   :root { --foreground: light-color; }  ← 覆盖了 tailwind.css 的 .dark 定义！
```

**修复**：从 `index.scss` 的 `:root {}` 块中删除所有与 `tailwind.css` 重复的变量定义。

```scss
// index.scss
:root {
  /* shadcn/ui 基础变量 (--background, --foreground, --card 等) 由 tailwind.css 统一管理
     此处不再重复定义，避免覆盖 tailwind.css .dark {} 的暗色覆写。
     品牌色 (--color-primary-*, --color-secondary-*, --color-accent-warm-*) 同理由 tailwind.css @theme 管理。 */

  /* 仅保留 tailwind.css 未定义的自定义 token */
  --border-color: #{$border-color};
  --radius-xs: 4px;
  --blur-md: 20px;
  /* ... 其他非重复变量 */
}
```

### 组件级实现模式

#### 标准模式：非 scoped 块 + `.dark {}` 嵌套

```vue
<style lang="scss" scoped>
.my-component { background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(0, 0, 0, 0.1); }
.label { color: rgba(0, 0, 0, 0.9); }
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .my-component { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.06); }
  .label { color: rgba(224, 231, 235, 0.9); }
}
</style>
```

#### 特异性匹配规则

**问题**：scoped 块生成的选择器（带 `[data-v-xxx]`）特异性高于非 scoped 的 `.dark` 规则。

```scss
// ❌ Scoped 编译后: .trigger-btn .trigger-info .trigger-name[data-v-xxx] { } → 特异性 0,1,3
// ❌ 非 scoped: .dark .trigger-name { } → 特异性 0,0,2 — 输了！

// ✅ 正确：匹配嵌套深度
.dark {
  .trigger-btn .trigger-info .trigger-name { color: rgba(224, 231, 235, 0.9); } // 特异性 0,0,4 — 赢了！
}
```

### 颜色映射策略

| 亮色模式 | 暗色模式 | 说明 |
|---------|---------|------|
| `rgba(255, 255, 255, 0.9)` | `rgba(255, 255, 255, 0.04)` | 白色背景 → 极暗半透明白 |
| `rgba(0, 0, 0, 0.9)` | `rgba(224, 231, 235, 0.9)` | 黑色文本 → 浅灰文本 |
| `rgba(0, 0, 0, 0.1)` | `rgba(255, 255, 255, 0.06)` | 浅灰边框 → 极暗半透明白 |
| `$primary-color-500` | `$primary-color-400` | 品牌色降一档（更亮） |
| `box-shadow: 0 2px 8px rgba(0,0,0,0.1)` | `box-shadow: 0 2px 8px rgba(0,0,0,0.4)` | 阴影加深 |

**核心原则**：背景亮→暗 / 文本暗→亮 / 边框用半透明白色 `rgba(255,255,255,0.06-0.1)` / 品牌色降一档色阶（500→400）

### 暗色模式红线

| 禁止 | 说明 |
|------|------|
| scoped 块中 `:global(.dark)` | 编译 bug，必用非 scoped 块 |
| `index.scss` `:root` 定义 shadcn/品牌色变量 | 覆盖 tailwind.css 的 `.dark` |
| 暗色规则特异性 < scoped 规则 | 必须匹配嵌套深度 |
| 使用 `$primary-color-*` 定义颜色 | 必须用 CSS 变量或 Tailwind |
| 新组件无暗色适配 | 必须同步添加 `.dark {}` 块 |
| 修改颜色后不运行 audit 脚本 | 必须验证暗色模式无回退 |

---

## 5. Storybook 规范

### 强制要求

| 组件类型 | Story 要求 | 说明 |
|---------|-----------|------|
| **UI 基础组件** (`components/ui/`) | **强制** | 无外部依赖，纯展示逻辑 |
| **轻业务组件** (可用 mock 数据独立渲染) | **强制** | 如 StatusIndicator, ErrorMessage |
| **重业务组件** (深度依赖 Store/Router/API) | **推荐** | 依赖过重时可豁免 |
| **页面级组件** (`pages/`) | **不需要** | Storybook 不是页面测试工具 |

**判定标准**：组件能否在不依赖 Store/Router/API 的前提下渲染出有意义的 UI？能 → 强制；不能 → 推荐/豁免。

### 文件组织

```
components/ui/button/
├── Button.vue
├── index.ts
└── __stories__/
    └── Button.stories.ts    # 必须
```

### Story 编写规范

```typescript
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '../'

const meta = {
  title: 'UI/Button',          // 分类：UI/ | Business/ | Design System/
  component: Button,
  tags: ['autodocs'],
  argTypes: { /* 控件定义 */ },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { /* 默认态 */ }
export const AllVariants: Story = { /* 所有变体并排 */ }
```

**必须覆盖的场景**：Default / AllVariants / Disabled（如支持）/ WithIcon（如支持）。暗色模式通过 Storybook 主题切换器验证。

**开发工作流**：新建/修改组件 → 编写/更新 Story → `npm run storybook` 验证 → 确认亮色+暗色均正常 → 同一 commit 提交

### Storybook 红线

| 禁止 | 说明 |
|------|------|
| UI 基础组件无 Story 文件 | 新建 `components/ui/` 下组件必须同步创建 Story |
| 修改组件 props 后不更新 Story | Story 必须覆盖所有公开的 variant/size/状态 |
| Story 中硬编码 Store/API 依赖 | 使用 mock 数据或 args，保持 Story 独立可运行 |
| 提交组件变更但不含 Story 变更 | 组件与 Story 必须在同一 commit 中 |

---

## 6. 红线总表

### 架构红线

| 禁止 | Norman 原则 |
|------|------------|
| View 层直接 `axios.get` / `store.loadXXX()` | 概念模型——分层即一致性 |
| View 层 `watch` 触发数据加载（应通过 Store setters） | 约束——防止失控的副作用 |
| Composable 直接操作 DOM | 约束——职责分离 |
| Service 修改 Store | 映射——数据流单向 |
| 前后端类型混用（必须经 Service 层 DTO↔Model 转换） | 概念模型——层级隔离 |
| View/Composable/Service 直接操作 localStorage | 约束——统一管理存储 |
| 异步按钮无 disabled + handler guard | 约束——防重复操作 |
| 修改 `composables/sse/` 核心逻辑 | 约束——核心冻结 |
| SWR 请求失败时清空缓存 | 反馈——降级展示优于空白 |
| 硬编码用户可见 UI 文案（必须用 `useTextConfig`） | 约束——文案热更新能力 |

### 设计红线

| 禁止 | Norman 原则 |
|------|------------|
| 大面积高饱和渐变背景 | — |
| 默认生硬 box-shadow（应弥散柔和） | 可供性——质感暗示层级 |
| 正文背景使用毛玻璃（仅浮层可用） | — |
| 按钮无 hover/active 态 | 反馈——用户操作必须有回应 |
| 内容瞬间出现/消失（≥ 150ms 过渡） | 反馈——状态变化必须可感知 |
| CSS transition 实现复杂序列动画 | — 必须用 GSAP |
| 硬编码颜色/圆角/缓动（必须用 Token） | 一致性——统一设计语言 |
| 正文行高 < 1.5 / 使用 px 字号 | 可供性——阅读舒适性 |
| 同页面 4+ 种字号层级 | 映射——层级混乱 |

### 可访问性红线

| 禁止 | Norman 原则 |
|------|------------|
| Glass 浮层文本对比度 < 4.5:1 | 可发现性——看不清即不存在 |
| `<div @click>` 无 role/tabindex/键盘事件 | 可供性——看起来不像按钮 |
| `outline: none` 后无替代焦点样式 | 示能符——聚焦位置不可见 |
| Hover-only 功能无 focus 等价路径 | 可发现性——键盘用户盲区 |
| icon button 无 `aria-label` + `<Tooltip>` | 可发现性——功能不可感知 |
| 仅靠颜色区分状态 | 反馈——色觉障碍用户无法理解 |
| 忽略 `prefers-reduced-motion` | 约束——尊重用户偏好 |
| 触控目标 < 44×44px | 可供性——点不中 |
| 固定 px 布局 / 375px 下功能不可用 | 可发现性——窄屏用户被排斥 |

### 审查速查

| 维度 | 检查项 | 通过标准 |
|------|--------|---------|
| 反馈 | 按钮有 active 反馈 | `active:scale-95` 或 GSAP |
| 反馈 | 新元素有入场动画 | GSAP springIn / CSS fade-in |
| 反馈 | 操作有成功/失败反馈 | 图标 morph + glow 或 shake |
| 反馈 | 即时性 | 触发到反馈 < 100ms |
| 可发现 | icon button 有 Tooltip | shadcn `<Tooltip>` + `aria-label` |
| 可发现 | Cmd+K 可达所有隐藏功能 | 命令面板包含全部入口 |
| 映射 | 缓动匹配运动方向 | 进入 ease-out，离开 ease-in |
| 映射 | 时长匹配元素质量 | tooltip 150ms，modal 400ms |
| 约束 | 异步按钮 disabled + guard | 双保险缺一不可 |
| 一致 | 颜色来自 Token | 无硬编码色值 |
| 一致 | 缓动三选一 | fluid / spring / snap |
| 性能 | 动画仅用 transform/opacity | 无 width/height 动画 |
| 性能 | GSAP 组件卸载清理 | `onUnmounted` killTweensOf |
| 性能 | 长列表虚拟化 | > 100 条启用 |
| 克制 | 无装饰性动画 | 每个动画能用四柱解构 |
| 克制 | 通过 100 次使用测试 | 高频动效 ≤ 150ms |
| Storybook | UI 组件有 Story 文件 | `__stories__/Xxx.stories.ts` 存在 |
| Storybook | Story 覆盖所有变体 | Default + AllVariants + Disabled |
| Storybook | 亮/暗色模式均正常 | Storybook 主题切换器验证 |
| Storybook | 组件与 Story 同步提交 | 同一 commit |
