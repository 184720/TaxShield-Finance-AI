# Phase 2：真实 Qwen 风险解释与 Mock 回退

## 配置与启动

在项目根目录复制 `.env.example` 为 `.env.local`，填写：

```dotenv
QWEN_API_KEY=你的百炼密钥
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

公网与本地默认均先调用 Qwen；只读取服务端 `QWEN_API_KEY`。`VITE_QWEN_API_KEY` 不受支持，Vite 的公开环境变量前缀也明确排除了任何 API Key。不要把真实密钥写入本文件、源码、聊天记录或 Git。

`pnpm dev` 会启动 Vite 和本地同源代理。修改环境变量后重启。无密钥、断网、超时、限流或响应不合法时自动回退 Mock，并在结果中标明。

## Netlify

以完整源码部署（不能仅拖拽 dist）。现有构建命令与目录保持不变。函数地址为 `/.netlify/functions/qwen-explain`。设置 `QWEN_API_KEY`、可选 `QWEN_MODEL` / `QWEN_BASE_URL` / `QWEN_ALLOWED_ORIGIN` 于 Functions scope；重建部署。

QWEN_ALLOWED_ORIGIN 可设为 `https://taxshield-ai.netlify.app`。密钥与端点须属于同一区域/工作空间；工作空间端点可按百炼控制台指引设置。默认使用中国内地兼容端点。纯静态托管、`vite preview` 不提供函数，Qwen 会回退 Mock。Vercel 若需真实调用，需另行部署等价服务端函数；本次没有修改为 Vercel 适配。

Netlify 函数配置每 IP/域名 60 秒 10 次限制；这不是身份认证或跨 IP 总预算。公开启用前应在平台开启访问保护并设置百炼费用告警/预算。Origin 检查不能替代认证，非浏览器客户端可以伪造 Origin。本次不自动发布、不写入密钥、不触发付费调用。

## 数据链路与兼容

`ai-service → ai-client → llm-provider → qwen-provider → 同源服务端代理 → 百炼`

保留现有 `mock-provider.ts` 的八类固定模板和所有页面调用签名。Qwen 同一代理支持风险解释与整改方案；Mock 不再作为可选默认 Provider，只在超时、API 错误或 schema / 来源校验失败时使用。

模型只收到 RiskRecord 派生字段：riskId、riskName、riskLevel、reason、evidence、policyReferences，以及用于归属校验的 reportId；triggerValue 由 evidence 的 label/value 原样生成。不会上传企业画像、完整 TaxDataBundle 或输入快照。启用前需确认财税风险证据向百炼传输已获得授权。

请求提示由服务端构造，不接受浏览器自定义 prompt。输出 JSON 含用户要求的七个解释字段，以及 riskId、reportId、evidence_indices、policy_ids 用于可执行校验。服务器与浏览器两次验证后映射回现有 AIExplanation；data_gaps 显示在建议列表中，证据表始终复制原始 evidence。

## 校验边界

- 严格 JSON/schema；ID 必须一致；证据索引和政策 ID 必须属于输入。
- 拒绝额外评分/风险字段、未知数字、常见伪造文号/标题以及常见重新判定表述。
- 不将模型生成的证据数组写回；没有任何调用风险引擎、修改风险记录或分数的路径。
- confidence 的 low/medium/high 映射为 0.3/0.5/0.7，仅为自评显示，不是准确率或风险概率。
- 这些确定性校验**不能证明任意自然语言在语义上没有幻觉**（例如对已有数字关系的错误解读）。必须专业复核；不宣称 100% 防幻觉，不作为违法或税额认定。较严格校验可能增加 Mock 回退率。
- 15 秒上游超时、18 秒客户端超时；32 KiB 请求限制；错误不返回上游原文或密钥，不记录风险明细。

## 验证命令

### 本次修改文件

- `src/modules/ai/ai-client.ts`：Provider 选择，兼容原自定义接口。
- `src/modules/ai/ai-service.ts`：保持签名，校验失败回退。
- `src/modules/ai/llm-provider.ts`：真实调用与 Mock 统一调度。
- `src/modules/ai/qwen-provider.ts`：同源请求、超时、适配。
- `src/modules/ai/prompts.ts`：风险解释提示词和最小输入。
- `src/modules/ai/schema.ts`：Qwen JSON、来源和越权校验。
- `src/modules/ai/server/qwen-handler.ts`：服务端调用百炼，密钥隔离与错误处理。
- `netlify/functions/qwen-explain.ts`：部署入口和平台限流配置。
- `scripts/qwen-dev-plugin.mjs`：本地同源代理。
- `scripts/test-ai-provider.mjs`、`test-ai-env.mjs`、`test-ai-dev.mjs`：回归与安全测试。
- `vite.config.ts`、`netlify.toml`：密钥公开白名单、本地及生产函数配置。
- `.env.example`、`.gitignore`：配置示例与密钥文件忽略。
- `AI_QWEN_SETUP.md`、`AI_VERIFICATION.json`：交付说明与未修改文件核验记录。

### 本次测试结果（2026-09-19）

类型检查和生产构建通过（退出码 0）；构建仍有原有 chunk 体积、inlineDynamicImports 与字体镜像提示。11 类非法模型输出、4 条回退路径、服务端请求校验、上游请求结构、合法输出适配通过。Vite 密钥隔离测试通过，前端产物未包含测试用密钥哨兵。本地真实 HTTP 代理在缺失密钥时返回 JSON 503，跨源请求返回 403。

原有复检测试通过：89→89 / 6→6，89→99 / 6→1，99→97 / 1→2；Checklist 与风险结果隔离通过。风险引擎、评分、复检算法、政策模块与 PDF 导出实现均与上一版逐字节一致。浏览器已验证解释与整改在无密钥时明确显示“Mock 离线保障模式”，且报告/Checklist 仍可用。

尚未完成真实千问 API 和 Netlify 生产联调：本机没有 `QWEN_API_KEY`、Netlify 授权或站点绑定；公开端点探测返回 `200 text/html`（SPA 页面），说明当前公网尚未部署该 Function。配置密钥并部署完整源码后，必须再验证真实返回的 provider/model、schema、evidence、policy_ids、失败回退和生产函数日志（日志不得含风险明细）。

```sh
node scripts/test-ai-provider.mjs
node scripts/test-ai-env.mjs
node scripts/test-ai-dev.mjs
node scripts/test-recheck.mjs
pnpm run typecheck
pnpm run build
```

本次模型成功响应以受控 HTTP 测试替身验证，**不是实际千问调用成功证明**。没有真实密钥，真实服务的授权、地区、配额、响应质量与 Netlify 部署仍需配置后验收。已有页面、PDF、Checklist、复检及风险引擎代码未改。

## 示例 JSON（测试样本，非真实模型实测）

```json
{
  "riskId": "vat",
  "reportId": "report-test",
  "risk_summary": "解释引擎已有提示",
  "reason_analysis": "进项证据需要核对",
  "evidence_explanation": "进项税额为100元",
  "possible_impact": "可能需要进一步核对抵扣资料",
  "suggestion": "建议核对原始凭证",
  "confidence": "medium",
  "data_gaps": [],
  "evidence_indices": [0],
  "policy_ids": ["VAT001"]
}
```

对应输入 evidence 为 `[{"label":"进项税额","value":"100元"}]`，关联政策含 VAT001；未包含该证据或政策时不能接受此示例输出。

参考：[百炼结构化输出](https://help.aliyun.com/en/model-studio/qwen-structured-output)、[Netlify Functions API](https://docs.netlify.com/build/functions/api/)、[函数限流](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/)。
