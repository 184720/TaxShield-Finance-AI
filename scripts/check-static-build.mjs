import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Run after build: rejects artifacts that still require platform-side templating.
const output = resolve('dist/client');
const html = readFileSync(resolve(output, 'index.html'), 'utf8');
assert.doesNotMatch(html, /\{\{[^}]+\}\}/, 'Production HTML must not require platform placeholder replacement');
assert.doesNotMatch(html, /slardar|collectEvent|tenantId|csrfToken/, 'Platform tracking and identity injection must be absent');
assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//, 'Entry document must not require external scripts or icons');
assert.match(html, /type=["']module["']/, 'Retain the normal web ESM build, not the offline hash-router build');
assert.match(readFileSync(resolve(output, '_redirects'), 'utf8'), /^\/\*\s+\/index\.html\s+200\s*$/m);
assert.ok(!readdirSync(resolve(output, 'assets')).some((name) => name.endsWith('.map')), 'Public output must not contain source maps');
console.log('PASS: independent static HTML, no platform injection, ESM entry, SPA fallback, no public source maps');
