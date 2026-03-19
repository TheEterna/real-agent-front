# i18n 修复指令（第二波）

## 背景
第一波 agent 已创建了所有 locale 模块文件（src/locales/modules/*.ts），包含中英文翻译 key。
但部分源文件的硬编码中文尚未替换为 t() 调用。你的任务是**完成替换**。

## 工作流程
1. 读取你负责的源文件
2. 读取对应的 locale 模块文件，了解已有的 key
3. 将源文件中的硬编码中文替换为 t() 调用
4. 如果 locale 文件中缺少某个 key，**新增到 locale 文件中**（zh + en 都要加）

## .vue 文件修改规则

### 确保 useI18n 已导入
```typescript
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
```
如果文件已有，不要重复。

### 替换规则
| 原始代码 | 替换为 |
|---------|--------|
| `<span>删除</span>` | `<span>{{ t('ns.key') }}</span>` |
| `title="删除"` | `:title="t('ns.key')"` |
| `:title="'删除'"` | `:title="t('ns.key')"` |
| `placeholder="搜索"` | `:placeholder="t('ns.key')"` |
| `message.error('失败')` | `message.error(t('ns.key'))` |
| `` `删除 ${name}` `` | `t('ns.key', { name })` |
| `{ label: '名称' }` | 改为 computed 或函数内调用 t() |

### 对象字面量中的 label
如果是静态对象，改为 computed:
```typescript
// Before
const items = [{ label: '首页' }]
// After
const items = computed(() => [{ label: t('ns.home') }])
```

## .ts 文件（非 Vue 组件）
使用全局 i18n:
```typescript
import i18n from '@/i18n'
const { t } = i18n.global
```

## 不需要翻译的内容
- 代码注释
- console.log/warn/error 调试信息
- TypeScript 类型定义注释
- CSS/style 内容
- API 路径
- mock 数据
- 变量名、函数名、emit 事件名

## 公共文案复用
通用按钮/错误/状态等使用 common 命名空间:
- `t('common.button.confirm')`, `t('common.button.cancel')`, `t('common.button.delete')` 等
- `t('common.error.generic')`, `t('common.message.copySuccess')` 等

## 关键约束
1. **大文件用 Edit 工具**，不要 Write 全量覆盖
2. 确保修改后**语法正确**
3. **不修改业务逻辑**
4. 如果 locale 文件缺 key，追加到对应模块文件末尾
