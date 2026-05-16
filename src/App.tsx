import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://fwktaxbgicooxmqleaho.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3a3RheGJnaWNvb3htcWxlYWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTk3ODYsImV4cCI6MjA5MDEzNTc4Nn0._YNNkQn-jmvFziFAAWQbzxKEkpebQbYBfqg110WdDYo";
const JIRA_BASE = "https://zenone.atlassian.net/browse";
const PASS = "ZenOne2026";

async function loadData() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/roadmap?id=eq.main&select=data`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await res.json();
    return rows?.[0]?.data || null;
  } catch { return null; }
}

async function saveData(data) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/roadmap?id=eq.main`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ data, updated_at: new Date().toISOString() })
    });
  } catch {}
}

const INIT_DATA = { sprints: [], labels: [], stickyNotes: [] };
const SIZE_ORDER = ["XL","L","M","S"];
const SIZE_STYLES = {
  XL:{bg:"#3C3489",text:"#fff",border:"#534AB7"},
  L:{bg:"#085041",text:"#fff",border:"#0F6E56"},
  M:{bg:"#633806",text:"#fff",border:"#854F0B"},
  S:{bg:"#791F1F",text:"#fff",border:"#A32D2D"}
};
const PHASE_CFG = {
  "done":        { light:{bg:"#dcfce7",text:"#166534",border:"#86efac"}, dark:{bg:"#1a3a2a",text:"#4ade80",border:"#166534"}, strike:true },
  "in-progress": { light:{bg:"#fef9c3",text:"#854d0e",border:"#fde047"}, dark:{bg:"#3a2800",text:"#fbbf24",border:"#854d0e"}, strike:false },
  "not-started": { light:{bg:"#f1f0e8",text:"#6b7280",border:"#d1d5db"}, dark:{bg:"#1e1e1e",text:"#6b7280",border:"#374151"}, strike:false }
};
let OWNER_COLORS = {
  Pedro:["#1e3a5f","#60a5fa"], Kirill:["#1a3a2a","#4ade80"], Design:["#3a1a4a","#c084fc"],
  Tanya:["#3a1a2a","#f472b6"], Michael:["#2a2a1a","#facc15"], Delaney:["#1a2a3a","#67e8f9"],
  Tiger:["#2a1a1a","#fca5a5"], Lana:["#1a2a3a","#67e8f9"]
};
const LABEL_COLORS = [
  { id:"green",   bg:"#4a7c59", light:"#d4ead9", border:"#91c4a0" },
  { id:"blue",    bg:"#3d6fa8", light:"#d0e4f7", border:"#8ab8e8" },
  { id:"purple",  bg:"#7059a8", light:"#e5dff7", border:"#b5a8e0" },
  { id:"amber",   bg:"#a07830", light:"#f5e8c8", border:"#d4b878" },
  { id:"red",     bg:"#a05050", light:"#f5d8d8", border:"#d49090" },
  { id:"pink",    bg:"#a0507a", light:"#f5d8ea", border:"#d490b8" },
  { id:"teal",    bg:"#3a8a80", light:"#c8ecea", border:"#80ccc8" },
  { id:"orange",  bg:"#a06038", light:"#f5e0cc", border:"#d4a880" },
  { id:"slate",   bg:"#506880", light:"#d8e4f0", border:"#90aac8" },
  { id:"rose",    bg:"#a05868", light:"#f5d8de", border:"#d498a8" },
  { id:"indigo",  bg:"#4858a8", light:"#d8dcf5", border:"#98a8e0" },
  { id:"lime",    bg:"#5a8038", light:"#ddeec8", border:"#a0cc80" },
  { id:"cyan",    bg:"#2a7890", light:"#c8e8f0", border:"#70bcd0" },
  { id:"fuchsia", bg:"#885098", light:"#f0d8f5", border:"#cc90e0" },
  { id:"brown",   bg:"#7a5040", light:"#ead8d0", border:"#c0988a" },
  { id:"stone",   bg:"#6a6458", light:"#e5e2da", border:"#b0a898" },
];
const STICKY_COLORS = ["#fef08a","#86efac","#93c5fd","#f9a8d4","#fdba74","#c4b5fd"];
const DARK  = { bg:"#0f0f0f",bg2:"#141414",bg3:"#1a1a1a",bg4:"#1f1f1f",bg5:"#242424",border:"#2a2a2a",border2:"#333",border3:"#444",text:"#f0f0f0",text2:"#e0e0e0",text3:"#c0c0c0",text4:"#6b7280",text5:"#555",text6:"#333",inputBg:"#2a2a2a",inputBorder:"#555" };
const LIGHT = { bg:"#f5f5f4",bg2:"#ffffff",bg3:"#fafaf9",bg4:"#f0efed",bg5:"#e8e8e6",border:"#d4d2cc",border2:"#c4c2bc",border3:"#b4b2ac",text:"#1c1c1a",text2:"#2c2c2a",text3:"#4c4c4a",text4:"#6c6c6a",text5:"#9c9c9a",text6:"#bbb",inputBg:"#ffffff",inputBorder:"#b4b2ac" };

let uid = Date.now();
const newId = () => `n${uid++}`;

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [cb]);
}

function OwnerTags({ owners }) {
  return owners.map(o => {
    const [bg, text] = OWNER_COLORS[o] || ["#252525","#9ca3af"];
    return <span key={o} style={{background:bg,color:text,borderRadius:10,padding:"1px 8px",fontSize:10,fontWeight:500,border:`0.5px solid ${text}33`,whiteSpace:"nowrap"}}>{o}</span>;
  });
}

function SizeBadge({ size, onChange, editable }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useClickOutside(ref, () => setOpen(false));
  const s = SIZE_STYLES[size] || SIZE_STYLES.M;
  const badge = (
    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:s.bg,color:s.text,border:`0.5px solid ${s.border}`,borderRadius:4,fontSize:10,fontWeight:700,minWidth:22,height:20,padding:"0 4px",gap:3,cursor:editable?"pointer":"default"}}
      onClick={editable ? e => { e.stopPropagation(); setOpen(o=>!o); } : undefined}>
      {size}{editable && <span style={{fontSize:8,opacity:.7}}>▾</span>}
    </span>
  );
  if (!editable) return badge;
  return (
    <div ref={ref} style={{position:"relative",flexShrink:0}}>
      {badge}
      {open && (
        <div style={{position:"absolute",top:26,left:0,background:"#1f1f1f",border:"0.5px solid #333",borderRadius:8,padding:6,zIndex:999,display:"flex",flexDirection:"column",gap:3,boxShadow:"0 4px 16px rgba(0,0,0,.8)",minWidth:200}}>
          {SIZE_ORDER.map(sz => {
            const st = SIZE_STYLES[sz]; const active = sz===size;
            return (
              <span key={sz} onClick={()=>{ onChange(sz); setOpen(false); }}
                style={{display:"flex",alignItems:"center",gap:8,background:active?"#2a2a2a":st.bg,color:st.text,borderRadius:5,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",border:`0.5px solid ${active?"#555":st.border}`}}>
                <span style={{background:st.bg,borderRadius:3,padding:"1px 5px",fontSize:10,border:`0.5px solid ${st.border}`}}>{sz}</span>
                <span style={{fontSize:10,fontWeight:400,color:"#9ca3af"}}>{sz==="XL"?"Big bet":sz==="L"?"Multi-sprint":sz==="M"?"Single sprint":"Quick win"}</span>
                {active && <span style={{marginLeft:"auto",color:"#4ade80"}}>✓</span>}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InlineEdit({ value, onChange, style={}, placeholder="Edit…", editable=true, T }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const prevValueRef = useRef(value);
  if (!editing && prevValueRef.current !== value) { prevValueRef.current = value; setVal(value); }
  const commit = () => { setEditing(false); prevValueRef.current = val; if (val !== value) onChange(val); };
  if (!editable || !editing) return (
    <span onClick={editable ? e => { e.stopPropagation(); setEditing(true); } : undefined} style={{cursor:editable?"text":"default",...style}}>
      {value || <span style={{opacity:0.3}}>{editable ? placeholder : ""}</span>}
    </span>
  );
  return (
    <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit}
      onKeyDown={e=>{ if(e.key==="Enter")commit(); if(e.key==="Escape")setEditing(false); }}
      style={{background:T?T.inputBg:"#2a2a2a",border:`0.5px solid ${T?T.inputBorder:"#555"}`,borderRadius:4,color:T?T.text:"#f0f0f0",fontSize:"inherit",fontFamily:"inherit",padding:"2px 6px",outline:"none",boxSizing:"border-box",...style}}
      onClick={e=>e.stopPropagation()}/>
  );
}

function OwnersPicker({ owners, onChange, editable, T }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [, setTick] = useState(0);
  const ref = useRef();
  useClickOutside(ref, () => { setOpen(false); setConfirmRemove(null); });
  if (!editable) return (
    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
      {owners.length===0 ? <span style={{fontSize:10,color:T?T.text5:"#555"}}>—</span> : <OwnerTags owners={owners}/>}
    </div>
  );
  const toggle = name => onChange(owners.includes(name) ? owners.filter(o=>o!==name) : [...owners,name]);
  const addCustom = () => {
    const n = custom.trim(); if (!n) return;
    if (!OWNER_COLORS[n]) { const p=[["#1e2a3a","#7dd3fc"],["#2a1a3a","#d8b4fe"],["#1a2a1a","#86efac"],["#2a2a1a","#fde68a"]]; OWNER_COLORS[n]=p[Object.keys(OWNER_COLORS).length%p.length]; }
    if (!owners.includes(n)) onChange([...owners,n]);
    setCustom(""); setTick(t=>t+1);
  };
  const removeFromRoster = name => { delete OWNER_COLORS[name]; onChange(owners.filter(o=>o!==name)); setConfirmRemove(null); setTick(t=>t+1); };
  return (
    <div ref={ref} style={{position:"relative",flexShrink:0}}>
      <div data-trigger onClick={e=>{ e.stopPropagation(); setOpen(o=>!o); }} style={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"center",cursor:"pointer",minWidth:32}}>
        {owners.length===0 ? <span style={{fontSize:10,color:T?T.text5:"#555",padding:"1px 6px",borderRadius:10,border:`0.5px dashed ${T?T.border2:"#333"}`}}>+ owner</span> : <OwnerTags owners={owners}/>}
      </div>
      {open && (
        <div style={{position:"fixed",background:"#1f1f1f",border:"0.5px solid #444",borderRadius:10,padding:8,zIndex:9999,minWidth:180,maxHeight:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:3,boxShadow:"0 8px 24px rgba(0,0,0,.8)"}}
          ref={r=>{ if(r&&ref.current){const b=ref.current.querySelector('[data-trigger]');if(b){const rc=b.getBoundingClientRect();r.style.top=(rc.bottom+6)+"px";r.style.left=Math.max(8,rc.right-180)+"px";}}}}>
          <div style={{fontSize:10,color:"#555",paddingBottom:5,borderBottom:"0.5px solid #2a2a2a"}}>Click to add · ✕ to remove</div>
          {owners.length>0 && <div style={{display:"flex",flexDirection:"column",gap:2,paddingBottom:4,borderBottom:"0.5px solid #222"}}>
            {owners.map(o=>{ const[bg,text]=OWNER_COLORS[o]||["#252525","#9ca3af"]; return(
              <div key={o} style={{display:"flex",alignItems:"center",gap:6,background:"#2a2a2a",borderRadius:6,padding:"4px 8px",border:"0.5px solid #444"}}>
                <span style={{background:bg,color:text,borderRadius:8,padding:"1px 7px",fontSize:10,fontWeight:500,flex:1}}>{o}</span>
                <span onClick={()=>toggle(o)} style={{color:"#ef4444",fontSize:11,cursor:"pointer",fontWeight:600}}>✕</span>
              </div>
            );})}
          </div>}
          {Object.keys(OWNER_COLORS).filter(o=>!owners.includes(o)).map(o=>{ const[bg,text]=OWNER_COLORS[o]; return(
            <div key={o} style={{display:"flex",alignItems:"center",gap:4,borderRadius:6,padding:"3px 6px",border:"0.5px solid transparent"}} onMouseEnter={e=>e.currentTarget.style.background="#252525"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span onClick={()=>toggle(o)} style={{background:bg,color:text,borderRadius:8,padding:"1px 7px",fontSize:10,fontWeight:500,flex:1,cursor:"pointer"}}>{o}</span>
              <span onClick={()=>toggle(o)} style={{color:"#4ade80",fontSize:10,cursor:"pointer",padding:"0 3px"}}>+</span>
              {confirmRemove===o
                ? <span style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:9,color:"#9ca3af"}}>Remove?</span><span onClick={()=>removeFromRoster(o)} style={{color:"#ef4444",fontSize:10,cursor:"pointer",fontWeight:600}}>Yes</span><span onClick={()=>setConfirmRemove(null)} style={{color:"#6b7280",fontSize:10,cursor:"pointer",marginLeft:3}}>No</span></span>
                : <span onClick={e=>{ e.stopPropagation(); setConfirmRemove(o); }} style={{color:"#ef4444",fontSize:11,cursor:"pointer",fontWeight:700}}>✕</span>}
            </div>
          );})}
          <div style={{borderTop:"0.5px solid #2a2a2a",marginTop:4,paddingTop:6,display:"flex",gap:4}}>
            <input placeholder="Add name…" value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter")addCustom(); e.stopPropagation(); }} onClick={e=>e.stopPropagation()} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:4,color:"#e0e0e0",fontSize:10,padding:"4px 6px",outline:"none"}}/>
            <button onClick={addCustom} style={{background:"#2a2a2a",border:"0.5px solid #444",borderRadius:4,color:"#4ade80",fontSize:11,padding:"3px 8px",cursor:"pointer",fontWeight:600}}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

function JiraTag({ ticketId, onChange, editable }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(ticketId||"");
  useEffect(()=>setVal(ticketId||""),[ticketId]);
  const commit = () => { setEditing(false); onChange(val.trim().toUpperCase()); };
  if (editing) return <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{ if(e.key==="Enter")commit(); if(e.key==="Escape"){setEditing(false);setVal(ticketId||"");} }} placeholder="ZEN-123" onClick={e=>e.stopPropagation()} style={{width:80,background:"#2a2a2a",border:"0.5px solid #534AB7",borderRadius:4,color:"#c084fc",fontSize:10,padding:"1px 5px",outline:"none",fontFamily:"system-ui,sans-serif"}}/>;
  if (ticketId) return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,flexShrink:0}}>
      <a href={`${JIRA_BASE}/${ticketId}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{background:"#2a1a4a",color:"#c084fc",borderRadius:4,padding:"1px 6px",fontSize:10,fontWeight:500,border:"0.5px solid #534AB7",textDecoration:"none",whiteSpace:"nowrap"}}>{ticketId} ↗</a>
      {editable && <span onClick={e=>{ e.stopPropagation(); onChange(""); }} style={{color:"#555",fontSize:10,cursor:"pointer"}}>✕</span>}
    </span>
  );
  if (!editable) return null;
  return <span onClick={e=>{ e.stopPropagation(); setEditing(true); }} style={{color:"#666",fontSize:10,cursor:"pointer",whiteSpace:"nowrap",padding:"1px 4px",borderRadius:4,border:"0.5px dashed #555"}}>+ Jira</span>;
}

function LabelPicker({ labelId, onChange, labels, editable }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useClickOutside(ref, () => setOpen(false));
  const current = labels.find(l=>l.id===labelId);
  const lc = current ? LABEL_COLORS.find(c=>c.id===current.colorId) : null;
  if (!editable && !current) return null;
  if (!editable && current) return <span style={{width:10,height:10,borderRadius:"50%",background:lc?lc.bg:"#888",flexShrink:0,display:"inline-block"}} title={current.name}/>;
  return (
    <div ref={ref} style={{position:"relative",flexShrink:0}}>
      <span onClick={e=>{ e.stopPropagation(); setOpen(o=>!o); }} title="Assign label"
        style={{width:12,height:12,borderRadius:"50%",background:lc?lc.bg:"#444",border:`1.5px solid ${lc?lc.bg:"#666"}`,cursor:"pointer",display:"inline-block",flexShrink:0}}/>
      {open && (
        <div style={{position:"fixed",background:"#1f1f1f",border:"0.5px solid #444",borderRadius:10,padding:8,zIndex:9999,minWidth:160,display:"flex",flexDirection:"column",gap:3,boxShadow:"0 8px 24px rgba(0,0,0,.8)"}}
          ref={r=>{ if(r&&ref.current){const rc=ref.current.getBoundingClientRect();r.style.top=(rc.bottom+6)+"px";r.style.left=rc.left+"px";}}}>
          <div style={{fontSize:10,color:"#555",paddingBottom:5,borderBottom:"0.5px solid #2a2a2a"}}>Assign label</div>
          {labelId && <div onClick={()=>{ onChange(null); setOpen(false); }} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",borderRadius:6,cursor:"pointer",fontSize:11,color:"#6b7280"}} onMouseEnter={e=>e.currentTarget.style.background="#252525"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕ Remove label</div>}
          {labels.map(l=>{ const lc=LABEL_COLORS.find(c=>c.id===l.colorId)||LABEL_COLORS[0]; return(
            <div key={l.id} onClick={()=>{ onChange(l.id); setOpen(false); }} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",borderRadius:6,cursor:"pointer",background:labelId===l.id?"#2a2a2a":"transparent"}} onMouseEnter={e=>e.currentTarget.style.background="#252525"} onMouseLeave={e=>{ if(labelId!==l.id)e.currentTarget.style.background="transparent"; }}>
              <span style={{width:12,height:12,borderRadius:"50%",background:lc.bg,flexShrink:0}}/>
              <span style={{fontSize:11,color:"#e0e0e0"}}>{l.name}</span>
              {labelId===l.id && <span style={{marginLeft:"auto",color:"#4ade80",fontSize:10}}>✓</span>}
            </div>
          );})}
          {labels.length===0 && <div style={{fontSize:11,color:"#555",padding:"4px 6px"}}>No labels yet — add one above</div>}
        </div>
      )}
    </div>
  );
}

function LabelNameEdit({ labelId, value, onChange, editable, color, T }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const prevId = useRef(labelId);
  if (prevId.current !== labelId) { prevId.current = labelId; setEditing(false); setVal(value); }
  const commit = () => { setEditing(false); if (val !== value) onChange(val); };
  if (!editable || !editing) return (
    <span onClick={editable ? e => { e.stopPropagation(); setEditing(true); } : undefined}
      style={{fontSize:11,fontWeight:500,color,minWidth:30,maxWidth:120,cursor:editable?"text":"default"}}>
      {value}
    </span>
  );
  return (
    <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit}
      onKeyDown={e=>{ if(e.key==="Enter")commit(); if(e.key==="Escape"){setEditing(false);setVal(value);} e.stopPropagation(); }}
      onClick={e=>e.stopPropagation()}
      style={{background:T.inputBg,border:`0.5px solid ${T.inputBorder}`,borderRadius:4,color:T.text,fontSize:11,fontFamily:"inherit",padding:"1px 5px",outline:"none",width:90}}/>
  );
}

function LabelChip({ l, onUpdate, onDelete, editable, darkMode, T }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [colorPickOpen, setColorPickOpen] = useState(false);
  const ref = useRef();
  useClickOutside(ref, () => { setConfirmDel(false); setColorPickOpen(false); });
  const lc = LABEL_COLORS.find(c=>c.id===l.colorId) || LABEL_COLORS[0];
  return (
    <div ref={ref} style={{display:"flex",alignItems:"center",gap:4,background:darkMode?lc.bg:lc.light,border:`1.5px solid ${lc.bg}`,borderRadius:8,padding:"3px 8px 3px 6px",position:"relative"}}>
      {editable && (
        <div style={{position:"relative"}}>
          <span onClick={e=>{ e.stopPropagation(); setColorPickOpen(o=>!o); }}
            style={{width:10,height:10,borderRadius:"50%",background:lc.bg,border:"1.5px solid rgba(255,255,255,0.5)",cursor:"pointer",display:"inline-block",flexShrink:0}}/>
          {colorPickOpen && (
            <div style={{position:"fixed",background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:8,zIndex:10000,display:"flex",gap:6,flexWrap:"wrap",width:176,boxShadow:"0 8px 24px rgba(0,0,0,.8)"}}
              ref={r=>{ if(r&&ref.current){const rc=ref.current.getBoundingClientRect();r.style.top=(rc.bottom+6)+"px";r.style.left=rc.left+"px";}}}>
              {LABEL_COLORS.map(c=>(
                <span key={c.id} onClick={()=>{ onUpdate(l.id,{colorId:c.id}); setColorPickOpen(false); }}
                  style={{width:20,height:20,borderRadius:"50%",background:c.bg,cursor:"pointer",border:l.colorId===c.id?"3px solid white":"2px solid transparent",boxSizing:"border-box"}}/>
              ))}
            </div>
          )}
        </div>
      )}
      {!editable && <span style={{width:10,height:10,borderRadius:"50%",background:lc.bg,display:"inline-block",flexShrink:0}}/>}
      <LabelNameEdit key={l.id} labelId={l.id} value={l.name} onChange={v=>onUpdate(l.id,{name:v})} editable={editable} color={darkMode?"#fff":lc.bg} T={T}/>
      {editable && <span onClick={()=>setConfirmDel(d=>!d)} style={{fontSize:10,color:darkMode?"rgba(255,255,255,0.5)":lc.bg,cursor:"pointer",marginLeft:2,opacity:.7}}>✕</span>}
      {confirmDel && (
        <div style={{position:"absolute",top:28,left:0,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:120,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
          <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete label?</span>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{ onDelete(l.id); setConfirmDel(false); }} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
            <button onClick={()=>setConfirmDel(false)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelBar({ labels, onAdd, onUpdate, onDelete, editable, darkMode, T }) {
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:1000,background:darkMode?"rgba(15,15,15,0.95)":"rgba(245,245,244,0.95)",backdropFilter:"blur(8px)",borderBottom:`0.5px solid ${T.border}`,padding:"8px 16px",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:10,fontWeight:500,color:T.text4,whiteSpace:"nowrap"}}>Labels:</span>
      {labels.map(l=><LabelChip key={l.id} l={l} onUpdate={onUpdate} onDelete={onDelete} editable={editable} darkMode={darkMode} T={T}/>)}
      {editable && <button onClick={onAdd} style={{fontSize:11,padding:"3px 10px",borderRadius:8,border:`0.5px dashed ${T.border2}`,background:"transparent",color:T.text5,cursor:"pointer"}}>+ Add label</button>}
    </div>
  );
}

function StickyNotes({ notes, onAdd, onUpdate, onDelete, editable, darkMode, T }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{position:"fixed",bottom:16,right:16,zIndex:2000,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
      <button onClick={()=>setCollapsed(c=>!c)} style={{background:darkMode?"#1f1f1f":"#fff",border:`0.5px solid ${T.border2}`,borderRadius:20,padding:"4px 12px",fontSize:11,color:T.text4,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.3)",display:"flex",alignItems:"center",gap:6}}>
        📝 {collapsed?`Notes (${notes.length})`:"Notes ▾"}
      </button>
      {!collapsed && (
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",maxHeight:"60vh",overflowY:"auto"}}>
          {notes.map(note=><StickyNote key={note.id} note={note} onUpdate={onUpdate} onDelete={onDelete} editable={editable} darkMode={darkMode} T={T}/>)}
          {editable && <button onClick={onAdd} style={{background:"transparent",border:`0.5px dashed ${T.border2}`,borderRadius:8,color:T.text5,fontSize:11,padding:"5px 14px",cursor:"pointer"}}>+ Add note</button>}
          {notes.length===0&&!editable&&<div style={{fontSize:11,color:T.text5,padding:"4px 8px"}}>No notes yet</div>}
        </div>
      )}
    </div>
  );
}

function StickyNote({ note, onUpdate, onDelete, editable }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const ref = useRef();
  useClickOutside(ref, ()=>{ setConfirmDel(false); setColorOpen(false); });
  const bg = note.color||STICKY_COLORS[0];
  return (
    <div ref={ref} style={{background:bg,borderRadius:8,padding:"8px 10px",width:200,boxShadow:"0 2px 8px rgba(0,0,0,.25)",position:"relative",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        {editable && (
          <div style={{position:"relative"}}>
            <span onClick={()=>setColorOpen(o=>!o)} style={{width:12,height:12,borderRadius:"50%",background:bg,border:"1.5px solid rgba(0,0,0,0.2)",display:"inline-block",cursor:"pointer"}}/>
            {colorOpen && (
              <div style={{position:"absolute",bottom:20,left:0,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:8,display:"flex",gap:5,flexWrap:"wrap",width:126,zIndex:100}}>
                {STICKY_COLORS.map(c=><span key={c} onClick={()=>{ onUpdate(note.id,{color:c}); setColorOpen(false); }} style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:note.color===c?"2px solid #fff":"2px solid transparent",boxSizing:"border-box"}}/>)}
              </div>
            )}
          </div>
        )}
        <div style={{display:"flex",gap:4,alignItems:"center",marginLeft:"auto"}}>
          {editable&&!confirmDel&&<span onClick={()=>setConfirmDel(true)} style={{fontSize:10,color:"rgba(0,0,0,0.35)",cursor:"pointer"}}>✕</span>}
          {confirmDel&&(
            <span style={{display:"flex",gap:4,alignItems:"center"}}>
              <span style={{fontSize:10,color:"rgba(0,0,0,0.6)"}}>Delete?</span>
              <span onClick={()=>onDelete(note.id)} style={{fontSize:10,color:"#dc2626",cursor:"pointer",fontWeight:600}}>Yes</span>
              <span onClick={()=>setConfirmDel(false)} style={{fontSize:10,color:"rgba(0,0,0,0.4)",cursor:"pointer"}}>No</span>
            </span>
          )}
        </div>
      </div>
      {editable
        ? <textarea value={note.text} onChange={e=>onUpdate(note.id,{text:e.target.value})} placeholder="Write a note…" rows={3} style={{width:"100%",background:"transparent",border:"none",outline:"none",resize:"vertical",fontSize:12,color:"rgba(0,0,0,0.75)",fontFamily:"system-ui,sans-serif",lineHeight:1.5,padding:0,boxSizing:"border-box"}}/>
        : <div style={{fontSize:12,color:"rgba(0,0,0,0.75)",lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{note.text||<span style={{opacity:.4}}>Empty note</span>}</div>
      }
    </div>
  );
}

function DropIndicator({ horizontal }) {
  return horizontal
    ? <div style={{width:3,background:"#4ade80",borderRadius:2,alignSelf:"stretch",flexShrink:0}}/>
    : <div style={{height:3,background:"#4ade80",borderRadius:2,margin:"2px 0"}}/>;
}

function TaskTextarea({ value, onCommit, T }) {
  const [local, setLocal] = useState(value);
  const taRef = useRef();
  useEffect(()=>setLocal(value),[value]);
  const resize = el => { if(el){ el.style.height="auto"; el.style.height=el.scrollHeight+"px"; } };
  useEffect(()=>resize(taRef.current),[local]);
  return (
    <textarea ref={r=>{ taRef.current=r; resize(r); }} value={local}
      onChange={e=>{ setLocal(e.target.value); resize(e.target); }}
      onBlur={()=>{ if(local!==value) onCommit(local); }}
      onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); onCommit(local); taRef.current?.blur(); } e.stopPropagation(); }}
      placeholder="Task description" rows={1}
      style={{flex:1,fontSize:11,color:T.text3,lineHeight:1.5,background:"transparent",border:"none",outline:"none",resize:"none",overflow:"hidden",minHeight:18,fontFamily:"system-ui,sans-serif",padding:0,textAlign:"left"}}/>
  );
}

// Ghost card shown while dragging
function GhostCard({ feature, pos, T, darkMode, labels }) {
  if (!feature) return null;
  const cardLabel = labels.find(l=>l.id===feature.labelId);
  const cardLc = cardLabel ? LABEL_COLORS.find(c=>c.id===cardLabel.colorId)||LABEL_COLORS[0] : null;
  const headerBg = cardLc ? (darkMode ? `rgba(${parseInt(cardLc.bg.slice(1,3),16)},${parseInt(cardLc.bg.slice(3,5),16)},${parseInt(cardLc.bg.slice(5,7),16)},0.22)` : cardLc.light) : T.bg4;
  const engState = feature.phases?.eng;
  const shadow = engState==="done" ? "-3px 0 0 0 #4ade80,3px 0 0 0 #4ade80" : engState==="in-progress" ? "-3px 0 0 0 #fbbf24,3px 0 0 0 #fbbf24" : "0 4px 20px rgba(0,0,0,.5)";
  return (
    <div style={{position:"fixed",left:pos.x,top:pos.y,width:260,pointerEvents:"none",zIndex:9000,opacity:0.92,transform:"rotate(1.5deg)",boxShadow:shadow,background:T.bg3,border:`0.5px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{background:headerBg,padding:"9px 10px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:SIZE_STYLES[feature.size]?.bg||"#333",color:"#fff",borderRadius:4,fontSize:10,fontWeight:700,minWidth:22,height:20,padding:"0 4px"}}>{feature.size}</span>
        <span style={{fontSize:13,fontWeight:600,color:T.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{feature.name}</span>
      </div>
    </div>
  );
}

function FeatureCard({ feature, onUpdate, onDelete, isDragging, dropPosition, editable, isPublic, T, darkMode, labels, onDragHandleMouseDown }) {
  const storageKey = `collapsed_${feature.id}`;
  const [collapsed, setCollapsed] = useState(()=>{ try{ return localStorage.getItem(storageKey)==="true"; }catch{ return false; } });
  const toggleCollapsed = ()=>{ const next=!collapsed; setCollapsed(next); try{localStorage.setItem(storageKey,String(next));}catch{}; };
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmTask, setConfirmTask] = useState(null);
  const delRef = useRef();
  useClickOutside(delRef, ()=>setConfirmDel(false));

  const featureRef = useRef(feature);
  useEffect(()=>{ featureRef.current=feature; },[feature]);

  const cyclePhase = useCallback(key=>{
    const f=featureRef.current; const o=["not-started","in-progress","done"];
    onUpdate(f.id,{phases:{...f.phases,[key]:o[(o.indexOf(f.phases[key])+1)%o.length]}});
  },[onUpdate]);

  const updateTask = useCallback((tid,ch)=>{
    const f=featureRef.current;
    onUpdate(f.id,{tasks:f.tasks.map(t=>t.id===tid?{...t,...ch}:t)});
  },[onUpdate]);

  const addTask = useCallback(()=>{
    const f=featureRef.current;
    onUpdate(f.id,{tasks:[...f.tasks,{id:newId(),name:"",owners:[],done:false,jiraId:"",labelId:null}]});
  },[onUpdate]);

  const deleteTask = useCallback(tid=>{
    const f=featureRef.current;
    onUpdate(f.id,{tasks:f.tasks.filter(t=>t.id!==tid)});
  },[onUpdate]);

  const engState = feature.phases.eng;
  const cardBoxShadow = engState==="done"
    ? "-3px 0 0 0 #4ade80,3px 0 0 0 #4ade80"
    : engState==="in-progress"
    ? "-3px 0 0 0 #fbbf24,3px 0 0 0 #fbbf24"
    : darkMode ? "0 1px 3px rgba(0,0,0,.4)" : "0 1px 4px rgba(0,0,0,.08)";

  const cardLabel = labels.find(l=>l.id===feature.labelId);
  const cardLc = cardLabel ? LABEL_COLORS.find(c=>c.id===cardLabel.colorId)||LABEL_COLORS[0] : null;
  const headerBg = cardLc
    ? darkMode ? `rgba(${parseInt(cardLc.bg.slice(1,3),16)},${parseInt(cardLc.bg.slice(3,5),16)},${parseInt(cardLc.bg.slice(5,7),16)},0.22)` : cardLc.light
    : T.bg4;

  return (
    <div data-feature-id={feature.id} style={{marginBottom:8}}>
      {dropPosition==="before" && <DropIndicator/>}
      <div style={{background:T.bg3,border:`0.5px solid ${T.border}`,borderRadius:10,overflow:"hidden",opacity:isDragging?0.25:1,boxShadow:cardBoxShadow,transition:"opacity .15s"}}>
        <div style={{background:headerBg,padding:"9px 10px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
            {editable && (
              <span
                onMouseDown={e=>{ e.stopPropagation(); onDragHandleMouseDown(e, feature.id); }}
                style={{color:T.text5,fontSize:13,cursor:"grab",flexShrink:0,userSelect:"none",marginTop:2,padding:"0 2px"}}>⠿</span>
            )}
            <SizeBadge size={feature.size} onChange={v=>onUpdate(feature.id,{size:v})} editable={editable}/>
            <LabelPicker labelId={feature.labelId||null} onChange={v=>onUpdate(feature.id,{labelId:v})} labels={labels} editable={editable&&!isPublic}/>
            <InlineEdit value={feature.name} onChange={v=>onUpdate(feature.id,{name:v})} editable={editable} T={T} style={{flex:1,minWidth:0,fontSize:13,fontWeight:600,color:T.text,lineHeight:1.4,wordBreak:"break-word",whiteSpace:"normal"}}/>
            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,marginTop:2}}>
              <span onClick={toggleCollapsed} style={{fontSize:10,color:T.text5,cursor:"pointer",padding:"0 2px"}}>{collapsed?"▸":"▾"}</span>
              {editable && (
                <div ref={delRef} style={{position:"relative"}}>
                  <span onClick={()=>setConfirmDel(true)} style={{fontSize:10,color:T.text5,cursor:"pointer",padding:"0 2px"}}>✕</span>
                  {confirmDel && (
                    <div style={{position:"absolute",top:0,right:24,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:110,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
                      <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete?</span>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>onDelete(feature.id)} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
                        <button onClick={()=>setConfirmDel(false)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5,paddingLeft:editable?22:0}}>
            <span style={{fontSize:10,color:T.text4}}>Owner:</span>
            <OwnersPicker owners={feature.owners||[]} onChange={v=>onUpdate(feature.id,{owners:v})} editable={editable} T={T}/>
          </div>
        </div>
        {!collapsed && (
          <div style={{padding:"8px 10px 10px"}}>
            <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
              {[["product","Product"],["design","Design"],["eng","Eng"]].map(([key,lbl])=>{
                const cfg=PHASE_CFG[feature.phases[key]]; const c=darkMode?cfg.dark:cfg.light;
                return <span key={key} onClick={!isPublic?()=>cyclePhase(key):undefined} style={{display:"inline-flex",alignItems:"center",background:c.bg,color:c.text,border:`0.5px solid ${c.border}`,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:500,textDecoration:cfg.strike?"line-through":"none",cursor:isPublic?"default":"pointer",userSelect:"none",whiteSpace:"nowrap"}}>{lbl}</span>;
              })}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:6}}>
              {(feature.tasks||[]).map(task=>(
                <div key={task.id} style={{display:"flex",alignItems:"flex-start",gap:6,background:T.bg5,borderRadius:6,padding:"5px 8px",border:`0.5px solid ${task.done?"#166534":T.border}`,textAlign:"left"}}>
                  <div onClick={!isPublic?()=>updateTask(task.id,{done:!task.done}):undefined} style={{width:14,height:14,borderRadius:3,border:`0.5px solid ${task.done?"#166534":T.border3}`,background:task.done?"#1a3a2a":"transparent",flexShrink:0,marginTop:3,cursor:isPublic?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {task.done && <span style={{color:"#4ade80",fontSize:10,lineHeight:1}}>✓</span>}
                  </div>
                  {editable&&!task.done
                    ? <TaskTextarea value={task.name} onCommit={v=>updateTask(task.id,{name:v})} T={T}/>
                    : <span style={{flex:1,fontSize:11,color:task.done?T.text4:T.text3,lineHeight:1.5,textDecoration:task.done?"line-through":"none",opacity:task.done?0.6:1,textAlign:"left",wordBreak:"break-word",whiteSpace:"normal"}}>{task.name||<span style={{opacity:.3}}>Task description</span>}</span>
                  }
                  <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,marginTop:1}}>
                    <JiraTag ticketId={task.jiraId} onChange={v=>updateTask(task.id,{jiraId:v})} editable={editable}/>
                    <OwnersPicker owners={task.owners||[]} onChange={v=>updateTask(task.id,{owners:v})} editable={editable} T={T}/>
                    {editable && (
                      <div style={{position:"relative",flexShrink:0}}>
                        <span onClick={()=>setConfirmTask(task.id)} style={{fontSize:10,color:T.text6,cursor:"pointer"}}>✕</span>
                        {confirmTask===task.id && (
                          <div style={{position:"absolute",top:0,right:18,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:110,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
                            <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete task?</span>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>{ deleteTask(task.id); setConfirmTask(null); }} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
                              <button onClick={()=>setConfirmTask(null)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {editable && <button onClick={addTask} style={{background:"transparent",border:`0.5px dashed ${T.border2}`,borderRadius:6,color:T.text5,fontSize:10,padding:"4px 8px",cursor:"pointer",textAlign:"left"}}>+ Add task</button>}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",paddingTop:4,borderTop:`0.5px solid ${T.border}`}}>
              {editable ? (
                <>
                  <span style={{fontSize:10,color:T.text4}}>EST:</span>
                  <input type="number" min="0" value={feature.estNum||""} onChange={e=>onUpdate(feature.id,{estNum:e.target.value})} placeholder="–" style={{width:36,background:T.inputBg,border:`0.5px solid ${T.border2}`,borderRadius:4,color:T.text4,fontSize:10,padding:"2px 4px",outline:"none",textAlign:"center"}}/>
                  <select value={feature.estUnit||"days"} onChange={e=>onUpdate(feature.id,{estUnit:e.target.value})} style={{background:T.inputBg,border:`0.5px solid ${T.border2}`,borderRadius:4,color:T.text4,fontSize:10,padding:"2px 4px",outline:"none",cursor:"pointer"}}>
                    <option value="days">day(s)</option>
                    <option value="weeks">week(s)</option>
                  </select>
                  <InlineEdit value={feature.note||""} onChange={v=>onUpdate(feature.id,{note:v})} editable T={T} placeholder="+ add note" style={{fontSize:10,color:T.text4,fontStyle:"italic"}}/>
                </>
              ) : (
                <>
                  {feature.estNum && <span style={{fontSize:10,color:T.text4}}>EST: {feature.estNum} {feature.estUnit}</span>}
                  {feature.note && <span style={{fontSize:10,color:T.text4,fontStyle:"italic"}}>{feature.note}</span>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {dropPosition==="after" && <DropIndicator/>}
    </div>
  );
}

function SprintCol({ sprint, onUpdateFeature, onDeleteFeature, onAddFeature, onUpdateSprint, onDeleteSprint, draggingId, dropTarget, editable, isSprintDragging, colWidth, isPublic, isSprintDropTarget, sprintDropSide, T, darkMode, labels, onDragHandleMouseDown, onSprintDragHandleMouseDown }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const delRef = useRef();
  useClickOutside(delRef, ()=>setConfirmDel(false));

  const borderStyle = isSprintDropTarget&&sprintDropSide==="left"
    ? {borderLeft:"3px solid #4ade80",borderRight:`0.5px solid ${T.border}`,borderTop:`0.5px solid ${T.border}`,borderBottom:`0.5px solid ${T.border}`}
    : isSprintDropTarget&&sprintDropSide==="right"
    ? {borderRight:"3px solid #4ade80",borderLeft:`0.5px solid ${T.border}`,borderTop:`0.5px solid ${T.border}`,borderBottom:`0.5px solid ${T.border}`}
    : {border:`0.5px solid ${isSprintDragging?"#534AB7":T.border}`};

  return (
    <div data-sprint-id={sprint.id}
      style={{flexShrink:0,width:colWidth,background:T.bg2,borderRadius:12,padding:12,boxSizing:"border-box",opacity:isSprintDragging?0.4:1,transition:"opacity .15s, width .1s",...borderStyle}}>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
          {editable && (
            <span onMouseDown={e=>{ e.stopPropagation(); onSprintDragHandleMouseDown(e, sprint.id); }}
              style={{color:T.text5,fontSize:13,cursor:"grab",flexShrink:0,userSelect:"none",marginTop:2,padding:"0 2px"}}>⠿</span>
          )}
          <div style={{flex:1}}>
            <InlineEdit value={sprint.label} onChange={v=>onUpdateSprint(sprint.id,{label:v})} editable={editable} T={T} style={{fontSize:13,fontWeight:700,color:T.text2,display:"block"}}/>
            <InlineEdit value={sprint.dates} onChange={v=>onUpdateSprint(sprint.id,{dates:v})} editable={editable} T={T} placeholder="e.g. Feb 2–13" style={{fontSize:11,color:T.text5,marginTop:1,display:"block"}}/>
          </div>
          {editable && (
            <div ref={delRef} style={{position:"relative",flexShrink:0,marginTop:2}}>
              <span onClick={()=>setConfirmDel(true)} style={{fontSize:10,color:T.text6,cursor:"pointer",padding:"2px 4px"}}>✕</span>
              {confirmDel && (
                <div style={{position:"absolute",top:0,right:20,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:130,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
                  <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete sprint?</span>
                  <span style={{fontSize:10,color:"#6b7280"}}>All features will be deleted.</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>onDeleteSprint(sprint.id)} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setConfirmDel(false)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {dropTarget?.sprintId===sprint.id && !dropTarget?.featureId && editable && <DropIndicator/>}
      {(sprint.features||[]).map(f=>{
        const pos = editable&&dropTarget?.sprintId===sprint.id&&dropTarget?.featureId===f.id ? dropTarget.position : null;
        return <FeatureCard key={f.id} feature={f} onUpdate={onUpdateFeature} onDelete={onDeleteFeature} isDragging={draggingId===f.id} dropPosition={pos} editable={editable} isPublic={isPublic} T={T} darkMode={darkMode} labels={labels} onDragHandleMouseDown={onDragHandleMouseDown}/>;
      })}
      {editable && <button onClick={()=>onAddFeature(sprint.id)} style={{width:"100%",background:"transparent",border:`0.5px dashed ${T.border}`,borderRadius:8,color:T.text5,fontSize:11,padding:"7px",cursor:"pointer",marginTop:4}}>+ New feature</button>}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [colWidth, setColWidth] = useState(()=>{ try{ return Number(localStorage.getItem("colWidth"))||280; }catch{ return 280; } });
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(()=>{ try{ return localStorage.getItem("darkMode")!=="false"; }catch{ return true; } });
  const [authed, setAuthed] = useState(()=>{ try{ return localStorage.getItem("rm_auth")==="1"; }catch{ return false; } });
  const [passInput, setPassInput] = useState("");
  const [passErr, setPassErr] = useState(false);

  // Drag state (all mouse-based now)
  const [draggingId, setDraggingId] = useState(null);       // feature id being dragged
  const [draggingSprintId, setDraggingSprintId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);        // {sprintId, featureId, position}
  const [sprintDropTarget, setSprintDropTarget] = useState(null); // {sprintId, side}
  const [ghostPos, setGhostPos] = useState({x:0,y:0});
  const dragState = useRef(null); // live drag info without re-renders

  const saveTimer = useRef(null);
  const history = useRef([]);
  const boardRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({x:0,y:0,scrollX:0,scrollY:0});
  const scrollRaf = useRef(null);

  const T = darkMode ? DARK : LIGHT;
  const isPublic = new URLSearchParams(window.location.search).get("view")==="public";
  const editable = editMode&&filter==="all"&&!isPublic;

  const setColWidthPersist = w => { setColWidth(w); try{ localStorage.setItem("colWidth",String(w)); }catch{}; };
  const toggleDark = ()=>setDarkMode(d=>{ const next=!d; try{localStorage.setItem("darkMode",String(next));}catch{} return next; });

  const submitPass = () => {
    if (passInput===PASS) { setAuthed(true); try{ localStorage.setItem("rm_auth","1"); }catch{}; }
    else { setPassErr(true); setPassInput(""); setTimeout(()=>setPassErr(false),1500); }
  };

  useEffect(()=>{
    const bg=darkMode?DARK.bg:LIGHT.bg;
    document.body.style.background=bg; document.documentElement.style.background=bg;
  },[darkMode]);

  useEffect(()=>{
    loadData().then(remote=>{
      if(remote&&remote.sprints&&remote.sprints.length>0){
        const seenIds=new Set();
        const fixed={...remote,labels:remote.labels||[],stickyNotes:remote.stickyNotes||[],sprints:remote.sprints.map(s=>({...s,features:s.features.map(f=>{
          const ff=seenIds.has(f.id)?{...f,id:newId()}:f; seenIds.add(ff.id);
          const tasks=(ff.tasks||[]).map(t=>{ if(seenIds.has(t.id)){const nt={...t,id:newId()};seenIds.add(nt.id);return nt;} seenIds.add(t.id); return t; });
          return {...ff,tasks};
        })}))}; setData(fixed);
      } else setData(INIT_DATA);
    }).catch(()=>setData(INIT_DATA));
  },[]);

  const scheduleSave = useCallback(newData=>{
    setSaveStatus("saving");
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{ await saveData(newData); setSaveStatus("saved"); setTimeout(()=>setSaveStatus("idle"),2000); },800);
  },[]);

  const upd = useCallback(fn=>setData(prev=>{
    history.current=[...history.current.slice(-49), prev];
    const next=fn(prev); scheduleSave(next); return next;
  }),[scheduleSave]);

  const undo = useCallback(()=>{
    if(!history.current.length) return;
    const prev=history.current[history.current.length-1];
    history.current=history.current.slice(0,-1);
    setData(prev); scheduleSave(prev);
  },[scheduleSave]);

  useEffect(()=>{
    const h=e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey){ const tag=document.activeElement?.tagName; if(tag==="INPUT"||tag==="TEXTAREA") return; e.preventDefault(); undo(); } };
    document.addEventListener("keydown",h); return ()=>document.removeEventListener("keydown",h);
  },[undo]);

  const labels = data?.labels||[];
  const stickyNotes = data?.stickyNotes||[];

  const updLabels = fn=>upd(p=>({...p,labels:fn(p.labels||[])}));
  const addLabel = ()=>updLabels(ls=>[...ls,{id:newId(),name:"New label",colorId:LABEL_COLORS[ls.length%LABEL_COLORS.length].id}]);
  const updateLabel = (id,ch)=>updLabels(ls=>ls.map(l=>l.id===id?{...l,...ch}:l));
  const deleteLabel = id=>updLabels(ls=>ls.filter(l=>l.id!==id));
  const updStickies = fn=>upd(p=>({...p,stickyNotes:fn(p.stickyNotes||[])}));
  const addSticky = ()=>updStickies(ns=>[...ns,{id:newId(),text:"",color:STICKY_COLORS[ns.length%STICKY_COLORS.length]}]);
  const updateSticky = (id,ch)=>updStickies(ns=>ns.map(n=>n.id===id?{...n,...ch}:n));
  const deleteSticky = id=>updStickies(ns=>ns.filter(n=>n.id!==id));

  const updateFeature = useCallback((fid,ch)=>upd(p=>({...p,sprints:p.sprints.map(s=>({...s,features:s.features.map(f=>f.id===fid?{...f,...ch}:f)}))})),[upd]);
  const deleteFeature = useCallback(fid=>upd(p=>({...p,sprints:p.sprints.map(s=>({...s,features:s.features.filter(f=>f.id!==fid)}))})),[upd]);
  const addFeature = useCallback(sid=>upd(p=>({...p,sprints:p.sprints.map(s=>s.id===sid?{...s,features:[...s.features,{id:newId(),name:"New feature",size:"M",phases:{product:"not-started",design:"not-started",eng:"not-started"},estNum:"",estUnit:"days",note:"",owners:[],tasks:[],labelId:null}]}:s)})),[upd]);
  const updateSprint = useCallback((sid,ch)=>upd(p=>({...p,sprints:p.sprints.map(s=>s.id===sid?{...s,...ch}:s)})),[upd]);
  const deleteSprint = useCallback(sid=>upd(p=>({...p,sprints:p.sprints.filter(s=>s.id!==sid)})),[upd]);
  const addSprint = useCallback(()=>upd(p=>({...p,sprints:[...p.sprints,{id:newId(),label:`Sprint ${58+p.sprints.length-3}`,dates:"Dates TBD",features:[]}]})),[upd]);

  // ── Mouse-based drag for feature cards ──────────────────────────────────────
  const getDropInfo = useCallback((cx, cy) => {
    if (!boardRef.current) return null;
    // Find which sprint column we're over
    const sprintEls = boardRef.current.querySelectorAll("[data-sprint-id]");
    let targetSprint = null;
    for (const el of sprintEls) {
      const r = el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right) { targetSprint = el; break; }
    }
    if (!targetSprint) return null;
    const sid = targetSprint.getAttribute("data-sprint-id");
    // Find which feature card we're over (by vertical position)
    const cardEls = targetSprint.querySelectorAll("[data-feature-id]");
    for (const el of cardEls) {
      const fid = el.getAttribute("data-feature-id");
      if (fid === dragState.current?.featureId) continue;
      const r = el.getBoundingClientRect();
      if (cy < r.bottom) {
        return { sprintId: sid, featureId: fid, position: cy < r.top + r.height/2 ? "before" : "after" };
      }
    }
    return { sprintId: sid, featureId: null, position: "after" };
  }, []);

  const getSprintDropInfo = useCallback((cx) => {
    if (!boardRef.current) return null;
    const sprintEls = boardRef.current.querySelectorAll("[data-sprint-id]");
    for (const el of sprintEls) {
      const sid = el.getAttribute("data-sprint-id");
      if (sid === dragState.current?.sprintId) continue;
      const r = el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right) {
        return { sprintId: sid, side: cx < r.left + r.width/2 ? "left" : "right" };
      }
    }
    return null;
  }, []);

  const runAutoScroll = useCallback((cx, cy) => {
    cancelAnimationFrame(scrollRaf.current);
    const board = boardRef.current;
    if (!board) return;
    const tick = () => {
      if (!dragState.current) return;
      const br = board.getBoundingClientRect();
      const HZONE = 80, VZONE = 80, SPEED = 10;
      if (cx < br.left + HZONE) board.scrollLeft -= SPEED;
      else if (cx > br.right - HZONE) board.scrollLeft += SPEED;
      if (cy < br.top + VZONE) window.scrollBy(0, -SPEED);
      else if (cy > br.bottom - VZONE) window.scrollBy(0, SPEED);
      scrollRaf.current = requestAnimationFrame(tick);
    };
    scrollRaf.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => cancelAnimationFrame(scrollRaf.current), []);

  const onDragHandleMouseDown = useCallback((e, featureId) => {
    if (!editable) return;
    e.preventDefault();
    dragState.current = { type: "feature", featureId, startX: e.clientX, startY: e.clientY, moved: false };
    setDraggingId(featureId);
    setGhostPos({ x: e.clientX - 130, y: e.clientY - 20 });
  }, [editable]);

  const onSprintDragHandleMouseDown = useCallback((e, sprintId) => {
    if (!editable) return;
    e.preventDefault();
    dragState.current = { type: "sprint", sprintId, startX: e.clientX, startY: e.clientY, moved: false };
    setDraggingSprintId(sprintId);
  }, [editable]);

  useEffect(() => {
    const onMove = e => {
      const ds = dragState.current;
      if (!ds) return;
      ds.moved = true;
      const cx = e.clientX, cy = e.clientY;

      if (ds.type === "feature") {
        setGhostPos({ x: cx - 130, y: cy - 20 });
        const info = getDropInfo(cx, cy);
        setDropTarget(info);
        runAutoScroll(cx, cy);
      } else if (ds.type === "sprint") {
        const info = getSprintDropInfo(cx);
        setSprintDropTarget(info);
        runAutoScroll(cx, cy);
      }
    };

    const onUp = e => {
      const ds = dragState.current;
      if (!ds) return;
      dragState.current = null;
      stopAutoScroll();

      if (ds.type === "feature") {
        const info = getDropInfo(e.clientX, e.clientY);
        if (info && ds.moved) {
          upd(prev => {
            let moved = null;
            let sprints = prev.sprints.map(s => {
              const f = s.features.find(f => f.id === ds.featureId);
              if (f) { moved = f; return { ...s, features: s.features.filter(f => f.id !== ds.featureId) }; }
              return s;
            });
            if (!moved) return prev;
            sprints = sprints.map(s => {
              if (s.id !== info.sprintId) return s;
              const feats = [...s.features];
              if (!info.featureId) feats.push(moved);
              else { const idx = feats.findIndex(f => f.id === info.featureId); feats.splice(info.position==="before"?idx:idx+1, 0, moved); }
              return { ...s, features: feats };
            });
            return { ...prev, sprints };
          });
        }
        setDraggingId(null); setDropTarget(null);
      } else if (ds.type === "sprint") {
        const info = getSprintDropInfo(e.clientX);
        if (info && ds.moved) {
          upd(prev => {
            const sprints = [...prev.sprints];
            const fromIdx = sprints.findIndex(s => s.id === ds.sprintId);
            const [moved] = sprints.splice(fromIdx, 1);
            const toIdx = sprints.findIndex(s => s.id === info.sprintId);
            sprints.splice(info.side==="left" ? toIdx : toIdx+1, 0, moved);
            return { ...prev, sprints };
          });
        }
        setDraggingSprintId(null); setSprintDropTarget(null);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [getDropInfo, getSprintDropInfo, runAutoScroll, stopAutoScroll, upd]);

  // Board pan (only when clicking directly on board background)
  const onBoardMouseDown = e => {
    if (e.target !== boardRef.current) return;
    e.preventDefault(); isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, scrollX: boardRef.current.scrollLeft, scrollY: window.scrollY };
    boardRef.current.style.cursor = "grabbing"; boardRef.current.style.userSelect = "none"; document.body.style.userSelect = "none";
  };
  const onBoardMouseMove = e => {
    if (!isPanning.current) return; e.preventDefault();
    boardRef.current.scrollLeft = panStart.current.scrollX - (e.clientX - panStart.current.x);
    window.scrollTo(0, panStart.current.scrollY - (e.clientY - panStart.current.y));
  };
  const onBoardMouseUp = e => {
    if (!isPanning.current) return; isPanning.current = false;
    boardRef.current.style.userSelect = ""; document.body.style.userSelect = "";
    boardRef.current.style.cursor = e.target === boardRef.current ? "grab" : "default";
  };

  const copyPublicLink = () => { const url=`${window.location.origin}${window.location.pathname}?view=public`; navigator.clipboard.writeText(url).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); }); };

  // Find the feature being dragged for ghost
  const draggingFeature = draggingId && data ? data.sprints.flatMap(s=>s.features).find(f=>f.id===draggingId) : null;

  if (!authed) return (
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui"}}>
      <div style={{background:T.bg2,border:`0.5px solid ${T.border2}`,borderRadius:16,padding:"40px 48px",display:"flex",flexDirection:"column",alignItems:"center",gap:20,boxShadow:"0 8px 32px rgba(0,0,0,.4)",minWidth:320}}>
        <div style={{fontSize:28}}>🔒</div>
        <div style={{fontSize:18,fontWeight:700,color:T.text}}>Roadmap</div>
        <div style={{fontSize:13,color:T.text4}}>Enter password to continue</div>
        <input autoFocus type="password" value={passInput} placeholder="Password"
          onChange={e=>setPassInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitPass()}
          style={{width:"100%",background:T.inputBg,border:`1.5px solid ${passErr?"#ef4444":T.inputBorder}`,borderRadius:8,color:T.text,fontSize:14,padding:"10px 14px",outline:"none",boxSizing:"border-box",transition:"border-color .2s",fontFamily:"system-ui"}}/>
        {passErr && <div style={{fontSize:12,color:"#ef4444",marginTop:-12}}>Incorrect password</div>}
        <button onClick={submitPass} style={{width:"100%",background:"#534AB7",border:"none",borderRadius:8,color:"#fff",fontSize:14,fontWeight:600,padding:"10px 0",cursor:"pointer"}}>Unlock</button>
      </div>
    </div>
  );

  if (!data) return <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:T.text5,fontFamily:"system-ui"}}>Loading roadmap…</div>;

  const filtered = { ...data, sprints: data.sprints.map(s=>({ ...s, features: s.features.filter(f=>{ if(filter==="xl-l") return f.size==="XL"||f.size==="L"; if(filter==="m-s") return f.size==="M"||f.size==="S"; return true; }) })) };
  const fBtn = (v,l) => <button key={v} onClick={()=>setFilter(v)} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:"0.5px solid",background:filter===v?T.bg5:"transparent",color:filter===v?T.text:T.text5,borderColor:filter===v?T.border3:T.border}}>{l}</button>;
  const statusColor = saveStatus==="saved"?"#4ade80":saveStatus==="saving"?"#fbbf24":"transparent";
  const statusText = saveStatus==="saved"?"✓ Saved":saveStatus==="saving"?"Saving…":"";

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",boxSizing:"border-box",userSelect:draggingId?"none":"auto"}}>
      <LabelBar labels={labels} onAdd={addLabel} onUpdate={updateLabel} onDelete={deleteLabel} editable={editable} darkMode={darkMode} T={T}/>
      <div style={{padding:"58px 0 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8,padding:"0 16px"}}>
          <h1 style={{fontSize:20,fontWeight:700,color:T.text,margin:0}}>Roadmap</h1>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:statusColor,minWidth:60}}>{statusText}</span>
            <div style={{display:"flex",gap:4}}>{[["all","All"],["xl-l","Boulders"],["m-s","Pebbles"]].map(([v,l])=>fBtn(v,l))}</div>
            {!isPublic&&filter==="all"&&<button onClick={()=>setEditMode(m=>!m)} style={{padding:"4px 14px",borderRadius:20,fontSize:11,cursor:"pointer",border:`0.5px solid ${editMode?"#4ade80":T.border}`,background:editMode?"#1a3a2a":"transparent",color:editMode?"#4ade80":T.text5,transition:"all .2s"}}>{editMode?"✓ Editing":"Edit"}</button>}
            {editable&&<button onClick={addSprint} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:`0.5px solid ${T.border}`,background:"transparent",color:T.text5}}>+ Sprint</button>}
            {!isPublic&&<button onClick={copyPublicLink} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:`0.5px solid ${copied?"#4ade80":T.border}`,background:copied?"#1a3a2a":"transparent",color:copied?"#4ade80":T.text5,transition:"all .2s"}}>{copied?"✓ Copied!":"Share ↗"}</button>}
            <button onClick={toggleDark} style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",border:`0.5px solid ${T.border}`,background:"transparent",color:T.text5}}>{darkMode?"☀️":"🌙"}</button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:10,color:T.text5,whiteSpace:"nowrap"}}>⟷</span>
              <input type="range" min={220} max={500} value={colWidth} onChange={e=>setColWidthPersist(Number(e.target.value))} style={{width:70,accentColor:"#534AB7",cursor:"pointer"}}/>
            </div>
          </div>
        </div>
        <div style={{fontSize:10,color:T.text6,marginBottom:14,padding:"0 16px"}}>
          {isPublic?"Public view — read only":editable?"Drag ⠿ to reposition · Click size to change · Click phase to advance · Click text to edit · Ctrl+Z to undo":filter==="all"?"View mode — click Edit to make changes":"View only"}
        </div>
        <div ref={boardRef}
          onMouseDown={onBoardMouseDown} onMouseMove={onBoardMouseMove} onMouseUp={onBoardMouseUp} onMouseLeave={onBoardMouseUp}
          style={{display:"flex",gap:10,alignItems:"flex-start",overflowX:"auto",paddingBottom:24,paddingLeft:16,paddingRight:16,cursor:draggingId?"grabbing":"grab"}}>
          {filtered.sprints.map(s=>(
            <SprintCol key={s.id} sprint={s}
              onUpdateFeature={updateFeature} onDeleteFeature={deleteFeature} onAddFeature={addFeature}
              onUpdateSprint={updateSprint} onDeleteSprint={deleteSprint}
              draggingId={draggingId} dropTarget={dropTarget}
              editable={editable} isPublic={isPublic}
              isSprintDragging={draggingSprintId===s.id}
              isSprintDropTarget={sprintDropTarget?.sprintId===s.id}
              sprintDropSide={sprintDropTarget?.sprintId===s.id?sprintDropTarget.side:null}
              colWidth={colWidth} T={T} darkMode={darkMode} labels={labels}
              onDragHandleMouseDown={onDragHandleMouseDown}
              onSprintDragHandleMouseDown={onSprintDragHandleMouseDown}/>
          ))}
        </div>
      </div>
      <GhostCard feature={draggingFeature} pos={ghostPos} T={T} darkMode={darkMode} labels={labels}/>
      <StickyNotes notes={stickyNotes} onAdd={addSticky} onUpdate={updateSticky} onDelete={deleteSticky} editable={editable} darkMode={darkMode} T={T}/>
    </div>
  );
}
