const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = 'MeetJain23/deployflow';

app.use(cors());
app.use(express.json());

const pipelines = [
  { id:"PL-001", name:"frontend-app", repo:"github.com/team/frontend", branch:"main", status:"success", duration:"2m 34s", triggered:new Date().toISOString(), stages:[{name:"Build",status:"success",duration:"32s"},{name:"Test",status:"success",duration:"48s"},{name:"Dockerize",status:"success",duration:"41s"},{name:"Deploy",status:"success",duration:"33s"}], commit:"a3f8c1d", author:"Sarah K." },
  { id:"PL-002", name:"auth-service", repo:"github.com/team/auth-svc", branch:"main", status:"running", duration:"1m 12s", triggered:new Date().toISOString(), stages:[{name:"Build",status:"success",duration:"28s"},{name:"Test",status:"success",duration:"44s"},{name:"Dockerize",status:"running",duration:"-"},{name:"Deploy",status:"pending",duration:"-"}], commit:"e7b2f90", author:"Raj M." },
  { id:"PL-003", name:"payment-gateway", repo:"github.com/team/payments", branch:"develop", status:"failed", duration:"3m 01s", triggered:new Date().toISOString(), stages:[{name:"Build",status:"success",duration:"35s"},{name:"Test",status:"success",duration:"52s"},{name:"Dockerize",status:"failed",duration:"1m 34s"},{name:"Deploy",status:"pending",duration:"-"}], commit:"c44d1a2", author:"Alex T." },
  { id:"PL-004", name:"notification-svc", repo:"github.com/team/notif", branch:"main", status:"success", duration:"1m 45s", triggered:new Date().toISOString(), stages:[{name:"Build",status:"success",duration:"22s"},{name:"Test",status:"success",duration:"38s"},{name:"Dockerize",status:"success",duration:"25s"},{name:"Deploy",status:"success",duration:"20s"}], commit:"f19e3b7", author:"Maya L." },
  { id:"PL-005", name:"api-gateway", repo:"github.com/team/api-gw", branch:"release/v2", status:"queued", duration:"-", triggered:new Date().toISOString(), stages:[{name:"Build",status:"pending",duration:"-"},{name:"Test",status:"pending",duration:"-"},{name:"Dockerize",status:"pending",duration:"-"},{name:"Deploy",status:"pending",duration:"-"}], commit:"b82a0ff", author:"Dev P." }
];

const containers = [
  { id:"C-001", name:"frontend-app", image:"frontend:3.2.1", status:"running", cpu:23, memory:312, port:3000, replicas:3, uptime:"4d 12h" },
  { id:"C-002", name:"auth-service", image:"auth:1.8.0", status:"running", cpu:45, memory:480, port:8080, replicas:2, uptime:"4d 12h" },
  { id:"C-003", name:"payment-gateway", image:"payments:2.1.4", status:"warning", cpu:67, memory:720, port:8443, replicas:2, uptime:"2d 8h" },
  { id:"C-004", name:"notification-svc", image:"notif:1.3.2", status:"running", cpu:12, memory:198, port:5000, replicas:1, uptime:"4d 12h" },
  { id:"C-005", name:"api-gateway", image:"apigw:4.0.0", status:"running", cpu:38, memory:410, port:443, replicas:3, uptime:"4d 12h" },
  { id:"C-006", name:"redis-cache", image:"redis:7.2", status:"running", cpu:8, memory:256, port:6379, replicas:1, uptime:"10d 3h" },
  { id:"C-007", name:"postgres-db", image:"postgres:16", status:"running", cpu:31, memory:1024, port:5432, replicas:1, uptime:"10d 3h" }
];

const logs = [];
const LOG_MESSAGES = [
  { level:"INFO", svc:"auth-service", msg:"JWT token validated for user_8293" },
  { level:"INFO", svc:"api-gateway", msg:"POST /api/v2/orders -> 201 (45ms)" },
  { level:"WARN", svc:"payment-gateway", msg:"Stripe webhook retry #2 for evt_3fa8" },
  { level:"ERROR", svc:"payment-gateway", msg:"Connection timeout to payment processor" },
  { level:"INFO", svc:"frontend-app", msg:"Static assets cache invalidated" },
  { level:"INFO", svc:"notification-svc", msg:"Email queued: order_confirmation" },
  { level:"DEBUG", svc:"auth-service", msg:"Rate limiter: 142/500 requests" },
  { level:"INFO", svc:"api-gateway", msg:"GET /api/v2/products -> 200 (12ms)" },
  { level:"WARN", svc:"postgres-db", msg:"Slow query detected (1.2s)" },
  { level:"INFO", svc:"redis-cache", msg:"Cache hit ratio: 94.2%" }
];

for (let i = 0; i < 20; i++) {
  const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
  logs.push({ id:i, timestamp:new Date(Date.now()-(20-i)*1000).toISOString(), ...msg });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status:'healthy', service:'deployflow-backend', version:'2.4.1', uptime:process.uptime(), timestamp:new Date().toISOString() });
});

// Stats
app.get('/api/stats', (req, res) => {
  const successCount = pipelines.filter(p => p.status === 'success').length;
  res.json({ totalBuilds:1247, successRate:((successCount/pipelines.length)*100).toFixed(1), activeContainers:containers.reduce((s,c)=>s+c.replicas,0), services:containers.length, avgDeployTime:"2m 18s", uptime:"99.97%" });
});

// Pipelines
app.get('/api/pipelines', (req, res) => res.json(pipelines));

app.get('/api/pipelines/:id', (req, res) => {
  const p = pipelines.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error:'Pipeline not found' });
  res.json(p);
});

app.post('/api/pipelines', async (req, res) => {
  const { name, repo, branch, dockerfilePath, deployTarget } = req.body;
  const np = {
    id:'PL-' + String(pipelines.length+1).padStart(3,'0'),
    name:name||'new-service', repo:repo||'github.com/team/new-service', branch:branch||'main',
    status:'queued', duration:'-', triggered:new Date().toISOString(),
    stages:[{name:"Build",status:"pending",duration:"-"},{name:"Test",status:"pending",duration:"-"},{name:"Dockerize",status:"pending",duration:"-"},{name:"Deploy",status:"pending",duration:"-"}],
    commit:Math.random().toString(36).substring(2,9), author:"User"
  };
  pipelines.push(np);
  simulatePipeline(np);
  try {
    const response = await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/dispatches', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + GITHUB_TOKEN, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'pipeline_trigger', client_payload: { pipeline_name: name || 'new-service' } })
    });
    console.log('GitHub Actions triggered! Status:', response.status);
  } catch(e) { console.log('GitHub trigger failed:', e.message); }
  res.status(201).json(np);
});
// Containers
app.get('/api/containers', (req, res) => {
  const live = containers.map(c => ({
    ...c,
    cpu: Math.min(100, Math.max(5, c.cpu + Math.floor(Math.random()*20)-10)),
    memory: c.memory + Math.floor(Math.random()*50)-25
  }));
  res.json(live);
});

// Metrics
app.get('/api/metrics', (req, res) => {
  const m = { cpu:[], memory:[], requests:[], errors:[] };
  for (let i=0;i<30;i++) {
    const t = new Date(Date.now()-(30-i)*60000).toISOString();
    m.cpu.push({timestamp:t,value:20+Math.random()*40+Math.sin(i/4)*10});
    m.memory.push({timestamp:t,value:40+Math.random()*20+Math.cos(i/3)*8});
    m.requests.push({timestamp:t,value:80+Math.random()*120+Math.sin(i/5)*30});
    m.errors.push({timestamp:t,value:Math.random()*5});
  }
  res.json(m);
});

// Alerts
app.get('/api/alerts', (req, res) => {
  res.json([
    {id:1,severity:"WARN",message:"payment-gateway: Response latency > 500ms (avg 623ms)",timestamp:new Date(Date.now()-180000).toISOString()},
    {id:2,severity:"INFO",message:"Auto-scaler: frontend-app scaled 2 -> 3 replicas",timestamp:new Date(Date.now()-720000).toISOString()},
    {id:3,severity:"ERROR",message:"payment-gateway: Connection pool exhausted (max: 50)",timestamp:new Date(Date.now()-480000).toISOString()}
  ]);
});

// Logs
app.get('/api/logs', (req, res) => {
  const msg = LOG_MESSAGES[Math.floor(Math.random()*LOG_MESSAGES.length)];
  logs.push({ id:logs.length, timestamp:new Date().toISOString(), ...msg });
  res.json(logs.slice(-50));
});

// Pipeline simulation engine
function simulatePipeline(pipeline) {
  const durations = [3000,4000,5000,3000];
  let stage = 0;
  function runStage() {
    if (stage >= pipeline.stages.length) {
      pipeline.status = 'success';
      pipeline.duration = '15s (simulated)';
      addLog("INFO", pipeline.name, "Pipeline " + pipeline.id + " completed successfully");
      return;
    }
    pipeline.status = 'running';
    pipeline.stages[stage].status = 'running';
    addLog("INFO", pipeline.name, 'Stage "' + pipeline.stages[stage].name + '" started');
    setTimeout(() => {
      pipeline.stages[stage].status = 'success';
      pipeline.stages[stage].duration = (durations[stage]/1000) + 's';
      addLog("INFO", pipeline.name, 'Stage "' + pipeline.stages[stage].name + '" completed');
      stage++;
      runStage();
    }, durations[stage]);
  }
  setTimeout(runStage, 1000);
}

function addLog(level, svc, msg) {
  logs.push({ id:logs.length, timestamp:new Date().toISOString(), level, svc, msg });
}

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  DeployFlow Backend API');
  console.log('  Status:  RUNNING');
  console.log('  Port:    ' + PORT);
  console.log('  Health:  http://localhost:' + PORT + '/api/health');
  console.log('  Version: 2.4.1');
  console.log('===========================================');
  console.log('');
});

module.exports = app;