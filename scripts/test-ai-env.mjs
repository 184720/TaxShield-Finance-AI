import assert from 'node:assert/strict';
import { resolveConfig } from 'vite';
process.env.VITE_QWEN_API_KEY='TEST_SECRET_MUST_NOT_ENTER_BROWSER_6927';
process.env.VITE_LLM_PROVIDER='qwen';
const config=await resolveConfig({},'build');
assert.equal(config.env.VITE_QWEN_API_KEY,undefined,'Legacy-prefixed secret must not be exposed by Vite');
assert.equal(config.env.VITE_LLM_PROVIDER,undefined);
console.log('PASS: provider is code-defaulted; API key and provider env are excluded from browser env');
