import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRizz, generateChatReply, analyzeScreenshot, ApiError } from '../src/services/gemini.ts';

function stub(t, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = fn;
  t.after(() => { globalThis.fetch = original; });
}
test('successful call uses same-origin backend and returns genuine payload', async t => {
  stub(t, async (url, options) => {
    assert.equal(url, '/api/rizz');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).prompt, 'hello');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ text: 'fixture reply' });
  });
  assert.equal(await generateRizz('hello'), 'fixture reply');
});
test('HTTP errors throw instead of generating fake success', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  for (const status of [400, 401, 413, 429, 502, 503, 504]) {
    globalThis.fetch = async () => Response.json({ error: 'not copied to UI' }, { status });
    await assert.rejects(generateRizz('hello'), error => error instanceof ApiError && error.status === status);
  }
});
test('invalid success payloads and network failures remain failures', async t => {
  stub(t, async () => Response.json({ text: 7 }));
  await assert.rejects(generateRizz('hello'), ApiError);
  globalThis.fetch = async () => { throw new TypeError('private-network-details'); };
  await assert.rejects(generateRizz('hello'), error => !error.message.includes('private-network-details'));
});
test('exhausted lifetime budget does not ask the user to retry later', async t => {
  stub(t, async () => Response.json({ error: 'demo_call_budget_exhausted' }, { status: 429 }));
  await assert.rejects(generateRizz('hello'), error => error.status === 429 && /budget is exhausted/.test(error.message));
});
test('aborted requests produce explicit timeout error', async t => {
  stub(t, async () => { throw new DOMException('aborted', 'AbortError'); });
  await assert.rejects(generateRizz('hello'), error => error.status === 504);
});
test('chat and image outputs are checked before use', async t => {
  stub(t, async () => Response.json({ reply: 'fixture', critique: 'fixture' }));
  assert.deepEqual(await generateChatReply([], 'hi'), { reply: 'fixture', critique: 'fixture' });
  globalThis.fetch = async () => Response.json({ tone: 'fixture', options: ['one'] });
  await assert.rejects(analyzeScreenshot('fixture'), ApiError);
  globalThis.fetch = async () => Response.json({ tone: 'fixture', options: ['one', 'two', 'three'] });
  assert.equal((await analyzeScreenshot('fixture')).options.length, 3);
});
