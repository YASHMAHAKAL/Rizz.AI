require('dotenv').config();
const { createApp, readConfig } = require('./src/app');
const { createGeminiProvider } = require('./src/gemini');

const config = readConfig(process.env);
const app = createApp({ config, provider: config.configured ? createGeminiProvider(config) : null });
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(JSON.stringify({ event: 'listening', port: config.port, configured: config.configured }));
});
server.requestTimeout = 40000;
server.headersTimeout = 10000;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    app.locals.draining = true;
    server.close(() => process.exit(0));
    server.closeIdleConnections();
    setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 35000).unref();
  });
}
