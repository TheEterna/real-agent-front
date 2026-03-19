import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Mock Data: Folders ====================

const MOCK_FOLDERS = [
  {
    id: 'folder-001',
    name: '工作文档',
    parentId: null,
    fileCount: 3,
    createdTime: '2026-02-01T08:00:00Z',
    updatedTime: '2026-03-18T10:00:00Z',
  },
  {
    id: 'folder-002',
    name: '个人资料',
    parentId: null,
    fileCount: 0,
    createdTime: '2026-02-05T09:00:00Z',
    updatedTime: '2026-03-15T14:00:00Z',
  },
  {
    id: 'folder-003',
    name: '学习资源',
    parentId: null,
    fileCount: 3,
    createdTime: '2026-02-10T10:00:00Z',
    updatedTime: '2026-03-12T16:00:00Z',
  },
  {
    id: 'folder-004',
    name: '2026年项目',
    parentId: 'folder-001',
    fileCount: 0,
    createdTime: '2026-02-15T08:00:00Z',
    updatedTime: '2026-03-17T09:00:00Z',
  },
  {
    id: 'folder-005',
    name: '技术方案',
    parentId: 'folder-001',
    fileCount: 2,
    createdTime: '2026-02-20T11:00:00Z',
    updatedTime: '2026-03-16T15:00:00Z',
  },
  {
    id: 'folder-006',
    name: '照片',
    parentId: 'folder-002',
    fileCount: 2,
    createdTime: '2026-03-01T08:00:00Z',
    updatedTime: '2026-03-14T12:00:00Z',
  },
  {
    id: 'folder-007',
    name: 'Q1',
    parentId: 'folder-004',
    fileCount: 3,
    createdTime: '2026-03-01T09:00:00Z',
    updatedTime: '2026-03-18T11:00:00Z',
  },
]

// ==================== Mock Data: Drive Files ====================

const MOCK_DRIVE_FILES = [
  // 工作文档 (folder-001)
  {
    id: 'dfile-001',
    userId: MOCK_USER.userId,
    fileName: '产品路线图.pdf',
    mimeType: 'application/pdf',
    size: 3145728,
    storagePath: '/mock/drive/产品路线图.pdf',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-001',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-18T10:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-002',
    userId: MOCK_USER.userId,
    fileName: '竞品分析报告.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1572864,
    storagePath: '/mock/drive/竞品分析报告.docx',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-001',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-17T14:30:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-003',
    userId: MOCK_USER.userId,
    fileName: '周报模板.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 204800,
    storagePath: '/mock/drive/周报模板.xlsx',
    storageType: 'COS',
    category: 'spreadsheet',
    folderId: 'folder-001',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-16T09:00:00Z',
    isDeleted: false,
  },
  // 2026年项目/Q1 (folder-007)
  {
    id: 'dfile-004',
    userId: MOCK_USER.userId,
    fileName: 'Sprint计划.md',
    mimeType: 'text/markdown',
    size: 51200,
    storagePath: '/mock/drive/Sprint计划.md',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-007',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-15T11:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-005',
    userId: MOCK_USER.userId,
    fileName: '迭代回顾.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 5242880,
    storagePath: '/mock/drive/迭代回顾.pptx',
    storageType: 'COS',
    category: 'presentation',
    folderId: 'folder-007',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-14T16:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-006',
    userId: MOCK_USER.userId,
    fileName: 'Bug清单.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 819200,
    storagePath: '/mock/drive/Bug清单.xlsx',
    storageType: 'COS',
    category: 'spreadsheet',
    folderId: 'folder-007',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-13T10:00:00Z',
    isDeleted: false,
  },
  // 技术方案 (folder-005)
  {
    id: 'dfile-007',
    userId: MOCK_USER.userId,
    fileName: '微服务拆分方案.pdf',
    mimeType: 'application/pdf',
    size: 2097152,
    storagePath: '/mock/drive/微服务拆分方案.pdf',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-005',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-12T14:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-008',
    userId: MOCK_USER.userId,
    fileName: '数据库ER图.png',
    mimeType: 'image/png',
    size: 1258291,
    storagePath: '/mock/drive/数据库ER图.png',
    storageType: 'COS',
    category: 'image',
    folderId: 'folder-005',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-11T09:30:00Z',
    isDeleted: false,
  },
  // 照片 (folder-006)
  {
    id: 'dfile-009',
    userId: MOCK_USER.userId,
    fileName: '工位照片.jpg',
    mimeType: 'image/jpeg',
    size: 2097152,
    storagePath: '/mock/drive/工位照片.jpg',
    storageType: 'COS',
    category: 'image',
    folderId: 'folder-006',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-10T08:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-010',
    userId: MOCK_USER.userId,
    fileName: '团建合影.jpg',
    mimeType: 'image/jpeg',
    size: 5242880,
    storagePath: '/mock/drive/团建合影.jpg',
    storageType: 'COS',
    category: 'image',
    folderId: 'folder-006',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-09T17:00:00Z',
    isDeleted: false,
  },
  // 学习资源 (folder-003)
  {
    id: 'dfile-011',
    userId: MOCK_USER.userId,
    fileName: 'Rust入门.pdf',
    mimeType: 'application/pdf',
    size: 10485760,
    storagePath: '/mock/drive/Rust入门.pdf',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-003',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-08T10:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-012',
    userId: MOCK_USER.userId,
    fileName: '设计模式.epub',
    mimeType: 'application/epub+zip',
    size: 3145728,
    storagePath: '/mock/drive/设计模式.epub',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-003',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-07T15:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-013',
    userId: MOCK_USER.userId,
    fileName: '算法笔记.md',
    mimeType: 'text/markdown',
    size: 204800,
    storagePath: '/mock/drive/算法笔记.md',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-003',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-06T11:00:00Z',
    isDeleted: false,
  },
  // Root (no folder)
  {
    id: 'dfile-014',
    userId: MOCK_USER.userId,
    fileName: '临时文件.txt',
    mimeType: 'text/plain',
    size: 5120,
    storagePath: '/mock/drive/临时文件.txt',
    storageType: 'COS',
    category: 'document',
    folderId: null,
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-05T08:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-015',
    userId: MOCK_USER.userId,
    fileName: 'README.md',
    mimeType: 'text/markdown',
    size: 10240,
    storagePath: '/mock/drive/README.md',
    storageType: 'COS',
    category: 'document',
    folderId: null,
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-04T09:00:00Z',
    isDeleted: false,
  },
  // Extra files to reach 20+
  {
    id: 'dfile-016',
    userId: MOCK_USER.userId,
    fileName: '接口测试报告.pdf',
    mimeType: 'application/pdf',
    size: 1572864,
    storagePath: '/mock/drive/接口测试报告.pdf',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-001',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-15T13:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-017',
    userId: MOCK_USER.userId,
    fileName: '性能优化方案.md',
    mimeType: 'text/markdown',
    size: 81920,
    storagePath: '/mock/drive/性能优化方案.md',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-005',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-10T15:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-018',
    userId: MOCK_USER.userId,
    fileName: '团队分工表.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 153600,
    storagePath: '/mock/drive/团队分工表.xlsx',
    storageType: 'COS',
    category: 'spreadsheet',
    folderId: 'folder-007',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-12T08:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-019',
    userId: MOCK_USER.userId,
    fileName: '活动海报.png',
    mimeType: 'image/png',
    size: 3670016,
    storagePath: '/mock/drive/活动海报.png',
    storageType: 'COS',
    category: 'image',
    folderId: 'folder-006',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-08T14:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-020',
    userId: MOCK_USER.userId,
    fileName: 'Docker实战.pdf',
    mimeType: 'application/pdf',
    size: 8388608,
    storagePath: '/mock/drive/Docker实战.pdf',
    storageType: 'COS',
    category: 'document',
    folderId: 'folder-003',
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-05T10:00:00Z',
    isDeleted: false,
  },
  {
    id: 'dfile-021',
    userId: MOCK_USER.userId,
    fileName: '备忘录.txt',
    mimeType: 'text/plain',
    size: 2048,
    storagePath: '/mock/drive/备忘录.txt',
    storageType: 'COS',
    category: 'document',
    folderId: null,
    ingestStatus: 'COMPLETED',
    ragflowDocumentId: null,
    uploadTime: '2026-03-03T16:00:00Z',
    isDeleted: false,
  },
]

// ==================== Helpers ====================

function getQueryParam(url: string, key: string): string | null {
  const queryStr = url.split('?')[1]
  if (!queryStr) return null
  const params = new URLSearchParams(queryStr)
  return params.get(key)
}

// ==================== Handler ====================

export default function driveMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // ==================== Folder Endpoints ====================

  // --- PUT /drive/folders/:id/rename ---
  if (method === 'put' && match('/drive/folders/:id/rename', url)) {
    const id = param('/drive/folders/:id/rename', url, 'id')
    const body = parseBody(config.data)
    return ok({ id, name: body.name || '已重命名文件夹', updatedTime: new Date().toISOString() })
  }

  // --- PUT /drive/folders/:id/move ---
  if (method === 'put' && match('/drive/folders/:id/move', url)) {
    const id = param('/drive/folders/:id/move', url, 'id')
    return ok({ id, updatedTime: new Date().toISOString() })
  }

  // --- GET /drive/folders ---
  if (method === 'get' && match('/drive/folders', url)) {
    return ok(MOCK_FOLDERS)
  }

  // --- POST /drive/folders ---
  if (method === 'post' && match('/drive/folders', url)) {
    const body = parseBody(config.data)
    return ok({
      id: mockId('folder'),
      name: body.name || '新建文件夹',
      parentId: body.parentId || null,
      fileCount: 0,
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
    })
  }

  // ==================== File Endpoints ====================

  // --- POST /drive/files/upload/single (most specific, check first) ---
  if (method === 'post' && match('/drive/files/upload/single', url)) {
    return ok({
      fileId: mockId('file'),
      fileName: 'mock-drive-upload.pdf',
      fileUrl: '/mock/drive/mock-drive-upload.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      category: 'document',
    })
  }

  // --- POST /drive/files/upload ---
  if (method === 'post' && match('/drive/files/upload', url)) {
    return ok([
      {
        fileId: mockId('file'),
        fileName: 'mock-drive-upload.pdf',
        fileUrl: '/mock/drive/mock-drive-upload.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        category: 'document',
      },
    ])
  }

  // --- PUT /drive/files/move ---
  if (method === 'put' && match('/drive/files/move', url)) {
    return ok(null)
  }

  // --- PUT /drive/files/:id/rename ---
  if (method === 'put' && match('/drive/files/:id/rename', url)) {
    const id = param('/drive/files/:id/rename', url, 'id')
    const body = parseBody(config.data)
    return ok({ id, fileName: body.fileName || body.name || '已重命名文件', updatedTime: new Date().toISOString() })
  }

  // --- GET /drive/files ---
  if (method === 'get' && match('/drive/files', url)) {
    const folderId = getQueryParam(url, 'folderId')
    if (folderId) {
      return ok(MOCK_DRIVE_FILES.filter((f) => f.folderId === folderId))
    }
    // No folderId → return root files (folderId is null)
    return ok(MOCK_DRIVE_FILES.filter((f) => f.folderId === null))
  }

  return null
}
