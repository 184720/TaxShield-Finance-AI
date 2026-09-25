# 税智盾独立静态部署

部署到域名根路径 `/`，保留 BrowserRouter，不使用 HashRouter。没有修改业务模块、页面组件、存储实现或 PDF 生成逻辑。

## 根因与修复范围

原 `@lark-apaas/coding-preset-vite-react` 的 `miaoda-view-context` 插件把 `{{basename}}` 写入生产 HTML；`fullstack-basename-injection` 插件把入口环境变量改成优先读取该运行时值，因此根路径无法匹配 Router，出现白屏。

现在入口 basename 固定为 `/`；Vite 配置保留原 React/Tailwind 工具链，只移除平台身份、OG 占位符、统计及 basename 注入。HTML 使用本地 favicon，并在业务模块导入前跳过 SDK 平台 runtime 初始化（遥测、时间同步、iframe bridge），原 scopedStorage 实现保持不变。

未修改 UI。外部字体和现有字体代理仍保留，以保持排版；本项目不是完全离线应用。模板 AI 仍为原有 Mock，只有配置原 AI endpoint 后才会请求该服务。

## 修改文件

- vite.config.ts：过滤平台插件、固定资源根路径、清理构建输出、关闭公开 source map，拒绝切换 HashRouter 的 offline standalone 模式。
- src/index.tsx：BrowserRouter basename 固定 `/`。
- index.html：移除外部 favicon、平台 bootstrap 禁用标记、静态产品标题。
- package.json：仅添加 packageManager，固定 pnpm@11.19.0，依赖声明不变。
- public/_redirects：Netlify SPA 回退。
- netlify.toml：构建命令、发布目录、Node 版本。
- vercel.json：静态构建目录、优先文件命中再 SPA 回退。
- scripts/check-static-build.mjs：检查实际构建产物不含平台占位符/统计注入、包含回退文件且不发布 map。
- DEPLOYMENT.md：本文档。

## 本地验证

使用 Node 24.21.0、pnpm 11.19.0：

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
node scripts/check-static-build.mjs
pnpm exec vite preview --host 127.0.0.1 --port 4175
```

预览只用于本地验证，不是生产服务器。构建结果为 `dist/client`。

本次实际验证：typecheck、Vite 配置 TypeScript 检查、build、产物检查通过；本地开发首页正常。生产预览中 `/dashboard`、`/risk-analysis`、`/report`、`/history` 直达和刷新均显示对应页面，最终新测试页没有 error/warn 日志。

PDF 按钮完成生成流程且页面无错误提示，但自动化浏览器未确认下载事件；需在实际公网域名用普通浏览器下载并打开检查。PDF 代码未改。

## Netlify

方案一：本地构建后，把整个 `dist/client` 文件夹（含 `_redirects`）上传到静态部署入口。不要上传源码 ZIP 作为静态站点，不要只上传 index.html。

方案二：将项目文件提交到自己的 Git 仓库并连接 Netlify。项目根目录应是 package.json 所在目录；平台会读取 netlify.toml：

- 构建命令：`pnpm run build`
- 发布目录：`dist/client`
- Node：24.21.0
- pnpm：读取 package.json 的 packageManager

`public/_redirects` 会复制到发布目录，内容为 `/* /index.html 200`。不要使用原平台专用的 scripts/build.sh。

## Vercel

导入同一源码仓库，Root Directory 指向 package.json 所在目录，Node 选择 24.x。使用仓库中的 vercel.json；输出目录为 dist/client。路由配置优先命中真实资源，再将页面路径交给 index.html。

## 环境变量与发布验收

- 比赛 Mock 模式不需要 API key；不配置 VITE_TAXSHIELD_AI_ENDPOINT。
- 不要设置 MIAODA_BUILD_TARGET=standalone，它会触发明确的构建错误，避免偷偷切换 HashRouter。
- 独立部署不要沿用旧平台的 CLIENT_BASE_PATH、ASSETS_CDN_PATH、MIAODA_APP_TYPE 等环境变量，也不要把 NODE_ENV=production 用于会跳过 devDependencies 的安装阶段。
- 如启用真实 AI，沿用现有 VITE_TAXSHIELD_AI_ENDPOINT，使用 HTTPS API 并配置 CORS；不能在 VITE_* 变量内放密钥。
- 公网采用 HTTPS；发布后逐个直达/刷新上述四个页面，并走 Demo → 报告 → PDF 下载 → 复检流程。
- 历史记录保存在当前浏览器、当前站点，不随换域名或换电脑自动迁移。
- 本次未实际向 Netlify/Vercel 上传，托管端最终状态需在发布后确认；本地预览通过不等于托管平台已验收。

参考：
- https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/
- https://docs.netlify.com/build/configure-builds/manage-dependencies/
- https://vercel.com/docs/project-configuration/vercel-json
