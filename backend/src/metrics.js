// Fixed-cardinality, process-local Prometheus metrics. Never use user input,
// URLs, prompts, credentials or provider responses as metric labels.
const buckets = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, Infinity];
const routes = new Set(['/healthz', '/readyz', '/metrics', '/auth/check', '/api/rizz', '/api/chat', '/api/analyze']);
const outcomes = new Set(['success', 'timeout', 'rate_limited', 'unavailable', 'invalid_response', 'cancelled']);

function createMetrics() {
  const http = new Map();
  const durations = new Map();
  const provider = new Map();
  function routeLabel(value) { return routes.has(value) ? value : 'other'; }
  function recordHttp(route, status, durationSeconds) {
    const label = routeLabel(route);
    const code = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 500;
    const key = `${label}|${code}`;
    http.set(key, (http.get(key) || 0) + 1);
    const duration = durations.get(label) || { counts: buckets.map(() => 0), sum: 0, count: 0 };
    const value = Math.max(0, Number.isFinite(durationSeconds) ? durationSeconds : 0);
    for (let index = 0; index < buckets.length; index++) {
      if (value <= buckets[index]) duration.counts[index]++;
    }
    duration.sum += value;
    duration.count++;
    durations.set(label, duration);
  }
  function recordProvider(route, outcome) {
    const part = ['rizz', 'chat', 'analyze'].includes(route) ? route : 'other';
    const result = outcomes.has(outcome) ? outcome : 'unavailable';
    const key = `${part}|${result}`;
    provider.set(key, (provider.get(key) || 0) + 1);
  }
  function render({ active, totalCalls, limit }) {
    const lines = [
      '# HELP rizz_ai_http_requests_total HTTP responses by bounded route and status.',
      '# TYPE rizz_ai_http_requests_total counter',
    ];
    for (const [key, count] of [...http].sort()) {
      const [route, status] = key.split('|');
      lines.push(`rizz_ai_http_requests_total{route="${route}",status="${status}"} ${count}`);
    }
    lines.push('# HELP rizz_ai_http_duration_seconds HTTP response duration by bounded route.');
    lines.push('# TYPE rizz_ai_http_duration_seconds histogram');
    for (const [route, entry] of [...durations].sort()) {
      buckets.forEach((bucket, index) => {
        lines.push(`rizz_ai_http_duration_seconds_bucket{route="${route}",le="${bucket === Infinity ? '+Inf' : bucket}"} ${entry.counts[index]}`);
      });
      lines.push(`rizz_ai_http_duration_seconds_sum{route="${route}"} ${entry.sum}`);
      lines.push(`rizz_ai_http_duration_seconds_count{route="${route}"} ${entry.count}`);
    }
    lines.push('# HELP rizz_ai_gemini_requests_total Provider attempts by bounded route and outcome.');
    lines.push('# TYPE rizz_ai_gemini_requests_total counter');
    for (const [key, count] of [...provider].sort()) {
      const [route, outcome] = key.split('|');
      lines.push(`rizz_ai_gemini_requests_total{route="${route}",outcome="${outcome}"} ${count}`);
    }
    lines.push('# HELP rizz_ai_gemini_inflight Provider calls still occupying this process.');
    lines.push('# TYPE rizz_ai_gemini_inflight gauge');
    lines.push(`rizz_ai_gemini_inflight ${Math.max(0, active)}`);
    lines.push('# HELP rizz_ai_demo_provider_calls_total Provider attempts since this process started.');
    lines.push('# TYPE rizz_ai_demo_provider_calls_total counter');
    lines.push(`rizz_ai_demo_provider_calls_total ${Math.max(0, totalCalls)}`);
    lines.push('# HELP rizz_ai_demo_provider_call_limit Configured per-process lifetime call limit.');
    lines.push('# TYPE rizz_ai_demo_provider_call_limit gauge');
    lines.push(`rizz_ai_demo_provider_call_limit ${limit}`);
    return `${lines.join('\n')}\n`;
  }
  return { recordHttp, recordProvider, render };
}

module.exports = { createMetrics };
