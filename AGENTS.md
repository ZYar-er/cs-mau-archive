# 仓库指南

## 项目结构与模块组织

```
scripts/          Python 数据抓取脚本（Steam API、归档解析）
data/             脚本输出的 JSON 数据（daily.json、history.json、current.json）
web/              React + Vite 前端，用于可视化 MAU 数据
web/src/          TypeScript 源码
web/src/components/  React 组件（Header、HeroSection（含 QuickStats 卡片区）、ChartSection、MAUChart、InfoSection、Footer）
web/src/data/     可导入的数据模块，由仓库级 data/ 同步而来
web/src/styles/   风格卡与注册表（正式版与沙盒共用，会打包进 dist）
web/src/lab/      风格沙盒的 dev-only 外壳（不进 dist）
web/lab/          风格实验入口 HTML（dev-only，不参与构建）
web/scripts/      构建辅助脚本（copy-data.mjs、gen-seo.mjs、render-ssr.mjs）
archive/          Wayback Machine 的历史原始 HTML 快照
docs/             设计文档（site.md：主站约定；lab.md：风格与沙盒的约束清单）
```

## 构建、测试与开发命令

所有前端命令在 `web/` 目录下执行。

| 命令                  | 用途                                          |
|----------------------|----------------------------------------------|
| `npm run dev`        | 启动 Vite 开发服务器（会先同步数据、生成 SEO 元数据） |
| `npm run lab`        | 打开风格实验沙盒 `/lab/`（同样会先同步数据）    |
| `npm run build`      | `tsc` 类型检查 → Vite 生产构建 → SSR 预渲染进 `dist/index.html` |
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
- **统计口径：** 按版本聚合统一使用 `lib/data.ts` 中的 `getVersion*` 函数（如 `getVersionAvgMAU`、`getVersionMinMAU`、`getVersionPeakRecord`），不要在组件里自行过滤。历史确定值（如 CS:GO 峰值月份 `2023-04`、CS2 起始月份 `2023-09`）允许以常量硬编码，但须与数据核对一致，并在定义处注明含义，不得用于动态统计数值。
- **格式化：** 尚未配置格式化工具。保持现有缩进风格一致（TSX/JSON 为 2 空格，Python 为 4 空格）。
- **主站约定：** 配色、显示名与界面习惯的规则集中在 `docs/site.md`，改外壳、文案或色板前先读。其中「配色有两个写入点」和「改显示不改标识符」最容易踩。

## 风格（Style）

风格是**正式版的一部分**：`/` 与 `/zh/` 的顶栏有风格控件，点击原地切到下一张卡，状态写在 `?v=`（`/?v=swiss`）。默认卡 `baseline` 就是线上原貌，也是唯一被预渲染的一份。`web/src/styles/` 存放风格卡与注册表（由 `src/SiteRoot.tsx` 引入，会打包进 `dist/`）；`web/src/lab/` 只是围绕它们的 dev 沙盒外壳，`web/lab/index.html` 故意不在 `vite.config.ts` 的 `rollupOptions.input` 中，`vite build` 看不到它，沙盒与浮动切换条都不会进 `dist/`。

风格卡（人写的审美描述）决定"长什么样"，约束清单决定"不许破什么"，后者不因风格而豁免。

**改动 `web/src/styles/**`、`web/src/lab/**` 或新增风格卡前，先读 `docs/lab.md` 的硬性约束清单**。最容易踩的几条：

- 统计数值一律走 `lib/data.ts` 的导出函数，格式化走 `lib/format.ts`；变体里不重算口径、不就地 `toFixed` / `toLocaleString`
- 用户可见文案一律走 `useI18n().t()`，新增 key 同时补 `en` / `zh`（`TKey` 会强制）
- 每个变体都要过：双语、375px 无横向滚动、`prefers-reduced-motion`、键盘可达、`<h1>` 唯一
- 顶栏、页尾、图表一律复用线上组件（`Header` / `Footer` / `MAUChart`），不自己重写；换肤只走 `theme` prop 与 CSS 钩子类名（`site-header-*` / `site-footer-*` / `mau-chart-*`），**布局与结构保持原版**；ECharts 保持懒加载；不引入新的运行时依赖
- 卡片要把 `StyleCardProps` 里的两个顶栏控件（`styleSwitch` / `onLanguageToggle`）都转给 `Header`，漏传会少一个控件，或让页面与 URL 脱节
- 样式作用域限定在卡片根节点，禁止裸 `body` / `:root` / 标签选择器（沙盒里与浮动切换条共用文档）
- 卡片只放在 `web/src/styles/variants/`。`src/components/**` 允许加法式改动（新增可选主题 / 类名钩子，默认值复刻现状），不改 `src/SiteRoot.tsx`、`src/main.tsx`、`src/lib/**` 及构建脚本

## 测试指南

当前没有测试套件。添加测试时，将测试文件放在对应代码旁边（例如 `scripts/test_fetch_monthly.py` 或 `web/src/components/__tests__/`）。在 `web/` 下运行 `npx tsc --noEmit` 进行类型检查，作为最低限度的安全网。

## 提交与 Pull Request 规范

- 遵循仓库历史中的 conventional commit 前缀：`feat:`、`fix:`、`docs:`、`data:`、`chore:`。
- CI 数据提交使用 `data: update MAU`，且仅修改 `data/*.json`（不要加 `[skip ci]`，否则 Cloudflare Pages 会跳过重建）。
- PR 推荐使用 squash-and-merge。在 PR 描述中关联相应的 issue 或设计文档。

## 数据流水线

1. `scripts/fetch_monthly.py` 每月通过 GitHub Actions（`cron: "0 9 1 * *"`）调用 Steam API，按月份去重后写入 `data/daily.json`，并同步更新 `data/current.json`。
2. `archive/` 中的历史 HTML 文件通过 `scripts/parse_archives.py` 解析为 `data/history.json`。
3. 开发/构建前，`web/scripts/copy-data.mjs` 将 `data/*.json` 复制到 `web/src/data/`，以便前端直接导入。
4. 构建前 `web/scripts/gen-seo.mjs` 依据数据生成 SEO 元数据（写入 `web/index.html` 的 token）、`web/public/robots.txt`、`web/public/sitemap.xml`、`web/public/llms.txt`（给 agent 的简报），并把数据 JSON 复制到 `web/public/data/` 供爬虫抓取（`all.json` 为合并去重结果，其余三个原样发布，四个都在 Dataset 的 `distribution` 里）；构建后 `web/scripts/render-ssr.mjs` 将 React 应用预渲染进 `dist/index.html`（客户端再水合）。SEO 相关改动注意：`index.html` 中的 `__SEO_*__` token 由 gen-seo 在构建时替换，勿手改生成结果。
