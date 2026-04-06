// Simple test — no test framework needed, just Node.js built-ins
const http = require('http');
 
let passed = 0;
let failed = 0;
 
function test(name, condition) {
  if (condition) {
    console.log('  PASS:', name);
    passed++;
  } else {
    console.error('  FAIL:', name);
    failed++;
  }
}
 
function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });
}
 
async function runTests() {
  console.log('Running tests...');
  const app = require('./server.js');
 
  // Give the server a moment to start
  await new Promise(r => setTimeout(r, 500));
 
  // Test home endpoint
  const home = await httpGet('/');
  test('GET / returns 200', home.status === 200);
  test('GET / has message field', home.body.message !== undefined);
  test('GET / has hostname field', home.body.hostname !== undefined);
 
  // Test health endpoint
  const health = await httpGet('/health');
  test('GET /health returns 200', health.status === 200);
  test('GET /health returns ok status', health.body.status === 'ok');
 
  // Test version endpoint
  const version = await httpGet('/version');
  test('GET /version returns 200', version.status === 200);
  test('GET /version has version field', version.body.version !== undefined);
 
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
  // Exit code 1 = tests failed = Jenkins marks build as FAILED
  // Exit code 0 = tests passed = Jenkins continues pipeline
}
 
runTests().catch(err => { console.error(err); process.exit(1); });
