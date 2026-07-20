# 最佳实践与扩展指南

## 代码规范

- **纯原生 JS**：不引入运行时框架，保持单文件、零依赖运行。
- **IIFE 包裹**：应用代码放在立即执行函数中，避免污染全局作用域。
- **常量集中**：文件扩展名、缓存 key、每页行数等使用常量定义在顶部。
- **事件委托**：分页按钮使用事件委托，避免动态生成大量监听器。

## 修改源码后必须重新构建

`exam-helper.html` 是构建产物，不要直接编辑它。应修改 `src/exam-helper-template.html`，然后运行：

```bash
npm run build
```

## 添加新的文件格式

当前支持 `.xls`、`.xlsx`、`.csv`。如需支持 `.ods` 等：

1. 在 `SUPPORTED_EXTS` 中加入扩展名。
2. SheetJS 已支持 ODS，通常无需额外解析逻辑。
3. 在 `scripts/test-parse.js` 中加入对应样例验证。

## 调整每页行数

修改 `ROWS_PER_PAGE` 常量即可。行数越大，每页题数越多，但 DOM 节点也越多，需根据目标设备性能权衡。

## 调整网格列宽

修改 CSS：

```css
main {
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
}
```

减小 `420px` 可在更窄屏幕上显示更多列，但也要考虑单题卡片的可读性。

## 更换拼音库

当前使用 `js-pinyin`，优势是体积小、支持首字母。若需要更精准的多音字处理：

1. 安装更大的拼音库（如 `pinyin-pro`）。
2. 修改 `build.js` 中内联的库路径。
3. 调整 `buildIndex()` 中的调用方式。
4. 注意最终 HTML 体积会显著增加。

## 保护私有题库

- 不要将 `repository/` 目录提交到公开仓库。
- 在 `.gitignore` 中排除 `repository/` 与 `node_modules/`。
- 对外发布时只提供 `exam-helper.html`、`templates/`、`README.md`、`docs/`。

## 测试 checklist

每次修改后建议验证：

- [ ] `npm run build` 成功且无报错。
- [ ] `node scripts/test-parse.js` 通过。
- [ ] `node scripts/test-playwright.js` 通过。
- [ ] 手动打开 `exam-helper.html`，用 `templates/` 目录验证加载、搜索、分页、高亮、帮助窗口。

## 性能建议

- 避免在搜索回调中直接操作大量 DOM。
- 对超过 5000 题的题库，可考虑：
  - 使用 Web Worker 构建索引。
  - 使用虚拟滚动替代分页。
  - 将缓存从 `localStorage` 迁移到 `IndexedDB`。
