const express = require('express');
const os      = require('os');
const client  = require('prom-client');
// prom-client is the official Prometheus Node.js library
 
const app  = express();
const PORT = process.env.PORT || 3000;
 
const VERSION = process.env.APP_VERSION  || '1.0.0';
const BUILD   = process.env.BUILD_NUMBER || 'local';
 
// ── Prometheus Metrics Setup ──────────────────────────────
 
// Create a registry — holds all our metrics
const register = new client.Registry();
 
// Add default Node.js metrics (heap, CPU, event loop, GC, etc)
// These are collected automatically every 10 seconds
client.collectDefaultMetrics({
  register,
  prefix: 'hello_devops_',
  // prefix keeps our metrics separate from others
});
 
// Counter — only goes up, never down
// Use for: requests, errors, logins, purchases
const httpRequestsTotal = new client.Counter({
  name: 'hello_devops_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  // Labels let you slice the metric: show only POST requests,
  // or only 500 errors, or only /health requests
  registers: [register],
});
 
// Histogram — tracks distribution of values
// Use for: request duration, response size, queue wait time
const httpRequestDuration = new client.Histogram({
  name: 'hello_devops_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  // buckets define the thresholds for the histogram
  // e.g. how many requests took less than 5ms, 10ms, 25ms, etc
  registers: [register],
});
 
// Gauge — can go up and down
// Use for: active connections, queue depth, temperature
const httpRequestsInProgress = new client.Gauge({
  name: 'hello_devops_http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method', 'route'],
  registers: [register],
});
 
// ── Middleware ────────────────────────────────────────────
// Middleware runs on EVERY request before your route handlers
 
app.use((req, res, next) => {
  const start = Date.now();
  // Record the start time
 
  httpRequestsInProgress.inc({ method: req.method, route: req.path });
  // Increment in-progress counter when request starts
 
  res.on('finish', () => {
    // 'finish' fires when the response is sent
    const duration = (Date.now() - start) / 1000;
    // Calculate duration in seconds
 
    const labels = {
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    };
 
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
    httpRequestsInProgress.dec({ method: req.method, route: req.path });
    // Decrement in-progress when request finishes
  });
 
  next();
  // next() passes to the actual route handler
});
 
// ── Routes ───────────────────────────────────────────────
 
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from DevOps!',
    hostname: os.hostname(),
    version: VERSION,
    build: BUILD
  });
});
 
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
 
app.get('/version', (req, res) => {
  res.json({ version: VERSION, build: BUILD });
});
 
// ── Metrics Endpoint ─────────────────────────────────────
// Prometheus scrapes this endpoint every 15 seconds
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
  // Returns all metrics in Prometheus text format
});
 
// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});
 
module.exports = app;

