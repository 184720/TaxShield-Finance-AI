import { handleQwenRequest } from "../../src/modules/ai/server/qwen-handler.ts";

// Use the handler API so the configured esbuild bundler includes dependencies.
// The v2 default-export API uses NFT, whose pnpm symlinks fail on Windows.
export async function handler(event) {
  const method = event.httpMethod;
  const headers = new Headers();
  for (const [name, value] of Object.entries(event.headers || {})) {
    if (value != null) headers.set(name, value);
  }
  const request = new Request(event.rawUrl, {
    method,
    headers,
    ...(method === "GET" || method === "HEAD" ? {} : {
      body: event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64")
        : event.body || "",
    }),
  });
  const response = await handleQwenRequest(request, process.env);
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers),
    body: await response.text(),
  };
}

export const config = {
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};
