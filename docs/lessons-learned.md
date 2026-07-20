# 踩坑与解决方案

## 1. SheetJS 直接内联导致脚本解析失败

### 现象

把 `xlsx.full.min.js` 直接以文本形式内联到 `<script>` 标签后，浏览器控制台报：

```
Invalid left-hand side in assignment
ReferenceError: XLSX is not defined
```

解析失败，题库加载结果为 0 题。

### 原因

SheetJS 压缩代码中包含 `<!--` 序列。在 HTML `<script>` 标签内部，`<!--` 会触发 HTML 解析器的“script data escaped”状态，导致后续部分代码被错误解析。

### 解决方案

不直接内联 JS 文本，而是将库以 **base64 data URI** 形式通过 `<script src="data:text/javascript;base64,...">` 引入：

```html
<script src="data:text/javascript;base64,SGVsbG8sIFdvcmxkIQ=="></script>
```

这样 HTML 解析器只解析 `src` 属性，不会触碰 JS 内容，彻底规避注释边界问题。

### 代价

base64 编码使文件体积增加约 33%，但换来的是内联脚本的安全性。

## 2. 缓存了空数据

### 现象

用户反馈加载后显示“已加载缓存，共 0 题”。

### 原因

早期实现中，即使解析失败导致 `questions` 为空，也会把空数组写入 `localStorage`。下次打开应用时直接读取了错误的空缓存。

### 解决方案

1. `saveCache()` 中增加判断，题目数为 0 时不写入缓存。
2. 升级 `CACHE_KEY` 版本号，让旧错误缓存自然失效。
3. 界面提供「清除缓存」按钮，允许用户手动重置。

## 3. 英文缩写搜索被拼音首字母干扰

### 现象

输入 `GDW` 后命中大量不相关题目。

### 原因

`GDW` 作为子串可能出现在某些中文短语的拼音首字母串中（如“供电单位” → `gddw` 包含 `gdw`）。

### 解决方案

对全大写英文字母的 token 单独处理，仅匹配原文 `raw` 字段，不走拼音索引。

## 4. 一次性渲染大量卡片导致卡顿

### 现象

当题库有几千题时，全部渲染到 DOM 中页面非常卡。

### 解决方案

- 分页：每次只渲染当前页内容。
- 按“行数”分页：由于采用 CSS Grid 多列布局，按固定行数计算每页题数，保证页面整齐无半行空白。

## 5. 多选题答案只高亮一个选项

### 现象

多选题答案为 `ABCD` 时，只有一个选项被标绿。

### 原因

早期 `isOptionAnswer` 只做了单字母相等判断。

### 解决方案

将答案拆分为字母数组，再判断选项标签是否在该数组中：

```js
const labels = answer.toUpperCase().replace(/[^A-D]/g, '').split('');
if (labels.includes(label)) return true;
```
