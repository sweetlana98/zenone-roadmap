import { useState, useRef, useEffect, useCallback } from "react";

const INIT_DATA = {
  sprints: [
    {
      id: "s55", label: "Sprint 55", dates: "Feb 2–13",
      features: [
        { id: "f1", name: "Survey pop-up", size: "M", phases: { product: "done", design: "done", eng: "done" }, estNum: "3", estUnit: "days", note: "", owners: [], tasks: [{ id: "t1", name: "Data collection form (clinic type, # of Drs, goal)", owners: ["Pedro"] }, { id: "t2", name: "Select → done flow", owners: ["Pedro"] }] },
        { id: "f2", name: "Help Center", size: "L", phases: { product: "done", design: "in-progress", eng: "not-started" }, estNum: "", estUnit: "days", note: "Eng picks up in Sprint 56", owners: [], tasks: [{ id: "t3", name: "Contents, rough layout, key features & anchors ready", owners: ["Design"] }, { id: "t4", name: "Put together with designer", owners: ["Design"] }] },
        { id: "f3", name: "Admin changes", size: "XL", phases: { product: "in-progress", design: "not-started", eng: "not-started" }, estNum: "", estUnit: "days", note: "Design + Eng in Sprint 56", owners: [], tasks: [{ id: "t5", name: "Scope: Onboarding KPIs, Health Scores, Customer Segmentation", owners: [] }] }
      ]
    },
    {
      id: "s56", label: "Sprint 56", dates: "Feb 16–27",
      features: [
        { id: "f4", name: "HubSpot data sync", size: "M", phases: { product: "done", design: "done", eng: "done" }, estNum: "", estUnit: "days", note: "", owners: ["Kirill"], tasks: [{ id: "t6", name: "Integrate ZenOne with HubSpot", owners: ["Kirill"] }] },
        { id: "f5", name: "Admin changes", size: "XL", phases: { product: "done", design: "done", eng: "in-progress" }, estNum: "1", estUnit: "weeks", note: "", owners: ["Kirill", "Pedro"], tasks: [{ id: "t7", name: "Customer Detail Page + list (ref: 1548)", owners: ["Kirill"] }, { id: "t8", name: "Alarms", owners: ["Kirill"] }, { id: "t9", name: "Stats: Onboarding KPIs, Health Scores", owners: ["Pedro"] }] },
        { id: "f6", name: "Help Center", size: "L", phases: { product: "done", design: "done", eng: "in-progress" }, estNum: "1", estUnit: "weeks", note: "", owners: ["Pedro"], tasks: [{ id: "t12", name: "Building + Videos hookup", owners: ["Pedro"] }] },
        { id: "f7", name: "Wizard rework", size: "M", phases: { product: "done", design: "done", eng: "in-progress" }, estNum: "", estUnit: "days", note: "", owners: [], tasks: [{ id: "t13", name: "Surface changes", owners: ["Pedro"] }, { id: "t14", name: "In-depth rework", owners: ["Kirill"] }] }
      ]
    },
    {
      id: "s57", label: "Sprint 57", dates: "Mar 1–10",
      features: [
        { id: "f8", name: "Vendor Portal", size: "XL", phases: { product: "done", design: "in-progress", eng: "not-started" }, estNum: "", estUnit: "days", note: "", owners: ["Tanya"], tasks: [{ id: "t15", name: "Improvements: shipping states, order minimum, multi-user", owners: ["Tanya"] }, { id: "t16", name: "Bug fixes: Stripe connection (ref: 2605)", owners: ["Tanya"] }] },
        { id: "f9", name: "ACH + payment terms", size: "M", phases: { product: "in-progress", design: "not-started", eng: "not-started" }, estNum: "", estUnit: "days", note: "Design → TBD", owners: [], tasks: [{ id: "t19", name: "Add ACH, payment terms (net 30)", owners: [] }] },
        { id: "f10", name: "Shopping cart + onboarding review", size: "XL", phases: { product: "in-progress", design: "not-started", eng: "not-started" }, estNum: "", estUnit: "days", note: "Design → TBD", owners: [], tasks: [{ id: "t22", name: "Simple vs Assisted onboarding — features, price points", owners: [] }] }
      ]
    }
  ]
};

const SIZE_ORDER = ["XL","L","M","S"];
const SIZE_STYLES = { XL:{bg:"#3C3489",text:"#fff",border:"#534AB7"}, L:{bg:"#085041",text:"#fff",border:"#0F6E56"}, M:{bg:"#633806",text:"#fff",border:"#854F0B"}, S:{bg:"#791F1F",text:"#fff",border:"#A32D2D"} };
const PHASE_CFG = { "done":{bg:"#1a3a2a",text:"#4ade80",border:"#166534",strike:true}, "in-progress":{bg:"#3a2800",text:"#fbbf24",border:"#854d0e",strike:false}, "not-started":{bg:"#1e1e1e",text:"#6b7280",border:"#374151",strike:false} };
let OWNER_COLORS = { Pedro:["#1e3a5f","#60a5fa"], Kirill:["#1a3a2a","#4ade80"], Design:["#3a1a4a","#c084fc"], Tanya:["#3a1a2a","#f472b6"], Michael:["#2a2a1a","#facc15"], Delaney:["#1a2a3a","#67e8f9"], Tiger:["#2a1a1a","#fca5a5"] };

let uid = 2000;
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
  const s = SIZE_STYLES[size];
  const badge = <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",background:s.bg,color:s.text,border:`0.5px solid ${s.border}`,borderRadius:4,fontSize:10,fontWeight:700,minWidth:22,height:20,padding:"0 4px",gap:3,cursor:editable?"pointer":"default"}} onClick={editable?e=>{e.stopPropagation();setOpen(o=>!o);}:undefined}>{size}{editable&&<span style={{fontSize:8,opacity:.7}}>▾</span>}</span>;
  if (!editable) return badge;
  return (
    <div ref={ref} style={{position:"relative",flexShrink:0}}>
      {badge}
      {open && <div style={{position:"absolute",top:26,left:0,background:"#1f1f1f",border:"0.5px solid #333",borderRadius:8,padding:6,zIndex:999,display:"flex",flexDirection:"column",gap:3,boxShadow:"0 4px 16px rgba(0,0,0,.8)",minWidth:200}}>
        {SIZE_ORDER.map(sz => { const st=SIZE_STYLES[sz]; const active=sz===size; return (
          <span key={sz} onClick={()=>{onChange(sz);setOpen(false);}} style={{display:"flex",alignItems:"center",gap:8,background:active?"#2a2a2a":st.bg,color:st.text,borderRadius:5,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",border:`0.5px solid ${active?"#555":st.border}`}}>
            <span style={{background:st.bg,borderRadius:3,padding:"1px 5px",fontSize:10,border:`0.5px solid ${st.border}`}}>{sz}</span>
            <span style={{fontSize:10,fontWeight:400,color:"#9ca3af"}}>{sz==="XL"?"Big bet":sz==="L"?"Multi-sprint":sz==="M"?"Single sprint":"Quick win"}</span>
            {active && <span style={{marginLeft:"auto",color:"#4ade80"}}>✓</span>}
          </span>
        );})}
      </div>}
    </div>
  );
}

function InlineEdit({ value, onChange, style={}, placeholder="Edit…", multiline=false, editable=true }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  const commit = () => { setEditing(false); if (val !== value) onChange(val); };
  if (!editable || !editing) return (
    <span onClick={editable?e=>{e.stopPropagation();setEditing(true);}:undefined} style={{cursor:editable?"text":"default",...style}}>
      {value || <span style={{opacity:0.3}}>{editable?placeholder:""}</span>}
    </span>
  );
  const sh = {background:"#2a2a2a",border:"0.5px solid #555",borderRadius:4,color:"#f0f0f0",fontSize:"inherit",fontFamily:"inherit",padding:"2px 6px",outline:"none",width:"100%",boxSizing:"border-box",...style};
  return multiline
    ? <textarea autoFocus value={val} rows={2} onChange={e=>setVal(e.target.value)} onBlur={commit} style={{...sh,resize:"none"}} onClick={e=>e.stopPropagation()}/>
    : <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}} style={sh} onClick={e=>e.stopPropagation()}/>;
}

function OwnersPicker({ owners, onChange, editable }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [tick, setTick] = useState(0);
  const ref = useRef();
  useClickOutside(ref, () => { setOpen(false); setConfirmRemove(null); });

  if (!editable) return <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{owners.length===0?<span style={{fontSize:10,color:"#444"}}>—</span>:<OwnerTags owners={owners}/>}</div>;

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
      <div data-trigger onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} style={{display:"flex",gap:3,flexWrap:"wrap",alignItems:"center",cursor:"pointer",minWidth:32}}>
        {owners.length===0 ? <span style={{fontSize:10,color:"#555",padding:"1px 6px",borderRadius:10,border:"0.5px dashed #333"}}>+ owner</span> : <OwnerTags owners={owners}/>}
      </div>
      {open && (
        <div style={{position:"fixed",background:"#1f1f1f",border:"0.5px solid #444",borderRadius:10,padding:8,zIndex:9999,minWidth:180,maxHeight:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:3,boxShadow:"0 8px 24px rgba(0,0,0,.8)"}}
          ref={r=>{if(r&&ref.current){const b=ref.current.querySelector('[data-trigger]');if(b){const rc=b.getBoundingClientRect();r.style.top=(rc.bottom+6)+"px";r.style.left=Math.max(8,rc.right-180)+"px";}}}}
        >
          <div style={{fontSize:10,color:"#555",paddingBottom:5,borderBottom:"0.5px solid #2a2a2a"}}>Click to add · ✕ to remove</div>
          {owners.length>0 && <div style={{display:"flex",flexDirection:"column",gap:2,paddingBottom:4,borderBottom:"0.5px solid #222"}}>
            {owners.map(o=>{const[bg,text]=OWNER_COLORS[o]||["#252525","#9ca3af"];return(
              <div key={o} style={{display:"flex",alignItems:"center",gap:6,background:"#2a2a2a",borderRadius:6,padding:"4px 8px",border:"0.5px solid #444"}}>
                <span style={{background:bg,color:text,borderRadius:8,padding:"1px 7px",fontSize:10,fontWeight:500,flex:1}}>{o}</span>
                <span onClick={()=>toggle(o)} style={{color:"#ef4444",fontSize:11,cursor:"pointer",fontWeight:600}}>✕</span>
              </div>
            );})}
          </div>}
          {Object.keys(OWNER_COLORS).filter(o=>!owners.includes(o)).map(o=>{
            const[bg,text]=OWNER_COLORS[o];
            return (
              <div key={o} style={{display:"flex",alignItems:"center",gap:4,borderRadius:6,padding:"3px 6px",border:"0.5px solid transparent"}} onMouseEnter={e=>e.currentTarget.style.background="#252525"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span onClick={()=>toggle(o)} style={{background:bg,color:text,borderRadius:8,padding:"1px 7px",fontSize:10,fontWeight:500,flex:1,cursor:"pointer"}}>{o}</span>
                <span onClick={()=>toggle(o)} style={{color:"#4ade80",fontSize:10,cursor:"pointer",padding:"0 3px"}}>+</span>
                {confirmRemove===o
                  ? <span style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:9,color:"#9ca3af"}}>Remove?</span><span onClick={()=>removeFromRoster(o)} style={{color:"#ef4444",fontSize:10,cursor:"pointer",fontWeight:600}}>Yes</span><span onClick={()=>setConfirmRemove(null)} style={{color:"#6b7280",fontSize:10,cursor:"pointer",marginLeft:3}}>No</span></span>
                  : <span onClick={e=>{e.stopPropagation();setConfirmRemove(o);}} style={{color:"#ef4444",fontSize:11,cursor:"pointer",fontWeight:700}}>✕</span>}
              </div>
            );
          })}
          <div style={{borderTop:"0.5px solid #2a2a2a",marginTop:4,paddingTop:6,display:"flex",gap:4}}>
            <input placeholder="Add name…" value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCustom();e.stopPropagation();}} onClick={e=>e.stopPropagation()} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:4,color:"#e0e0e0",fontSize:10,padding:"4px 6px",outline:"none"}}/>
            <button onClick={addCustom} style={{background:"#2a2a2a",border:"0.5px solid #444",borderRadius:4,color:"#4ade80",fontSize:11,padding:"3px 8px",cursor:"pointer",fontWeight:600}}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropIndicator() { return <div style={{height:3,background:"#4ade80",borderRadius:2,margin:"2px 0"}}/>; }

function FeatureCard({ feature, onUpdate, onDelete, onDragStart, onDragEnd, isDragging, onDragOverCard, dropPosition, editable }) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmTask, setConfirmTask] = useState(null);
  const cardRef = useRef();
  const delRef = useRef();
  useClickOutside(delRef, () => setConfirmDel(false));

  const cyclePhase = key => { if(!editable)return; const o=["not-started","in-progress","done"]; onUpdate(feature.id,{phases:{...feature.phases,[key]:o[(o.indexOf(feature.phases[key])+1)%o.length]}}); };
  const updateTask = (tid,ch) => onUpdate(feature.id,{tasks:feature.tasks.map(t=>t.id===tid?{...t,...ch}:t)});
  const addTask = () => onUpdate(feature.id,{tasks:[...feature.tasks,{id:newId(),name:"New task",owners:[]}]});
  const deleteTask = tid => onUpdate(feature.id,{tasks:feature.tasks.filter(t=>t.id!==tid)});
  const onDragOv = e => { if(!editable)return; e.preventDefault();e.stopPropagation(); const r=cardRef.current.getBoundingClientRect(); onDragOverCard(feature.id,e.clientY<r.top+r.height/2?"before":"after"); };
  const bc = feature.phases.eng==="done"?"#166534":feature.phases.eng==="in-progress"?"#854d0e":"#2d2d2d";

  return (
    <div ref={cardRef} onDragOver={onDragOv}>
      {dropPosition==="before"&&<DropIndicator/>}
      <div draggable={editable} onDragStart={editable?e=>{e.dataTransfer.effectAllowed="move";e.stopPropagation();onDragStart(feature.id);}:undefined} onDragEnd={editable?onDragEnd:undefined}
        style={{background:"#1a1a1a",border:`0.5px solid ${bc}`,borderRadius:10,overflow:"hidden",marginBottom:8,opacity:isDragging?.3:1,boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}>
        <div style={{background:"#1f1f1f",padding:"9px 10px"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
            {editable&&<span style={{color:"#444",fontSize:13,cursor:"grab",flexShrink:0,userSelect:"none",marginTop:2}}>⠿</span>}
            <SizeBadge size={feature.size} onChange={v=>onUpdate(feature.id,{size:v})} editable={editable}/>
            <InlineEdit value={feature.name} onChange={v=>onUpdate(feature.id,{name:v})} editable={editable} placeholder="Feature name" style={{flex:1,minWidth:0,fontSize:13,fontWeight:600,color:"#f0f0f0",lineHeight:1.4}}/>
            <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,marginTop:2}}>
              <span onClick={()=>setCollapsed(c=>!c)} style={{fontSize:10,color:"#555",cursor:"pointer",padding:"0 2px"}}>{collapsed?"▸":"▾"}</span>
              {editable&&<div ref={delRef} style={{position:"relative"}}>
                <span onClick={()=>setConfirmDel(true)} style={{fontSize:10,color:"#444",cursor:"pointer",padding:"0 2px"}}>✕</span>
                {confirmDel&&<div style={{position:"absolute",top:0,right:24,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:110,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
                  <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete?</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>onDelete(feature.id)} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
                    <button onClick={()=>setConfirmDel(false)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
                  </div>
                </div>}
              </div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5,paddingLeft:editable?22:0}}>
            <span style={{fontSize:10,color:"#444"}}>Owner:</span>
            <OwnersPicker owners={feature.owners||[]} onChange={v=>onUpdate(feature.id,{owners:v})} editable={editable}/>
          </div>
        </div>
        {!collapsed&&<div style={{padding:"8px 10px 10px"}}>
          <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
            {[["product","Product"],["design","Design"],["eng","Eng"]].map(([key,lbl])=>{
              const c=PHASE_CFG[feature.phases[key]];
              return <span key={key} onClick={()=>cyclePhase(key)} style={{display:"inline-flex",alignItems:"center",background:c.bg,color:c.text,border:`0.5px solid ${c.border}`,borderRadius:4,padding:"2px 7px",fontSize:10,fontWeight:500,textDecoration:c.strike?"line-through":"none",cursor:editable?"pointer":"default",userSelect:"none",whiteSpace:"nowrap"}}>{lbl}</span>;
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:6}}>
            {feature.tasks.map(task=>(
              <div key={task.id} style={{display:"flex",alignItems:"center",gap:6,background:"#242424",borderRadius:6,padding:"5px 8px",border:"0.5px solid #2d2d2d",position:"relative"}}>
                <InlineEdit value={task.name} onChange={v=>updateTask(task.id,{name:v})} editable={editable} placeholder="Task" multiline style={{flex:1,fontSize:11,color:"#c0c0c0",lineHeight:1.4}}/>
                <OwnersPicker owners={task.owners||[]} onChange={v=>updateTask(task.id,{owners:v})} editable={editable}/>
                {editable&&<div style={{position:"relative",flexShrink:0}}>
                  <span onClick={()=>setConfirmTask(task.id)} style={{fontSize:10,color:"#333",cursor:"pointer"}}>✕</span>
                  {confirmTask===task.id&&<div style={{position:"absolute",top:0,right:18,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:110,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
                    <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete task?</span>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{deleteTask(task.id);setConfirmTask(null);}} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
                      <button onClick={()=>setConfirmTask(null)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
                    </div>
                  </div>}
                </div>}
              </div>
            ))}
            {editable&&<button onClick={addTask} style={{background:"transparent",border:"0.5px dashed #333",borderRadius:6,color:"#555",fontSize:10,padding:"4px 8px",cursor:"pointer",textAlign:"left"}}>+ Add task</button>}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",paddingTop:4,borderTop:"0.5px solid #222"}}>
            {editable ? <>
              <span style={{fontSize:10,color:"#555"}}>EST:</span>
              <input type="number" min="0" value={feature.estNum} onChange={e=>onUpdate(feature.id,{estNum:e.target.value})} placeholder="–" style={{width:36,background:"#2a2a2a",border:"0.5px solid #333",borderRadius:4,color:"#9ca3af",fontSize:10,padding:"2px 4px",outline:"none",textAlign:"center"}}/>
              <select value={feature.estUnit} onChange={e=>onUpdate(feature.id,{estUnit:e.target.value})} style={{background:"#2a2a2a",border:"0.5px solid #333",borderRadius:4,color:"#6b7280",fontSize:10,padding:"2px 4px",outline:"none",cursor:"pointer"}}>
                <option value="days">day(s)</option>
                <option value="weeks">week(s)</option>
              </select>
              <InlineEdit value={feature.note} onChange={v=>onUpdate(feature.id,{note:v})} editable placeholder="+ add note" style={{fontSize:10,color:"#4b5563",fontStyle:"italic"}}/>
            </> : <>
              {feature.estNum&&<span style={{fontSize:10,color:"#6b7280"}}>EST: {feature.estNum} {feature.estUnit}</span>}
              {feature.note&&<span style={{fontSize:10,color:"#4b5563",fontStyle:"italic"}}>{feature.note}</span>}
            </>}
          </div>
        </div>}
      </div>
      {dropPosition==="after"&&<DropIndicator/>}
    </div>
  );
}

function SprintCol({ sprint, onUpdateFeature, onDeleteFeature, onAddFeature, onUpdateSprint, onDeleteSprint, onDragStart, onDragEnd, draggingId, dropTarget, onDragOverCard, onDragOverEmpty, editable }) {
  const emptyTarget = editable&&dropTarget?.sprintId===sprint.id&&!dropTarget?.featureId;
  const [confirmDel, setConfirmDel] = useState(false);
  const delRef = useRef();
  useClickOutside(delRef, () => setConfirmDel(false));
  return (
    <div onDragOver={e=>{if(editable){e.preventDefault();if(!sprint.features.length)onDragOverEmpty(sprint.id);}}}
      style={{flexShrink:0,width:280,background:"#141414",borderRadius:12,padding:12,border:"0.5px solid #2a2a2a",boxSizing:"border-box"}}>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
          <div style={{flex:1}}>
            <InlineEdit value={sprint.label} onChange={v=>onUpdateSprint(sprint.id,{label:v})} editable={editable} style={{fontSize:13,fontWeight:700,color:"#e0e0e0",display:"block"}}/>
            <InlineEdit value={sprint.dates} onChange={v=>onUpdateSprint(sprint.id,{dates:v})} editable={editable} placeholder="e.g. Feb 2–13" style={{fontSize:11,color:"#555",marginTop:1,display:"block"}}/>
          </div>
          {editable&&<div ref={delRef} style={{position:"relative",flexShrink:0,marginTop:2}}>
            <span onClick={()=>setConfirmDel(true)} style={{fontSize:10,color:"#333",cursor:"pointer",padding:"2px 4px"}}>✕</span>
            {confirmDel&&<div style={{position:"absolute",top:0,right:20,background:"#1f1f1f",border:"0.5px solid #444",borderRadius:8,padding:"8px 10px",zIndex:200,display:"flex",flexDirection:"column",gap:6,minWidth:130,boxShadow:"0 4px 12px rgba(0,0,0,.6)"}}>
              <span style={{fontSize:11,color:"#e0e0e0",fontWeight:500}}>Delete sprint?</span>
              <span style={{fontSize:10,color:"#6b7280"}}>All features will be deleted.</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onDeleteSprint(sprint.id)} style={{flex:1,background:"#7f1d1d",border:"0.5px solid #ef4444",borderRadius:5,color:"#fca5a5",fontSize:10,padding:"3px 0",cursor:"pointer"}}>Yes</button>
                <button onClick={()=>setConfirmDel(false)} style={{flex:1,background:"#2a2a2a",border:"0.5px solid #444",borderRadius:5,color:"#9ca3af",fontSize:10,padding:"3px 0",cursor:"pointer"}}>No</button>
              </div>
            </div>}
          </div>}
        </div>
      </div>
      {emptyTarget&&<DropIndicator/>}
      {sprint.features.map(f=>{
        const pos=editable&&dropTarget?.sprintId===sprint.id&&dropTarget?.featureId===f.id?dropTarget.position:null;
        return <FeatureCard key={f.id} feature={f} onUpdate={onUpdateFeature} onDelete={onDeleteFeature} onDragStart={onDragStart} onDragEnd={onDragEnd} isDragging={draggingId===f.id} onDragOverCard={(fid,p)=>onDragOverCard(sprint.id,fid,p)} dropPosition={pos} editable={editable}/>;
      })}
      {editable&&<button onClick={()=>onAddFeature(sprint.id)} style={{width:"100%",background:"transparent",border:"0.5px dashed #2a2a2a",borderRadius:8,color:"#444",fontSize:11,padding:"7px",cursor:"pointer",marginTop:4}}>+ New feature</button>}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(INIT_DATA);
  const [filter, setFilter] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const editable = editMode && filter === "all";

  const upd = useCallback(fn => setData(prev => fn(prev)), []);
  const updateFeature = (fid,ch) => upd(p=>({...p,sprints:p.sprints.map(s=>({...s,features:s.features.map(f=>f.id===fid?{...f,...ch}:f)}))}));
  const deleteFeature = fid => upd(p=>({...p,sprints:p.sprints.map(s=>({...s,features:s.features.filter(f=>f.id!==fid)}))}));
  const addFeature = sid => upd(p=>({...p,sprints:p.sprints.map(s=>s.id===sid?{...s,features:[...s.features,{id:newId(),name:"New feature",size:"M",phases:{product:"not-started",design:"not-started",eng:"not-started"},estNum:"",estUnit:"days",note:"",owners:[],tasks:[]}]}:s)}));
  const updateSprint = (sid,ch) => upd(p=>({...p,sprints:p.sprints.map(s=>s.id===sid?{...s,...ch}:s)}));
  const deleteSprint = sid => upd(p=>({...p,sprints:p.sprints.filter(s=>s.id!==sid)}));
  const addSprint = () => upd(p=>({...p,sprints:[...p.sprints,{id:newId(),label:`Sprint ${58+p.sprints.length-3}`,dates:"Dates TBD",features:[]}]}));

  const handleDragStart = useCallback(fid=>setDraggingId(fid),[]);
  const handleDragEnd = useCallback(()=>{setDraggingId(null);setDropTarget(null);},[]);
  const handleDragOverCard = useCallback((sid,fid,pos)=>setDropTarget({sprintId:sid,featureId:fid,position:pos}),[]);
  const handleDragOverEmpty = useCallback(sid=>setDropTarget({sprintId:sid,featureId:null,position:"after"}),[]);

  const handleDrop = useCallback(e=>{
    if(!editable)return;
    e.preventDefault();
    if(!draggingId||!dropTarget)return;
    upd(prev=>{
      let moved=null;
      let sprints=prev.sprints.map(s=>{const f=s.features.find(f=>f.id===draggingId);if(f){moved=f;return{...s,features:s.features.filter(f=>f.id!==draggingId)};}return s;});
      if(!moved)return prev;
      sprints=sprints.map(s=>{
        if(s.id!==dropTarget.sprintId)return s;
        const feats=[...s.features];
        if(!dropTarget.featureId)feats.push(moved);
        else{const idx=feats.findIndex(f=>f.id===dropTarget.featureId);feats.splice(dropTarget.position==="before"?idx:idx+1,0,moved);}
        return{...s,features:feats};
      });
      return{...prev,sprints};
    });
    setDraggingId(null);setDropTarget(null);
  },[draggingId,dropTarget,editable,upd]);

  const filtered={...data,sprints:data.sprints.map(s=>({...s,features:s.features.filter(f=>{if(filter==="xl-l")return f.size==="XL"||f.size==="L";if(filter==="m-s")return f.size==="M"||f.size==="S";return true;})}))};
  const fBtn=(v,l)=><button key={v} onClick={()=>setFilter(v)} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:"0.5px solid",background:filter===v?"#2a2a2a":"transparent",color:filter===v?"#e0e0e0":"#555",borderColor:filter===v?"#444":"#2a2a2a"}}>{l}</button>;

  return (
    <div onDragOver={e=>{if(editable)e.preventDefault();}} onDrop={handleDrop}
      style={{background:"#0f0f0f",minHeight:"100vh",padding:"20px 16px",fontFamily:"system-ui,sans-serif",boxSizing:"border-box"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <h1 style={{fontSize:20,fontWeight:700,color:"#f0f0f0",margin:0}}>Roadmap</h1>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",gap:4}}>{[["all","All"],["xl-l","Boulders"],["m-s","Pebbles"]].map(([v,l])=>fBtn(v,l))}</div>
          {filter==="all"&&<button onClick={()=>setEditMode(m=>!m)} style={{padding:"4px 14px",borderRadius:20,fontSize:11,cursor:"pointer",border:`0.5px solid ${editMode?"#4ade80":"#2a2a2a"}`,background:editMode?"#1a3a2a":"transparent",color:editMode?"#4ade80":"#555",transition:"all .2s"}}>{editMode?"✓ Editing":"Edit"}</button>}
          {editable&&<button onClick={addSprint} style={{padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",border:"0.5px solid #2a2a2a",background:"transparent",color:"#555"}}>+ Sprint</button>}
        </div>
      </div>
      <div style={{fontSize:10,color:"#333",marginBottom:14}}>
        {editable?"Drag ⠿ to reposition · Click size to change · Click phase to advance · Click text to edit":filter==="all"?"View mode — click Edit to make changes":"View only"}
      </div>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",overflowX:"auto",paddingBottom:16}}>
        {filtered.sprints.map(s=>(
          <SprintCol key={s.id} sprint={s} onUpdateFeature={updateFeature} onDeleteFeature={deleteFeature} onAddFeature={addFeature} onUpdateSprint={updateSprint} onDeleteSprint={deleteSprint} onDragStart={handleDragStart} onDragEnd={handleDragEnd} draggingId={draggingId} dropTarget={dropTarget} onDragOverCard={handleDragOverCard} onDragOverEmpty={handleDragOverEmpty} editable={editable}/>
        ))}
      </div>
    </div>
  );
}
