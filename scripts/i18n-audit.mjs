#!/usr/bin/env node
/**
 * i18n 审计脚本 — 扫描前端源码中残留的硬编码中文
 *
 * 排除规则：
 * - 代码注释
 * - console.log/warn/error/debug 调试信息
 * - import/export 语句
 * - TypeScript 类型注释和 JSDoc
 * - CSS/SCSS 样式块
 * - 纯数据文件（type定义、interface、enum）
 * - __stories__、__test__、__mocks__ 目录
 * - node_modules
 * - .d.ts 文件
 * - locale 文件本身 (locales/)
 * - I18N_AGENT_INSTRUCTIONS.md
 *
 * 输出：按文件分组的残留中文清单 + 统计
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, relative, extname } from 'path'

const SRC_DIR = join(process.cwd(), 'src')
const REPORT_PATH = join(process.cwd(), 'i18n-audit-report.json')

// 中文字符正则（含中文标点）
const CHINESE_RE = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/

// 需要排除的目录
const EXCLUDE_DIRS = new Set([
  'node_modules', '__stories__', '__test__', '__tests__', '__mocks__',
  'locales', 'i18n', '.git', 'dist', 'public'
])

// 需要排除的文件模式
const EXCLUDE_FILES = [
  /\.d\.ts$/,
  /\.stories\./,
  /\.test\./,
  /\.spec\./,
  /I18N_AGENT/,
]

// 判断一行是否应该跳过
function shouldSkipLine(line) {
  const trimmed = line.trim()

  // 空行
  if (!trimmed) return true

  // 单行注释
  if (trimmed.startsWith('//')) return true

  // JSDoc / 多行注释
  if (trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('*/')) return true

  // console 输出（调试信息不翻译）
  if (/console\.(log|warn|error|debug|info)\s*\(/.test(trimmed)) return true

  // import/export 语句
  if (/^(import|export)\s/.test(trimmed)) return true

  // TypeScript 类型定义行
  if (/^(type|interface|enum|declare)\s/.test(trimmed)) return true

  // aria-label 已经使用 t() 的
  if (/:aria-label="t\(/.test(trimmed)) return true

  // 已经使用 t() 的行（有中文可能是 fallback 参数）
  // 但我们仍然报告，标记为 "可能是 fallback"

  return false
}

// 判断是否在 <style> 块中
function isInStyleBlock(lines, lineIndex) {
  let inStyle = false
  for (let i = 0; i <= lineIndex; i++) {
    const l = lines[i].trim()
    if (/<style[\s>]/.test(l)) inStyle = true
    if (l === '</style>') inStyle = false
  }
  return inStyle
}

// 判断中文是否已经被 t() 包裹
function isAlreadyI18ned(line) {
  // 检查行中是否主要通过 t() 使用
  const tCallCount = (line.match(/\bt\(/g) || []).length
  // 简单启发式：如果有 t() 调用且中文出现在 t() 参数中，可能是 fallback
  if (tCallCount > 0) return 'partial'
  return false
}

// 递归收集文件
function collectFiles(dir) {
  const files = []

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry)) continue
      files.push(...collectFiles(fullPath))
    } else {
      const ext = extname(entry)
      if (!['.vue', '.ts', '.tsx'].includes(ext)) continue
      if (EXCLUDE_FILES.some(re => re.test(entry))) continue
      files.push(fullPath)
    }
  }

  return files
}

// 扫描单个文件
function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const issues = []

  let inMultiLineComment = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 多行注释追踪
    if (trimmed.includes('/*') && !trimmed.includes('*/')) {
      inMultiLineComment = true
    }
    if (trimmed.includes('*/')) {
      inMultiLineComment = false
      continue
    }
    if (inMultiLineComment) continue

    // 跳过不需要的行
    if (shouldSkipLine(line)) continue

    // 跳过 style 块
    if (isInStyleBlock(lines, i)) continue

    // 检测中文
    if (CHINESE_RE.test(line)) {
      const i18nStatus = isAlreadyI18ned(line)

      issues.push({
        line: i + 1,
        content: trimmed.substring(0, 120), // 截断过长行
        status: i18nStatus === 'partial' ? 'partial_i18n' : 'needs_i18n',
      })
    }
  }

  return issues
}

// 主函数
function main() {
  console.log('🔍 扫描 src/ 目录中的硬编码中文...\n')

  const files = collectFiles(SRC_DIR)
  console.log(`📁 发现 ${files.length} 个文件待扫描\n`)

  const results = {}
  let totalIssues = 0
  let totalFiles = 0

  for (const filePath of files) {
    const issues = scanFile(filePath)
    if (issues.length > 0) {
      const relPath = relative(SRC_DIR, filePath).replace(/\\/g, '/')
      results[relPath] = issues
      totalFiles++
      totalIssues += issues.length
    }
  }

  // 按目录分组统计
  const dirStats = {}
  for (const [file, issues] of Object.entries(results)) {
    const dir = file.split('/').slice(0, 2).join('/')
    if (!dirStats[dir]) dirStats[dir] = { files: 0, issues: 0, fileList: [] }
    dirStats[dir].files++
    dirStats[dir].issues += issues.length
    dirStats[dir].fileList.push(file)
  }

  // 输出摘要
  console.log('═══════════════════════════════════════')
  console.log('         i18n 审计报告摘要')
  console.log('═══════════════════════════════════════')
  console.log(`\n📊 总计: ${totalFiles} 个文件含残留中文, ${totalIssues} 处待处理\n`)

  console.log('按目录统计:')
  const sortedDirs = Object.entries(dirStats).sort((a, b) => b[1].issues - a[1].issues)
  for (const [dir, stat] of sortedDirs) {
    const bar = '█'.repeat(Math.min(Math.ceil(stat.issues / 5), 30))
    console.log(`  ${dir.padEnd(35)} ${String(stat.issues).padStart(4)} 处  ${String(stat.files).padStart(3)} 文件  ${bar}`)
  }

  // 输出每个文件的详情
  console.log('\n\n═══════════════════════════════════════')
  console.log('         按文件详情')
  console.log('═══════════════════════════════════════\n')

  for (const [file, issues] of Object.entries(results)) {
    const needsI18n = issues.filter(i => i.status === 'needs_i18n').length
    const partial = issues.filter(i => i.status === 'partial_i18n').length
    console.log(`\n📄 ${file} (${needsI18n} 需处理, ${partial} 部分完成)`)
    for (const issue of issues.slice(0, 8)) { // 每文件最多显示8条
      const marker = issue.status === 'partial_i18n' ? '⚠️' : '❌'
      console.log(`  ${marker} L${String(issue.line).padStart(4)}: ${issue.content}`)
    }
    if (issues.length > 8) {
      console.log(`  ... 还有 ${issues.length - 8} 处`)
    }
  }

  // 写入 JSON 报告
  const report = {
    timestamp: new Date().toISOString(),
    summary: { totalFiles, totalIssues, dirStats },
    details: results,
  }
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))
  console.log(`\n\n📋 完整报告已写入: ${REPORT_PATH}`)
}

main()
