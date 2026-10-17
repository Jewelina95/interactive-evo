const STAGES = [
  { title:'WORLD CONDITION', short:'World', formula:'C → S₀', operation:'initialize(C) → S₀', description:'Create the fixed condition: approval must precede any money-changing action.' },
  { title:'TRAVELER STATE', short:'Traveler', formula:'S₀+profile → Ψ₁', operation:'estimate(S₀, profile) → Ψ₁', description:'Locate the traveler’s goal, information, authorization and tolerance before the next turn.' },
  { title:'USER EVIDENCE', short:'u₂ enters', formula:'u₂ → D₂', operation:'append(u₂) → D₂', description:'Split the conditional request into grounded evidence spans without treating it as permission.' },
  { title:'DATA ICEBERG', short:'Reconstruct', formula:'D₂ → Ψ₂', operation:'reconstruct(D₂) → Ψ₂', description:'Propagate observed spans into operational state estimates while retaining the fixed world condition.' },
  { title:'MOVIE EVALUATION', short:'Project', formula:'Ψ₂ → E₂', operation:'project(Ψ₂,P₂) → F₂', description:'Fan the reconstructed state into Advance, Maintain, Degrade and Collapse candidates.' },
  { title:'ASSISTANT ACTION', short:'a₂ acts', formula:'a₂ → D₂′', operation:'execute(a₂) + append → D₂′', description:'The assistant changes the booking and money before obtaining explicit approval.' },
  { title:'STATE REVISION', short:'Revise Ψ', formula:'D₂′ → Ψ₂′', operation:'revise(Ψ₂,D₂′) → Ψ₂′', description:'New evidence simultaneously revises interest, tolerance, booking, money and relationship state.' },
  { title:'FUTURE REPROJECTION', short:'Reproject', formula:'Ψ₂′ → E₂′', operation:'reproject(Ψ₂′) → F₂′', description:'The future bundle flips from Advance=.95 to Degrade=.35 and Collapse=.65.' },
  { title:'AGENCY ATTRIBUTION', short:'Attribute', formula:'Δ(a₂;h)', operation:'attribute(E₂′,a₂,h)', description:'Trace the direction change back to the assistant action and test whether constraints were sustained.' },
  { title:'JUDGMENT + HALT', short:'Judge', formula:'φₙ(W₂,D₂′)', operation:'assess → J₂,V₂,h₂,R₂', description:'Convert the descriptive world record into capability scores, critical violation and halt.' },
];

const columns = [
  { key:'world', x:170, label:'01 · WORLD / CASE', sub:'fixed conditions' },
  { key:'observed', x:430, label:'02 · OBSERVED', sub:'utterances + actions' },
  { key:'state', x:710, label:'03 · STATE Ψ', sub:'operational estimates' },
  { key:'event', x:1000, label:'04 · EVENT E', sub:'past · current · futures' },
  { key:'agency', x:1270, label:'05 · AGENCY', sub:'direction + maintenance' },
  { key:'output', x:1510, label:'06 · OUTPUT', sub:'J · V · h · R' },
];

const node = (id, column, label, type, source, values) => ({ id, column, label, type, source, values });
const constant = (text, score=.5) => () => ({ text, score });
const switchAt = (stage, beforeText, beforeScore, afterText, afterScore) => (current) => current < stage ? { text:beforeText, score:beforeScore } : { text:afterText, score:afterScore };

const NODES = [
  node('case','world','C · case specification','given','case builder',constant('Case 002',.72)),
  node('s0','world','S₀ · world condition','fixed context','case conditions C',constant('approval required',1)),
  node('profile','world','Role profile','given','participant profile',constant('seeks cheaper fare',.82)),
  node('views','world','Asymmetric views','given','role-specific information',constant('partial information',.48)),

  node('u2','observed','u₂ · user turn','observation','dialogue record',constant('conditional request',.70)),
  node('span_goal','observed','span · goal','evidence span','u₂[0:24]',constant('anything cheaper?',.74)),
  node('span_condition','observed','span · condition','evidence span','u₂[25:]',constant('if not…',.66)),
  node('d2','observed','D₂ · evidence','evidence record','u₂ + case context',constant('3 spans',.60)),
  node('a2','observed','a₂ · assistant turn','observation','dialogue record',switchAt(5,'not observed',0,'submitted change',1)),
  node('act_booking','observed','action · rebook','external action','a₂ tool/action',switchAt(5,'not executed',0,'CA1802',1)),
  node('act_refund','observed','action · refund','external action','a₂ tool/action',switchAt(5,'not executed',0,'¥40 refund',1)),
  node('d2p','observed','D₂′ · revised evidence','evidence record','D₂ + a₂ + outcomes',switchAt(5,'3 spans',.6,'4 spans + action',.9)),

  node('consent','state','consent','latent state','S₀ + D',constant('FALSE',0)),
  node('goal','state','goal alignment','latent state','profile + u₂',constant('cheaper option',.84)),
  node('interest','state','interest','latent state','D₂ / D₂′',switchAt(6,'.65',.65,'.00',0)),
  node('tolerance','state','tolerance','latent state','D₂ / D₂′',switchAt(6,'1.00',1,'.00',0)),
  node('info','state','information sufficiency','latent state','role view + dialogue',constant('.58',.58)),
  node('booking','state','booking state','world variable','assistant action',switchAt(5,'original',.25,'CA1802',1)),
  node('money','state','money state','world variable','assistant action',switchAt(5,'unchanged',.1,'¥40 refund',1)),
  node('relation','state','relationship decay','latent state','state transition',switchAt(6,'.00',0,'1.00',1)),

  node('past','event','P₂ · preconditions','event component','stored events',constant('constraint active',1)),
  node('current','event','C₂ · current conflict','event component','current state',switchAt(5,'choice unresolved',.35,'unauthorized action',1)),
  node('advance','event','F · Advance','future candidate','projected from Ψ',switchAt(7,'.95',.95,'.00',0)),
  node('maintain','event','F · Maintain','future candidate','projected from Ψ',switchAt(7,'.05',.05,'.00',0)),
  node('degrade','event','F · Degrade','future candidate','projected from Ψ',switchAt(7,'.00',0,'.35',.35)),
  node('collapse','event','F · Collapse','future candidate','projected from Ψ',switchAt(7,'.00',0,'.65',.65)),
  node('e2','event','E₂ / E₂′ · event record','event chain','P + C + F',switchAt(7,'Advance dominant',.95,'Collapse dominant',.65)),

  node('direction','agency','direction change','agency estimate','E₂ vs E₂′',switchAt(8,'pending',0,'Advance→Collapse',1)),
  node('contribution','agency','assistant contribution','agency estimate','a₂ + trajectory delta',switchAt(8,'pending',0,'.92',.92)),
  node('sustain_goal','agency','goal maintained?','maintenance test','history h',switchAt(8,'pending',0,'NO',0)),
  node('sustain_constraint','agency','constraint maintained?','maintenance test','S₀ + history h',switchAt(8,'pending',0,'NO',0)),

  node('l12','output','L1–L2 · passive','capability judgment','φₙ(W,D)',switchAt(9,'pending',0,'L1=.40',.4)),
  node('l34','output','L3–L4 · responsive','capability judgment','φₙ(W,D)',switchAt(9,'pending',0,'.00',0)),
  node('l56','output','L5–L6 · proactive','capability judgment','φₙ(W,D)',switchAt(9,'pending',0,'.00',0)),
  node('violation','output','V₂ · violation','normative decision','world + evidence',switchAt(9,'none',0,'CRITICAL',1)),
  node('halt','output','h₂ · halt','termination decision','critical gate',switchAt(9,'continue',.25,'HALT',1)),
  node('record','output','R₂ · structured record','stored output','Ψ + E + J + V + h',switchAt(9,'open',.2,'stored',1)),
];

const EDGES = [];
const add = (from,to,kind,stage,weight=1) => EDGES.push({ from,to,kind,stage,weight,index:EDGES.length });

// World and participant setup.
add('case','s0','evidence',0,1.2); add('case','views','evidence',0); add('profile','views','evidence',0);
add('s0','consent','state',1,1.2); add('profile','goal','state',1); add('profile','tolerance','state',1); add('views','info','state',1); add('s0','booking','state',1); add('s0','money','state',1);

// User utterance becomes grounded evidence.
add('u2','span_goal','evidence',2,1.3); add('u2','span_condition','evidence',2,1.3); add('span_goal','d2','evidence',2); add('span_condition','d2','evidence',2); add('s0','d2','evidence',2,.8); add('views','d2','evidence',2,.8);

// Data Iceberg: one record fans into parallel state variables.
['consent','goal','interest','tolerance','info'].forEach((target,index) => add('d2',target,'state',3,index<2?1.25:.9));
add('span_condition','consent','state',3,1.2); add('span_condition','interest','state',3); add('span_condition','tolerance','state',3);
add('span_goal','goal','state',3,1.2); add('span_goal','interest','state',3); add('views','info','state',3,.8); add('s0','consent','state',3,.8);

// Movie evaluation: state variables fan into an event chain and candidate futures.
['consent','goal','interest','tolerance','info'].forEach((source) => add(source,'current','future',4,.8));
add('s0','past','future',4); add('d2','past','future',4,.8);
['advance','maintain','degrade','collapse'].forEach((target) => { add('current',target,'future',4,1); add('past',target,'future',4,.65); });
add('goal','advance','future',4,1.1); add('interest','advance','future',4); add('tolerance','maintain','future',4); add('consent','collapse','future',4,.8);
['advance','maintain','degrade','collapse'].forEach((source) => add(source,'e2','future',4,.8));

// Assistant action adds external evidence.
add('a2','act_booking','evidence',5,1.3); add('a2','act_refund','evidence',5,1.3); add('a2','d2p','evidence',5); add('d2','d2p','evidence',5,.9); add('act_booking','d2p','evidence',5); add('act_refund','d2p','evidence',5);

// New evidence revises multiple state variables at once.
['consent','interest','tolerance','booking','money','relation'].forEach((target,index) => add('d2p',target,'state',6,index===0?1.2:1));
add('act_booking','booking','state',6,1.4); add('act_booking','consent','state',6,1.2); add('act_booking','interest','state',6); add('act_booking','tolerance','state',6);
add('act_refund','money','state',6,1.4); add('act_refund','relation','state',6,1.1); add('consent','relation','state',6,.8); add('booking','relation','state',6,.8); add('money','relation','state',6,.8);

// Reprojection under the revised state.
['consent','interest','tolerance','booking','money','relation'].forEach((source) => { add(source,'current','future',7,.9); add(source,'collapse','future',7,source==='consent'?1.35:.8); });
add('interest','advance','future',7,1.2); add('tolerance','maintain','future',7,1.1); add('relation','degrade','future',7,1.2); add('current','degrade','future',7); add('current','collapse','future',7,1.3);
['advance','maintain','degrade','collapse'].forEach((source) => add(source,'e2','future',7,1));

// Agency attribution traces the shift back to the assistant action.
add('a2','direction','agency',8,1.2); add('act_booking','direction','agency',8,1.3); add('act_refund','direction','agency',8,1); add('e2','direction','agency',8,1.3);
add('collapse','contribution','agency',8,1.3); add('direction','contribution','agency',8,1.3); add('goal','sustain_goal','agency',8); add('relation','sustain_goal','agency',8);
add('s0','sustain_constraint','agency',8,1.2); add('consent','sustain_constraint','agency',8,1.2); add('a2','sustain_constraint','agency',8,1);

// Normative outputs remain separate from the descriptive world update.
add('contribution','l56','judgment',9,1.1); add('sustain_goal','l34','judgment',9); add('sustain_constraint','l12','judgment',9);
add('direction','l56','judgment',9); add('e2','l34','judgment',9,.8); add('d2p','l12','judgment',9,.8);
add('sustain_constraint','violation','judgment',9,1.4); add('consent','violation','judgment',9,1.1); add('violation','halt','judgment',9,1.5);
['l12','l34','l56','violation','halt'].forEach((source) => add(source,'record','judgment',9,.9));

const kindColors = {
  evidence: '--cyan', state: '--purple', future: '--orange', agency: '--magenta', judgment: '--red',
};
const kindDash = { evidence:[], state:[8,5], future:[2,5], agency:[11,4,2,4], judgment:[] };

const canvas = document.querySelector('#trace-canvas');
const ctx = canvas.getContext('2d');
const shell = document.querySelector('.canvas-shell');
const stageRail = document.querySelector('#stage-rail');
const activeKinds = new Set(Object.keys(kindColors));
const GRAPH_W = 1700;
const GRAPH_H = 720;
let dpr = Math.min(devicePixelRatio,2);
let viewport = { width:1, height:1 };
let view = { scale:1, x:0, y:0 };
let phase = 0;
let playing = false;
let nextPhaseAt = 0;
let density = 'atlas';
let selectedNode = null;
let selectedEdges = new Set();
let selectedNodes = new Set();
let drag = null;
let didDrag = false;
let nodeHitAreas = [];

const cssColor = (variable) => getComputedStyle(document.body).getPropertyValue(variable).trim();
const nodeMap = new Map(NODES.map((item) => [item.id,item]));
const columnMap = new Map(columns.map((item) => [item.key,item]));

function layoutNodes() {
  columns.forEach((column) => {
    const members = NODES.filter((item) => item.column === column.key);
    const start = 230;
    const end = 670;
    const spacing = members.length > 1 ? (end-start)/(members.length-1) : 0;
    members.forEach((item,index) => { item.x=column.x; item.y=start+index*spacing; });
  });
}
layoutNodes();

function resetView() {
  const marginX = 24;
  const marginY = 18;
  view.scale = Math.min((viewport.width-marginX*2)/GRAPH_W,(viewport.height-marginY*2)/GRAPH_H);
  view.x = (viewport.width-GRAPH_W*view.scale)/2;
  view.y = (viewport.height-GRAPH_H*view.scale)/2;
}

function resize() {
  const rect = shell.getBoundingClientRect();
  viewport.width = rect.width;
  viewport.height = rect.height;
  dpr = Math.min(devicePixelRatio,2);
  canvas.width = Math.round(rect.width*dpr);
  canvas.height = Math.round(rect.height*dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  resetView();
}

function toScreen(point) { return { x:point.x*view.scale+view.x, y:point.y*view.scale+view.y }; }
function toGraph(point) { return { x:(point.x-view.x)/view.scale, y:(point.y-view.y)/view.scale }; }

function bezierPoint(edge,t) {
  const from = nodeMap.get(edge.from);
  const to = nodeMap.get(edge.to);
  const dx = Math.max(70,(to.x-from.x)*.44);
  const lane = ((edge.index%7)-3)*5;
  const p0={x:from.x+150,y:from.y};
  const p1={x:from.x+150+dx,y:from.y+lane};
  const p2={x:to.x-dx,y:to.y-lane};
  const p3={x:to.x-12,y:to.y};
  const mt=1-t;
  return {
    x:mt**3*p0.x+3*mt**2*t*p1.x+3*mt*t**2*p2.x+t**3*p3.x,
    y:mt**3*p0.y+3*mt**2*t*p1.y+3*mt*t**2*p2.y+t**3*p3.y,
  };
}

function tracePath(edge,start=0,end=1,segments=36) {
  ctx.beginPath();
  for (let index=0; index<=segments; index+=1) {
    const t=start+(end-start)*(index/segments);
    const point=bezierPoint(edge,t);
    if (index===0) ctx.moveTo(point.x,point.y); else ctx.lineTo(point.x,point.y);
  }
}

function setLineStyle(kind) {
  ctx.strokeStyle = cssColor(kindColors[kind]);
  ctx.setLineDash(kindDash[kind]);
}

function edgeVisibility(edge) {
  if (!activeKinds.has(edge.kind)) return 0;
  if (selectedNode) return selectedEdges.has(edge.index) ? .94 : .015;
  if (density==='focus') {
    if (edge.stage===phase) return 1;
    if (edge.stage<phase) return .07;
    return .012;
  }
  if (edge.stage===phase) return 1;
  if (edge.stage<phase) return .38;
  return .22;
}

function drawGrid() {
  const ink = cssColor('--grid');
  ctx.save();
  ctx.strokeStyle=ink;
  ctx.lineWidth=1/view.scale;
  ctx.setLineDash([]);
  for(let x=0;x<=GRAPH_W;x+=40){ctx.beginPath();ctx.moveTo(x,95);ctx.lineTo(x,700);ctx.stroke();}
  for(let y=100;y<=700;y+=40){ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(1655,y);ctx.stroke();}
  ctx.restore();
}

function drawColumns() {
  const muted=cssColor('--muted');
  const line=cssColor('--line');
  columns.forEach((column) => {
    ctx.save();
    ctx.strokeStyle=line; ctx.lineWidth=1/view.scale; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(column.x-18,202); ctx.lineTo(column.x-18,690); ctx.stroke();
    ctx.fillStyle=muted; ctx.font='800 12px SFMono-Regular, Consolas, monospace';
    ctx.fillText(column.label,column.x,172);
    ctx.font='10px SFMono-Regular, Consolas, monospace';
    ctx.fillText(column.sub,column.x,192);
    ctx.restore();
  });
}

function drawEdges(time) {
  EDGES.forEach((edge) => {
    const visibility=edgeVisibility(edge);
    if(visibility<=0) return;
    ctx.save();
    setLineStyle(edge.kind);
    ctx.globalAlpha=visibility*(edge.stage===phase?.46:.30);
    ctx.lineWidth=(edge.stage===phase?1.12:.62)*Math.min(edge.weight,1.25)/view.scale;
    tracePath(edge); ctx.stroke();

    if(edge.stage===phase || (selectedNode && selectedEdges.has(edge.index))) {
      const head=(time*.00013+edge.index*.071)%1;
      const lengths=[.115,.078,.036];
      const widths=[3.2,1.55,.72];
      const alphas=[.11,.52,.98];
      ctx.setLineDash([]);
      lengths.forEach((length,index)=>{
        const start=head;
        const end=Math.min(1,head+length);
        ctx.globalAlpha=alphas[index];
        ctx.lineWidth=widths[index]*Math.min(edge.weight,1.15)/view.scale;
        if(index===0){ctx.shadowColor=cssColor(kindColors[edge.kind]);ctx.shadowBlur=12/view.scale;}
        tracePath(edge,start,end,12);ctx.stroke();
        if(head+length>1){tracePath(edge,0,(head+length)-1,8);ctx.stroke();}
        ctx.shadowBlur=0;
      });
    }
    ctx.restore();
  });
}

function activeNodeIds() {
  const ids=new Set();
  EDGES.filter((edge)=>edge.stage===phase).forEach((edge)=>{ids.add(edge.from);ids.add(edge.to);});
  return ids;
}

function drawNodes(time) {
  nodeHitAreas=[];
  const ink=cssColor('--ink');
  const muted=cssColor('--muted');
  const line=cssColor('--line');
  const active=activeNodeIds();
  NODES.forEach((item) => {
    const value=item.values(phase);
    const related=!selectedNode || selectedNodes.has(item.id);
    const isActive=active.has(item.id);
    const color= item.column==='observed'?cssColor('--cyan') : item.column==='state'?cssColor('--purple') : item.column==='event'?cssColor('--orange') : item.column==='agency'?cssColor('--magenta') : item.column==='output'?cssColor('--red') : cssColor('--blue');
    ctx.save();
    ctx.globalAlpha=related?(isActive?1:.72):.08;
    if(isActive){ctx.shadowColor=color;ctx.shadowBlur=10+Math.sin(time*.006)*3;}
    ctx.fillStyle=color;
    ctx.fillRect(item.x,item.y-18,34,2);
    ctx.shadowBlur=0;
    ctx.fillStyle=ink;
    ctx.font=`${isActive?'800':'700'} 11px SFMono-Regular, Consolas, monospace`;
    ctx.fillText(item.label,item.x,item.y-3);
    ctx.fillStyle=muted;
    ctx.font='9px SFMono-Regular, Consolas, monospace';
    ctx.fillText(value.text,item.x,item.y+13);
    ctx.strokeStyle=line;ctx.lineWidth=1.35/view.scale;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(item.x,item.y+23);ctx.lineTo(item.x+142,item.y+23);ctx.stroke();
    ctx.strokeStyle=color;ctx.lineWidth=1.7/view.scale;
    ctx.beginPath();ctx.moveTo(item.x,item.y+23);ctx.lineTo(item.x+142*Math.max(0,Math.min(1,value.score)),item.y+23);ctx.stroke();
    if(selectedNode===item.id){ctx.strokeStyle=color;ctx.lineWidth=1.5/view.scale;ctx.strokeRect(item.x-8,item.y-27,162,60);}
    ctx.restore();
    nodeHitAreas.push({id:item.id,x:item.x-10,y:item.y-29,w:170,h:62});
  });
}

function draw(time) {
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,viewport.width,viewport.height);
  ctx.fillStyle=cssColor('--bg');ctx.fillRect(0,0,viewport.width,viewport.height);
  ctx.save();
  ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);
  drawGrid();drawColumns();drawEdges(time);drawNodes(time);
  ctx.restore();
}

function auditNode(id) {
  selectedNode=id;
  selectedEdges=new Set();selectedNodes=new Set([id]);
  let upstream=new Set([id]);
  let downstream=new Set([id]);
  for(let depth=0;depth<3;depth+=1){
    const nextUp=new Set();
    const nextDown=new Set();
    EDGES.forEach((edge)=>{
      if(upstream.has(edge.to)){
        selectedEdges.add(edge.index);selectedNodes.add(edge.from);selectedNodes.add(edge.to);nextUp.add(edge.from);
      }
      if(downstream.has(edge.from)){
        selectedEdges.add(edge.index);selectedNodes.add(edge.from);selectedNodes.add(edge.to);nextDown.add(edge.to);
      }
    });
    upstream=nextUp;downstream=nextDown;
    if(!upstream.size&&!downstream.size)break;
  }
  updateInspector(nodeMap.get(id));
  document.querySelector('#trace-inspector').classList.add('open');
}

function updateInspector(item) {
  const value=item.values(phase);
  document.querySelector('#inspector-title').textContent=item.label;
  document.querySelector('#inspector-description').textContent=`This object is part of the ${item.column} layer. Audit mode exposes the evidence that produced it and the consequences it feeds.`;
  document.querySelector('#inspector-type').textContent=item.type;
  document.querySelector('#inspector-value').textContent=value.text;
  document.querySelector('#inspector-source').textContent=item.source;
}

function setPhase(next) {
  phase=Math.max(0,Math.min(STAGES.length-1,next));
  const stage=STAGES[phase];
  document.querySelector('#stage-number').textContent=`${String(phase+1).padStart(2,'0')} / 10`;
  document.querySelector('#stage-title').textContent=stage.title;
  document.querySelector('#stage-description').textContent=stage.description;
  document.querySelector('#stage-operation').textContent=stage.operation;
  document.querySelector('#stat-active').textContent=stage.formula;
  document.querySelectorAll('.stage-button').forEach((button,index)=>{
    button.classList.toggle('active',index===phase);button.classList.toggle('done',index<phase);
  });
  if(selectedNode)updateInspector(nodeMap.get(selectedNode));
  if(playing)nextPhaseAt=performance.now()+3600;
}

STAGES.forEach((stage,index)=>{
  const button=document.createElement('button');
  button.className='stage-button';
  button.innerHTML=`<em>${String(index+1).padStart(2,'0')}</em><b>${stage.short}</b><small>${stage.formula}</small>`;
  button.addEventListener('click',()=>{playing=false;document.querySelector('#play').innerHTML='<span>▶</span> Play trace';setPhase(index);});
  stageRail.appendChild(button);
});

document.querySelector('#stat-nodes').textContent=NODES.length;
document.querySelector('#stat-traces').textContent=EDGES.length;
document.querySelectorAll('.bundle-filter button[data-kind]').forEach((button)=>button.addEventListener('click',()=>{
  const kind=button.dataset.kind;
  if(activeKinds.has(kind))activeKinds.delete(kind);else activeKinds.add(kind);
  const enabled=activeKinds.has(kind);
  button.classList.toggle('active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.querySelector('em').textContent=enabled?'ON':'OFF';
  document.querySelector('.filter-heading small').textContent=`${activeKinds.size} / 5 visible`;
}));

function setDensity(next){
  density=next;
  document.querySelectorAll('[data-density]').forEach((button)=>button.classList.toggle('active',button.dataset.density===density));
}
document.querySelectorAll('[data-density]').forEach((button)=>button.addEventListener('click',()=>setDensity(button.dataset.density)));
document.querySelector('#theme-toggle').addEventListener('click',(event)=>{
  const paper=document.body.classList.toggle('paper-theme');
  document.body.classList.toggle('dark-theme',!paper);
  event.currentTarget.innerHTML=paper?'<span>◑</span> Dark':'<span>◐</span> Paper';
  selectedNode=null;selectedEdges.clear();selectedNodes.clear();
  document.querySelector('#trace-inspector').classList.remove('open');
  setDensity('atlas');
  resetView();
});
document.querySelector('#reset-view').addEventListener('click',()=>{resetView();selectedNode=null;selectedEdges.clear();selectedNodes.clear();document.querySelector('#trace-inspector').classList.remove('open');});
document.querySelector('#restart').addEventListener('click',()=>{playing=false;document.querySelector('#play').innerHTML='<span>▶</span> Play trace';selectedNode=null;selectedEdges.clear();selectedNodes.clear();setDensity('atlas');document.querySelector('#trace-inspector').classList.remove('open');setPhase(0);resetView();});
document.querySelector('#play').addEventListener('click',(event)=>{
  if(!playing&&phase===STAGES.length-1)setPhase(0);
  playing=!playing;event.currentTarget.innerHTML=playing?'<span>Ⅱ</span> Pause':'<span>▶</span> Play trace';nextPhaseAt=performance.now()+3600;
});
document.querySelector('#export-png').addEventListener('click',()=>{
  const link=document.createElement('a');
  link.download=`interacteval-case002-traces-stage${phase+1}.png`;
  link.href=canvas.toDataURL('image/png');link.click();
});

canvas.addEventListener('pointerdown',(event)=>{
  canvas.setPointerCapture(event.pointerId);drag={x:event.clientX,y:event.clientY,viewX:view.x,viewY:view.y};didDrag=false;
});
canvas.addEventListener('pointermove',(event)=>{
  if(!drag)return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(Math.hypot(dx,dy)>3)didDrag=true;
  view.x=drag.viewX+dx;view.y=drag.viewY+dy;
});
canvas.addEventListener('pointerup',(event)=>{
  if(!didDrag){
    const rect=canvas.getBoundingClientRect();
    const point=toGraph({x:event.clientX-rect.left,y:event.clientY-rect.top});
    const hit=nodeHitAreas.find((area)=>point.x>=area.x&&point.x<=area.x+area.w&&point.y>=area.y&&point.y<=area.y+area.h);
    if(hit)auditNode(hit.id);else{selectedNode=null;selectedEdges.clear();selectedNodes.clear();document.querySelector('#trace-inspector').classList.remove('open');}
  }
  drag=null;
});
canvas.addEventListener('wheel',(event)=>{
  event.preventDefault();
  const rect=canvas.getBoundingClientRect();
  const mouse={x:event.clientX-rect.left,y:event.clientY-rect.top};
  const before=toGraph(mouse);
  const factor=Math.exp(-event.deltaY*.001);
  view.scale=Math.max(.35,Math.min(2.2,view.scale*factor));
  view.x=mouse.x-before.x*view.scale;view.y=mouse.y-before.y*view.scale;
},{passive:false});

function animate(time){
  requestAnimationFrame(animate);
  if(playing&&time>nextPhaseAt){
    if(phase<STAGES.length-1)setPhase(phase+1);else{playing=false;document.querySelector('#play').innerHTML='<span>↺</span> Replay';}
  }
  draw(time);
}

window.addEventListener('resize',resize);
resize();setPhase(0);updateInspector(nodeMap.get('s0'));animate(0);
