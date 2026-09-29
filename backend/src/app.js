const express = require('express');
const { createHash, timingSafeEqual, randomUUID } = require('node:crypto');
const { createMetrics } = require('./metrics');

class AppError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function integer(env, key, fallback, min, max) {
  const value = env[key] === undefined ? fallback : Number(env[key]);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
  return value;
}

function readConfig(env = process.env) {
  const apiKey = (env.GEN_AI_KEY || '').trim();
  const model = (env.GEMINI_MODEL || '').trim();
  const username = (env.DEMO_USERNAME || '').trim();
  const password = env.DEMO_PASSWORD || '';
  if (model && !/^gemini-[a-z0-9.-]{1,80}$/.test(model)) throw new Error('Invalid GEMINI_MODEL');
  if (username && !/^[a-zA-Z0-9_-]{1,64}$/.test(username)) throw new Error('Invalid DEMO_USERNAME');
  if (password && (password.length < 16 || password.length > 256)) throw new Error('DEMO_PASSWORD must contain 16–256 characters');
  return {
    apiKey, model, username, password,
    configured: Boolean(apiKey && model && username && password),
    port: integer(env, 'PORT', 3000, 1, 65535),
    timeoutMs: integer(env, 'PROVIDER_TIMEOUT_MS', 25000, 50, 30000),
    maxConcurrent: integer(env, 'MAX_CONCURRENT_REQUESTS', 2, 1, 4),
    requestsPerMinute: integer(env, 'REQUESTS_PER_MINUTE', 10, 1, 60),
    maxProviderCalls: integer(env, 'MAX_PROVIDER_CALLS', 100, 1, 1000),
  };
}

function text(value, max = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new AppError(400, 'invalid_input');
  return value.trim();
}

function exactKeys(body, keys) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !keys.includes(key))) throw new AppError(400, 'invalid_input');
}

function validateInput(route, body) {
  if (route === 'rizz') {
    exactKeys(body, ['prompt']);
    return { prompt: text(body.prompt) };
  }
  if (route === 'chat') {
    exactKeys(body, ['history', 'userMessage']);
    if (!Array.isArray(body.history) || body.history.length > 10) throw new AppError(400, 'invalid_history');
    const history = body.history.map((entry, index) => {
      exactKeys(entry, ['role', 'parts']);
      if (entry.role !== (index % 2 === 0 ? 'user' : 'model')) throw new AppError(400, 'invalid_history');
      return { role: entry.role, parts: text(entry.parts) };
    });
    if (history.length % 2 || history.reduce((sum, entry) => sum + entry.parts.length, 0) > 10000) {
      throw new AppError(400, 'invalid_history');
    }
    return { history, userMessage: text(body.userMessage) };
  }
  exactKeys(body, ['imageBase64']);
  const value = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length > 2800000) throw new AppError(400, 'invalid_image');
  const bytes = Buffer.from(match[2], 'base64');
  const validMagic = match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : match[1] === 'jpeg' ? bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))
    : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!bytes.length || bytes.length > 2 * 1024 * 1024 || !validMagic || bytes.toString('base64') !== match[2]) {
    throw new AppError(400, 'invalid_image');
  }
  return { mimeType: `image/${match[1]}`, data: match[2] };
}

function validateOutput(route, output) {
  try {
    if (route === 'rizz') return { text: text(output.text, 8000) };
    if (route === 'chat') return { reply: text(output.reply, 8000), critique: text(output.critique, 4000) };
    if (!Array.isArray(output.options) || output.options.length !== 3) throw new Error('invalid');
    return { tone: text(output.tone, 1000), options: output.options.map(option => text(option, 4000)) };
  } catch { throw new AppError(502, 'invalid_provider_response'); }
}

function createApp({ config, provider, logger = entry => console.log(JSON.stringify(entry)), now = Date.now }) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.draining = false;
  let active = 0;
  let totalCalls = 0;
  let windowStart = now();
  let requests = 0;
  let authFailures = 0;
  let authWindowStart = now();
  const metrics = createMetrics();
  const expectedAuthHash = createHash('sha256').update(`${config.username}:${config.password}`).digest();

  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({ 'X-Request-ID': req.requestId, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    const started = now();
    res.on('finish', () => {
      const route = req.route?.path || '/unmatched';
      const durationMs = now() - started;
      metrics.recordHttp(route, res.statusCode, durationMs / 1000);
      logger({ event: 'http', requestId: req.requestId, method: req.method,
        route, status: res.statusCode, durationMs });
    });
    next();
  });
  app.get('/healthz', (_req, res) => res.json({ status: 'alive' }));
  app.get('/readyz', (_req, res) => res.status(config.configured && provider && !app.locals.draining ? 200 : 503)
    .json({ status: config.configured && provider && !app.locals.draining ? 'ready' : 'not_ready' }));
  // Backend Service is ClusterIP-only; nginx has no /metrics proxy. Expose
  // only bounded, non-sensitive, process-local measurements for in-cluster scrape.
  app.get('/metrics', (_req, res) => res.type('text/plain; version=0.0.4')
    .send(metrics.render({ active, totalCalls, limit: config.maxProviderCalls })));

  function authenticate(req, res, next) {
    if (!config.configured || !provider || app.locals.draining) return next(new AppError(503, 'service_unavailable'));
    if (now() - authWindowStart >= 60000) { authWindowStart = now(); authFailures = 0; }
    if (authFailures >= 50) { res.set('Retry-After', '60'); return next(new AppError(429, 'authentication_rate_limited')); }
    const header = req.get('authorization') || '';
    const match = /^Basic ([A-Za-z0-9+/=]{1,512})$/.exec(header);
    const actualHash = createHash('sha256').update(match ? Buffer.from(match[1], 'base64') : '').digest();
    if (!match || !timingSafeEqual(actualHash, expectedAuthHash)) {
      authFailures++;
      res.set('WWW-Authenticate', 'Basic realm="Rizz.AI staging demo", charset="UTF-8"');
      return next(new AppError(401, 'authentication_required'));
    }
    next();
  }
  app.get('/auth/check', authenticate, (_req, res) => res.status(204).end());
  app.use('/api', authenticate, express.json({ limit: '3mb', strict: true }));

  for (const route of ['rizz', 'chat', 'analyze']) {
    app.post(`/api/${route}`, async (req, res, next) => {
      let controller;
      let timer;
      let providerCall;
      let acquired = false;
      let timedOut = false;
      let outcome = 'unavailable';
      const disconnected = () => { if (!res.writableEnded) controller?.abort(); };
      try {
        if (!req.is('application/json')) throw new AppError(415, 'json_required');
        const input = validateInput(route, req.body);
        if (now() - windowStart >= 60000) { windowStart = now(); requests = 0; }
        if (totalCalls >= config.maxProviderCalls) throw new AppError(429, 'demo_call_budget_exhausted');
        if (requests >= config.requestsPerMinute) {
          res.set('Retry-After', '60'); throw new AppError(429, 'demo_request_limit');
        }
        if (active >= config.maxConcurrent) throw new AppError(503, 'service_busy');
        requests++; totalCalls++; active++; acquired = true;
        controller = new AbortController();
        res.once('close', disconnected);
        providerCall = Promise.resolve().then(() => provider.generate(route, input, { signal: controller.signal }));
        const deadline = new Promise((_, reject) => {
          timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new AppError(504, 'provider_timeout')); }, config.timeoutMs);
        });
        const output = await Promise.race([providerCall, deadline]);
        if (!res.destroyed) {
          res.json(validateOutput(route, output));
          outcome = 'success';
        } else outcome = 'cancelled';
      } catch (error) {
        if (res.destroyed) { outcome = 'cancelled'; return; }
        if (error instanceof AppError) {
          outcome = error.code === 'provider_timeout' ? 'timeout'
            : error.code === 'invalid_provider_response' ? 'invalid_response' : 'unavailable';
          next(error);
        } else if (timedOut || error?.name === 'AbortError' || error?.name === 'TimeoutError') {
          outcome = 'timeout'; next(new AppError(504, 'provider_timeout'));
        } else if (Number(error?.status) === 429) {
          outcome = 'rate_limited'; next(new AppError(503, 'provider_rate_limited'));
        } else { outcome = 'unavailable'; next(new AppError(502, 'provider_unavailable')); }
      } finally {
        clearTimeout(timer);
        res.off('close', disconnected);
        // A provider ignoring cancellation still occupies its concurrency slot.
        if (acquired) {
          metrics.recordProvider(route, outcome);
          if (providerCall) providerCall.then(() => { active--; }, () => { active--; });
          else active--;
        }
      }
    });
  }
  app.use((_req, _res, next) => next(new AppError(404, 'not_found')));
  app.use((error, req, res, _next) => {
    const status = error instanceof AppError ? error.status : error.type === 'entity.too.large' ? 413
      : error.type === 'entity.parse.failed' ? 400 : 500;
    const code = error instanceof AppError ? error.code : status === 413 ? 'payload_too_large'
      : status === 400 ? 'invalid_json' : 'internal_error';
    if (status >= 500) logger({ event: 'failure', requestId: req.requestId, code, status });
    res.status(status).json({ error: code, requestId: req.requestId });
  });
  return app;
}
module.exports = { createApp, readConfig, validateInput, validateOutput };
