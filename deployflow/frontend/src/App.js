import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || '';

const statusColor = s => ({success:"#00e676",running:"#40c4ff",failed:"#ff5252",warning:"#ffd740",queued:"#78909c",pending:"#546e7a"})[s]||"#aaa";
const levelCol = l => ({INFO:"#40c4ff",WARN:"#ffd740",ERROR:"#ff5252",DEBUG:"#78909c"})[l]||"#aaa";
const stageIcon = s => s==="success"?"\u2713":s==="running"?"\u25CF":s==="failed"?"\u2717":"\u25CB";

function BarChart({data, color}) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d=>d.value));
  const w = 320, h = 120, bw = w/data.length - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((d,i)=>{const bh=(d.value/max)*(h-10); return <rect key={i} x={i*(bw+2)} y={h-bh} width={bw} height={bh} fill={color} rx={2} opacity={0.85}/>;})}
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState("pipelines");
  const [stats, setStats] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [containers, setContainers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [newPipeline, setNewPipeline] = useState({ name:'', repo:'', branch:'main', dockerfilePath:'./Dockerfile', deployTarget:'production' });
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, pipelinesRes, containersRes, metricsRes, alertsRes, logsRes] = await Promise.all([
        fetch(`${API}/api/stats`), fetch(`${API}/api/pipelines`), fetch(`${API}/api/containers`),
        fetch(`${API}/api/metrics`), fetch(`${API}/api/alerts`), fetch(`${API}/api/logs`)
      ]);
      setStats(await statsRes.json());
      setPipelines(await pipelinesRes.json());
      setContainers(await containersRes.json());
      setMetrics(await metricsRes.json());
      setAlerts(await alertsRes.json());
      setLogs(await logsRes.json());
      setBackendStatus('connected');
      setLoading(false);
    } catch(e) {
      setBackendStatus('disconnected');
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 3000); return () => clearInterval(iv); }, [fetchData]);

  const handleCreatePipeline = async () => {
    try {
      const res = await fetch(`${API}/api/pipelines`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(newPipeline)
      });
      if (res.ok) {
        setShowDeploy(false);
        setNewPipeline({ name:'', repo:'', branch:'main', dockerfilePath:'./Dockerfile', deployTarget:'production' });
        fetchData();
      }
    } catch(e) { console.error(e); }
  };

  const handleRerun = async (id) => {
    try {
      await fetch(`${API}/api/pipelines/${id}/rerun`, { method: 'POST' });
      setSelectedPipeline(null);
      fetchData();
    } catch(e) { console.error(e); }
  };

  const tabs = [
    {id:"pipelines", label:"Pipelines", icon:"\u26A1"},
    {id:"containers", label:"Containers", icon:"\uD83D\uDCE6"},
    {id:"monitoring", label:"Monitoring", icon:"\uD83D\uDCCA"},
    {id:"logs", label:"Logs", icon:"\uD83D\uDCDD"},
  ];

  if (loading) return (
    <div style={{fontFamily:"monospace",background:"#0a0e17",color:"#40c4ff",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
      Loading DeployFlow...
    </div>
  );

  return (
    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",background:"#0a0e17",color:"#c8d6e5",minHeight:"100vh",fontSize:13}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .card{background:#111827;border:1px solid #1e2a3a;border-radius:10px;padding:16px;transition:all .2s}
        .card:hover{border-color:#2a3a4e;background:#141c2b}
        .tab{padding:10px 18px;cursor:pointer;border:none;background:transparent;color:#546e7a;font-family:inherit;font-size:12px;font-weight:500;border-bottom:2px solid transparent;transition:all .2s;display:flex;align-items:center;gap:6px}
        .tab.active{color:#40c4ff;border-bottom-color:#40c4ff}.tab:hover{color:#90caf9}
        .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
        .btn{padding:8px 16px;border:1px solid #1e2a3a;background:#111827;color:#c8d6e5;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;transition:all .2s}
        .btn:hover{background:#1e2a3a;border-color:#40c4ff}
        .btn-primary{background:#0d47a1;border-color:#1565c0;color:#e3f2fd}.btn-primary:hover{background:#1565c0}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100}
        .modal{background:#111827;border:1px solid #1e2a3a;border-radius:14px;padding:28px;max-width:560px;width:90%;animation:slideUp .25s ease}
        input{width:100%;padding:8px 12px;background:#0a0e17;border:1px solid #1e2a3a;border-radius:6px;color:#c8d6e5;font-family:inherit;font-size:12px;outline:none}
        input:focus{border-color:#40c4ff}
      `}</style>

      {/* HEADER */}
      <div style={{background:"#0d1117",borderBottom:"1px solid #1e2a3a",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#0d47a1,#40c4ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚙</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:"#e3f2fd"}}>DeployFlow</div>
            <div style={{fontSize:10,color:"#546e7a"}}>CI/CD Automation Platform v2.4.1</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:backendStatus==='connected'?"#00e676":"#ff5252",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:11,color:"#78909c"}}>Backend: {backendStatus}</span>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,padding:"14px 24px"}}>
          {[
            {label:"Total Builds",val:stats.totalBuilds.toLocaleString(),sub:"+23 today",c:"#40c4ff"},
            {label:"Success Rate",val:stats.successRate+"%",sub:"↑ 1.3%",c:"#00e676"},
            {label:"Containers",val:stats.activeContainers,sub:stats.services+" services",c:"#7c4dff"},
            {label:"Avg Deploy",val:stats.avgDeployTime,sub:"↓ 12s",c:"#ffd740"},
            {label:"Uptime",val:stats.uptime,sub:"30 days",c:"#00e676"},
          ].map((s,i)=>(
            <div key={i} className="card" style={{animation:`slideUp .3s ease ${i*.06}s both`}}>
              <div style={{fontSize:9,color:"#546e7a",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{s.label}</div>
              <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700,color:s.c}}>{s.val}</div>
              <div style={{fontSize:10,color:"#78909c",marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid #1e2a3a",padding:"0 24px"}}>
        {tabs.map(t=><button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>)}
      </div>

      <div style={{padding:"16px 24px"}}>

        {/* PIPELINES */}
        {tab==="pipelines" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#78909c"}}>{pipelines.length} pipelines configured</div>
              <button className="btn btn-primary" onClick={()=>setShowDeploy(true)}>+ New Pipeline</button>
            </div>
            {pipelines.map((p,i)=>(
              <div key={p.id} className="card" style={{cursor:"pointer",marginBottom:8,animation:`slideUp .3s ease ${i*.05}s both`}} onClick={()=>setSelectedPipeline(p)}>
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
                          <div style={{width:22,height:22,borderRadius:6,background:statusColor(s.status)+"22",border:`1px solid ${statusColor(s.status)}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:statusColor(s.status),fontWeight:700}}>{stageIcon(s.status)}</div>
                          {si<p.stages.length-1 && <div style={{width:10,height:1,background:"#1e2a3a"}}/>}
                        </div>
                      ))}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <span className="badge" style={{background:statusColor(p.status)+"22",color:statusColor(p.status)}}>{p.status}</span>
                      <div style={{fontSize:10,color:"#546e7a",marginTop:4}}>{p.duration}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTAINERS */}
        {tab==="containers" && (
          <div>
            <div style={{fontSize:11,color:"#78909c",marginBottom:14}}>Docker containers across 3 nodes</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {containers.map((c,i)=>(
                <div key={c.id} className="card" style={{animation:`slideUp .3s ease ${i*.05}s both`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontWeight:600,color:"#e3f2fd",fontSize:13}}>{c.name}</div>
                      <div style={{fontSize:10,color:"#546e7a",marginTop:2}}>{c.image}</div>
                    </div>
                    <span className="badge" style={{background:statusColor(c.status)+"22",color:statusColor(c.status)}}>{c.status}</span>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#78909c",marginBottom:3}}><span>CPU</span><span>{c.cpu}%</span></div>
                    <div style={{height:4,background:"#1e2a3a",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${c.cpu}%`,background:c.cpu>60?"#ff5252":"#40c4ff",borderRadius:2,transition:"width 1s"}}/>
                    </div>
                  </div>
                  <div style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#78909c",marginBottom:3}}><span>Memory</span><span>{c.memory}MB</span></div>
                    <div style={{height:4,background:"#1e2a3a",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(c.memory/1500)*100}%`,background:"#7c4dff",borderRadius:2}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#546e7a"}}>
                    <span>Port: {c.port}</span><span>Replicas: {c.replicas}</span><span>{c.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MONITORING */}
        {tab==="monitoring" && metrics && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {title:"CPU Utilization (%)",data:metrics.cpu,color:"#40c4ff"},
                {title:"Memory Usage (%)",data:metrics.memory,color:"#7c4dff"},
                {title:"Requests / sec",data:metrics.requests,color:"#00e676"},
                {title:"Error Rate (%)",data:metrics.errors,color:"#ff5252"},
              ].map((m,i)=>(
                <div key={i} className="card" style={{animation:`slideUp .3s ease ${i*.08}s both`}}>
                  <div style={{fontSize:10,color:"#78909c",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{m.title}</div>
                  <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:24,fontWeight:700,color:m.color,marginBottom:8}}>
                    {m.data[m.data.length-1].value.toFixed(1)}
                  </div>
                  <BarChart data={m.data} color={m.color}/>
                </div>
              ))}
            </div>
            <div className="card" style={{marginTop:14}}>
              <div style={{fontSize:10,color:"#78909c",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Active Alerts</div>
              {alerts.map((a,i)=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderTop:i?"1px solid #1e2a3a":"none",flexWrap:"wrap"}}>
                  <span className="badge" style={{background:levelCol(a.severity)+"22",color:levelCol(a.severity),minWidth:50,justifyContent:"center"}}>{a.severity}</span>
                  <span style={{flex:1,fontSize:12,minWidth:200}}>{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        {tab==="logs" && (
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:"1px solid #1e2a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:"#78909c",textTransform:"uppercase",letterSpacing:1}}>Live Log Stream (from Backend API)</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#00e676",animation:"pulse 1s infinite"}}/>
                <span style={{fontSize:10,color:"#78909c"}}>Streaming</span>
              </div>
            </div>
            <div style={{padding:10,maxHeight:400,overflowY:"auto"}}>
              {logs.slice().reverse().map((l,i)=>(
                <div key={l.id||i} style={{display:"flex",gap:8,padding:"4px 6px",fontSize:11,borderRadius:4,background:i%2===0?"transparent":"#0a0e1799",flexWrap:"wrap"}}>
                  <span style={{color:"#546e7a",minWidth:70}}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                  <span style={{color:levelCol(l.level),minWidth:40,fontWeight:600}}>{l.level}</span>
                  <span style={{color:"#7c4dff",minWidth:110}}>[{l.svc}]</span>
                  <span style={{color:l.level==="ERROR"?"#ff8a80":"#c8d6e5",flex:1}}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PIPELINE DETAIL MODAL */}
      {selectedPipeline && (
        <div className="modal-overlay" onClick={()=>setSelectedPipeline(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:"#e3f2fd"}}>{selectedPipeline.name}</div>
                <div style={{fontSize:11,color:"#546e7a",marginTop:4}}>{selectedPipeline.repo} • {selectedPipeline.branch}</div>
              </div>
              <button className="btn" onClick={()=>setSelectedPipeline(null)} style={{padding:"4px 10px",fontSize:16}}>✕</button>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:20}}>
              {selectedPipeline.stages.map((s,i)=>(
                <div key={i} style={{flex:1,textAlign:"center"}}>
                  <div style={{padding:"10px 0",borderRadius:8,background:statusColor(s.status)+"18",border:`1px solid ${statusColor(s.status)}44`,marginBottom:4}}>
                    <div style={{fontSize:18,color:statusColor(s.status)}}>{stageIcon(s.status)}</div>
                  </div>
                  <div style={{fontSize:11,color:"#c8d6e5",fontWeight:500}}>{s.name}</div>
                  <div style={{fontSize:9,color:"#546e7a"}}>{s.duration}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
              {[["Commit",selectedPipeline.commit],["Author",selectedPipeline.author],["Duration",selectedPipeline.duration],["Status",selectedPipeline.status]].map(([k,v],i)=>(
                <div key={i} style={{padding:"8px 12px",background:"#0a0e17",borderRadius:6}}>
                  <div style={{fontSize:10,color:"#546e7a",marginBottom:2}}>{k}</div>
                  <div style={{color:"#e3f2fd",fontWeight:500}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,display:"flex",gap:8}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={()=>handleRerun(selectedPipeline.id)}>↻ Re-run Pipeline</button>
              <button className="btn" style={{flex:1}} onClick={()=>{setSelectedPipeline(null);setTab('logs')}}>View Logs</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PIPELINE MODAL */}
      {showDeploy && (
        <div className="modal-overlay" onClick={()=>setShowDeploy(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:700,color:"#e3f2fd",marginBottom:20}}>Create New Pipeline</div>
            {[["Service Name","name","my-new-service"],["Repository URL","repo","github.com/team/service"],["Branch","branch","main"],["Dockerfile Path","dockerfilePath","./Dockerfile"],["Deploy Target","deployTarget","production"]].map(([label,key,ph],i)=>(
              <div key={i} style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#78909c",marginBottom:4}}>{label}</div>
                <input placeholder={ph} value={newPipeline[key]} onChange={e=>setNewPipeline({...newPipeline,[key]:e.target.value})}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-primary" style={{flex:1}} onClick={handleCreatePipeline}>Create & Run Pipeline</button>
              <button className="btn" onClick={()=>setShowDeploy(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
