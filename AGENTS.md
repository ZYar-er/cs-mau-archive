# 仓库指南

## 项目结构与模块组织

```
scripts/          Python 数据抓取脚本（Steam API、归档解析）
data/             脚本输出的 JSON 数据（daily.json、history.json、current.json）
web/              React + Vite 前端，用于可视化 MAU 数据
web/src/          TypeScript 源码
web/src/components/  React 组件（Header、HeroSection（含 QuickStats 卡片区）、ChartSection、MAUChart、Footer）
web/src/data/     可导入的数据模块，由仓库级 data/ 同步而来
web/scripts/      构建辅助脚本（copy-data.mjs）
archive/          Wayback Machine 的历史原始 HTML 快照
docs/             设计规格与实现计划
```

## 构建、测试与开发命令

所有前端命令在 `web/` 目录下执行。

| 命令                  | 用途                                          |
|----------------------|----------------------------------------------|
| `npm run dev`        | 启动 Vite 开发服务器（会先同步数据文件）       |
| `npm run build`      | 先用 `tsc` 做类型检查，再生成 Vite 生产构建     |
| `npm run preview`    | 本地预览生产构建                              |

Python 脚本在仓库根目录执行：

```sh
pip install -r requirements.txt
python scripts/fetch_monthly.py    # 从 Steam API 获取当月 MAU（按月份去重）
python scripts/parse_archives.py   # 解析历史 HTML 为 JSON
```

## 代码风格与命名规范

- **TypeScript（React）：** 使用严格编译器设置（`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`）。组件文件名使用 PascalCase，与默认导出名称一致。接口和类型在 `types.ts` 中定义，命名使用 PascalCase。导入语句使用 `verbatimModuleSyntax`。
- **Python：** 函数签名使用类型标注。函数和变量使用 `snake_case`。`scripts/` 中的脚本遵循 `fetch_*.py` / `parse_*.py` 的命名模式。
- **CSS：** 通过 `@tailwindcss/vite` 使用 Tailwind CSS 4。自定义主题 token 以 `steam-` 为前缀，在 `index.css` 中定义。
- **响应式：** 断点沿用 Tailwind 默认（mobile / sm 640 / lg 1024）。MAUChart 以容器宽度 640px 切换紧凑模式（调整 grid 边距、轴字号并隐藏事件标线文字）。统计数值统一使用 `tabular-nums`，卡片用 flex 垂直居中保持等高。
- **统计口径：** 按版本聚合统一使用 `lib/data.ts` 中的 `getVersion*` 函数（如 `getVersionAvgMAU`、`getVersionMinMAU`、`getVersionPeakRecord`），不要在组件里自行过滤。
- **格式化：** 尚未配置格式化工具。保持现有缩进风格一致（TSX/JSON 为 2 空格，Python 为 4 空格）。

## 测试指南

当前没有测试套件。添加测试时，将测试文件放在对应代码旁边（例如 `scripts/test_fetch_daily.py` 或 `web/src/components/__tests__/`）。在 `web/` 下运行 `npx tsc --noEmit` 进行类型检查，作为最低限度的安全网。

## 提交与 Pull Request 规范

- 遵循仓库历史中的 conventional commit 前缀：`feat:`、`fix:`、`docs:`、`data:`、`chore:`。
- CI 数据提交使用 `data: update MAU`，且仅修改 `data/*.json`（不要加 `[skip ci]`，否则 Cloudflare Pages 会跳过重建）。
- PR 推荐使用 squash-and-merge。在 PR 描述中关联相应的 issue 或设计文档。

## 数据流水线

1. `scripts/fetch_monthly.py` 每月通过 GitHub Actions（`cron: "0 9 1 * *"`）调用 Steam API，按月份去重后写入 `data/daily.json`，并同步更新 `data/current.json`。
2. `archive/` 中的历史 HTML 文件通过 `scripts/parse_archives.py` 解析为 `data/history.json`。
3. 开发/构建前，`web/scripts/copy-data.mjs` 将 `data/*.json` 复制到 `web/src/data/`，以便前端直接导入。
