const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML = fs.readFileSync(path.resolve(__dirname, '..', 'exam-helper.html'), 'utf8');
const REPO = path.resolve(__dirname, '..', 'repository', '普考-一线（其他人员）');

const dom = new JSDOM(HTML, { runScripts: 'dangerously', resources: 'usable' });
const window = dom.window;
const document = window.document;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  // Wait for scripts to run
  await wait(500);

  const input = document.getElementById('folderInput');
  const files = fs.readdirSync(REPO)
    .filter(f => /\.(xls|xlsx|csv)$/i.test(f))
    .map(f => {
      const buf = fs.readFileSync(path.join(REPO, f));
      return new window.File([buf], f, { type: 'application/vnd.ms-excel' });
    });

  const dt = new window.DataTransfer();
  files.forEach(f => dt.items.add(f));
  input.files = dt.files;

  const event = new window.Event('change', { bubbles: true });
  input.dispatchEvent(event);

  // Wait for parsing
  await wait(3000);

  const status = document.getElementById('status').textContent;
  const count = document.getElementById('count').textContent;
  const cards = document.querySelectorAll('.card');

  console.log('status:', status);
  console.log('count:', count);
  console.log('cards rendered:', cards.length);

  // Try a search
  const search = document.getElementById('search');
  search.value = '安全';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  await wait(300);
  console.log('after search "安全":', document.getElementById('count').textContent, 'cards:', document.querySelectorAll('.card').length);

  window.close();
})();
