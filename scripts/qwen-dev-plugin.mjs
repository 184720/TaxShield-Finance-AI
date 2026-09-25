import { loadEnv } from 'vite';
import { Readable } from 'node:stream';

/** Local same-origin endpoint; production uses the Netlify Function. */
export function qwenDevPlugin() {
  let env;
  return {
    name: 'taxshield-qwen-dev-proxy',
    configResolved(config) { env = { ...loadEnv(config.mode, config.envDir, ''), ...process.env }; },
    configureServer(server) {
      server.middlewares.use('/.netlify/functions/qwen-explain', async (req, res) => {
        try {
          const { handleQwenRequest } = await server.ssrLoadModule('/src/modules/ai/server/qwen-handler.ts');
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
          }
          const method = req.method || 'GET';
          const request = new Request(`http://${req.headers.host}/.netlify/functions/qwen-explain`, {
            method, headers, ...(method === 'GET' || method === 'HEAD' ? {} : { body: Readable.toWeb(req), duplex: 'half' }),
          });
          const response = await handleQwenRequest(request, env);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end('{"error":"provider_unavailable"}');
        }
      });
    },
  };
}
