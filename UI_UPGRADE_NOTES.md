# 税智盾 TaxShield AI · 比赛级产品化 UI 升级说明

> 升级日期：2026-09-17
> 范围：**仅前端展示层**。risk-engine / AI 判断逻辑 / policy 匹配 / recheck 逻辑 / 数据结构均未改动。

## 验证结果

| 检查 | 结果 |
|---|---|
| `tsc -p tsconfig.app.json`（typecheck） | ✅ 0 错误 |
| `eslint src`（lint） | ✅ 0 错误 |
| `vite build`（npm run build） | ✅ 成功（7.26s） |
| 浏览器运行时验证（真实用户路径） | ✅ 0 JS 异常 / 0 console.error |

运行时验证覆盖了：空状态 → 点击体验 Demo → 驾驶舱有数据 → 风险分析页生成 AI 解释 → 报告页生成整改方案 → 勾选 Checklist → 企业画像/上传/历史页回归 → 移动端 390px 响应式回归。

## 修改文件清单（9 个）

### 设计令牌层
1. **`src/tailwind-theme.css`**
   - 主色从亮蓝紫（hsl 228 100% 65%）改为**深海蓝**（hsl 215 56% 23%），info/ring/chart 同步对齐
   - 新增品牌色阶（brand-50/100/300/600/900）
   - 新增**语义状态色**：`status-ok`（绿=正常）/ `status-warn`（橙=整改）/ `status-risk`（红=风险），soft/line 三件套
   - 新增 AI 标识色（ai / ai-2 / ai-soft）
   - 新增全局工具类：`ts-gradient-brand`（品牌渐变）、`ts-gradient-ai`、`ts-grid-texture`（网格纹理）、`ts-skeleton`（骨架屏微光，支持 reduced-motion）、`ts-score-glow`、`ts-tabular`（等宽数字）、`ts-focus-ring`

### 共享原语层（全局统一的核心）
2. **`src/components/TaxShieldPrimitives.tsx`**（重写，向后兼容，新 props 全部可选）
   - 统一卡片基元：圆角 rounded-2xl、双层阴影、描边
   - `RiskBadge`：状态色口径统一，新增 `size` / `withDescription`
   - 新增 `HealthScoreDial`：纯 SVG 健康指数仪表盘（无第三方图表依赖，PDF 可稳定渲染），支持明暗两种模式
   - 新增 `AIAttribution`：**"AI 生成，基于企业风险数据分析"** 归因标识（inline / block 两种形态，带置信度）
   - 新增 `EmptyState` / `SkeletonBlock` / `SkeletonCard` / `AIPendingState`：统一空状态与 loading 态
   - 新增 `MetaItem` / `StatusDot` / `ComplianceNote`
   - 新增 `scoreTone()` / `scoreBandLabel()`：健康分→色阶的唯一口径（≥80 绿 / ≥60 橙 / <60 红，与既有业务判定一致）

### 页面层
3. **`src/pages/DashboardPage/DashboardPage.tsx`**（驾驶舱重做）
   - 品牌区：深海蓝渐变 Hero + 网格纹理 + 光晕；右侧新增**当前企业卡片**（企业名 / 检测时间 / 数据来源 / 引擎版本）
   - **大尺寸健康指数仪表盘**成为视觉主角，旁边配风险等级徽章+描述
   - 统计卡升级：风险数量 / 高风险事项 / 影响金额 / 历史检测；无数据时展示骨架屏
   - 新增 **AI 优先处置建议卡片**：按等级排序取前 3 条风险，附 AI 归因标识与置信度，建议文案复用已生成的 AI 解释（无则回退规则引擎建议，不新造数据）
   - 新增「快速进入健康报告」按钮；六步闭环、趋势图、企业档案、历史检测全部按新令牌重排
   - 「体验 Demo 企业」按钮保留原逻辑（runRiskEngine + saveReport + 跳转），仅增强视觉
   - 底部新增合规声明条

4. **`src/pages/RiskAnalysisPage/RiskAnalysisPage.tsx`**（重点页重做）
   - 每个风险升级为**高级风险卡片**：左侧等级色条（红/橙/绿）、编号徽章、等级徽章+描述、影响金额独立展示
   - 区块结构：发现原因（标注"规则引擎"）→ 数据证据表（标注"来自企业填报数据，非 AI 生成"，行 hover 高亮）→ **AI 智能解释区**（科技蓝渐变图标 + AIAttribution 归因标识 + 置信度 + 五段式编号卡片 01-05 + 免责声明）→ 政策依据（左侧蓝线、状态色徽章：现行有效绿/待复核橙/已失效红、新增生效日期）→ 整改入口（绿色按钮）
   - 顶部概览：健康指数仪表盘 + 4 张统计卡 + 风险分布 StatusDot 图例 + AI 解释覆盖计数
   - AI 加载中改为骨架屏占位（布局不跳动）；数据不足提示改为橙色警示卡

5. **`src/pages/ReportPage/ReportPage.tsx`**（报告页重做）
   - 报告头：品牌渐变横幅，含**报告编号、企业信息、生成时间、数据来源、引擎/规则版本**，右侧暗色健康指数仪表盘 + 等级/金额/数量
   - 新增 **AI 辅助分析标识条**（徽章 + 说明文案）
   - 新增报告要点统计行（健康指数 / 风险事项 / Checklist 进度 / AI 解释覆盖）
   - 企业画像改为 MetaItem 网格 + **数据来源说明卡**
   - 风险详情卡：等级色条、证据表、政策依据、AI 解释区（同风险页口径）、整改方案（步骤编号列表 + Checklist 进度条 + 材料/注意事项分栏 + AI 归因 block）、规则引擎建议材料
   - 复检对比区块（有前序报告时展示前后分数与提升值）
   - PDF 导出按钮逻辑不变（usePdfExport + TaxHealthReportDocument）

### PDF 导出一致性
6. **`src/pages/ReportPage/report-print.css`**
   - 状态色变量与屏幕端令牌同口径（ok/warn/risk + soft/line）
   - 新增 `.ts-ai-tag`（AI 归因徽章）、`.ts-ai-note`（AI 说明块）、封面 `.ts-cover-ai` 样式
   - 等级徽章改用变量取色

7. **`src/pages/ReportPage/components/TaxHealthReportDocument.tsx`**
   - 封面新增：数据来源、风险事项统计、**AI 辅助分析标识**、规则版本号
   - AI 解释段新增：归因徽章、置信度、数据证据行、AI 说明块——与屏幕端同一口径

### 全局外壳
8. **`src/components/Header.tsx`**：Logo 改品牌渐变、可点击回驾驶舱、导航激活态用深海蓝
9. **`src/components/Footer.tsx`**：**品牌名修正**（原"金税四期风险自检工具"→"税智盾 TaxShield AI"），补合规声明与 AI 复核提示、参赛项目标注

## 未改动（红线确认）

- `src/modules/risk-engine/**`、`src/modules/ai/**`、`src/modules/policy/**`、`src/modules/rectification/**`、`src/modules/report/**`、`src/modules/domain/types.ts`、`src/lib/**` —— 一行未动
- 所有业务调用（`runRiskEngine` / `explainRisk` / `generateRemediationPlan` / `toggleChecklistItem` / `compareReports` / `exportPdf` / store 读写）保持原样
- 未删除任何已有功能；新增展示字段全部取自既有数据结构，无新造字段
