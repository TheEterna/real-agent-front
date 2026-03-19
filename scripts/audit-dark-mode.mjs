#!/usr/bin/env node
/**
 * Dark Mode Audit Script — AI-consumable output (JSON to stdout)
 * Zero dependencies. Runs with: node scripts/audit-dark-mode.mjs
 *
 * Checks:
 * A) Template: Tailwind static-color classes missing dark: counterpart
 * B) Style: Hardcoded colors not inside .dark context
 * C) Style: SCSS vars ($primary-color-* etc.) used for colors (compile-time, won't auto-switch)
 * D) Template: inline style="" with hardcoded colors
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC = new URL('../src', import.meta.url).pathname;

// --- Color classification ---
// Static Tailwind colors that do NOT auto-switch via CSS variables
const STATIC_PALETTES = [
  'white','black','zinc','gray','slate','stone','neutral',
  'red','orange','amber','yellow','lime','green','emerald',
  'teal','cyan','sky','blue','indigo','violet','purple',
  'fuchsia','pink','rose'
];

// Theme colors defined in @theme — these use CSS vars and DO auto-switch
const THEME_PALETTES = [
  'primary','secondary','accent','background','foreground',
  'card','popover','muted','destructive','border','input','ring',
  'sidebar','chart'
];

// CSS properties that carry color
const COLOR_PROPS = /^(background|background-color|color|border-color|border-top-color|border-bottom-color|border-left-color|border-right-color|border|outline-color|box-shadow|fill|stroke|text-decoration-color|caret-color|accent-color)\s*:/i;

// Hardcoded color value patterns
const HARDCODED_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\s*\([\d\s,.%]+\)|hsla?\s*\([^)]+\)/g;

// SCSS variable pattern (compile-time, won't switch)
const SCSS_VAR = /\$[\w-]+-color[\w-]*/g;

// --- Helpers ---
function walk(dir, ext, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name.startsWith('.') || name === 'node_modules') continue;
    if (statSync(p).isDirectory()) walk(p, ext, acc);
    else if (p.endsWith(ext)) acc.push(p);
  }
  return acc;
}

function extractBlocks(content) {
  const tplMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
  const styleBlocks = [];
  const styleRe = /<style([^>]*)>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = styleRe.exec(content))) {
    const attrs = m[1];
    styleBlocks.push({
      scoped: attrs.includes('scoped'),
      lang: attrs.includes('scss') ? 'scss' : 'css',
      code: m[2],
      startLine: content.substring(0, m.index).split('\n').length
    });
  }
  return { template: tplMatch ? tplMatch[1] : '', styles: styleBlocks };
}

function isInsideDarkContext(code, charIndex) {
  // Walk backward from charIndex, tracking brace depth to see if we're inside .dark { }
  let depth = 0;
  for (let i = charIndex - 1; i >= 0; i--) {
    if (code[i] === '}') depth++;
    if (code[i] === '{') {
      depth--;
      if (depth < 0) {
        // Found the opening brace — check what selector precedes it
        const preceding = code.substring(Math.max(0, i - 200), i).trim();
        if (/\.dark\s*$/.test(preceding) || /\.dark\s+[^{}]*$/.test(preceding)) return true;
        if (/^:global\(\.dark\)/.test(preceding.split('\n').pop().trim())) return true;
        // Continue up in case of nested
        depth = 0;
      }
    }
  }
  return false;
}

function hexLuminance(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length < 6) return null;
  const r = parseInt(hex.substring(0,2),16)/255;
  const g = parseInt(hex.substring(2,4),16)/255;
  const b = parseInt(hex.substring(4,6),16)/255;
  const toL = c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*toL(r) + 0.7152*toL(g) + 0.0722*toL(b);
}

function rgbaLuminance(str) {
  const m = str.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!m) return null;
  const [r,g,b] = [+m[1]/255, +m[2]/255, +m[3]/255];
  const toL = c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return 0.2126*toL(r) + 0.7152*toL(g) + 0.0722*toL(b);
}

function rgbaAlpha(str) {
  const m = str.match(/rgba\s*\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)/);
  return m ? +m[1] : 1;
}

function colorLuminance(val) {
  if (val.startsWith('#')) return hexLuminance(val);
  if (val.startsWith('rgb')) return rgbaLuminance(val);
  return null;
}

// --- Check A: Template Tailwind classes ---
function checkTemplateClasses(template, file) {
  const issues = [];
  // Match class="..." and :class="..." with string content
  const classRe = /\bclass="([^"]+)"/g;
  let m;
  while ((m = classRe.exec(template))) {
    const classes = m[1].split(/\s+/);
    const line = template.substring(0, m.index).split('\n').length;

    const hasDarkBg = classes.some(c => c.startsWith('dark:bg-'));
    const hasDarkText = classes.some(c => c.startsWith('dark:text-'));
    const hasDarkBorder = classes.some(c => c.startsWith('dark:border-'));

    for (const cls of classes) {
      // Check bg-{static} without dark:bg-*
      const bgMatch = cls.match(/^bg-(\w+)(?:-(\d+))?(?:\/|$)/);
      if (bgMatch && !hasDarkBg) {
        const palette = bgMatch[1];
        if (STATIC_PALETTES.includes(palette)) {
          // Estimate severity by luminance
          const isLight = palette === 'white' || (bgMatch[2] && parseInt(bgMatch[2]) <= 300);
          issues.push({
            file, line, check: 'MISSING_DARK_BG',
            severity: isLight ? 'critical' : 'warning',
            code: cls,
            context: m[1].substring(0, 120),
            detail: `${cls} has no dark:bg-* counterpart`
          });
        }
      }

      // Check text-{static} without dark:text-*
      const textMatch = cls.match(/^text-(\w+)(?:-(\d+))?(?:\/|$)/);
      if (textMatch && !hasDarkText) {
        const palette = textMatch[1];
        // Skip non-color text utilities (text-sm, text-center, text-wrap, etc.)
        if (STATIC_PALETTES.includes(palette)) {
          const isDark = palette === 'black' || (textMatch[2] && parseInt(textMatch[2]) >= 700);
          issues.push({
            file, line, check: 'MISSING_DARK_TEXT',
            severity: isDark ? 'high' : 'low',
            code: cls,
            context: m[1].substring(0, 120),
            detail: `${cls} has no dark:text-* counterpart`
          });
        }
      }

      // Check border-{static} without dark:border-*
      const borderMatch = cls.match(/^border-(\w+)(?:-(\d+))?(?:\/|$)/);
      if (borderMatch && !hasDarkBorder) {
        const palette = borderMatch[1];
        // Skip non-color border utilities (border-2, border-solid, etc.)
        if (STATIC_PALETTES.includes(palette)) {
          issues.push({
            file, line, check: 'MISSING_DARK_BORDER',
            severity: 'low',
            code: cls,
            context: m[1].substring(0, 120),
            detail: `${cls} has no dark:border-* counterpart`
          });
        }
      }
    }
  }
  return issues;
}

// --- Check B/C: Style block hardcoded colors ---
function checkStyleBlock(block, file) {
  const issues = [];
  const lines = block.code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // Check if this line has a color property
    if (!COLOR_PROPS.test(trimmed)) continue;

    const absLine = block.startLine + i;
    const charIndex = block.code.indexOf(line);
    const inDark = isInsideDarkContext(block.code, charIndex);

    if (inDark) continue; // Inside .dark { } — this IS the dark override, skip

    // Check B: Hardcoded color values
    const colors = trimmed.match(HARDCODED_COLOR);
    if (colors) {
      for (const colorVal of colors) {
        // Skip very low alpha (basically transparent)
        if (colorVal.startsWith('rgba') && rgbaAlpha(colorVal) < 0.08) continue;

        const lum = colorLuminance(colorVal);

        // Determine severity based on property and luminance
        const isBgProp = /^(background|background-color)\s*:/i.test(trimmed);
        const isColorProp = /^color\s*:/i.test(trimmed);

        let severity = 'info';
        if (isBgProp && lum !== null && lum > 0.4) severity = 'critical';
        else if (isBgProp && lum !== null && lum > 0.2) severity = 'high';
        else if (isColorProp && lum !== null && lum < 0.15) severity = 'high';
        else if (lum !== null) severity = 'warning';
        else severity = 'info';

        issues.push({
          file, line: absLine, check: 'HARDCODED_COLOR',
          severity,
          code: trimmed.substring(0, 120),
          detail: `Hardcoded ${colorVal} (lum=${lum?.toFixed(3)||'?'}) not in .dark context`,
          scoped: block.scoped
        });
      }
    }

    // Check C: SCSS variables
    const scssVars = trimmed.match(SCSS_VAR);
    if (scssVars) {
      for (const v of scssVars) {
        issues.push({
          file, line: absLine, check: 'SCSS_VAR_COLOR',
          severity: 'warning',
          code: trimmed.substring(0, 120),
          detail: `SCSS var ${v} is compile-time — won't auto-switch in dark mode`,
          scoped: block.scoped
        });
      }
    }
  }
  return issues;
}

// --- Check D: Inline styles ---
function checkInlineStyles(template, file) {
  const issues = [];
  const re = /\bstyle="([^"]+)"/g;
  let m;
  while ((m = re.exec(template))) {
    const style = m[1];
    const colors = style.match(HARDCODED_COLOR);
    if (colors) {
      const line = template.substring(0, m.index).split('\n').length;
      for (const c of colors) {
        issues.push({
          file, line, check: 'INLINE_STYLE_COLOR',
          severity: 'warning',
          code: style.substring(0, 120),
          detail: `Inline style with hardcoded color: ${c}`
        });
      }
    }
  }
  return issues;
}

// --- Check E: Files with color styles but NO dark handling at all ---
function checkNoDarkHandling(content, styles, file) {
  const hasDarkInStyles = styles.some(s => /\.dark\b/.test(s.code));
  const hasDarkInTemplate = /dark:/.test(content);
  const hasColorProps = styles.some(s => COLOR_PROPS.test(s.code));
  const hasHardcodedColors = styles.some(s => HARDCODED_COLOR.test(s.code));

  if (hasHardcodedColors && !hasDarkInStyles && !hasDarkInTemplate) {
    // Count how many color properties
    let colorCount = 0;
    for (const s of styles) {
      const lines = s.code.split('\n');
      for (const l of lines) {
        if (COLOR_PROPS.test(l.trim()) && HARDCODED_COLOR.test(l)) colorCount++;
      }
    }
    if (colorCount > 0) {
      return [{
        file, line: 0, check: 'NO_DARK_HANDLING',
        severity: colorCount > 5 ? 'critical' : 'high',
        code: `${colorCount} hardcoded color properties`,
        detail: `File has ${colorCount} hardcoded color declarations but ZERO dark mode handling`
      }];
    }
  }
  return [];
}

// --- Main ---
const allFiles = walk(SRC, '.vue');
const allIssues = [];

for (const file of allFiles) {
  const rel = relative(SRC, file);
  const content = readFileSync(file, 'utf-8');
  const { template, styles } = extractBlocks(content);

  allIssues.push(...checkTemplateClasses(template, rel));
  for (const block of styles) {
    allIssues.push(...checkStyleBlock(block, rel));
  }
  allIssues.push(...checkInlineStyles(template, rel));
  allIssues.push(...checkNoDarkHandling(content, styles, rel));
}

// Deduplicate by file+line+check
const seen = new Set();
const deduped = allIssues.filter(i => {
  const key = `${i.file}:${i.line}:${i.check}:${i.code}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Sort: critical > high > warning > low > info
const ORDER = { critical: 0, high: 1, warning: 2, low: 3, info: 4 };
deduped.sort((a, b) => (ORDER[a.severity] ?? 9) - (ORDER[b.severity] ?? 9));

// Summary
const summary = {
  files_scanned: allFiles.length,
  total_issues: deduped.length,
  critical: deduped.filter(i => i.severity === 'critical').length,
  high: deduped.filter(i => i.severity === 'high').length,
  warning: deduped.filter(i => i.severity === 'warning').length,
  low: deduped.filter(i => i.severity === 'low').length,
  info: deduped.filter(i => i.severity === 'info').length,
  by_check: {}
};

for (const i of deduped) {
  summary.by_check[i.check] = (summary.by_check[i.check] || 0) + 1;
}

console.log(JSON.stringify({ summary, issues: deduped }, null, 2));
