# 主站（原版）约定

这些是改主站外壳、文案或配色时会踩的东西。**不看代码注释就会踩**，所以集中在这里。

## 配色

- **有两个写入点，必须同步改。** 外壳走 `web/src/index.css` 的 `@theme`（`steam-*` token）；图表的 canvas 走 `components/MAUChart.tsx` 的 `STEAM_THEME` —— 后者是 TS 常量，**不读 CSS 变量**，改一边不会带动另一边。两处都对彼此写明了依赖注释
- 当前色板是 Steam 经典深色 / 库：`#171a21` 主背景（页面与顶栏页尾同色）、`#232730` 卡片、`#292e37` 悬停 / 激活、`#adadad` 次要文字与描边、`#66c0f4` 高亮蓝
- `blue-bright` / `blue-mid` / `blue-deep` / `green` / `text` **不在色板上**，是上一版保留的 Steam 强调色（hero 数字渐变、涨跌徽章要用）
- `--color-steam-border` 与 `--color-steam-muted` 现在同值（都是 `#adadad`）。站内 border 用法几乎都带 `/50`；只有 `lab/LabApp.tsx` 里两处是全不透明
- 图表里 `#2a3f5a` 系列的线已换成 `rgba(173, 173, 173, …)`（透明度 0.12–0.25）以配合新底色；**数据色不随色板变** —— 6 个月均值的黄、四个事件色、CS:GO 橙、历史峰值红都是语义色
- `<meta name="theme-color">` 在两个 `web/*/index.html` 里是**手写**的，不归 `gen-seo.mjs` 管，换底色要一起改

## 显示名与数据键

- 数据里 `game_version` 是 `csgo` / `cs2`，`getVersion*(...)` 按这些键筛选，**不得改名**
- 渲染一律走 `format.ts` 的 `fmtGameVersion()`（`csgo` → `CS:GO`，注意冒号）。直接把数据键 `toUpperCase()` 会渲染出 `CSGO`
- 全站统一：`Valve`（不是 `VALVE`）、`CS:GO`、`CS2`
- `QuickStats.tsx` 里的常量名 `CSGO_PEAK_MONTH` 属于**标识符**，JS 里写不了冒号，保持原样。**改显示，不改标识符**

## 界面习惯

- **语言切换是原地切换。** `Header` 的语言控件仍是 `<a href="/zh/">`（无 JS 时正常跳转到另一份预渲染文档），有 JS 时接管点击 → `setLang` + `history.replaceState` 改写本地化路径。lab 通过可选 prop `onLanguageToggle` 换掉后半段，改写自己的查询串
- 该控件的 `min-w-12 sm:min-w-13` 是必须的：`中文` 比 `EN` 宽约 11px，原地切换会让控件宽度跳动并把 GitHub 链接推走
- **已知缺口：** 原地切换不会更新 `document.title`。每个页面的标题由 `gen-seo.mjs` 带数据写进各自的 HTML，要在 JS 里同步就得复制那套逻辑
- **标签与数值之间不用 `·` 分隔**，例如 `records 2013-10 → 2026-09`、`游戏版本 CS2`
- **页面里没有折叠控件。** FAQ 是永久展开的普通块，不用 `<details>` / `<summary>` —— 这也让答案始终可见，与 `gen-seo.mjs` 写给爬虫的 `FAQPage` JSON-LD 保持一致
- **图表 tooltip 布局已定型**：两行数字（`MAU` / `6M avg`）在上，`月份 · 游戏版本` 收尾。两套主题共用这一个布局，只换颜色。改它之前先确认数据模型确实变了
