import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== '.git') walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

walk(root);
const errors = [];
const referencePattern = /(?:href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(referencePattern)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#)/.test(reference)) continue;
    const targetWithoutFragment = reference.split('#')[0].split('?')[0];
    if (!targetWithoutFragment) continue;
    const target = path.resolve(path.dirname(file), targetWithoutFragment);
    if (!fs.existsSync(target)) {
      errors.push(`${path.relative(root, file)} → ${reference}`);
    }
  }
}

const required = [
  'index.html', 'courses/index.html', 'courses/digital-logic/index.html',
  'courses/digital-logic/chapter03-logic-gates/index.html',
  'downloads.html', 'quizzes.html', 'about.html', 'README.md'
];
for (const item of required) {
  if (!fs.existsSync(path.join(root, item))) errors.push(`缺少必要檔案：${item}`);
}

for (let chapter = 1; chapter <= 14; chapter++) {
  const folder = chapter === 3 ? 'chapter03-logic-gates' : `chapter${String(chapter).padStart(2, '0')}`;
  if (!fs.existsSync(path.join(root, 'courses/digital-logic', folder, 'index.html'))) {
    errors.push(`缺少第 ${chapter} 章入口`);
  }
}

if (errors.length) {
  console.error(`檢查失敗（${errors.length} 項）：\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`檢查完成：${htmlFiles.length} 個 HTML 頁面，所有本機連結與必要章節均正常。`);
