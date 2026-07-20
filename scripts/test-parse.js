const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Pinyin = require('js-pinyin/dist/pinyin.js');

const REPO = path.resolve(__dirname, '..', 'repository', '普考-一线（其他人员）');
const pinyin = new Pinyin({ checkPolyphone: false, charCase: 0 });

function normalizeHeader(h) {
  return String(h).trim().replace(/\\/g, '');
}
function getCell(row, map, key) {
  const idx = map[key];
  return idx === undefined ? '' : row[idx];
}
function stripLeadingLabel(text) {
  return String(text).replace(/^[A-Da-d][\.\-、．]\s*/, '').trim();
}
function parseOptions(raw) {
  if (!raw) return [];
  const s = String(raw).trim();
  if (!s) return [];
  let parts = s.split(/[|\n\r]+/);
  if (parts.length <= 1) {
    const matches = [];
    const regex = /([A-Da-d])[\.\-、．]\s*/g;
    let m;
    while ((m = regex.exec(s)) !== null) matches.push(m);
    if (matches.length > 1) {
      parts = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = i + 1 < matches.length ? matches[i + 1].index : s.length;
        parts.push(s.slice(start, end).trim());
      }
    }
  }
  return parts.map(stripLeadingLabel).filter(p => p);
}

function rowsToQuestions(rows, fileName, sheetName) {
  if (!rows || rows.length < 2) return [];
  const header = rows[0].map(normalizeHeader);
  const colMap = {};
  header.forEach((h, i) => { if (h) colMap[h] = i; });
  const qs = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const questionText = String(getCell(r, colMap, '题干') || '').trim();
    if (!questionText) continue;
    qs.push({
      file: fileName,
      sheet: sheetName,
      type: String(getCell(r, colMap, '题型') || '未知').trim(),
      question: questionText,
      options: parseOptions(getCell(r, colMap, '选项')),
      answer: String(getCell(r, colMap, '答案') || '').trim(),
      category: String(getCell(r, colMap, '一级纲要') || '').trim(),
      source: String(getCell(r, colMap, '题目依据') || '').trim(),
      remark: String(getCell(r, colMap, '备注') || '').trim()
    });
  }
  return qs;
}

function buildIndex(questions) {
  return questions.map(q => {
    const joined = [q.question, q.options.join(' '), q.answer, q.source, q.category, q.file, q.remark].join(' ');
    return {
      raw: joined.toLowerCase(),
      full: pinyin.getFullChars(joined).toLowerCase(),
      initials: pinyin.getCamelChars(joined).toLowerCase()
    };
  });
}

function search(questions, index, query) {
  const tokens = query.split(/\s+/).filter(t => t);
  return questions.filter((q, i) => {
    const idx = index[i];
    return tokens.every(t => idx.raw.includes(t) || idx.full.includes(t) || idx.initials.includes(t));
  });
}

const files = fs.readdirSync(REPO).filter(f => /\.(xls|xlsx|csv)$/i.test(f));
let total = 0;
const all = [];
for (const f of files) {
  const workbook = XLSX.readFile(path.join(REPO, f));
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const qs = rowsToQuestions(rows, f, sheetName);
  console.log(`${f}: ${qs.length} 题`);
  total += qs.length;
  all.push(...qs);
}
console.log(`\n总计: ${total} 题（来自 ${files.length} 个文件）`);

const index = buildIndex(all);

const tests = ['安全', 'anquan', 'aq', '安全 工器具', '信息安规'];
for (const q of tests) {
  const hits = search(all, index, q);
  console.log(`搜索 "${q}" -> ${hits.length} 条`);
  if (hits.length) {
    const hit = hits[0];
    console.log(`  示例: ${hit.question.slice(0, 60)}... [${hit.type}]`);
  }
}
