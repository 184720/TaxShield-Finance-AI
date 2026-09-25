# 税智盾 TaxShield AI V2 Phase 1

本次升级保留原有 React、TypeScript、Vite、Tailwind 与 shadcn/ui 工程结构，并增加：

- 企业画像、数据上传、风险分析、健康报告、历史检测路由。
- Risk Engine V2：收入申报、增值税、企业所得税、发票、行业偏离、税收优惠、三流一致性、趋势异常八类规则。
- Tax Health Index 评分、风险证据、整改建议和本地 Mock 政策库。
- 武汉智创科技有限公司比赛演示数据。

## 本地启动

```powershell
pnpm install --no-frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm run dev
```

## Demo 边界

- 文件上传界面仅记录选中的文件名；尚未读取或解析 XLSX/CSV 内容。
- AI 解释、整改建议和政策检索为本地 Mock 接口。
- 政策资料仅作演示；实际申报前必须以申报期有效官方文件及专业人员复核为准。
