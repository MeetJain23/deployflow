const http = require('http');
const app = require('../server');

let server;
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5555${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function postJSON(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`http://localhost:5555${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(resData) }); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 DeployFlow Backend Test Suite\n');
  console.log('='.repeat(50));
  
  // Test 1: Health check
  console.log('\n📋 Health Check Tests:');
  const health = await fetchJSON('/api/health');
  assert(health.status === 200, 'Health endpoint returns 200');
  assert(health.body.status === 'healthy', 'Status is healthy');
  assert(health.body.service === 'deployflow-backend', 'Service name correct');
  assert(health.body.version === '2.4.1', 'Version is correct');

  // Test 2: Stats
  console.log('\n📋 Dashboard Stats Tests:');
  const stats = await fetchJSON('/api/stats');
  assert(stats.status === 200, 'Stats endpoint returns 200');
  assert(stats.body.totalBuilds > 0, 'Total builds is positive');
  assert(parseFloat(stats.body.successRate) > 0, 'Success rate is positive');
  assert(stats.body.activeContainers > 0, 'Active containers exist');

  // Test 3: Pipelines
  console.log('\n📋 Pipeline Tests:');
  const pipelines = await fetchJSON('/api/pipelines');
  assert(pipelines.status === 200, 'Pipelines endpoint returns 200');
  assert(Array.isArray(pipelines.body), 'Returns array');
  assert(pipelines.body.length >= 5, 'At least 5 pipelines exist');
  assert(pipelines.body[0].stages.length === 4, 'Pipeline has 4 stages');

  // Test 4: Single pipeline
  const single = await fetchJSON('/api/pipelines/PL-001');
  assert(single.status === 200, 'Single pipeline returns 200');
  assert(single.body.name === 'frontend-app', 'Pipeline name correct');

  // Test 5: Pipeline not found
  const notFound = await fetchJSON('/api/pipelines/PL-999');
  assert(notFound.status === 404, 'Non-existent pipeline returns 404');

  // Test 6: Create pipeline
  console.log('\n📋 Pipeline Creation Tests:');
  const created = await postJSON('/api/pipelines', {
    name: 'test-service',
    repo: 'github.com/team/test',
    branch: 'main'
  });
  assert(created.status === 201, 'Create pipeline returns 201');
  assert(created.body.name === 'test-service', 'New pipeline name correct');
  assert(created.body.status === 'queued', 'New pipeline status is queued');

  // Test 7: Containers
  console.log('\n📋 Container Tests:');
  const containers = await fetchJSON('/api/containers');
  assert(containers.status === 200, 'Containers endpoint returns 200');
  assert(containers.body.length >= 7, 'At least 7 containers');
  assert(containers.body[0].cpu >= 0 && containers.body[0].cpu <= 100, 'CPU within valid range');

  // Test 8: Metrics
  console.log('\n📋 Monitoring Tests:');
  const metrics = await fetchJSON('/api/metrics');
  assert(metrics.status === 200, 'Metrics endpoint returns 200');
  assert(metrics.body.cpu.length === 30, 'CPU has 30 data points');
  assert(metrics.body.memory.length === 30, 'Memory has 30 data points');
  assert(metrics.body.requests.length === 30, 'Requests has 30 data points');
  assert(metrics.body.errors.length === 30, 'Errors has 30 data points');

  // Test 9: Alerts
  const alerts = await fetchJSON('/api/alerts');
  assert(alerts.status === 200, 'Alerts endpoint returns 200');
  assert(alerts.body.length > 0, 'Alerts exist');

  // Test 10: Logs
  console.log('\n📋 Log Tests:');
  const logs = await fetchJSON('/api/logs');
  assert(logs.status === 200, 'Logs endpoint returns 200');
  assert(logs.body.length > 0, 'Logs exist');
  assert(logs.body[0].level !== undefined, 'Log has level field');
  assert(logs.body[0].svc !== undefined, 'Log has service field');

  // Results
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

server = app.listen(5555, async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
