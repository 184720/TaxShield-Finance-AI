# TaxShield工行杯普惠金融版改造说明

更新日期：2026-09-25  
项目：税智盾 TaxShield AI  
改造方式：在现有 React + Vite Web Demo 上增量扩展，未重新开发原系统。

## 原版本定位

面向中小企业的AI辅助税务风险自检与整改平台，围绕财税数据输入、规则检测、AI解释、整改执行、复检与健康报告建立闭环。

## 工行杯版定位

**面向小微企业的AI财税健康管理与融资准备助手。**

帮助企业整理分散的财税数据，完成风险自检与整改，再形成融资准备所需的财税健康档案和材料自查清单。

核心展示语：**先体检、再整改、再准备融资。**

产品只提供内部财税健康管理和材料准备参考，不判断贷款是否获批，不输出授信额度、利率预测、违约概率或银行信用评分。

## 新增功能

- 独立融资准备中心，路由 `/financing`。
- 三级准备提示：需优先整改、建议完善、准备较充分。
- 企业基础资料、财务资料、纳税资料、经营资料、融资辅助资料五类清单。
- 资料状态：已准备、待补充、待复核。
- 企业和报告隔离的资料自查持久化，复检后需重新确认；不会把旧报告自查状态自动带入新报告。
- 读取原报告中与 reportId/riskId 对应的AI建议，不新增AI调用。
- 驾驶舱融资准备卡、主导航入口、报告整改区后的融资准备入口。
- 可选PDF融资准备附录；取消勾选可继续导出原健康报告。
- 金融服务衔接说明仅为“产品构想 / 后续接口方向”，无银行接口或合作关系声明。

## 准备等级口径

本规则为产品内部准备提示，不是银行标准，也未经信贷效果验证。

| 条件（按顺序判断） | 显示状态 |
| --- | --- |
| 当前报告仍有高风险，或健康指数低于80 | 需优先整改 |
| 无高风险且健康指数不低于80，但资料未齐、待复核或有规则因数据不足未执行 | 建议完善 |
| 无高风险、健康指数不低于80、清单全部确认齐备且没有数据不足的未执行规则 | 准备较充分 |

Checklist仅用于显示“整改已执行但检测风险仍存在”的提示，不参与等级计算。健康指数仍直接读取原风险引擎报告。

**真实材料边界：** 系统有财务/发票/申报字段，不代表已经核验原始凭证。营业执照、财务报表、纳税证明、合同、银行流水、客户供应商资料、融资用途说明由企业自行确认，初始状态为待补充。Demo始终标注模拟来源；不能把模拟状态作为真实融资资质证明。

## 单向数据流

```
已有 EnterpriseProfile / TaxHealthReport / RiskRecord
           + 独立保存的融资材料自查状态
           + Checklist执行状态（仅提示）
                     ↓
       buildFinancingMaterials
                     ↓
       generateFinancingReadiness
                     ↓
       FinancingReadinessReport
                     ↓
驾驶舱卡片 / 融资准备页 / PDF可选附录
```

融资模块不回写TaxHealthReport，不改变风险等级、健康指数或ReportDiff。主导航默认展示当前企业最新检测；从报告入口携带reportId查看该报告时，若有更新报告会明确提示并提供跳转。

## 保留功能

企业画像、Excel/CSV上传解析、风险规则检测、健康评分、风险证据、Qwen风险解释、政策参考、AI整改、Checklist、历史检测、复检及前后对比、原PDF下载流程和原报告内容均保留。

受保护目录文件哈希与修改前一致：

- src/modules/risk-engine
- src/modules/ai
- src/modules/policy
- src/modules/rectification
- src/modules/report（含复检与ReportDiff）
- src/modules/domain

## 修改文件

| 文件 | 内容 |
| --- | --- |
| src/App.tsx | 注册融资准备路由 |
| src/components/Header.tsx | 导航及产品副标题 |
| src/components/Layout.tsx | 浏览器页面标题 |
| src/components/Footer.tsx | 普惠金融版定位文案 |
| src/pages/DashboardPage/DashboardPage.tsx | 定位、三阶段叙事、融资准备卡 |
| src/pages/ReportPage/ReportPage.tsx | 融资准备入口、PDF附录勾选项与数据传递 |
| src/pages/ReportPage/components/TaxHealthReportDocument.tsx | 仅导入和追加条件附录，原风险报告内容保留 |

## 新增文件

| 文件 | 内容 |
| --- | --- |
| src/modules/financing/types.ts | 融资准备领域类型与展示标签 |
| src/modules/financing/financing-checklist.ts | 材料分类、报告字段完整性检查 |
| src/modules/financing/financing-readiness.ts | 单向准备提示计算 |
| src/modules/financing/financing-store.ts | 企业/报告隔离的自查状态存储 |
| src/components/FinancingReadinessCard.tsx | 驾驶舱和报告复用入口 |
| src/pages/FinancingReadinessPage/FinancingReadinessPage.tsx | 融资准备中心 |
| src/pages/ReportPage/components/FinancingReadinessAppendix.tsx | 两页独立PDF附录 |
| scripts/test-financing.mjs | 四场景、存储隔离与原PDF内容回归测试 |
| TaxShield工行杯普惠金融版改造说明.md | 本文档 |

## 验证记录

### 四个融资准备场景

| 场景 | 实际结果 |
| --- | --- |
| 89分 / 6项风险 / 2项高风险 | 需优先整改，通过 |
| 原引擎整改后Demo复检：99分 / 1项风险 | 默认建议完善；7项企业侧资料自查确认齐备后准备较充分，通过 |
| 财务字段、企业信息缺失或资料待复核 | 保持建议完善并显示缺口，不产生贷款失败判断，通过 |
| Checklist全部完成但未复检 | 仍需优先整改，原报告不变，通过 |

资料完整性是独立条件。因此不能只演示89→99就声称融资材料已经全部齐备。

### 原有回归

- `pnpm run typecheck`：通过。
- `pnpm run build`：通过。有构建分包大小、inlineDynamicImports配置提示，不影响成功构建；本次未改变构建架构。
- `node scripts/test-recheck.mjs`：通过。
  - 原数据复检89→89、6→6。
  - 整改后数据89→99、6→1、解除5项。
  - 错误进项数据99→97、1→2，新增vat风险。
  - Checklist状态隔离与历史报告查看通过。
- `node scripts/test-financing.mjs`：通过。
- 未发现独立的原PDF自动化测试脚本，本次补充PDF内容回归和浏览器真实下载验证。
- HTML回归：附加版移除附录后，与原报告HTML逐字一致。
- 实际下载PDF：原报告9页、附加版11页；前9页渲染结果逐像素一致。
- 两份PDF都可正常打开，附录中文与排版已检查，PDF导出期间无AI API请求。

### 浏览器真实路径

独立Edge浏览器会话，使用模拟企业数据：
Dashboard → 体验Demo → 风险分析 → 生成AI风险解释 → 报告生成整改方案 → 勾选Checklist → 融资准备（仍需优先整改） → 开始复检 → 整改后Demo数据 → 历史检测 → 融资准备 → 补齐材料自查 → 刷新验证 → 导出附录版及原版PDF。

- Qwen解释真实返回provider=qwen、model=qwen-plus，reportId匹配；AI解释与整改代理请求均HTTP 200。
- 过程未捕获pageerror；融资准备材料刷新持久化通过。
- 1366×768桌面与390×844移动端检查，融资准备页面无横向溢出。
- 本次验收为本地服务验证，没有执行公网部署或银行接口联调。

## 比赛展示主线

1. 从首页解释小微企业“财税数据散、整理成本高、融资前自查困难”的问题。
2. 体验武汉智创Demo，展示89分、6项风险、2项高风险。
3. 用真实Qwen解释演示风险证据如何变成可理解的整改动作。
4. 生成整改方案并勾选Checklist，说明执行完成不等于风险解除。
5. 使用明确标注的整改后模拟数据复检，展示99分、1项风险。
6. 进入融资准备中心，展示资料缺口与企业自行确认流程；演示资料不是实际银行审核材料。
7. 生成附融资准备建议的健康报告，形成财税健康档案。
8. 展示商业银行普惠金融服务衔接的未来方向，明确“尚未接入”。

## 未来可扩展方向

- 真实凭证管理与资料时效校验，在授权基础上减少重复整理。
- 专业人员复核与审计记录。
- 基于真实受理需求完善材料分类，区分企业自查与第三方核验。
- 在取得授权及完成必要评估后，探索商业银行普惠金融服务入口衔接。
- 在真实样本和使用反馈基础上评估准备提示口径；不虚构信贷预测效果。

## 对原创新大赛版本的影响

原核心功能保留，新增融资准备作为后续工作环节。首页、页脚及浏览器标题使用普惠金融版定位，原报告可取消附录后导出。没有额外维护第二套系统，也没有增加贷款审批功能。

