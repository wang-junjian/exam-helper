# 考试助手开发文档

本目录记录考试助手项目在开发过程中形成的设计思路、技术选型、踩坑经验与最佳实践。文档内容不包含任何真实题库数据，仅讨论工具本身。

## 文档列表

| 文件 | 内容 |
|------|------|
| [development-guide.md](./development-guide.md) | 开发环境、构建流程、测试方法、目录说明 |
| [architecture-and-decisions.md](./architecture-and-decisions.md) | 整体架构、关键设计决策与取舍 |
| [search-design.md](./search-design.md) | 检索索引、拼音支持、查询语义设计 |
| [lessons-learned.md](./lessons-learned.md) | 开发中遇到的问题与解决方案 |
| [best-practices.md](./best-practices.md) | 编码与维护建议、扩展指南 |

## 核心目标

- **单文件交付**：最终产物只有一个 HTML 文件，用户无需安装、无需联网即可使用。
- **本地数据优先**：题库数据始终保留在用户本地，应用只负责解析与展示，不向外传输任何数据。
- **跨平台浏览器**：优先支持 Chromium/Edge/Chrome，兼容现代浏览器的文件选择能力。
