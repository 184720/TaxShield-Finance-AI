# 金税四期小微企业季度申报风险智能自检工具 - 需求拆解文档

## 产品概述

- **产品类型**: 税务风险自检工具
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 小微企业主、兼职会计
- **核心价值**: 季度申报前自助排查税务风险，提前发现异常指标并获取合规整改建议
- **界面语言**: 中文
- **主题偏好**: user_specified（专业商务风，主色调深蓝色 #1a365d + 白色背景）
- **导航模式**: 路径导航
- **导航布局**: 顶部 Topbar（三页均有返回/切换入口，工具型应用，简洁明了）

---

## 页面结构总览

| 页面名称 | 文件名 | 路由 | 页面类型 | 入口来源 |
|---------|-------|------|---------|---------|
| 数据录入页 | `DataInputPage.tsx` | `/` | 一级 | 导航（默认首页） |
| 风险检测结果页 | `RiskResultPage.tsx` | `/result` | 一级 | 数据录入页 → 点击「开始检测」 |
| 整改建议页 | `SuggestionPage.tsx` | `/suggestions` | 一级 | 风险检测结果页 → 点击「查看整改建议」 |

> **页面类型说明**：三个页面构成一条完整的用户任务流（输入 → 检测 → 整改），通过顶部导航可回溯查看。

---

## 页面布局建议

### 数据录入页

- **布局模式**: 单栏居中布局 + 顶部分组标签
- **视觉重心**: 表单输入区（占主体）
- **结果承载区**: 无（此页为输入起点）；按钮区位于底部固定或跟随表单末端
- **一键填充区**: 表单上方放置 3 个场景填充按钮，方便测试

### 风险检测结果页

- **布局模式**: 上下分区 + 中部卡片网格
- **视觉重心**: 顶部综合风险仪表盘（第一眼抓住用户注意力）
- **结果承载区**:
  - 上部：综合风险仪表盘 + 风险等级标签
  - 中部：8 项风险指标横向条形图/卡片列表（正常绿色、异常红色）
  - 底部：税费优惠适配结果卡（含优惠政策列表 + 预计减免金额）
- **底部 CTA**: 「查看详细整改建议」按钮跳转到整改建议页

### 整改建议页

- **布局模式**: 单栏列表 + 折叠展开卡片
- **视觉重心**: 异常指标整改卡列表（按风险等级从高到低排序）
- **结果承载区**: 每条异常指标为一张卡片，包含：风险指标名称、当前计算值、风险说明、合规整改建议、政策依据
- **顶部返回**: 可返回结果页重新查看数据

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 测试数据一键填充 | demo-mock | `src/data/testData.ts` 中定义低/中/高风险 3 组模拟数据，点击按钮注入表单 state | ✅ 本身就是 mock |
| 风险指标计算逻辑 | demo-mock | 前端内置 8 项风险指标的计算公式与判断阈值，表单提交后纯前端计算产出结果 | ✅ 纯前端规则计算，无后端 |
| 税费优惠适配计算 | demo-mock | 前端内置小规模增值税减免 + 小型微利企业所得税优惠规则，根据表单数据计算减免金额 | ✅ 纯前端规则计算 |
| 整改建议文案 | demo-mock | `src/data/suggestions.ts` 中按 8 项指标预定义整改建议与政策依据文案，异常时匹配输出 | ✅ 静态文案库 |
| 用户表单输入数据持久化（可选，跨页传递） | local-persist | 表单数据存入 `__global_tax_check_formData`，结果页/建议页读取计算；刷新后仍可查看 | 无 |

> 说明：本工具为纯前端计算工具，所有规则与文案均内置为前端代码，用户输入数据仅在本地流转，不涉及后端 API 或插件。

---

## 导航配置

- **导航布局**: Topbar（顶部简洁导航，工具标题 + 步骤进度指示）
- **导航项**:
  | 导航文字 | 路由 | 图标(可选) |
  |---------|------|-----------|
  | 数据录入 | `/` | FileText |
  | 风险检测 | `/result` | ShieldAlert |
  | 整改建议 | `/suggestions` | Lightbulb |

> 注：结果页与建议页在无数据时应校验并引导回录入页。顶部导航同时体现"步骤进度"感（录入 → 检测 → 整改）。

---

## 功能列表

### 数据录入页

- **页面目标**: 收集企业基础信息与财税数据，为风险检测提供输入
- **功能点**:
  - **分组表单录入**: 分为"基础信息""增值税数据""企业所得税数据"三组，共 11 个字段（行业选择、申报季度、从业人数、资产总额、开票收入、未开票收入、进项税额、营业收入、营业成本、销售费用、管理费用、利润总额），支持基本数值校验（非负、必填）
  - **一键填充测试数据**: 提供「🎯 低风险」「⚠️ 中风险」「🚨 高风险」3 个按钮，点击后自动填入对应场景的模拟数据，方便快速体验
  - **开始检测跳转**: 点击「开始检测」按钮，校验必填项后，将表单数据存入全局状态并跳转至结果页，附带加载过渡动画

### 风险检测结果页

- **页面目标**: 综合展示风险评分、8 项指标检测结果及税费优惠适配情况
- **功能点**:
  - **综合风险仪表盘**: 顶部用仪表盘（Gauge）展示 0-100 分综合风险评分，配合风险等级标签（低/中/高），颜色随等级变化（绿/黄/红）
  - **8 项风险指标展示**: 中部以横向条形图或卡片列表形式展示 8 项指标检测结果，正常显示绿色、异常显示红色，hover 或展开可查看计算值与判定说明
  - **税费优惠适配结果**: 底部卡片自动判断是否符合小规模纳税人增值税减免、小型微利企业所得税优惠条件，列出可享受的优惠政策名称与预计减免金额
  - **跳转整改建议**: 底部「查看详细整改建议」按钮，跳转到整改建议页

### 整改建议页

- **页面目标**: 针对每项异常指标提供具体的合规整改建议与政策依据
- **功能点**:
  - **异常指标列表**: 按风险等级从高到低排列所有异常指标卡片，每条包含风险指标名称、当前计算值、风险说明、合规整改建议、政策依据 5 个字段
  - **无异常提示**: 若全部指标正常，展示「恭喜！未检测到明显风险」的空状态卡片，并给出常规合规提醒
  - **返回重测**: 顶部或底部提供「返回修改数据重新检测」入口，回到录入页

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用页面 |
|---------|---------|---------|
| `__global_tax_check_formData` | 用户录入的表单数据，类型为 `ITaxFormData` | 数据录入页、风险检测结果页、整改建议页 |
| `__global_tax_check_result` | 计算后的风险检测结果，类型为 `IRiskResult` | 风险检测结果页、整改建议页 |

```ts
interface ITaxFormData {
  /** 行业：现代服务业/商贸业/其他 */
  industry: 'service' | 'trade' | 'other';
  /** 申报季度，如 "2026Q2" */
  quarter: string;
  /** 从业人数 */
  employeeCount: number;
  /** 资产总额（万元） */
  totalAssets: number;
  /** 开票收入（元） */
  invoicedRevenue: number;
  /** 未开票收入（元） */
  uninvoicedRevenue: number;
  /** 进项税额（元） */
  inputTax: number;
  /** 营业收入（元） */
  operatingRevenue: number;
  /** 营业成本（元） */
  operatingCost: number;
  /** 销售费用（元） */
  sellingExpenses: number;
  /** 管理费用（元） */
  adminExpenses: number;
  /** 利润总额（元） */
  totalProfit: number;
}

interface IRiskIndicator {
  /** 指标编号 1-8 */
  id: number;
  /** 指标名称 */
  name: string;
  /** 计算值 */
  value: number;
  /** 单位 */
  unit: string;
  /** 风险等级 */
  level: 'normal' | 'low' | 'medium' | 'high';
  /** 风险说明 */
  description: string;
  /** 整改建议 */
  suggestion: string;
  /** 政策依据 */
  policyBasis: string;
}

interface ITaxBenefit {
  /** 优惠政策名称 */
  policyName: string;
  /** 是否符合条件 */
  eligible: boolean;
  /** 预计减免金额（元） */
  estimatedSaving: number;
  /** 说明 */
  description: string;
}

interface IRiskResult {
  /** 综合评分 0-100 */
  overallScore: number;
  /** 综合风险等级 */
  overallLevel: 'low' | 'medium' | 'high';
  /** 8 项风险指标详情 */
  indicators: IRiskIndicator[];
  /** 税费优惠适配结果 */
  benefits: ITaxBenefit[];
}

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Free —— 无参考材料，从税务合规产品语义出发自主建立设计系统
- **核心情绪 / 应用类型**: 面向小微企业主的税务风控自检工具，需传达专业可信、清晰易懂、低焦虑的商务工具感
- **独特记忆点**: 以"税务仪表盘"为视觉母题，风险评分用仪表盘指针 + 三色分段弧直观呈现，风险指标用色带横向条承载，形成"申报前体检报告"的一致认知

## 2. Art Direction

- **方向名**: 税务合规仪表风
- **Design Style**: Swiss Minimalist + subtle data-viz accent —— 瑞士极简保证财务数据的严谨可读，数据可视化的分段色带承担风险表达，避免大面积红色造成的焦虑感
- **DNA 参数**: 圆角 subtle (`rounded-md`) / 阴影 subtle (`shadow-sm` 卡片, `shadow-md` 悬浮) / 间距 standard (`gap-4` / `p-6`) / 字体方向 无衬线中文正文 + 等宽数字 / 装饰手法 细边分隔、数据色带、微型仪表图标
- **应用类型**: Workflow —— 录入 → 检测 → 整改建议的线性任务流，三页逐步递进

## 3. Color System

**色彩关系**: 深海蓝主色 + 冷灰中性基底 + 绿/黄/红三段风险色带，整体偏冷静专业，风险色仅用于数据可视化与状态标记
**配色设计理由**: 深蓝色 #1a365d 对应税务、合规、权威的产品语义；白色背景保证长表单和报告的可读性；风险色克制使用，仅作用于指标条与状态徽章，不充斥界面
**主色推导**: 从用户指定的 #1a365d 出发，转换为 HSL 并衍生同色系深浅层级；accent 使用极浅蓝灰作为 hover/选中底，与主色同色温不抢戏
**使用比例**: 65% 中性（bg/card/border/text）/ 25% 辅助（accent + 风险色数据可视化）/ 10% primary（CTA、品牌锚点、关键状态）

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(210 40% 98%) | 页面背景，微冷蓝白，减少纯白刺眼感 |
| card | `--card` | `bg-card` | hsl(0 0% 100%) | 卡片、表单、结果面板，纯白承载内容 |
| text | `--foreground` | `text-foreground` | hsl(215 32% 18%) | 标题和正文，深墨蓝灰 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(215 16% 47%) | 占位符、说明、辅助元信息 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(211 62% 25%) | 主交互、CTA、品牌识别（对应 #1a365d） |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%) | primary 上的文字和图标 |
| accent | `--accent` | `bg-accent` | hsl(214 32% 94%) | hover/focus 浅底、选中底、Skeleton |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(211 62% 25%) | accent 上的文字和图标 |
| border | `--border` | `border-border` | hsl(214 20% 88%) | 输入框、卡片、菜单边界 |

**语义色提示**: 风险三级色带，饱和度与 primary 对齐（~35-55%），避免刺眼报警感
- 低风险/正常：`success-bg` hsl(142 55% 94%) / `success-border` hsl(142 45% 72%) / `success-text` hsl(142 65% 28%)
- 中风险/警告：`warning-bg` hsl(38 90% 94%) / `warning-border` hsl(38 75% 70%) / `warning-text` hsl(30 80% 32%)
- 高风险/异常：`danger-bg` hsl(0 75% 96%) / `danger-border` hsl(0 65% 78%) / `danger-text` hsl(0 70% 35%)

## 4. 字体与节奏

- **font-display**: Noto Sans SC —— 中文标题清晰稳重，契合财税工具的专业感
- **font-body**: Noto Sans SC + IBM Plex Mono（数字）—— 正文易读；金额、税率、评分等关键数字用等宽字体增强数据仪表感
- **字号**: H1 text-3xl ~ text-4xl；H2 text-xl ~ text-2xl；body text-base；muted text-sm；大数字评分 text-5xl ~ text-6xl（等宽）
- **圆角**: 小到中 (`rounded-md`) —— 商务工具不过度圆润，保持克制专业

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导，三页任务流线性组织
- **Page / Section Order**: 数据录入页 → 风险检测结果页 → 整改建议页，顶部步骤条指示当前位置
- **Standard Content Zone**: `max-w-5xl` + `mx-auto`，表单与报告均居中布局，桌面端首屏聚焦核心操作
- **Shell / Frame Alignment**: 内容容器独立居中，顶部轻量导航 + 底部免责声明为全局 chrome，与内容区同宽对齐
- **Padding & Rhythm**: `px-4 md:px-6 lg:px-8 py-8 md:py-10`，section 间距 `gap-8`
- **Full-bleed Zones**: 无全宽视觉区，全站信息密度一致
- **Local Narrowing**: 表单页录入区可收窄至 `max-w-3xl`，结果页与建议页充分用宽
- **Overflow Strategy**: 风险指标列表、整改建议列表纵向滚动；横向数据条在窄屏自动换行
- **Flexibility Boundary**: 允许移动端调整卡片间距、表单字段排列为单列；不允许改变主色、圆角、风险色逻辑和步骤流顺序

## 6. 视觉与动效

- **装饰**: 细边分隔线、微型仪表图标、数据色带条
- **阴影/边界**: 轻阴影卡片 + 1px 边框，悬浮态 `shadow-md`，整体偏扁平
- **动效**: 克制精致 —— 页面切换 200ms fade + slide-up；仪表盘指针有填充动画；风险条从左到右增长；按钮 hover 有背景色过渡；检测提交有 loading 脉冲动画

## 7. 组件原则

- 按钮、输入框、卡片必须有 Default / Hover / Active / Focus-visible / Disabled 状态
- Primary 按钮仅用于「开始检测」等主行动；次级操作用 Outline / Ghost
- 风险状态用「颜色 + 文字标签 + 图标」三重表达，不依赖单色识别
- 表单分组用浅灰卡片或细边分隔，字段标签在上方，错误提示在下方配 danger 色
- 加载态与空状态延续仪表盘视觉语言，使用同色系骨架屏与图标

## 8. Image Direction

- **Image Role**: 无强制图片需求，优先通过排版、数据可视化（仪表盘、风险色带）和微型图标建立视觉记忆点
- **Image Art Direction**: 无强制图片需求
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 避免通用商务握手图、金币钞票素材图、无意义蓝色科技渐变背景图

## 9. Anti-patterns

- **Red-alarm overload**: 高风险就大面积铺红，造成小微企业主过度焦虑；风险色仅限条带左端、徽章和图标，大面积仍用中性底
- **Form fatigue**: 十多个字段堆成一面墙，无分组无呼吸；按基础信息/增值税/所得税三段分卡，降低认知负荷
- **Dashboard bloat**: 为了"数据可视化"堆叠冗余图表；核心只保留一个仪表盘 + 八条风险色带，信息密度恰到好处
- **Mono-hue tyranny**: 主色铺满按钮、tab、图标、边框、链接；按 65-25-10 把深海蓝收回到 CTA 与品牌锚点
- **Status color drift**: 风险绿/黄/红饱和度过高盖过主色；语义色饱和度与 primary 对齐，保持统一色温
- **Invisible interaction**: 只做 hover 不做 focus-visible；所有可交互元素必须有清晰的键盘聚焦态