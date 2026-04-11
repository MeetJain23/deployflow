const http = require('http');
const app = require('../server');
let server, passed = 0, failed = 0;

function assert(condition, name) {
  if (condition) { console.log('  PASS: ' + name); passed++; }
  else { console.log('  FAIL: ' + name); failed++; }
}

async function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5555' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\nDeployFlow Backend Test Suite\n');
  const health = await fetchJSON('/api/health');
  assert(health.status === 200, 'Health endpoint returns 200');
  assert(health.body.status === 'healthy', 'Status is healthy');

  const stats = await fetchJSON('/api/stats');
  assert(stats.status === 200, 'Stats endpoint returns 200');
  assert(stats.body.totalBuilds > 0, 'Total builds is positive');

  const pipelines = await fetchJSON('/api/pipelines');
  assert(pipelines.status === 200, 'Pipelines endpoint returns 200');
  assert(pipelines.body.length >= 5, 'At least 5 pipelines');

  const containers = await fetchJSON('/api/containers');
  assert(containers.status === 200, 'Containers endpoint returns 200');
  assert(containers.body.length >= 7, 'At least 7 containers');

  const metrics = await fetchJSON('/api/metrics');
  assert(metrics.status === 200, 'Metrics endpoint returns 200');
  assert(metrics.body.cpu.length === 30, 'CPU has 30 data points');

  const logs = await fetchJSON('/api/logs');
  assert(logs.status === 200, 'Logs endpoint returns 200');
  assert(logs.body.length > 0, 'Logs exist');

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) process.exit(1);
}

server = app.listen(5555, async () => {
  try { await runTests(); } catch(e) { console.error(e); process.exit(1); }
  finally { server.close(); }
});