// Exercises the explicitly mocked Compose stack only. Never calls a cloud URL.
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8088';
const authorization = `Basic ${Buffer.from('smoke:local-smoke-fixture-password').toString('base64')}`;
const request = (path, options = {}) => fetch(base + path, { ...options, signal: AbortSignal.timeout(5000) });
assert.equal((await request('/healthz')).status, 200);
assert.equal((await request('/readyz')).status, 200);
const unauthenticated = await request('/');
assert.equal(unauthenticated.status, 401);
assert.match(unauthenticated.headers.get('www-authenticate'), /^Basic /);
const page = await request('/', { headers: { authorization } });
assert.equal(page.status, 200);
const html = await page.text();
assert.match(html, /Rizz.AI/);
assert.doesNotMatch(html, /env-config.js/);
const script = /src="(\/assets\/[^"\s]+\.js)"/.exec(html);
assert.ok(script, 'Built JS asset exists');
assert.equal((await request(script[1], { headers: { authorization } })).status, 200);
const post = (path, body, authenticated = true) => request(`/api/${path}`, { method: 'POST',
  headers: { 'content-type': 'application/json', ...(authenticated ? { authorization } : {}) },
  body: JSON.stringify(body) });
assert.equal((await post('rizz', { prompt: 'hello' }, false)).status, 401);
const reply = await post('rizz', { prompt: 'hello' });
assert.equal(reply.status, 200);
assert.match((await reply.json()).text, /^MOCK PROVIDER:/);
assert.equal((await post('rizz', { prompt: '' })).status, 400);
const chat = await post('chat', { history: [], userMessage: 'hello' });
assert.equal(chat.status, 200);
assert.match((await chat.json()).reply, /^MOCK PROVIDER:/);
const image = await post('analyze', { imageBase64: 'data:image/png;base64,iVBORw0KGgo=' });
assert.equal(image.status, 200);
assert.equal((await image.json()).options.length, 3);
console.log('PASS: local nginx/app assets, auth, readiness, API routing and three mock-provider endpoints. No Gemini calls.');
