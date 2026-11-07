#!/usr/bin/env node
/**
 * 产物自检（零依赖、无网络）：确认 exam-helper.html 仍是「一个能离线跑起来的单文件应用」。
 *
 * 与 test-browser.js / test-playwright.js 的区别：那两个脚本依赖 repository/ 下的真实题库
 * （该目录不入库），因此无法在 CI 里运行；本脚本只读构建产物做静态断言，任何环境都能跑。
 *
 * 用法：npm test  或  node scripts/smoke.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'exam-helper.html');

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
};

if (!fs.existsSync(FILE)) {
  console.error('✗ 产物不存在：exam-helper.html（先运行 npm run build）');
  process.exit(1);
}

const html = fs.readFileSync(FILE, 'utf8');
const sizeKB = Number((Buffer.byteLength(html) / 1024).toFixed(1));

// 1. 体量与结构：产物必须已经把两个库内联进来，体积不会小。
check('产物体积 > 800 KB（含内联 SheetJS + 拼音库）', sizeKB > 800, sizeKB + ' KB');
check('声明 doctype 与 UTF-8', /^<!DOCTYPE html>/i.test(html.trim()) && /charset=["']?utf-8/i.test(html));

// 2. 构建占位符必须被真实内容替换，否则线上就是一个坏掉的壳。
const leftovers = html.match(/<!--\s*inject:[^>]*?-->/g) || [];
check('无残留的 inject 占位符', leftovers.length === 0, leftovers.join(', '));

const dataScripts = (html.match(/<script src="data:text\/javascript;base64,/g) || []).length;
check('内联库脚本数 = 2', dataScripts === 2, String(dataScripts));

// 3. 应用逻辑与本地产物一致：搜索、题库读取、拼音检索三处关键代码都在。
check('调用 XLSX 解析题库', /XLSX\.read\(/.test(html));
check('使用 PinyinClass 做拼音检索', /PinyinClass/.test(html) && /getCamelChars/.test(html));

// 4. 关键 DOM 齐全（页面交互靠这些 id）。
const REQUIRED_IDS = [
  'search', 'count', 'results', 'status', 'progress',
  'folderInput', 'selectBtn', 'clearCacheBtn', 'helpBtn', 'helpModal', 'helpClose',
];
const missing = REQUIRED_IDS.filter((id) => !html.includes(`id="${id}"`));
check('关键 DOM 齐全', missing.length === 0, missing.length ? '缺失 ' + missing.join(', ') : REQUIRED_IDS.length + ' 个');

// 5. 离线可用：不允许任何指向外部的 src/href（data: / blob: / 锚点除外）。
const external = (html.match(/(?:src|href)="(?:https?:)?\/\/[^"]*"/g) || []);
check('无外部网络依赖（离线可用）', external.length === 0, external.slice(0, 3).join(', '));

console.log('');
if (failed) {
  console.error(`✗ 自检失败：${failed} 项未通过`);
  process.exit(1);
}
console.log(`✓ 自检全通过（${sizeKB} KB 单文件，离线可用）`);
