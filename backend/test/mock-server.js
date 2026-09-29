// Explicit container-smoke fixture, excluded from the production image/entrypoint.
if (process.env.NODE_ENV !== 'test' || process.env.RIZZ_SMOKE_TEST_ONLY !== '1') {
  throw new Error('Mock provider is restricted to the explicit local smoke-test override');
}
const { createApp, readConfig } = require('../src/app');
const provider = { async generate(route) {
  return route === 'rizz' ? { text: 'MOCK PROVIDER: smoke fixture, not Gemini output' }
    : route === 'chat' ? { reply: 'MOCK PROVIDER: fixture reply', critique: 'fixture critique' }
    : { tone: 'MOCK PROVIDER: fixture', options: ['fixture one', 'fixture two', 'fixture three'] };
} };
const app = createApp({ config: readConfig(process.env), provider });
app.listen(3000, '0.0.0.0', () => console.log('LOCAL SMOKE ONLY: mocked provider, no Gemini calls'));
