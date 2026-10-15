# 风格（Style）

主站固定，风格是变量。同一份真实数据套不同视觉语言；默认那一套（`baseline`）就是线上现状。

风格是**正式版的一部分**：`/` 与 `/zh/` 的顶栏有一个风格控件，点击原地切到下一张卡，状态写在 `?v=`（`/?v=swiss`）。`web/src/lab/` 只是围绕同一批卡的 dev 沙盒 —— 右下角浮动条能直接按名字跳到任意一张卡，比顶栏的逐张轮转好用，仅此而已。

- 正式版：`/?v=<slug>`，或点顶栏的风格控件
- dev 沙盒：`npm run lab`（或 `npm run dev` 后开 `/lab/`），浮动条切换风格卡与语言
- 卡片源码：`web/src/styles/variants/`，注册表 `web/src/styles/registry.ts`
- `web/lab/index.html` 不在 `vite.config.ts` 的 `rollupOptions.input` 里，`vite build` 看不到它 —— 这是"沙盒不进 dist"的实现方式，不靠自觉。卡片本身则由 `src/SiteRoot.tsx` 引入，会正常打包

## 风格卡是什么

风格卡由人来写，负责**审美**：名称 / slug、视觉语言（色板、字体、材质、动效）、布局倾向、本卡特别要求。

`title` 不只在沙盒里出现 —— 它也是顶栏风格控件的文案（显示的是"下一张卡"的名字）。所以它要短得能放进一个 chip，改它等于改线上顶栏。

**约束不在风格卡里**。下面是每张卡都要满足的规则，不因风格不同而豁免。风格卡没写到的部分，我按"最能体现该视觉语言"来判断，交付时说明取舍。

## 加一张卡

1. 新建 `web/src/styles/variants/<slug>.tsx`（文件多了就改成 `<slug>/index.tsx`），默认导出 `StyleCard`（类型见 `web/src/styles/types.ts`）。组件会收到 `StyleCardProps`，里面是两个顶栏控件 —— **两个都必须转给顶栏**：
   - `styleSwitch`：不转的话顶栏少一个控件
   - `onLanguageToggle`：不转的话顶栏会退回自己的默认行为 —— 把地址改写成 `/zh/` 并只更新 provider 内部状态，页面与 URL 会脱节
2. 在 `web/src/styles/registry.ts` 的 `cards` 数组里排上。顺序就是顶栏控件轮转的顺序，第一张是默认卡

不用改 `vite.config.ts`，不用改任何构建脚本。新卡会同时出现在正式版和沙盒里。

## 硬性约束

### 数据

- 所有数值来自 `web/src/lib/data.ts` 的导出函数（`getAll` / `getLatest` / `getPeak` / `getYoYGrowth` / `getVersionAvgMAU` / `getVersionPeakRecord` …），变体里不自行聚合、取极值或算增长率。历史快照与 API 记录的合并、按月去重只存在于 `data.ts` 一处，别处重算早晚会和主站分叉
- 历史事实常量（CS:GO 峰值月 `2023-04`、CS2 起始月 `2023-09`）只做时间线与文案标注，不参与动态数值，定义处注明含义
- 格式化走 `web/src/lib/format.ts`（`fmtNum` / `fmtMAU` / `fmtDate`）；需要新单位（中文万/亿、百分比…）先加进 `format.ts` 再复用，不在变体里就地 `toFixed` / `toLocaleString`
- 只渲染 `data/*.json` 的真实数据，不用 mock 或占位数字

### 双语

- 所有用户可见文案走 `useI18n().t()`，不硬编码中英文
- 新增 key 同时补 `en` 和 `zh` 两个字典（`TKey` 联合类型会强制）
- en / zh 两态都不截断、不溢出，中文字号与行高可读

### 响应式

- 断点用 Tailwind 默认（sm 640 / lg 1024），不自造阈值
- 375px 宽下不出现横向滚动
- 图表随容器宽度降级，参照 `MAUChart` 在容器 640px 切紧凑模式（收紧 grid 边距、缩小轴字号、隐藏事件标线文字）
- 数值统一 `tabular-nums`，避免动画与切换时宽度抖动

### 可访问性

- 全页有且仅有一个 `<h1>`（Bing 收录要求，见 commit `624c3a0`）
- `<header>` / `<main>` / `<footer>` 齐备，主内容在 `<main>`
- 图表不能只有 canvas：给 `aria-label` 或视觉隐藏的文本数据摘要，关键结论必须以文本存在
- 正文对比度 ≥ 4.5:1，大字号 ≥ 3:1。深色底上的低饱和灰是最容易踩的坑
- **已知且已接受的例外：** Swiss 卡的强调红 `#DA291C` 在米白上为 4.32:1，用在 10–14px 的栏名 / hero 标签 / 时间线编号上，低于正文门槛。2026-10 明确决定保留风格卡指定的色值（压深到 `#d4281b` 可达 4.53:1，但没采纳）。**不要当成 bug 去"修复"**
- 尊重 `prefers-reduced-motion: reduce`，数字滚动与过渡一律关闭
- 可交互元素用 `<button>` / `<a>`，有可见 focus 样式，Tab 顺序符合阅读顺序
- 颜色不是唯一的信息通道（涨跌不能只靠红绿）

### 工程

- **顶栏、页尾、图表一律复用线上组件，不要自己写。** 三条换肤途径：
  - `components/MAUChart.tsx` —— canvas 颜色走 `theme` prop（`ChartTheme`，默认 `STEAM_THEME` 即线上配色），DOM 外壳走 CSS 覆盖（`mau-chart-*` 钩子类名）。缩放与吸附、y 轴自适应、tooltip、区间按钮、底部统计都锁在组件里
  - `components/Header.tsx` / `components/Footer.tsx` —— 纯 DOM，全部走 CSS 覆盖（`site-header-*` / `site-footer-*` 钩子类名）。**布局、间距、结构和链接行为是原版的，不得改动**；变体只改表面：底色、字体、边框、阴影、圆角。仅有的扩展是两个可选 prop：`onLanguageToggle`（同下文）与 `styleSwitch`（顶栏的风格控件，由 `styles/useStyleSelection.ts` 造好）。两个控件都仍是真 `<a>`，无 JS 时照常跳转
  - 变体自己的容器宽度要对齐线上 chrome 的 `mx-auto max-w-7xl px-4 sm:px-6`，否则网格边缘和顶栏页尾对不齐
- **改 `MAUChart` / `Header` / `Footer` 本体之前先读 `docs/site.md`**：tooltip 布局已定型、配色有两个写入点、语言切换是原地切换、风格状态在 `?v=`。变体的越权边界也在那里
- ECharts 必须懒加载（`lazy(() => import('.../MAUChart'))`），不进首屏 chunk —— 参照 `src/App.tsx` 把 ~500KB 推到首屏之后的写法
- 不引入新的运行时依赖（现有仅 react / react-dom / echarts），要加先单独讨论
- 卡片只放在 `web/src/styles/variants/` 下；不改 `src/SiteRoot.tsx`、`src/main.tsx` 与构建脚本。`src/components/**` 与 `src/lib/**` 是**有条件的例外**：只允许加法式改动（新增可选的主题 / 类名钩子、`format.ts` 里新的格式化函数、`i18n.tsx` 里新的文案 key），默认值与既有行为必须逐字保持不变
- 样式作用域限定在卡片根节点（如 `.v-<slug>`）或 CSS Module，**不写裸 `body` / `:root` / 标签选择器**。沙盒里卡片与浮动条共用一个文档，全局选择器会互相串味；正式版里卡片虽然独占页面，但它的 CSS 与线上样式同处一个 bundle，同样要保持可预测。唯一的例外是沙盒入口 `web/src/lab/lab.css`，它是 dev-only 文档自己的样式表，不会进 `dist/`
- 沙盒入口不放进 `vite.config.ts` 的 `rollupOptions.input`；卡片的注册表则要能在正式版里正常打包
