const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'src', 'exam-helper-template.html');
const OUTPUT = path.join(ROOT, 'exam-helper.html');

const xlsxPath = require.resolve('xlsx/dist/xlsx.full.min.js');
const pinyinPath = require.resolve('js-pinyin/dist/pinyin.js');

let template = fs.readFileSync(TEMPLATE, 'utf8');

const xlsxBase64 = fs.readFileSync(xlsxPath).toString('base64');
template = template.replace(
  '<!-- inject:xlsx -->',
  `<script src="data:text/javascript;base64,${xlsxBase64}"></script>`
);

const pinyinLib = fs.readFileSync(pinyinPath, 'utf8');
const pinyinWrapped = `(function(){
  var module = {exports:{}};
  var exports = module.exports;
${pinyinLib}
  window.PinyinClass = module.exports;
})();`;
const pinyinBase64 = Buffer.from(pinyinWrapped).toString('base64');
template = template.replace(
  '<!-- inject:pinyin -->',
  `<script src="data:text/javascript;base64,${pinyinBase64}"></script>`
);

fs.writeFileSync(OUTPUT, template);
console.log(`Built ${OUTPUT} (${(template.length / 1024).toFixed(1)} KB)`);
