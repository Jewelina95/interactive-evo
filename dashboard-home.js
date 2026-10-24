function homeMetricCard(id, modelGroups) {
  const metric=metrics.find((item)=>item.id===id);
  const category=metric.category==='Overview'?'Overview':metric.category;
  return `<article class="home-metric"><h3><a href="#models?category=${category}&metric=${id}"><i class="metric-square square-${id}"></i>${esc(metric.title)}<span>↗</span></a></h3><p>${esc(metric.description)} · ${esc(metric.direction)}</p>${chart(metric,modelGroups)}</article>`;
}
function homeInterestRelationship(capability, modelGroups) {
  const index=Number(capability.split('-')[1])-1,level=`L${index+1}`;
  const rows=modelGroups.map((group)=>{
    const paired=group.records.filter((record)=>Number.isFinite(number(record.capability_level_means?.[index]))&&Number.isFinite(number(record.user_interest_change)));
    return {...group,paired,score:average(paired.map((record)=>number(record.capability_level_means[index]))),change:median(paired.map((record)=>number(record.user_interest_change)))};
  }).filter((group)=>group.paired.length).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  const count=rows.reduce((sum,row)=>sum+row.paired.length,0),excluded=modelGroups.reduce((sum,group)=>sum+group.records.length,0)-count;
  return `<article class="home-metric home-relationship" data-relationship-level="${level}"><h3><i class="metric-square"></i>${level} score &amp; interest change</h3><p>${esc(levelNames[index])} · ${count} paired cases${excluded?` · ${excluded} missing ${excluded===1?'pair':'pairs'} excluded`:''}</p>${rows.length?`<table class="relationship-summary"><caption class="sr-only">${level} mean score and median interest change by model, using the same paired cases</caption><thead><tr><th scope="col">Model</th><th scope="col">${level} score</th><th scope="col">Interest change</th><th scope="col">n</th></tr></thead><tbody>${rows.map((row)=>`<tr><th scope="row"><button type="button" data-relationship-model="${esc(row.name)}" data-relationship-capability="${capability}" aria-label="Open ${esc(row.name)} ${level} paired conversations"><img src="${providerAsset(row.name)}" alt=""/><span>${esc(row.name)}</span></button></th><td><b>${percent(row.score)}</b><i class="relationship-score-track"><em style="width:${row.score*100}%;background:${colors[row.name]}"></em></i></td><td class="${row.change<0?'negative':'positive'}"><b>${delta(row.change)}</b><i class="relationship-change-track"><em style="left:${row.change<0?50+row.change*50:50}%;width:${Math.abs(row.change)*50}%;background:${row.change<0?'#b18470':'#587666'}"></em></i></td><td>${row.paired.length}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">No complete score and interest-change pairs are available.</div>'}<div class="relationship-note"><span>Mean score and median interest change use the same paired cases. Select a model to inspect its conversations.</span><a href="#models?category=Engagement&metric=interest-change">Overall interest change · Engagement ↗</a></div></article>`;
}
function homeModelGroups(){
  return state.modelNames.map((name)=>({name,records:state.cases.filter((record)=>record.assistant===name)}));
}
function openRelationshipCases(name,capability){
  const index=Number(capability.split('-')[1])-1,level=`L${index+1}`;
  const records=state.cases.filter((record)=>record.assistant===name&&Number.isFinite(number(record.capability_level_means?.[index]))&&Number.isFinite(number(record.user_interest_change))).sort((a,b)=>number(b.capability_level_means[index])-number(a.capability_level_means[index]));
  dialog(`${name} · ${level}`,'PAIRED CONVERSATIONS',`<p class="detail-subtitle">${esc(levelNames[index])} · ${records.length} paired conversations</p><div class="table-wrap"><table class="results-table"><thead><tr><th>Case</th><th>${level} score</th><th>Interest change</th><th>Outcome</th></tr></thead><tbody>${records.map((record)=>`<tr><td><button class="case-open" data-case="${esc(record.id)}">${record.id.toUpperCase()}</button><small>${esc(record.scene_id)}</small></td><td>${percent(number(record.capability_level_means[index]))}</td><td>${delta(number(record.user_interest_change))}</td><td>${outcomeLabel[outcome(record)]}</td></tr>`).join('')}</tbody></table></div>`);
}
function updateHomeOverview(){
  const tab=state.homeTab||'language';
  document.querySelectorAll('[data-home-tab]').forEach((button)=>{const active=button.dataset.homeTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
  const grid=$('.home-overview-grid');grid.setAttribute('aria-label',`${tab==='language'?'Language models':tab} overview`);
  grid.innerHTML=homeOverviewCards(tab,homeModelGroups());bindChartActions(grid);
}
function homeOverviewCards(tab,modelGroups){
  return tab==='language'?['composite','closure','turns'].map((id)=>homeMetricCard(id,modelGroups)).join(''):[['Quality','Case records are pending'],['Interaction','Checkpoint data is pending'],['Coverage','Scenario assignments are pending']].map(([title,note])=>`<article class="home-metric home-metric-pending"><h3><i class="metric-square"></i>${tab[0].toUpperCase()+tab.slice(1)} · ${title}</h3><p>${note}</p><div><span class="pending-label">Pending</span><a href="#multimodal?modality=${tab}">View ${tab} evaluations ↗</a></div></article>`).join('');
}
function updateHomeCapability(){
  const capability=state.homeCapability||'level-1',modelGroups=homeModelGroups();
  document.querySelectorAll('[data-home-capability]').forEach((button)=>{const active=button.dataset.homeCapability===capability;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
  const grid=$('.home-capability-grid');grid.innerHTML=homeMetricCard(capability,modelGroups)+homeInterestRelationship(capability,modelGroups);bindChartActions(grid);
}
const narrativeFlowState={caseId:'case_001',raw:null,turn:0,stage:'evidence',timer:null};
function narrativeExcerpt(value,limit=210){
  const clean=copy(value||'').replace(/\s+/g,' ').trim();
  return clean.length>limit?`${clean.slice(0,limit).trim()}…`:clean;
}
function narrativeTheoryMarkup(){
  const principles=[
    ['01','OBSERVATIONAL INCOMPLETENESS','Data Iceberg Theory','Ψₜ = ΦΨ(Dₜ)','Reconstruct an evidence-grounded operational state instead of treating the transcript as the complete interaction world.','evidence → operational state'],
    ['02','TEMPORAL NON-SEPARABILITY','Movie Evaluation Theory','Vₜ = V(τₜ) · Eₜ = (Pₜ, Cₜ, Fₜ)','Evaluate an action through the history-conditioned state transition and the continuations it makes possible.','past → present → conditional futures'],
    ['03','DIRECTIONAL CONTRIBUTION','Agency Principle','Ainit(hₜ) = Avalid(hₜ) \\ Aresp(hₜ)','Distinguish appropriate response from warranted initiative, then test whether the introduced direction remains coherent.','initiative → direction → persistence']
  ];
  return `<div class="principle-grid">${principles.map(([n,kicker,title,formula,body,flow])=>`<article class="principle-card"><div class="principle-index">${n}<span>${kicker}</span></div><div class="principle-orbit" aria-hidden="true"><i></i><i></i><i></i></div><h3>${title}</h3><code>${formula}</code><p>${body}</p><span class="principle-flow">${flow}</span></article>`).join('')}</div>`;
}
function architectureFlowMarkup(){
  const layers=[
    ['CONSTRUCT','Data layer','Cᵉᵛᵃˡ + role views','A declared scenario space determines the initial scene, role conditions and information asymmetry.'],
    ['EXCHANGE','Interaction layer','O = (u, a)','User and assistant actions generate the observable record D.'],
    ['RECONSTRUCT','Mechanism layer','Wₜ = (Sₜ, Ψₜ, Eₜ)','Scene, latent state and event chain are updated and stored with their evidence after each subturn.'],
    ['ADJUDICATE','Normative layer','(Jₜ, Vₜ, hₜ) = φN(Wₜ, Dₜ)','Capability, red-line and termination decisions remain separate from descriptive reconstruction.']
  ];
  return `<div class="architecture-flow">${layers.map(([verb,title,formula,body],index)=>`<article><span>${String(index+1).padStart(2,'0')} · ${verb}</span><h3>${title}</h3><code>${formula}</code><p>${body}</p></article>${index<layers.length-1?'<i class="architecture-arrow" aria-hidden="true">→</i>':''}`).join('')}</div><div class="architecture-loop"><span>NEW EVIDENCE</span><b>D<sub>t+1</sub></b><i>reconstruct Ψ</i><i>extend E</i><i>revise S when warranted</i><strong>next sub-stage ↺</strong></div>`;
}
function narrativeMessages(raw,item){
  const assistant=raw.transcript.find((message)=>message.role==='assistant'&&message.assistant_turn===item.assistant_turn);
  const user=[...raw.transcript].reverse().find((message)=>message.role==='user'&&message.index<(assistant?.index??Infinity));
  return {assistant,user};
}
function latentReading(value){return copy(value?.degree||value?.value||'recorded').replaceAll('_',' ');}
function narrativeStageDetail(stage,item,raw,index){
  const {assistant,user}=narrativeMessages(raw,item),items=raw.evaluation_record||[],previous=items[index-1],levels=item.capability_judgment?.levels||[],paths=item.event_chain?.future?.paths||[],slots=item.latent_state?.slots||{};
  if(stage==='evidence')return `<span class="flow-detail-kicker">OBSERVED EXCHANGE · d<sub>t</sub></span><h4>What the evaluator can actually see</h4><div class="flow-quotes"><blockquote><b>User</b>${esc(narrativeExcerpt(user?.text,360))}</blockquote><blockquote><b>Assistant · turn ${item.assistant_turn}</b>${esc(narrativeExcerpt(assistant?.text,460))}</blockquote></div><p class="interpretation-rule"><b>Direct evidence.</b> Scene, state and event records may interpret this exchange, but they cannot add unsupported facts.</p>`;
  if(stage==='state'){
    const order=['trust','anxiety','frustration','primary_goal','negotiation_mode','vigilance'],names=[...order.filter((name)=>slots[name]),...Object.keys(slots).filter((name)=>!order.includes(name))].slice(0,4);
    return `<span class="flow-detail-kicker">LATENT STATE · ψ<sub>t</sub> = g(ψ<sub>t−1</sub>, d<sub>t</sub>, S)</span><h4>Evidence-grounded state reconstruction</h4><div class="state-transition-list">${names.map((name)=>{const current=slots[name],before=previous?.latent_state?.slots?.[name];return `<article><span>${esc(name.replaceAll('_',' '))}</span><div><small>${before?esc(latentReading(before)):'not yet recorded'}</small><i>→</i><strong>${esc(latentReading(current))}</strong></div><p>${esc(narrativeExcerpt(current.expression||current.reasoning_trace,190))}</p></article>`;}).join('')}</div><p class="interpretation-rule"><b>Operational estimate, not mind reading.</b> ${esc(narrativeExcerpt(item.latent_state?.change_reason,420))}</p>`;
  }
  if(stage==='event'){
    const history=item.event_chain?.past?.history_added||[],present=item.event_chain?.present?.plot_point||[];
    return `<span class="flow-detail-kicker">EVENT CHAIN · E<sub>t</sub> = h(E<sub>t−1</sub>, d<sub>t</sub>, ψ<sub>t</sub>, S)</span><h4>How the interaction is developing</h4><div class="event-time-grid"><article><span>PAST · accumulated</span><p>${esc(narrativeExcerpt(history.at(-1)||item.event_chain?.past?.premise?.[0],250))}</p></article><article><span>PRESENT · active situation</span><p>${esc(narrativeExcerpt(present[0],250))}</p></article><article><span>FUTURE · candidate continuations</span><div class="future-paths">${paths.map((path)=>`<div class="path-${String(path.label).toLowerCase()}"><span>${esc(path.label)}</span><i><em style="width:${number(path.probability)*100}%"></em></i><b>${percent(number(path.probability))}</b></div>`).join('')}</div></article></div><p class="interpretation-rule"><b>Descriptive, not evaluative.</b> Advance, Maintain, Degrade and Collapse describe the projected course; they are not capability grades.</p>`;
  }
  return `<span class="flow-detail-kicker">ADJUDICATION · J<sub>t</sub> = j(a<sub>t</sub>, S, ψ<sub>t</sub>, E<sub>t</sub>)</span><h4>What the assistant demonstrated</h4><div class="judgment-layout"><div class="judgment-levels">${levels.map((level)=>`<div class="${level.level==='L5'?'is-agency':''}"><span>${esc(level.level)} · ${esc(level.name)}${level.level==='L5'?'<small>AGENCY</small>':''}</span><i><em style="width:${number(level.capped_score)*100}%"></em></i><b>${decimal(number(level.capped_score))}</b></div>`).join('')}</div><aside><span>WHY AGENCY IS HERE</span><p>L5 asks whether this response introduced a useful direction that the user had not already established. L6 asks whether that direction remains coherent across later turns.</p></aside></div><div class="judgment-summary"><span>Turn value <b>${decimal(number(item.turn_score))}</b></span><span>Blocking dimension <b>${esc(item.capability_judgment?.blocking_dimension||'none')}</b></span><span>Continue? <b>${esc(item.termination?.decision||'—')}</b></span></div>`;
}
function narrativeMechanismMap(item,raw){
  const paths=item.event_chain?.future?.paths||[],levels=item.capability_judgment?.levels||[],l5=levels.find((level)=>level.level==='L5'),dominant=item.event_chain?.future?.dominant_path||{};
  const writeback=item.termination?.decision==='continue'?`ψ<sub>t</sub> + E<sub>t</sub> are written back to turn ${Number(item.assistant_turn)+1} ↺`:'ψ<sub>t</sub> + E<sub>t</sub> remain in the auditable final record';
  const nodes=[
    ['evidence','01','dₜ','Observe',`assistant turn ${item.assistant_turn}`,'What was said'],
    ['state','02','ψₜ','Reconstruct',`${Object.keys(item.latent_state?.slots||{}).length} active states`,'What it now means'],
    ['event','03','Eₜ','Track',`${paths.length} candidate futures`,'Where it may lead'],
    ['judgment','04','Jₜ','Adjudicate',`L5 ${decimal(number(l5?.capped_score))}`,'What capability was shown']
  ];
  return `<div class="mechanism-map"><div class="scene-context"><div><span>SCENE · S</span><strong>Context held across the whole turn</strong></div><p><b>Goal</b>${esc(narrativeExcerpt(raw.scene.objective,155))}</p><p><b>Boundary</b>${esc(narrativeExcerpt(raw.scene.interaction_boundary,155))}</p></div><div class="mechanism-steps" role="tablist" aria-label="Evaluation mechanism">${nodes.map(([id,n,symbol,verb,value,question],step)=>`${step?`<div class="mechanism-arrow" aria-hidden="true"><i></i><span>${step===1?'grounds':step===2?'updates':'supports'}</span></div>`:''}<button type="button" class="mechanism-node ${narrativeFlowState.stage===id?'active':''}" data-flow-stage="${id}" role="tab" aria-selected="${narrativeFlowState.stage===id}"><small>${n} · ${verb}</small><strong>${symbol}</strong><b>${esc(value)}</b><span>${question}</span></button>`).join('')}</div><div class="mechanism-readout"><span><b>Dominant course</b>${esc(dominant.label||'—')} · ${Number.isFinite(number(dominant.probability))?percent(number(dominant.probability)):'not recorded'}</span><span><b>Turn judgment</b>${decimal(number(item.turn_score))}</span><span><b>Halt controller</b>${esc(item.termination?.decision||'—')}</span><strong>${writeback}</strong></div></div>`;
}
function renderHeroCase(raw,item,index){
  const root=$('#hero-case-preview');if(!root)return;const {assistant,user}=narrativeMessages(raw,item),dominant=item.event_chain?.future?.dominant_path||{},trust=item.latent_state?.slots?.trust;
  root.innerHTML=`<div class="hero-case-top"><span>LIVE CASE · ${esc(raw.case_id.toUpperCase())} / ${esc(raw.scene.scene_id)}</span><b>turn ${index+1} of ${raw.evaluation_record.length}</b></div><h2>One response, read inside<br>the whole interaction.</h2><div class="hero-exchange"><p><b>USER</b>${esc(narrativeExcerpt(user?.text,150))}</p><p><b>ASSISTANT</b>${esc(narrativeExcerpt(assistant?.text,190))}</p></div><div class="hero-case-signals"><span><small>STATE</small>${trust?`trust · ${esc(latentReading(trust))}`:`${Object.keys(item.latent_state?.slots||{}).length} active states`}</span><span><small>COURSE</small>${esc(dominant.label||'—')} · ${Number.isFinite(number(dominant.probability))?percent(number(dominant.probability)):'—'}</span><span><small>JUDGMENT</small>${decimal(number(item.turn_score))} · ${esc(item.termination?.decision||'—')}</span></div><button type="button" data-story-target="story-demo">Open the full case trace ↓</button>`;
}
function renderNarrativeFlow(){
  const root=$('#narrative-flow');if(!root||!narrativeFlowState.raw)return;
  const raw=narrativeFlowState.raw,items=raw.evaluation_record||[],index=Math.max(0,Math.min(narrativeFlowState.turn,items.length-1)),item=items[index];narrativeFlowState.turn=index;
  const dominant=item.event_chain?.future?.dominant_path||{},moved=item.event_chain?.present?.present_moved;
  root.dataset.stage=narrativeFlowState.stage;
  root.innerHTML=`<div class="flow-case-head"><div><span>RECORDED CASE · EVERY VALUE COMES FROM THE ARCHIVE</span><h3>${esc(raw.case_id.toUpperCase())} · ${esc(raw.scene.scene_id)}</h3><p>${esc(raw.administration.assistant_system)} · ${esc(raw.scene.facets.realism)} · ${esc(raw.scene.facets.information)} information · ${esc(raw.scene.facets.purpose)}</p></div><div class="flow-case-facts"><span>Evaluated turn <b>${index+1}/${items.length}</b></span><span>Current course <b>${esc(dominant.label||'—')} ${Number.isFinite(number(dominant.probability))?percent(number(dominant.probability)):''}</b></span><span>Case outcome <b>${esc(raw.outcome.ending)}</b></span></div></div>${narrativeMechanismMap(item,raw)}<div class="flow-detail">${narrativeStageDetail(narrativeFlowState.stage,item,raw,index)}</div><div class="flow-controls"><button type="button" class="flow-play" data-flow-play aria-label="${narrativeFlowState.timer?'Pause':'Play'} case turns">${narrativeFlowState.timer?'Ⅱ':'▶'}</button><label><span>TURN 1</span><input id="trajectory-turn" type="range" min="0" max="${items.length-1}" step="1" value="${index}" aria-label="Evaluated assistant turn"><span>TURN ${items.length}</span></label><output>Assistant turn ${item.assistant_turn} · ${moved?'state changed':'state carried forward'}</output></div>`;
  renderHeroCase(raw,item,index);
}
async function loadNarrativeCase(id){
  narrativeFlowState.caseId=id;narrativeFlowState.turn=0;narrativeFlowState.stage='evidence';
  const root=$('#narrative-flow');if(root)root.innerHTML='<div class="flow-loading">Loading the recorded trajectory…</div>';
  try{const response=await fetch(`./data/cases/${encodeURIComponent(id)}.json?v=narrative-v1`);if(!response.ok)throw new Error('Case record unavailable');narrativeFlowState.raw=await response.json();renderNarrativeFlow();}
  catch(error){if(root)root.innerHTML=`<div class="flow-loading">${esc(error.message)}</div>`;}
}
function bindNarrativeReadingMap(){
  const links=[...document.querySelectorAll('.reading-map [data-story-target]')],sections=links.map((link)=>document.querySelector(`#${link.dataset.storyTarget}`)).filter(Boolean);if(!links.length)return;
  const observer=new IntersectionObserver((entries)=>{const visible=entries.filter((entry)=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;links.forEach((link)=>link.classList.toggle('active',link.dataset.storyTarget===visible.target.id));},{rootMargin:'-22% 0px -58%',threshold:[0,.2,.6]});sections.forEach((section)=>observer.observe(section));
}
function renderHome() {
  const modelGroups=homeModelGroups(),total=state.cases.length,scenes=new Set(state.cases.map((record)=>record.scene_id)).size;
  const snapshot=homeOverviewCards('language',modelGroups);
  $('#page-count').textContent='';
  $('#page-content').innerHTML=`<div class="narrative-layout"><aside class="reading-map" aria-label="Page sections"><span>CONTENTS</span>${[['intro','00','Project'],['demo','01','Case demo'],['theory','02','Principles'],['measurement','03','Architecture'],['results','04','Results']].map(([id,n,label])=>`<button type="button" data-story-target="story-${id}" class="${id==='intro'?'active':''}"><b>${n}</b>${label}</button>`).join('')}</aside><main class="narrative-main"><section class="home-hero story-section" id="story-intro"><div><span class="story-kicker">INTERACTEVAL · PROCESS-ORIENTED EVALUATION</span><h1>InteractEval</h1><p>A process-oriented measurement framework for the next generation of interactive AI—evaluating the world a system interprets, the trajectory it produces, and the agency it exercises over time.</p><div class="hero-actions"><button type="button" data-story-target="story-demo">Explore a recorded case ↓</button><a href="./assets/Qwen_InteractEval.pdf">Paper ↗</a></div></div><aside id="hero-case-preview" class="hero-case-demo" aria-label="Live case preview"><div class="hero-case-loading">Loading a recorded case…</div></aside></section>
  <section class="story-section trace-section" id="story-demo"><div class="story-heading trace-heading"><div><span>01 · RECORDED CASE DEMO</span><h2>Follow one exchange<br>through the evaluator</h2><p>Choose a case and assistant turn. Scene context grounds the exchange; latent state and event chain reconstruct what changed; a separate adjudicator assigns L1–L6 capability and decides whether the interaction should continue.</p></div><label class="case-trace-select"><span>CASE RECORD</span><select id="narrative-case">${state.cases.map((record)=>`<option value="${esc(record.id)}" ${record.id===narrativeFlowState.caseId?'selected':''}>${esc(record.id.toUpperCase())} · ${esc(record.assistant)} · ${esc(record.scene_id)}</option>`).join('')}</select></label></div><div id="narrative-flow" class="interaction-lab"><div class="flow-loading">Loading the recorded trajectory…</div></div><div class="scale-note"><span><i></i>Bars encode archived 0–1 scores or future-path probabilities.</span><span>State labels remain qualitative because the record treats them as evidence-grounded hypotheses, not direct measurements.</span></div></section>
  <section class="story-section theory-section" id="story-theory"><div class="story-heading"><span>02 · THEORETICAL FOUNDATIONS</span><h2>Three sources<br>of incompleteness</h2><p>Observed language underdetermines the interaction world; a turn’s value depends on its trajectory; and responsiveness does not establish who changed the direction of the interaction.</p></div>${narrativeTheoryMarkup()}</section>
  <section class="story-section measurement-section" id="story-measurement"><div class="story-heading"><span>03 · MEASUREMENT ARCHITECTURE</span><h2>Reconstruct first.<br>Adjudicate second.</h2><p>Case construction and interaction establish what can be observed. Mechanism reconstruction and normative adjudication remain separate, connected by a common evidence record.</p></div>${architectureFlowMarkup()}<div class="capability-chain" id="story-levels"><span>CAPABILITY HIERARCHY</span>${[['L1','Goal preservation'],['L2','Information uptake'],['L3','State progression'],['L4','Contextual expression'],['L5','Proactive agency'],['L6','Long-horizon coherence']].map(([level,label],index)=>`<div><b>${level}</b><em>${label}</em><small>${index<2?'passive execution':index<4?'responsive adaptation':'active adaptation'}</small></div>`).join('')}</div></section>
  <section class="story-section results-intro" id="story-results"><div class="story-heading"><span>04 · EMPIRICAL STUDY</span><h2>Where systems<br>begin to separate</h2><p>The paper evaluates ten frontier systems over a controlled 27-cell scenario space. The interactive archive below provides ${total} auditable records from ${scenes} scenes.</p></div><div class="study-findings"><article><strong>0.035 → 0.370</strong><span>performance range</span><p>Reported spread grows from passive execution to active adaptation.</p></article><article><strong>9.9%</strong><span>partner-specific variance</span><p>Assistant-side scores depend partly on the pairing of interacting systems.</p></article><article><strong>27</strong><span>scenario cells</span><p>Realism × information sufficiency × interaction purpose.</p></article></div></section>
  <section class="home-overview" aria-label="Current archive results"><div class="archive-heading"><div><span>CURRENT INTERACTIVE ARCHIVE</span><h2>${state.modelNames.length} systems · ${total} case records</h2></div><p>These charts summarize the records shipped with this site. Select a bar to open the corresponding model profile.</p></div><div class="home-overview-grid">${snapshot}</div><div class="result-actions"><a href="#models">Explore model results ↗</a><a href="#leaderboards">Open leaderboards ↗</a><a href="#architecture?section=cases">Inspect case evidence ↗</a><a href="./research.html">Methods and definitions ↗</a></div></section></main></div>`;
  bindChartActions($('.home-overview'));
  bindNarrativeReadingMap();loadNarrativeCase(narrativeFlowState.caseId);
}
function renderComparison() {
  const allGroups=groups(state.cases.filter((record)=>(state.setting==='all'||record.realism===state.setting)&&(state.information==='all'||record.information===state.information)&&(state.purpose==='all'||record.purpose===state.purpose)&&(state.scene==='all'||record.scene_id===state.scene)&&(state.partner==='all'||record.partner===state.partner)));
  const names=allGroups.map((group)=>group.name);
  const first=names.includes(state.compareA)?state.compareA:names[0];
  const second=names.includes(state.compareB)&&state.compareB!==first?state.compareB:names.find((name)=>name!==first);
  if(!first||!second){$('#page-content').innerHTML='<section class="section-panel"><h2>Choose a wider case selection</h2><p>Two models with assigned cases are needed for this comparison.</p><a class="solid-button" href="#models">Adjust comparison conditions</a></section>';return;}
  state.compareA=first;state.compareB=second;
  const chosen=[first,second].map((name)=>allGroups.find((group)=>group.name===name));
  $('#page-count').textContent=chosen.reduce((count,group)=>count+group.records.length,0)+' cases · 2 models';
  $('#page-content').innerHTML=`<section class="section-panel comparison-panel"><h2>Two models, one view</h2><p>Compare recorded outcomes and capabilities within the current case conditions. Sample counts remain attached to each model.</p><div class="comparison-selectors">${[['compare-a',first],['compare-b',second]].map(([id,value])=>`<label><span>${id==='compare-a'?'FIRST MODEL':'SECOND MODEL'}</span><select id="${id}">${names.map((name)=>`<option value="${esc(name)}" ${name===value?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`).join('<span class="comparison-vs">vs.</span>')}</div><div class="comparison-summary">${chosen.map((group)=>`<article><div><img src="${providerAsset(group.name)}" alt=""/><h3>${esc(group.name)}</h3><span>n=${group.records.length}</span></div><dl>${['composite','closure','turns','interest-change'].map((id)=>{const metric=metrics.find((item)=>item.id===id);return `<div><dt>${metric.title}</dt><dd>${metric.format(metric.get(group.records))}</dd></div>`;}).join('')}</dl><a href="#model/${encodeURIComponent(group.name)}">Model profile ↗</a></article>`).join('')}</div><h3>Six capability dimensions</h3><div class="comparison-capabilities">${metrics.filter((metric)=>metric.category==='Capabilities').map((metric)=>`<div><h4>${esc(metric.title)}</h4>${chosen.map((group)=>`<div><span>${esc(group.name)}</span><i><em style="width:${metric.get(group.records)*100}%;background:${colors[group.name]}"></em></i><b>${percent(metric.get(group.records))}</b></div>`).join('')}</div>`).join('')}</div><h3>Complete metric readout</h3>${renderTable(metrics,chosen)}</section>`;
  bindChartActions($('#page-content'));
}
document.addEventListener('click',(event)=>{
  const storyTarget=event.target.closest('[data-story-target]');if(storyTarget){document.querySelector(`#${storyTarget.dataset.storyTarget}`)?.scrollIntoView({behavior:'smooth',block:'start'});}
  const flowStage=event.target.closest('[data-flow-stage]');if(flowStage){narrativeFlowState.stage=flowStage.dataset.flowStage;renderNarrativeFlow();}
  const play=event.target.closest('[data-flow-play]');if(play){
    if(narrativeFlowState.timer){clearInterval(narrativeFlowState.timer);narrativeFlowState.timer=null;renderNarrativeFlow();}
    else if(narrativeFlowState.raw){narrativeFlowState.timer=setInterval(()=>{if(!$('#narrative-flow')){clearInterval(narrativeFlowState.timer);narrativeFlowState.timer=null;return;}const length=narrativeFlowState.raw.evaluation_record.length;narrativeFlowState.turn=(narrativeFlowState.turn+1)%length;const sequence=['evidence','state','event','judgment'];narrativeFlowState.stage=sequence[(sequence.indexOf(narrativeFlowState.stage)+1)%sequence.length];renderNarrativeFlow();},2200);renderNarrativeFlow();}
  }
  const tab=event.target.closest('[data-home-tab]');if(tab){state.homeTab=tab.dataset.homeTab;updateHomeOverview();}
  const capability=event.target.closest('[data-home-capability]');if(capability){state.homeCapability=capability.dataset.homeCapability;updateHomeCapability();}
  const paired=event.target.closest('[data-relationship-model]');if(paired)openRelationshipCases(paired.dataset.relationshipModel,paired.dataset.relationshipCapability);
});
document.addEventListener('change',(event)=>{if(event.target.id==='compare-a'||event.target.id==='compare-b'){state[event.target.id==='compare-a'?'compareA':'compareB']=event.target.value;renderComparison();}if(event.target.id==='narrative-case'){if(narrativeFlowState.timer){clearInterval(narrativeFlowState.timer);narrativeFlowState.timer=null;}loadNarrativeCase(event.target.value);}});
document.addEventListener('input',(event)=>{if(event.target.id==='trajectory-turn'){narrativeFlowState.turn=Number(event.target.value);renderNarrativeFlow();}});
