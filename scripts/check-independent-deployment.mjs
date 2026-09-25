import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const required = [
  'netlify.toml',
  'public/_redirects',
  'netlify/functions/qwen-explain.js',
  'src/pages/FinancingReadinessPage/FinancingReadinessPage.tsx',
  'src/modules/financing/financing-readiness.ts',
  'src/pages/ReportPage/components/FinancingReadinessAppendix.tsx',
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required deployment file: ${file}`);
}
if (fs.existsSync(path.join(root, '.netlify'))) throw new Error('Independent deployment directory must not contain .netlify site binding.');
if (fs.existsSync(path.join(root, '.env'))) throw new Error('Independent deployment directory must not contain .env secrets.');

const redirects = fs.readFileSync(path.join(root, 'public/_redirects'), 'utf8');
if (!redirects.includes('/* /index.html 200')) throw new Error('SPA fallback is missing from public/_redirects.');

const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
if (!config.includes('publish = "dist/client"') || !config.includes('directory = "netlify/functions"')) {
  throw new Error('Netlify publish or functions configuration is missing.');
}
console.log('Independent Netlify deployment checks passed.');

