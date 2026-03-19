# Artifact Panel 全局状态管理重构

## 📋 概述

将 Artifact Panel 从组件本地状态提升到全局 Pinia Store 管理，实现跨组件状态共享和统一控制。

## 🎯 重构目标

1. **消除重复实例**：确保整个应用只有一个 Artifact Panel 实例
2. **状态共享**：所有组件可以通过 store 控制同一个 Panel
3. **简化逻辑**：统一的 API 接口，降低维护成本

## 🏗️ 架构设计

### 状态管理层（chatStore）

```typescript
// 类型定义
export type ArtifactType = 'code' | 'preview' | 'document' | 'table' | 'image' | 'pdf'

interface ArtifactPanelState {
    isOpen: boolean
    width: number  // percent
    content: string
    type: ArtifactType
}

// 全局状态
const artifactPanelState = ref<ArtifactPanelState>({
    isOpen: false,
    width: 45,
    content: '',
    type: 'code'
})
```

### API 方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `openArtifactPanel(content, type)` | content: string, type: ArtifactType | 打开 Panel 并设置内容 |
| `closeArtifactPanel()` | - | 关闭 Panel |
| `updateArtifactContent(content)` | content: string | 更新内容 |
| `updateArtifactType(type)` | type: ArtifactType | 更新类型 |
| `updateArtifactWidth(width)` | width: number | 更新宽度 |
| `getArtifactPanelState()` | - | 获取完整状态 |

## 📦 组件集成

### Index.vue（主页面）

**改动前**：
```typescript
// 本地状态
const isArtifactOpen = ref(false)
const artifactWidth = ref(45)
const currentArtifactContent = ref('')
const currentArtifactType = ref<'code' | 'preview' | 'document'>('code')

// 本地方法
const toggleArtifact = () => {
  isArtifactOpen.value = !isArtifactOpen.value
}
```

**改动后**：
```typescript
// 使用全局状态
const artifactState = computed(() => chat.artifactPanelState)
const isArtifactOpen = computed(() => artifactState.value.isOpen)
const currentArtifactContent = computed({
  get: () => artifactState.value.content,
  set: (value) => chat.updateArtifactContent(value)
})

// 使用全局方法
const toggleArtifact = () => {
  if (isArtifactOpen.value) {
    chat.closeArtifactPanel()
  } else {
    chat.openArtifactPanel('', 'code')
  }
}
```

### PlanWidget.vue（计划小部件）

**改动前**：
```vue
<!-- 本地 Artifact Panel 实例 -->
<ArtifactPanel 
  :isOpen="isArtifactOpen" 
  @close="isArtifactOpen = false" 
  :content="currentArtifactContent"
/>
```

**改动后**：
```typescript
// 通过全局 store 控制
const handleOpenArtifactPanel = () => {
  chat.openArtifactPanel('# 生成的文件\n\n内容...', 'document')
}
```

## ✅ 优势

1. **单一数据源**：所有组件共享同一个状态，避免不一致
2. **解耦合**：组件不需要管理 Panel 的状态，只需调用 API
3. **易扩展**：新增功能只需在 store 中添加方法
4. **易测试**：状态管理逻辑集中，便于单元测试

## 🔄 使用示例

### 打开文档编辑器
```typescript
chat.openArtifactPanel('# Markdown 文档\n\n内容...', 'document')
```

### 打开代码预览
```typescript
chat.openArtifactPanel('const hello = "world"', 'code')
```

### 打开图片查看器
```typescript
const imageUrl = URL.createObjectURL(file)
chat.openArtifactPanel(imageUrl, 'image')
```

### 关闭 Panel
```typescript
chat.closeArtifactPanel()
```

## 📝 注意事项

1. **内存管理**：打开图片/PDF 时使用 `URL.createObjectURL()`，记得在适当时机调用 `URL.revokeObjectURL()` 释放内存
2. **状态持久化**：目前状态不持久化，刷新页面后会重置。如需持久化，可在 store 中添加 localStorage 支持
3. **并发控制**：同一时间只能打开一个 Panel，新的打开操作会覆盖旧的内容

## 🚀 后续优化方向

1. **历史记录**：支持 Panel 内容的历史记录和前进/后退
2. **多 Panel 支持**：支持同时打开多个 Panel（Tab 模式）
3. **拖拽调整**：支持拖拽调整 Panel 宽度
4. **快捷键**：添加键盘快捷键支持（如 Ctrl+K 打开/关闭）

## 📅 更新日志

- **2026-01-21**: 初始版本，完成全局状态管理重构
