const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY DATA STORE (simulates database)
// ============================================

const pipelines = [
  {
    id: "PL-001",
    name: "frontend-app",
    repo: "github.com/team/frontend",
    branch: "main",
    status: "success",
    duration: "2m 34s",
    triggered: new Date().toISOString(),
    stages: [
      { name: "Build", status: "success", duration: "32s" },
      { name: "Test", status: "success", duration: "48s" },
      { name: "Dockerize", status: "success", duration: "41s" },
      { name: "Deploy", status: "success", duration: "33s" }
    ],
    commit: "a3f8c1d",
    author: "Sarah K."
  },
  {
    id: "PL-002",
    name: "auth-service",
    repo: "github.com/team/auth-svc",
    branch: "main",
    status: "running",
    duration: "1m 12s",
    triggered: new Date().toISOString(),
    stages: [
      { name: "Build", status: "success", duration: "28s" },
      { name: "Test", status: "success", duration: "44s" },
      { name: "Dockerize", status: "running", duration: "—" },
      { name: "Deploy", status: "pending", duration: "—" }
    ],
    commit: "e7b2f90",
    author: "Raj M."
  },
  {
    id: "PL-003",
    name: "payment-gateway",
    repo: "github.com/team/payments",
    branch: "develop",
    status: "failed",
    duration: "3m 01s",
    triggered: new Date().toISOString(),
    stages: [
      { name: "Build", status: "success", duration: "35s" },
      { name: "Test", status: "success", duration: "52s" },
      { name: "Dockerize", status: "failed", duration: "1m 34s" },
      { name: "Deploy", status: "pending", duration: "—" }
    ],
    commit: "c44d1a2",
    author: "Alex T."
  },
  {
    id: "PL-004",
    name: "notification-svc",
    repo: "github.com/team/notif",
    branch: "main",
    status: "success",
    duration: "1m 45s",
    triggered: new Date().toISOString(),
    stages: [
      { name: "Build", status: "success", duration: "22s" },
      { name: "Test", status: "success", duration: "38s" },
      { name: "Dockerize", status: "success", duration: "25s" },
      { name: "Deploy", status: "success", duration: "20s" }
    ],
    commit: "f19e3b7",
    author: "Maya L."
  },
  {
    id: "PL-005",
    name: "api-gateway",
    repo: "github.com/team/api-gw",
    branch: "release/v2",
    status: "queued",
    duration: "—",
    triggered: new Date().toISOString(),
    stages: [
      { name: "Build", status: "pending", duration: "—" },
      { name: "Test", status: "pending", duration: "—" },
      { name: "Dockerize", status: "pending", duration: "—" },
      { name: "Deploy", status: "pending", duration: "—" }
    ],
    commit: "b82a0ff",
    author: "Dev P."
  }
];

const containers = [
  { id: "C-001", name: "frontend-app", image: "frontend:3.2.1", status: "running", cpu: 23, memory: 312, port: 3000, replicas: 3, uptime: "4d 12h" },
  { id: "C-002", name: "auth-service", image: "auth:1.8.0", status: "running", cpu: 45, memory: 480, port: 8080, replicas: 2, uptime: "4d 12h" },
  { id: "C-003", name: "payment-gateway", image: "payments:2.1.4", status: "warning", cpu: 67, memory: 720, port: 8443, replicas: 2, uptime: "2d 8h" },
  { id: "C-004", name: "notification-svc", image: "notif:1.3.2", status: "running", cpu: 12, memory: 198, port: 5000, replicas: 1, uptime: "4d 12h" },
  { id: "C-005", name: "api-gateway", image: "apigw:4.0.0", status: "running", cpu: 38, memory: 410, port: 443, replicas: 3, uptime: "4d 12h" },
  { id: "C-006", name: "redis-cache", image: "redis:7.2", status: "running", cpu: 8, memory: 256, port: 6379, replicas: 1, uptime: "10d 3h" },
  { id: "C-007", name: "postgres-db", image: "postgres:16", status: "running", cpu: 31, memory: 1024, port: 5432, replicas: 1, uptime: "10d 3h" }
];

const logs = [];
const LOG_MESSAGES = [
  { level: "INFO", svc: "auth-service", msg: "JWT token validated for user_8293" },
  { level: "INFO", svc: "api-gateway", msg: "POST /api/v2/orders → 201 (45ms)" },
  { level: "WARN", svc: "payment-gateway", msg: "Stripe webhook retry #2 for evt_3fa8" },
  { level: "ERROR", svc: "payment-gateway", msg: "Connection timeout to payment processor" },
  { level: "INFO", svc: "frontend-app", msg: "Static assets cache invalidated" },
  { level: "INFO", svc: "notification-svc", msg: "Email queued: order_confirmation" },
  { level: "DEBUG", svc: "auth-service", msg: "Rate limiter: 142/500 requests" },
  { level: "INFO", svc: "api-gateway", msg: "GET /api/v2/products → 200 (12ms)" },
  { level: "WARN", svc: "postgres-db", msg: "Slow query detected (1.2s)" },
  { level: "INFO", svc: "redis-cache", msg: "Cache hit ratio: 94.2%" },
];

// Generate initial logs
for (let i = 0; i < 20; i++) {
  const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
  logs.push({
    id: i,
    timestamp: new Date(Date.now() - (20 - i) * 1000).toISOString(),
    ...msg
  });
}

// ============================================
// API ROUTES
// ============================================

// Health check endpoint (used by Docker and CI/CD)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'deployflow-backend',
    version: '2.4.1',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Dashboard statistics
app.get('/api/stats', (req, res) => {
  const successCount = pipelines.filter(p => p.status === 'success').length;
  res.json({
    totalBuilds: 1247,
    successRate: ((successCount / pipelines.length) * 100).toFixed(1),
    activeContainers: containers.reduce((sum, c) => sum + c.replicas, 0),
    services: containers.length,
    avgDeployTime: "2m 18s",
    uptime: "99.97%"
  });
});

// ---- PIPELINE ROUTES ----
app.get('/api/pipelines', (req, res) => {
  res.json(pipelines);
});

app.get('/api/pipelines/:id', (req, res) => {
  const pipeline = pipelines.find(p => p.id === req.params.id);
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json(pipeline);
});

app.post('/api/pipelines', (req, res) => {
  const { name, repo, branch, dockerfilePath, deployTarget } = req.body;
  const newPipeline = {
    id: `PL-${String(pipelines.length + 1).padStart(3, '0')}`,
    name: name || 'new-service',
    repo: repo || 'github.com/team/new-service',
    branch: branch || 'main',
    status: 'queued',
    duration: '—',
    triggered: new Date().toISOString(),
    stages: [
      { name: "Build", status: "pending", duration: "—" },
      { name: "Test", status: "pending", duration: "—" },
      { name: "Dockerize", status: "pending", duration: "—" },
      { name: "Deploy", status: "pending", duration: "—" }
    ],
    commit: Math.random().toString(36).substring(2, 9),
    author: "User",
    dockerfilePath: dockerfilePath || './Dockerfile',
    deployTarget: deployTarget || 'production'
  };
  pipelines.push(newPipeline);

  // Simulate pipeline execution
  simulatePipeline(newPipeline);

  res.status(201).json(newPipeline);
});

app.post('/api/pipelines/:id/rerun', (req, res) => {
  const pipeline = pipelines.find(p => p.id === req.params.id);
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  
  pipeline.status = 'queued';
  pipeline.triggered = new Date().toISOString();
  pipeline.stages.forEach(s => { s.status = 'pending'; s.duration = '—'; });
  
  simulatePipeline(pipeline);
  res.json(pipeline);
});

// ---- CONTAINER ROUTES ----
app.get('/api/containers', (req, res) => {
  // Add live metrics variation
  const liveContainers = containers.map(c => ({
    ...c,
    cpu: Math.min(100, Math.max(5, c.cpu + Math.floor(Math.random() * 20) - 10)),
    memory: c.memory + Math.floor(Math.random() * 50) - 25
  }));
  res.json(liveContainers);
});

// ---- MONITORING ROUTES ----
app.get('/api/metrics', (req, res) => {
  const points = 30;
  const metrics = {
    cpu: [],
    memory: [],
    requests: [],
    errors: []
  };
  for (let i = 0; i < points; i++) {
    const t = new Date(Date.now() - (points - i) * 60000).toISOString();
    metrics.cpu.push({ timestamp: t, value: 20 + Math.random() * 40 + Math.sin(i / 4) * 10 });
    metrics.memory.push({ timestamp: t, value: 40 + Math.random() * 20 + Math.cos(i / 3) * 8 });
    metrics.requests.push({ timestamp: t, value: 80 + Math.random() * 120 + Math.sin(i / 5) * 30 });
    metrics.errors.push({ timestamp: t, value: Math.random() * 5 });
  }
  res.json(metrics);
});

app.get('/api/alerts', (req, res) => {
  res.json([
    { id: 1, severity: "WARN", message: "payment-gateway: Response latency > 500ms (avg 623ms)", timestamp: new Date(Date.now() - 180000).toISOString() },
    { id: 2, severity: "INFO", message: "Auto-scaler: frontend-app scaled 2 → 3 replicas", timestamp: new Date(Date.now() - 720000).toISOString() },
    { id: 3, severity: "ERROR", message: "payment-gateway: Connection pool exhausted (max: 50)", timestamp: new Date(Date.now() - 480000).toISOString() }
  ]);
});

// ---- LOG ROUTES ----
app.get('/api/logs', (req, res) => {
  // Add a new log entry each time
  const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
  logs.push({
    id: logs.length,
    timestamp: new Date().toISOString(),
    ...msg
  });
  res.json(logs.slice(-50));  // Return last 50 logs
});

// ============================================
// PIPELINE SIMULATION ENGINE
// ============================================
function simulatePipeline(pipeline) {
  const stageDurations = [3000, 4000, 5000, 3000]; // ms per stage
  let currentStage = 0;

  function runStage() {
    if (currentStage >= pipeline.stages.length) {
      pipeline.status = 'success';
      pipeline.duration = '15s (simulated)';
      addLog("INFO", pipeline.name, `Pipeline ${pipeline.id} completed successfully`);
      return;
    }

    pipeline.status = 'running';
    pipeline.stages[currentStage].status = 'running';
    addLog("INFO", pipeline.name, `Stage "${pipeline.stages[currentStage].name}" started`);

    setTimeout(() => {
      pipeline.stages[currentStage].status = 'success';
      pipeline.stages[currentStage].duration = `${(stageDurations[currentStage] / 1000).toFixed(0)}s`;
      addLog("INFO", pipeline.name, `Stage "${pipeline.stages[currentStage].name}" completed`);
      currentStage++;
      runStage();
    }, stageDurations[currentStage]);
  }

  setTimeout(runStage, 1000);
}

function addLog(level, svc, msg) {
  logs.push({
    id: logs.length,
    timestamp: new Date().toISOString(),
    level,
    svc,
    msg
  });
}

// ============================================
// START SERVER
// ============================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║       🚀 DeployFlow Backend API          ║
║══════════════════════════════════════════║
║  Status:  RUNNING                        ║
║  Port:    ${PORT}                            ║
║  Health:  http://localhost:${PORT}/api/health ║
║  Version: 2.4.1                          ║
╚══════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
