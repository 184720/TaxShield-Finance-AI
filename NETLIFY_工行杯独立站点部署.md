# TaxShield 工行杯普惠金融版：独立 Netlify 站点部署

本目录是“税智盾 TaxShield AI 工行杯普惠金融版”的独立部署源码。它已包含融资准备中心、普惠金融版首页与导航、Qwen AI解释、整改复检和PDF融资准备附录。

## 与原站点的隔离

- 本目录不包含 `.netlify/`，因此没有旧 Netlify Site ID、部署状态或本地数据库绑定。
- 本目录不包含 `.env`，因此没有复制任何密钥。
- 本目录不包含 `.git/`，避免误推送至原仓库。
- 请新建一个 Git 仓库，或直接从本目录在 Netlify 创建新站点；不要选择原 TaxShield 站点执行部署。

## 首次部署

1. 在 Netlify 选择 **Add new site → Import an existing project**，导入一个为本目录单独创建的 Git 仓库。
2. 或在本目录运行 `netlify init` 创建新站点。首次交互时选择 **Create & configure a new site**，不要选择链接已有站点。
3. Netlify 会读取 `netlify.toml`：

   | 配置 | 值 |
   | --- | --- |
   | Build command | `pnpm build` |
   | Publish directory | `dist/client` |
   | Functions directory | `netlify/functions` |
   | SPA fallback | `public/_redirects` 中的 `/* /index.html 200` |

4. 站点名称建议：`taxshield-icbc-cup-<team-or-year>`。站点名必须是新的，不能使用原 TaxShield 站点名。
5. 设置下面的生产环境变量后部署。
6. 部署成功后，将 `QWEN_ALLOWED_ORIGIN` 更新为新站点的 HTTPS 地址，再重新部署一次。

## 环境变量

这些变量仅用于 Netlify Function；不要设置任何以 `VITE_` 开头的密钥变量。

| 变量 | 必填 | 示例/默认值 | 说明 |
| --- | --- | --- | --- |
| `DASHSCOPE_API_KEY` | 是（使用Qwen时） | 在Netlify环境变量中填写 | Qwen服务端密钥，优先读取 |
| `QWEN_API_KEY` | 可选 | 兼容旧变量名 | 仅在未设置DASHSCOPE_API_KEY时读取 |
| `QWEN_MODEL` | 否 | `qwen-plus` | Qwen模型名 |
| `QWEN_BASE_URL` | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 兼容模式API地址 |
| `QWEN_ALLOWED_ORIGIN` | 建议设置 | `https://<new-site>.netlify.app` | 仅允许新站点域名调用函数 |

环境变量填写参考 `.env.example`。不要上传 `.env`，不要把 API Key 放入代码、Git 仓库或前端构建变量。

## 部署后验收

1. 访问新站点的 `/dashboard`。
2. 直接刷新 `/dashboard`、`/risk-analysis`、`/report`、`/financing`、`/history`，确认不会404。
3. 点击“体验 Demo 企业”，确认出现89分、6项风险、2项高风险。
4. 在风险分析页生成一项AI解释，确认页面显示“Qwen 在线生成”。
5. 生成整改方案后用整改后Demo数据复检，确认99分、1项风险。
6. 打开融资准备中心，确认默认“建议完善”；资料自查齐备后可显示“准备较充分”。
7. 在健康报告页分别导出“含融资准备附录”和“原健康报告”两版PDF。
8. 在 Netlify Functions 日志确认 `/.netlify/functions/qwen-explain` 返回200，且日志不记录完整财务数据。

## 与原 TaxShield 版本的区别

| 项目 | 原 TaxShield 展示 | 工行杯独立站点 |
| --- | --- | --- |
| 产品定位 | AI税务风险自检与整改 | AI财税健康管理与融资准备助手 |
| 新增页面 | 无 | 融资准备中心 `/financing` |
| 首页叙事 | 税务体检与整改 | 先体检、再整改、再准备融资 |
| 报告导出 | 企业税务健康报告 | 可选追加融资准备建议附录 |
| 金融能力 | 无 | 企业侧资料准备提示，不做授信判断 |
| 风险、AI、政策、整改、复检 | 原功能 | 完整保留 |

本版本不宣称银行合作、工商银行接口、贷款审批、授信额度、贷款通过率、利率预测或信用评分。融资准备状态仅表示本工具对财税规范程度和材料自查完整性的内部提示。

