const express = require('express');
const os = require('os');
 
const app = express();
const PORT = process.env.PORT || 3000;
// process.env.PORT lets Kubernetes set the port via environment variable
// If not set, default to 3000
 
const VERSION = process.env.APP_VERSION || '1.0.0';
const BUILD   = process.env.BUILD_NUMBER || 'local';
 
// Home page
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from DevOps!',
    hostname: os.hostname(),
    // os.hostname() returns the pod name in Kubernetes — cool!
    version: VERSION,
    build: BUILD
  });
});
 
// Health check — Kubernetes calls this every 10 seconds
// If it returns anything other than 200, K8s restarts the pod
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
 
// Version info
app.get('/version', (req, res) => {
  res.json({ version: VERSION, build: BUILD });
});
 
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Version: ${VERSION}, Build: ${BUILD}`);
});
 
module.exports = app;
// module.exports lets our test file import the app
