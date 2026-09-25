import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { qwenDevPlugin } from './qwen-dev-plugin.mjs';
import { fileURLToPath } from 'node:url';
process.env.QWEN_API_KEY='';process.env.QWEN_ALLOWED_ORIGIN='';
const server=await createServer({configFile:false,plugins:[qwenDevPlugin()],resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}},optimizeDeps:{noDiscovery:true,include:[]},server:{host:'127.0.0.1',port:0,open:false}});
try {
 await server.listen();const port=server.httpServer.address().port;const base=`http://127.0.0.1:${port}`;
 const response=await fetch(`${base}/.netlify/functions/qwen-explain`,{method:'POST',headers:{origin:base,'content-type':'application/json'},body:'{}'});
 assert.equal(response.status,503);assert.equal((await response.json()).error,'provider_not_configured');
 const denied=await fetch(`${base}/.netlify/functions/qwen-explain`,{method:'POST',headers:{origin:'https://evil.test'}});assert.equal(denied.status,403);
 console.log('PASS: real local HTTP proxy returns JSON 503 without key and denies cross-origin requests');
} finally {await server.close();}
