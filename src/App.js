import { useState, useEffect } from "react";

const PIPELINES = [
  { id: "PL-001", name: "frontend-app", repo: "github.com/team/frontend", branch: "main", status: "success", duration: "2m 34s", triggered: "2 min ago", stages: ["Build","Test","Dockerize","Deploy"], stageStatus: [2,2,2,2], commit: "a3f8c1d", author: "Sarah K." },
  { id: "PL-002", name: "auth-service", repo: "github.com/team/auth-svc", branch: "main", status: "running", duration: "1m 12s", triggered: "1 min ago", stages: ["Build","Test","Dockerize","Deploy"], stageStatus: [2,2,1,0], commit: "e7b2f90", author: "Raj M." },
  { id: "PL-003", name: "payment-gateway", repo: "github.com/team/payments", branch: "develop", status: "failed", duration: "3m 01s", triggered: "8 min ago", stages: ["Build","Test","Dockerize","Deploy"], stageStatus: [2,2,3,0], commit: "c44d1a2", author: "Alex T." },
  { id: "PL-004", name: "notification-svc", repo: "github.com/team/notif", branch: "main", status: "success", duration: "1m 45s", triggered: "14 min ago", stages: ["Build","Test","Dockerize","Deploy"], stageStatus: [2,2,2,2], commit: "f19e3b7", author: "Maya L." },
  { id: "PL-005", name: "api-gateway", repo: "github.com/team/api-gw", branch: "release/v2", status: "queued", duration: "—", triggered: "just now", stages: ["Build","Test","Dockerize","Deploy"], stageStatus: [0,0,0,0], commit: "b82a0ff", author: "Dev P." },
];

const CONTAINERS = [
  { name: "frontend-app", image: "frontend:3.2.1", cpu: 23, mem: 312, status: "running", port: 3000, replicas: 3 },
  { name: "auth-service", image: "auth:1.8.0", cpu: 45, mem: 480, status: "running", port: 8080, replicas: 2 },
  { name: "payment-gateway", image: "payments:2.1.4", cpu: 67, mem: 720, status: "warning", port: 8443, replicas: 2 },
  { name: "notification-svc", image: "notif:1.3.2", cpu: 12, mem: 198, status: "running", port: 5000, replicas: 1 },
  { name: "api-gateway", image: "apigw:4.0.0", cpu: 38, mem: 410, status: "running", port: 443, replicas: 3 },
  { name: "redis-cache", image: "redis:7.2", cpu: 8, mem: 256, status: "running", port: 6379, replicas: 1 },
  { name: "postgres-db", image: "postgres:16", cpu: 31, mem: 1024, status: "running", port: 5432, replicas: 1 },
];

const genMetrics = () => Array.from({length:30},(_,i)=>({t:i, cpu:20+Math.random()*40+Math.sin(i/4)*10, mem:40+Math.random()*20+Math.cos(i/3)*8, req:80+Math.random()*120+Math.sin(i/5)*30, err:Math.random()*5}));

const LOGS = [
  { ts: "12:04:31", level: "INFO", svc: "auth-service", msg: "JWT token validated for user_8293" },
  { ts: "12:04:30", level: "INFO", svc: "api-gateway", msg: "POST /api/v2/orders → 201 (45ms)" },
  { ts: "12:04:29", level: "WARN", svc: "payment-gateway", msg: "Stripe webhook retry #2 for evt_3fa8" },
  { ts: "12:04:28", level: "ERROR", svc: "payment-gateway", msg: "Connection timeout to payment processor (attempt 3/5)" },
  { ts: "12:04:27", level: "INFO", svc: "frontend-app", msg: "Static assets cache invalidated, CDN purge complete" },
  { ts: "12:04:26", level: "INFO", svc: "notification-svc", msg: "Email queued: order_confirmation → user@example.com" },
  { ts: "12:04:25", level: "DEBUG", svc: "auth-service", msg: "Rate limiter: 142/500 requests for IP 192.168.1.42" },
  { ts: "12:04:24", level: "INFO", svc: "api-gateway", msg: "GET /api/v2/products → 200 (12ms)" },
  { ts: "12:04:23", level: "WARN", svc: "postgres-db", msg: "Slow query detected: SELECT * FROM orders (1.2s)" },
  { ts: "12:04:22", level: "INFO", svc: "redis-cache", msg: "Cache hit ratio: 94.2% (last 5 min)" },
  { ts: "12:04:21", level: "ERROR", svc: "payment-gateway", msg: "Failed to process refund REF-9921: insufficient_funds" },
  { ts: "12:04:20", level: "INFO", svc: "frontend-app", msg: "Health check passed — all 3 replicas healthy" },
];

const statusColor = s => ({success:"#00e676",running:"#40c4ff",failed:"#ff5252",warning:"#ffd740",queued:"#78909c"}[s]||"#aaa");
const stageIcon = s => s===2?"\u2713":s===1?"\u25CF":s===3?"\u2717":"\u25CB";
const stageCol = s => s===2?"#00e676":s===1?"#40c4ff":s===3?"#ff5252":"#546e7a";
const levelCol = l => ({INFO:"#40c4ff",WARN:"#ffd740",ERROR:"#ff5252",DEBUG:"#78909c"}[l]||"#aaa");

function BarChart({data, dataKey, color, h=120, w=320}) {
  const max = Math.max(...data.map(d=>d[dataKey]));
  const bw = w/data.length - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((d,i)=>{const bh=(d[dataKey]/max)*(h-10); return <rect key={i} x={i*(bw+2)} y={h-bh} width={bw} height={bh} fill={color} rx={2} opacity={0.85}/>;})}
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState("pipelines");
  const [metrics] = useState(genMetrics);
  const [tick, setTick] = useState(0);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showDeploy, setShowDeploy] = useState(false);

  useEffect(()=>{const iv=setInterval(()=>setTick(t=>t+1),2000);return()=>clearInterval(iv);},[]);

  const tabs = [
    {id:"pipelines", label:"Pipelines", icon:"\u26A1"},
    {id:"containers", label:"Containers", icon:"\uD83D\uDCE6"},
    {id:"monitoring", label:"Monitoring", icon:"\uD83D\uDCCA"},
    {id:"logs", label:"Logs", icon:"\uD83D\uDCDD"},
  ];

  return (
    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",background:"#0a0e17",color:"#c8d6e5",minHeight:"100vh",fontSize:13}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .card{background:#111827;border:1px solid #1e2a3a;border-radius:10px;padding:16px;transition:all .2s}
        .card:hover{border-color:#2a3a4e;background:#141c2b}
        .tab{padding:10px 18px;cursor:pointer;border:none;background:transparent;color:#546e7a;font-family:inherit;font-size:12px;font-weight:500;border-bottom:2px solid transparent;transition:all .2s;display:flex;align-items:center;gap:6px}
        .tab.active{color:#40c4ff;border-bottom-color:#40c4ff}
        .tab:hover{color:#90caf9}
        .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
        .btn{padding:8px 16px;border:1px solid #1e2a3a;background:#111827;color:#c8d6e5;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;transition:all .2s}
        .btn:hover{background:#1e2a3a;border-color:#40c4ff}
        .btn-primary{background:#0d47a1;border-color:#1565c0;color:#e3f2fd}
        .btn-primary:hover{background:#1565c0}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:#111827;border:1px solid #1e2a3a;border-radius:14px;padding:28px;max-width:560px;width:90%;animation:slideUp .25s ease}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#0d1117",borderBottom:"1px solid #1e2a3a",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#0d47a1,#40c4ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚙</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:"#e3f2fd",letterSpacing:"-.5px"}}>DeployFlow</div>
            <div style={{fontSize:10,color:"#546e7a"}}>CI/CD Automation Platform v2.4.1</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#00e676",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:11,color:"#78909c"}}>All systems operational</span>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,padding:"14px 24px"}}>
        {[
          {label:"Total Builds",val:"1,247",sub:"+23 today",c:"#40c4ff"},
          {label:"Success Rate",val:"94.2%",sub:"↑ 1.3%",c:"#00e676"},
          {label:"Containers",val:"14",sub:"7 services",c:"#7c4dff"},
          {label:"Avg Deploy",val:"2m 18s",sub:"↓ 12s",c:"#ffd740"},
          {label:"Uptime",val:"99.97%",sub:"30 days",c:"#00e676"},
        ].map((s,i)=>(
          <div key={i} className="card" style={{animation:`slideUp .3s ease ${i*.06}s both`}}>
            <div style={{fontSize:9,color:"#546e7a",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{s.label}</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:s.c}}>{s.val}</div>
            <div style={{fontSize:10,color:"#78909c",marginTop:2}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid #1e2a3a",padding:"0 24px",gap:4}}>
        {tabs.map(t=><button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>)}
      </div>

      <div style={{padding:"16px 24px"}}>

        {tab==="pipelines" && (
          <div style={{animation:"slideUp .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#78909c"}}>{PIPELINES.length} pipelines configured</div>
              <button className="btn btn-primary" onClick={()=>setShowDeploy(true)}>+ New Pipeline</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {PIPELINES.map((p,i)=>(
                <div key={p.id} className="card" style={{cursor:"pointer",animation:`slideUp .3s ease ${i*.05}s both`}} onClick={()=>setSelectedPipeline(p)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:statusColor(p.status),flexShrink:0,animation:p.status==="running"?"pulse 1.5s infinite":"none"}}/>
                      <div>
                        <div style={{fontWeight:600,color:"#e3f2fd"}}>{p.name}</div>
                        <div style={{fontSize:11,color:"#546e7a",marginTop:2}}>{p.repo} • {p.branch} • {p.commit}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:16}}>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        {p.stages.map((s,si)=>(
                          <div key={si} style={{display:"flex",alignItems:"center",gap:4}}>
                            <div style={{width:22,height:22,borderRadius:6,background:stageCol(p.stageStatus[si])+"22",border:`1px solid ${stageCol(p.stageStatus[si])}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:stageCol(p.stageStatus[si]),fontWeight:700}}>{stageIcon(p.stageStatus[si])}</div>
                            {si<p.stages.length-1 && <div style={{width:10,height:1,background:"#1e2a3a"}}/>}
                          </div>
                        ))}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span className="badge" style={{background:statusColor(p.status)+"22",color:statusColor(p.status)}}>{p.status}</span>
                        <div style={{fontSize:10,color:"#546e7a",marginTop:4}}>{p.triggered} • {p.duration}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="containers" && (
          <div style={{animation:"slideUp .3s ease"}}>
            <div style={{fontSize:11,color:"#78909c",marginBottom:14}}>Docker containers across 3 nodes</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {CONTAINERS.map((c,i)=>(
                <div key={i} className="card" style={{animation:`slideUp .3s ease ${i*.05}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:600,color:"#e3f2fd",fontSize:13}}>{c.name}</div>
                      <div style={{fontSize:10,color:"#546e7a",marginTop:2}}>{c.image}</div>
                    </div>
                    <span className="badge" style={{background:statusColor(c.status)+"22",color:statusColor(c.status)}}>{c.status}</span>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#78909c",marginBottom:3}}>
                      <span>CPU</span><span>{Math.min(100,c.cpu+((tick*3+i*7)%15)-7).toFixed(0)}%</span>
                    </div>
                    <div style={{height:4,background:"#1e2a3a",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(100,c.cpu+((tick*3+i*7)%15)-7)}%`,background:c.cpu>60?"#ff5252":"#40c4ff",borderRadius:2,transition:"width 1s"}}/>
                    </div>
                  </div>
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#78909c",marginBottom:3}}>
                      <span>Memory</span><span>{c.mem}MB</span>
                    </div>
                    <div style={{height:4,background:"#1e2a3a",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(c.mem/1500)*100}%`,background:"#7c4dff",borderRadius:2}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#546e7a"}}>
                    <span>Port: {c.port}</span><span>Replicas: {c.replicas}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="monitoring" && (
          <div style={{animation:"slideUp .3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {title:"CPU Utilization (%)",key:"cpu",color:"#40c4ff"},
                {title:"Memory Usage (%)",key:"mem",color:"#7c4dff"},
                {title:"Requests / sec",key:"req",color:"#00e676"},
                {title:"Error Rate (%)",key:"err",color:"#ff5252"},
              ].map((m,i)=>(
                <div key={i} className="card" style={{animation:`slideUp .3s ease ${i*.08}s both`}}>
                  <div style={{fontSize:10,color:"#78909c",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{m.title}</div>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:24,fontWeight:700,color:m.color,marginBottom:8}}>
                    {metrics[metrics.length-1][m.key].toFixed(1)}{m.key==="req"?"":"%"}
                  </div>
                  <BarChart data={metrics} dataKey={m.key} color={m.color}/>
                </div>
              ))}
            </div>
            <div className="card" style={{marginTop:14}}>
              <div style={{fontSize:10,color:"#78909c",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Active Alerts</div>
              {[
                {sev:"WARN",msg:"payment-gateway: Response latency > 500ms (avg 623ms)",time:"3 min ago"},
                {sev:"INFO",msg:"Auto-scaler: frontend-app scaled from 2 → 3 replicas",time:"12 min ago"},
                {sev:"ERROR",msg:"payment-gateway: Connection pool exhausted (max: 50)",time:"8 min ago"},
              ].map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderTop:i?"1px solid #1e2a3a":"none",flexWrap:"wrap"}}>
                  <span className="badge" style={{background:levelCol(a.sev)+"22",color:levelCol(a.sev),minWidth:50,justifyContent:"center"}}>{a.sev}</span>
                  <span style={{flex:1,fontSize:12,minWidth:200}}>{a.msg}</span>
                  <span style={{fontSize:10,color:"#546e7a"}}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="logs" && (
          <div style={{animation:"slideUp .3s ease"}}>
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"10px 16px",borderBottom:"1px solid #1e2a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#78909c",textTransform:"uppercase",letterSpacing:1}}>Live Log Stream</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#00e676",animation:"pulse 1s infinite"}}/>
                  <span style={{fontSize:10,color:"#78909c"}}>Streaming</span>
                </div>
              </div>
              <div style={{padding:10,maxHeight:400,overflowY:"auto"}}>
                {LOGS.map((l,i)=>(
                  <div key={i} style={{display:"flex",gap:8,padding:"4px 6px",fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:4,background:i%2===0?"transparent":"#0a0e1799",animation:`slideUp .2s ease ${i*.03}s both`,flexWrap:"wrap"}}>
                    <span style={{color:"#546e7a",minWidth:55}}>{l.ts}</span>
                    <span style={{color:levelCol(l.level),minWidth:40,fontWeight:600}}>{l.level}</span>
                    <span style={{color:"#7c4dff",minWidth:110}}>[{l.svc}]</span>
                    <span style={{color:l.level==="ERROR"?"#ff8a80":"#c8d6e5",flex:1}}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPipeline && (
        <div className="modal-overlay" onClick={()=>setSelectedPipeline(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:"#e3f2fd"}}>{selectedPipeline.name}</div>
                <div style={{fontSize:11,color:"#546e7a",marginTop:4}}>{selectedPipeline.repo} • {selectedPipeline.branch}</div>
              </div>
              <button className="btn" onClick={()=>setSelectedPipeline(null)} style={{padding:"4px 10px",fontSize:16,lineHeight:1}}>✕</button>
            </div>
            <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:20}}>
              {selectedPipeline.stages.map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{padding:"10px 0",borderRadius:8,background:stageCol(selectedPipeline.stageStatus[i])+"18",border:`1px solid ${stageCol(selectedPipeline.stageStatus[i])}44`,marginBottom:4}}>
                    <div style={{fontSize:18,color:stageCol(selectedPipeline.stageStatus[i])}}>{stageIcon(selectedPipeline.stageStatus[i])}</div>
                  </div>
                  <div style={{fontSize:11,color:"#c8d6e5",fontWeight:500}}>{s}</div>
                  <div style={{fontSize:9,color:"#546e7a",marginTop:2}}>
                    {selectedPipeline.stageStatus[i]===2?"Done":selectedPipeline.stageStatus[i]===1?"Running":selectedPipeline.stageStatus[i]===3?"Failed":"Pending"}
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
              {[["Commit",selectedPipeline.commit],["Author",selectedPipeline.author],["Duration",selectedPipeline.duration],["Triggered",selectedPipeline.triggered]].map(([k,v],i)=>(
                <div key={i} style={{padding:"8px 12px",background:"#0a0e17",borderRadius:6}}>
                  <div style={{fontSize:10,color:"#546e7a",marginBottom:2}}>{k}</div>
                  <div style={{color:"#e3f2fd",fontWeight:500}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:"flex",gap:8}}>
              <button className="btn btn-primary" style={{flex:1}}>↻ Re-run Pipeline</button>
              <button className="btn" style={{flex:1}}>View Full Logs</button>
            </div>
          </div>
        </div>
      )}

      {showDeploy && (
        <div className="modal-overlay" onClick={()=>setShowDeploy(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:"#e3f2fd",marginBottom:20}}>Create New Pipeline</div>
            {[["Repository URL","github.com/team/new-service"],["Branch","main"],["Dockerfile Path","./Dockerfile"],["Deploy Target","production"]].map(([label,ph],i)=>(
              <div key={i} style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#78909c",marginBottom:4}}>{label}</div>
                <input placeholder={ph} style={{width:"100%",padding:"8px 12px",background:"#0a0e17",border:"1px solid #1e2a3a",borderRadius:6,color:"#c8d6e5",fontFamily:"inherit",fontSize:12,outline:"none"}}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={()=>setShowDeploy(false)}>Create & Run</button>
              <button className="btn" onClick={()=>setShowDeploy(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}