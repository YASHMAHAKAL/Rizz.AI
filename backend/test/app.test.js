const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp, readConfig } = require('../src/app');
const { createGeminiProvider } = require('../src/gemini');

const fixtureEnv = { GEN_AI_KEY: 'test-only-not-a-key', GEMINI_MODEL: 'gemini-test',
  DEMO_USERNAME: 'test', DEMO_PASSWORD: 'test-only-long-password' };
const authorization = `Basic ${Buffer.from(`${fixtureEnv.DEMO_USERNAME}:${fixtureEnv.DEMO_PASSWORD}`).toString('base64')}`;
const fixtureProvider = { async generate(route) {
  return route === 'rizz' ? { text: 'fixture' } : route === 'chat' ? { reply: 'fixture', critique: 'fixture' }
    : { tone: 'fixture', options: ['one', 'two', 'three'] };
} };

async function harness(t, options = {}) {
  const config = readConfig({ ...fixtureEnv, ...options.env });
  const logs = [];
  const app = createApp({ config, provider: fixtureProvider, logger: entry => logs.push(entry), ...options });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { app, logs, get: path => fetch(base + path),
    post: (path = 'rizz', body = { prompt: 'hello' }, headers = {}) => fetch(`${base}/api/${path}`, {
      method: 'POST', headers: { authorization, 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
    }), base };
}

test('health/readiness never call the provider; missing config and drain fail readiness', async t => {
  let calls = 0;
  const h = await harness(t, { provider: { async generate() { calls++; } } });
  assert.equal((await h.get('/healthz')).status, 200);
  assert.equal((await h.get('/readyz')).status, 200);
  h.app.locals.draining = true;
  assert.equal((await h.get('/readyz')).status, 503);
  assert.equal((await h.get('/healthz')).status, 200);
  const missing = await harness(t, { env: { GEN_AI_KEY: '' } });
  assert.equal((await missing.get('/readyz')).status, 503);
  assert.equal((await missing.post()).status, 503);
  assert.equal(calls, 0);
});

test('private-service metrics use bounded labels and separate provider outcomes', async t => {
  const h = await harness(t, { provider: { async generate(route) {
    if (route === 'chat') throw { status: 429 };
    return { text: 'fixture' };
  } } });
  assert.equal((await h.get('/healthz')).status, 200);
  assert.equal((await h.get('/readyz')).status, 200);
  assert.equal((await h.post('rizz', { prompt: 'private prompt' })).status, 200);
  assert.equal((await h.post('chat', { history: [], userMessage: 'secret text' })).status, 503);
  const response = await h.get('/metrics');
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /rizz_ai_http_requests_total\{route="\/api\/rizz",status="200"\} 1/);
  assert.match(body, /rizz_ai_gemini_requests_total\{route="rizz",outcome="success"\} 1/);
  assert.match(body, /rizz_ai_gemini_requests_total\{route="chat",outcome="rate_limited"\} 1/);
  assert.match(body, /rizz_ai_demo_provider_calls_total 2/);
  assert.match(body, /rizz_ai_gemini_inflight 0/);
  assert.doesNotMatch(body, /private prompt|secret text|test-only-long-password|test-only-not-a-key/);
});

test('API and gateway auth check require valid Basic credentials', async t => {
  const h = await harness(t);
  const rejected = await h.post('rizz', { prompt: 'hello' }, { authorization: '' });
  assert.equal(rejected.status, 401);
  assert.match(rejected.headers.get('www-authenticate'), /^Basic /);
  assert.equal((await h.get('/auth/check')).status, 401);
  assert.equal((await fetch(h.base + '/auth/check', { headers: { authorization } })).status, 204);
  const wrongAuthorization = `Basic ${Buffer.from('wrong:wrong').toString('base64')}`;
  assert.equal((await h.post('rizz', { prompt: 'hello' }, { authorization: wrongAuthorization })).status, 401);
  assert.equal((await h.post()).status, 200);
});

test('valid request contracts for all three endpoints', async t => {
  const h = await harness(t);
  assert.deepEqual(await (await h.post()).json(), { text: 'fixture' });
  assert.equal((await h.post('chat', { history: [], userMessage: 'hello' })).status, 200);
  const png = Buffer.from('89504e470d0a1a0a', 'hex').toString('base64');
  assert.equal((await h.post('analyze', { imageBase64: `data:image/png;base64,${png}` })).status, 200);
});

test('reject malformed input/history/image and extra fields without provider calls', async t => {
  let calls = 0;
  const h = await harness(t, { provider: { async generate() { calls++; } } });
  for (const body of [{}, { prompt: 3 }, { prompt: ' ' }, { prompt: 'x'.repeat(2001) }, { prompt: 'hello', secret: 'no' }]) {
    assert.equal((await h.post('rizz', body)).status, 400);
  }
  for (const history of [null, {}, [{ role: 'admin', parts: 'x' }], [{ role: 'user', parts: 'x' }],
    Array.from({ length: 12 }, () => ({ role: 'user', parts: 'x' }))]) {
    assert.equal((await h.post('chat', { history, userMessage: 'hi' })).status, 400);
  }
  assert.equal((await h.post('analyze', { imageBase64: 'data:image/jpeg;base64,aGVsbG8=' })).status, 400);
  assert.equal((await h.post('analyze', { imageBase64: 'raw-base64' })).status, 400);
  assert.equal(calls, 0);
});

test('minute limit is shared across endpoints and resets; lifetime calls do not reset', async t => {
  let time = 0;
  const h = await harness(t, { env: { REQUESTS_PER_MINUTE: '1', MAX_PROVIDER_CALLS: '2' }, now: () => time });
  assert.equal((await h.post()).status, 200);
  assert.equal((await h.post('chat', { history: [], userMessage: 'hi' })).status, 429);
  time += 60001;
  assert.equal((await h.post()).status, 200);
  time += 60001;
  const exhausted = await h.post();
  assert.equal(exhausted.status, 429);
  assert.equal((await exhausted.json()).error, 'demo_call_budget_exhausted');
  assert.equal(exhausted.headers.get('retry-after'), null);
});

test('hung provider times out, receives abort and cannot free an occupied slot prematurely', async t => {
  let observedSignal;
  let complete;
  const h = await harness(t, { env: { PROVIDER_TIMEOUT_MS: '50', MAX_CONCURRENT_REQUESTS: '1' },
    provider: { generate(_route, _input, { signal }) {
      observedSignal = signal;
      return new Promise(resolve => { complete = resolve; });
    } } });
  const result = await h.post();
  assert.equal(result.status, 504);
  assert.equal(observedSignal.aborted, true);
  assert.equal((await h.post()).status, 503);
  complete({ text: 'fixture' });
  await new Promise(resolve => setImmediate(resolve));
});

test('provider failures/invalid results are sanitized and never become successful replies', async t => {
  const h = await harness(t, { provider: { async generate() { throw new Error('secret-key-and-private-prompt'); } } });
  const response = await h.post();
  assert.equal(response.status, 502);
  assert.doesNotMatch(JSON.stringify(await response.json()) + JSON.stringify(h.logs), /secret-key-and-private-prompt|test-only-long-password/);
  const invalid = await harness(t, { provider: { async generate() { return { reply: 4 }; } } });
  assert.equal((await invalid.post('chat', { history: [], userMessage: 'hi' })).status, 502);
  const limited = await harness(t, { provider: { async generate() { throw { status: 429 }; } } });
  assert.equal((await limited.post()).status, 503);
  const emptyFailure = await harness(t, { provider: { async generate() { throw null; } } });
  assert.equal((await emptyFailure.post()).status, 502);
});

test('JSON parser rejects excessive bodies/malformed JSON; wrong content type rejected', async t => {
  const h = await harness(t);
  assert.equal((await h.post('rizz', { prompt: 'x'.repeat(3200000) })).status, 413);
  assert.equal((await fetch(h.base + '/api/rizz', { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await h.post('rizz', { prompt: 'hello' }, { 'content-type': 'text/plain' })).status, 415);
});

test('invalid configuration fails safely without disclosing values', () => {
  assert.throws(() => readConfig({ ...fixtureEnv, MAX_CONCURRENT_REQUESTS: '8' }), /MAX_CONCURRENT/);
  assert.throws(() => readConfig({ ...fixtureEnv, DEMO_PASSWORD: 'short' }), /16/);
  assert.equal(readConfig({}).configured, false);
});

test('Gemini adapter forwards selected model, structured schema, timeout, abort and no retry', async () => {
  const requests = [];
  const client = { models: { async generateContent(request) { requests.push(request); return { text: '{"reply":"fixture","critique":"fixture"}' }; } } };
  const config = readConfig(fixtureEnv);
  const provider = createGeminiProvider(config, client);
  const signal = new AbortController().signal;
  const result = await provider.generate('chat', { history: [], userMessage: 'hello' }, { signal });
  assert.deepEqual(result, { reply: 'fixture', critique: 'fixture' });
  assert.equal(requests[0].model, config.model);
  assert.equal(requests[0].config.abortSignal, signal);
  assert.equal(requests[0].config.httpOptions.timeout, config.timeoutMs);
  assert.equal(requests[0].config.httpOptions.retryOptions.attempts, 1);
  assert.equal(requests[0].config.responseMimeType, 'application/json');
  assert.equal(requests[0].config.maxOutputTokens, 1024);
});
