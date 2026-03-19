// /**
//  * 对话树 Mock 数据
//  * 模拟一个典型的多分支对话场景，用于前端测试
//  */
//
// import type { Turn, ConversationTree, ConversationTreeResponse } from '@/types/conversation'
// import { EventType } from '@/types/events'
//
// /**
//  * Mock Turn 数据
//  * 模拟场景：
//  * 1. 用户问："帮我写一个快速排序"
//  * 2. AI 回复 Python 版本
//  * 3. 用户要求"改成 Java 版本"（分支1）
//  * 4. 用户编辑为"增加注释"（分支2）
//  * 5. AI 重新生成回复（第2个回复）
//  */
// export const mockTurns: Turn[] = [
//   // 第一条用户消息
//   {
//     turnId: 'turn-1',
//     sessionId: 'test-session-1',
//     parentTurnId: null,
//     content: '你好，帮我写一个快速排序算法',
//     role: 'user',
//     type: EventType.USER,
//     createdAt: new Date('2025-12-03T10:00:00'),
//     messageId: 'msg-1'
//   },
//
//   // AI 第一次回复
//   {
//     turnId: 'turn-2',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-1',
//     content: '好的，这是 Python 版本的快速排序算法：\n\n```python\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n```',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:00:15'),
//     messageId: 'msg-2'
//   },
//
//   // 用户消息分支1：要求改成 Java
//   {
//     turnId: 'turn-3',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-2',
//     content: '改成 Java 版本',
//     role: 'user',
//     type: EventType.USER,
//     createdAt: new Date('2025-12-03T10:01:00'),
//     messageId: 'msg-3'
//   },
//
//   // AI 回复 Java 版本
//   {
//     turnId: 'turn-4',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-3',
//     content: '好的，这是 Java 版本的快速排序：\n\n```java\npublic static void quickSort(int[] arr, int low, int high) {\n    if (low < high) {\n        int pi = partition(arr, low, high);\n        quickSort(arr, low, pi - 1);\n        quickSort(arr, pi + 1, high);\n    }\n}\n```',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:01:20'),
//     messageId: 'msg-4'
//   },
//
//   // 用户继续追问
//   {
//     turnId: 'turn-5',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-4',
//     content: '能解释一下 partition 方法吗？',
//     role: 'user',
//     type: EventType.USER,
//     createdAt: new Date('2025-12-03T10:02:00'),
//     messageId: 'msg-5'
//   },
//
//   // AI 解释 partition
//   {
//     turnId: 'turn-6',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-5',
//     content: 'partition 方法是快速排序的核心，它的作用是...',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:02:15'),
//     messageId: 'msg-6'
//   },
//
//   // 用户消息分支2：编辑后重新发送（turn-2 的第二个子节点）
//   {
//     turnId: 'turn-7',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-2',
//     content: '在代码中增加详细注释',
//     role: 'user',
//     type: EventType.USER,
//     createdAt: new Date('2025-12-03T10:03:00'),
//     messageId: 'msg-7'
//   },
//
//   // AI 回复带注释的版本
//   {
//     turnId: 'turn-8',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-7',
//     content: '好的，这是带详细注释的 Python 快速排序：\n\n```python\ndef quick_sort(arr):\n    # 基准情况：空数组或单元素数组已经有序\n    if len(arr) <= 1:\n        return arr\n    # 选择中间元素作为基准值\n    pivot = arr[len(arr) // 2]\n    ...\n```',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:03:20'),
//     messageId: 'msg-8'
//   },
//
//   // AI 重新生成回复（turn-2 的第三个子节点，模拟重新生成）
//   {
//     turnId: 'turn-9',
//     sessionId: 'test-session-1',
//     parentTurnId: 'turn-1',
//     content: '好的，我来为您写一个优化的快速排序算法。这个版本使用了三路快排优化：\n\n```python\ndef quick_sort_3way(arr, low, high):\n    # 三路快排优化版本\n    ...\n```',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:04:00'),
//     messageId: 'msg-9'
//   }
// ]
//
// /**
//  * Mock 对话树响应（模拟后端 API 返回）
//  * 当前激活路径：turn-1 → turn-2 → turn-3 → turn-4 → turn-5 → turn-6
//  */
// export const mockConversationTreeResponse: ConversationTreeResponse = {
//   sessionId: 'test-session-1',
//   turns: mockTurns,
//   activePath: ['turn-1', 'turn-2', 'turn-3', 'turn-4', 'turn-5', 'turn-6']
// }
//
// /**
//  * 生成更复杂的 Mock 数据（用于压力测试）
//  * @param depth 树的深度
//  * @param branchFactor 每层的分支数
//  */
// export function generateComplexMockTree(depth: number = 5, branchFactor: number = 3): Turn[] {
//   const turns: Turn[] = []
//   let turnIdCounter = 1
//
//   const generateNode = (parentId: string | null, currentDepth: number, role: 'user' | 'assistant') => {
//     if (currentDepth > depth) return
//
//     const numChildren = currentDepth === depth ? 0 : branchFactor
//
//     for (let i = 0; i < (numChildren || 1); i++) {
//       const turnId = `turn-${turnIdCounter++}`
//       const turn: Turn = {
//         turnId,
//         sessionId: 'test-session-complex',
//         parentTurnId: parentId,
//         content: `${role === 'user' ? '用户' : 'AI'} 消息 ${turnId} (深度 ${currentDepth}, 分支 ${i + 1})`,
//         role,
//         type: role === 'user' ? EventType.USER : EventType.ASSISTANT,
//         createdAt: new Date(Date.now() + turnIdCounter * 1000),
//         messageId: `msg-${turnId}`
//       }
//       turns.push(turn)
//
//       // 递归生成子节点（角色交替）
//       generateNode(turnId, currentDepth + 1, role === 'user' ? 'assistant' : 'user')
//     }
//   }
//
//   // 从根节点开始生成（第一条用户消息）
//   generateNode(null, 0, 'user')
//
//   return turns
// }
//
// /**
//  * 模拟简单的线性对话（无分支）
//  */
// export const mockLinearConversation: Turn[] = [
//   {
//     turnId: 'turn-1',
//     sessionId: 'test-session-linear',
//     parentTurnId: null,
//     content: '你好',
//     role: 'user',
//     type: EventType.USER,
//     createdAt: new Date('2025-12-03T10:00:00'),
//     messageId: 'msg-1'
//   },
//   {
//     turnId: 'turn-2',
//     sessionId: 'test-session-linear',
//     parentTurnId: 'turn-1',
//     content: '你好！有什么可以帮助你的吗？',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:00:05'),
//     messageId: 'msg-2'
//   },
//   {
//     turnId: 'turn-3',
//     sessionId: 'test-session-linear',
//     parentTurnId: 'turn-2',
//     content: '今天天气怎么样？',
//     role: 'user',
//     type: EventType.USER,
//     createdAt: new Date('2025-12-03T10:00:10'),
//     messageId: 'msg-3'
//   },
//   {
//     turnId: 'turn-4',
//     sessionId: 'test-session-linear',
//     parentTurnId: 'turn-3',
//     content: '抱歉，我无法获取实时天气信息。',
//     role: 'assistant',
//     type: EventType.ASSISTANT,
//     createdAt: new Date('2025-12-03T10:00:15'),
//     messageId: 'msg-4'
//   }
// ]
//
// /**
//  * 从扁平数组构建树结构的测试数据验证
//  */
// export function validateMockData(turns: Turn[]): { valid: boolean; errors: string[] } {
//   const errors: string[] = []
//   const turnIds = new Set(turns.map(t => t.turnId))
//
//   turns.forEach(turn => {
//     // 验证父节点存在性
//     if (turn.parentTurnId && !turnIds.has(turn.parentTurnId)) {
//       errors.push(`Turn ${turn.turnId} 的父节点 ${turn.parentTurnId} 不存在`)
//     }
//
//     // 验证必填字段
//     if (!turn.turnId || !turn.sessionId || !turn.role || !turn.content) {
//       errors.push(`Turn ${turn.turnId} 缺少必填字段`)
//     }
//   })
//
//   return {
//     valid: errors.length === 0,
//     errors
//   }
// }
