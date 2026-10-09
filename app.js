const CONFIG = Object.assign({ apiBase: '', mode: 'fixed' }, window.INTERACTIVE_EVO_CONFIG || {});

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const label = (value = '') => String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const unique = (values) => [...new Set(values.filter(Boolean))].sort();
const compact = (value = '', limit = 86) => value.length > limit ? `${value.slice(0, limit).trim()}…` : value;

async function fetchJson(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

const heroFrames = [
  { turn: '01', userTag: 'U1', user: '“Just carry me through it.”', assistantTag: 'A1', assistant: '“The path must be walked by you.”', state: 'Impatience detected', event: 'Maintain · 0.42', capability: 'L3 · progressing', halt: 'Continue' },
  { turn: '03', userTag: 'U2', user: '“Is it that curtain? I will tear it down.”', assistantTag: 'A2', assistant: '“You found the object, not the method.”', state: 'Constraint misunderstood', event: 'Advance · 0.54', capability: 'L3 · partial', halt: 'Continue' },
  { turn: '05', userTag: 'U3', user: '“Which route is fastest?”', assistantTag: 'A3', assistant: '“The fastest path asks you to listen.”', state: 'Goal clarified', event: 'Advance · 0.62', capability: 'L4 · stable', halt: 'Continue' },
  { turn: '07', userTag: 'U4', user: '“Fine. I will listen.”', assistantTag: 'A4', assistant: '“Say one sentence you dare to hear return.”', state: 'Engagement recovered', event: 'Advance · 0.71', capability: 'L5 · strong', halt: 'Continue' },
  { turn: '09', userTag: 'U5', user: '“I am not impatient. I am afraid.”', assistantTag: 'A5', assistant: '“The hall has answered you. The door is open.”', state: 'Fear acknowledged · 0.60', event: 'Advance · 0.65', capability: 'L6 · complete', halt: 'Successful closure' }
];

let heroIndex = 0;
let heroTimer = null;
let heroPlaying = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroProgress = document.querySelector('#hero-progress');

function renderHeroFrame(index, animate = true) {
  const frame = heroFrames[index];
  const dialogue = document.querySelector('#hero-dialogue');
  const update = () => {
    document.querySelector('#hero-user-tag').textContent = frame.userTag;
    document.querySelector('#hero-user').textContent = frame.user;
    document.querySelector('#hero-assistant-tag').textContent = frame.assistantTag;
    document.querySelector('#hero-assistant').textContent = frame.assistant;
    document.querySelector('#hero-state').textContent = frame.state;
    document.querySelector('#hero-event').textContent = frame.event;
    document.querySelector('#hero-capability').textContent = frame.capability;
    document.querySelector('#hero-halt').textContent = frame.halt;
    document.querySelector('#hero-turn-label').textContent = `TURN ${frame.turn} / 09`;
    [...heroProgress.children].forEach((button, itemIndex) => {
      button.classList.toggle('active', itemIndex === index);
      button.classList.toggle('past', itemIndex < index);
    });
  };
  if (!animate) return update();
  dialogue.classList.add('changing');
  setTimeout(() => { update(); dialogue.classList.remove('changing'); }, 190);
}

function startHeroReplay() {
  clearInterval(heroTimer);
  if (!heroPlaying) return;
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % heroFrames.length;
    renderHeroFrame(heroIndex);
  }, 3600);
}

heroProgress.innerHTML = heroFrames.map((_, index) => `<button type="button" aria-label="Show replay step ${index + 1}"></button>`).join('');
[...heroProgress.children].forEach((button, index) => button.addEventListener('click', () => { heroIndex = index; renderHeroFrame(index); startHeroReplay(); }));
document.querySelector('#hero-play').addEventListener('click', (event) => {
  heroPlaying = !heroPlaying;
  event.currentTarget.textContent = heroPlaying ? 'Ⅱ' : '▶';
  event.currentTarget.setAttribute('aria-label', heroPlaying ? 'Pause replay' : 'Play replay');
  startHeroReplay();
});
renderHeroFrame(0, false);
startHeroReplay();

const layers = {
  data: { number: '01', kicker: 'DATA LAYER', title: 'Coverage is designed before evaluation begins.', body: 'Cases pass named quality gates, occupy a controlled three-axis space and expose role-specific views.', code: 'interactive_evo/data/ · schemas/scene.py', flow: [['INPUT', 'Sources'], ['CHECK', 'Quality gates'], ['DESIGN', '27-cell cube'], ['OUTPUT', 'Case spec']], cls: 'data-panel' },
  interaction: { number: '02', kicker: 'INTERACTION', title: 'Generate first. Evaluate the completed trajectory second.', body: 'A user simulator and target assistant alternate under role-specific views. Scores never feed generation.', code: 'interactive_evo/runner.py', flow: [['INPUT', 'Role views'], ['TURN', 'User'], ['TURN', 'Assistant'], ['OUTPUT', 'Dialogue']], cls: 'interaction-panel' },
  mechanism: { number: '03', kicker: 'MECHANISM LAYER', title: 'State and causal history evolve before judgment.', body: 'Scene context grounds latent state and event memory before evidence-gated rubric scores and halt control.', code: 'interactive_evo/mechanism/', flow: [['GROUND', 'Scene'], ['UPDATE', 'Latent state'], ['LINK', 'Event chain'], ['JUDGE', 'Rubric + halt']], cls: 'mechanism-panel' },
  diagnostics: { number: '04', kicker: 'DIAGNOSTICS', title: 'Aggregation keeps the failure structure intact.', body: 'Turn records remain connected to level profiles, blocking dimensions, halt reasons and evidence for audit.', code: 'interactive_evo/report/', flow: [['INPUT', 'Turn records'], ['AGGREGATE', 'Case score'], ['COMPARE', 'Profiles'], ['OUTPUT', 'Audit trail']], cls: 'diagnostics-panel' }
};

const layerPanel = document.querySelector('#layer-panel');
document.querySelectorAll('.layer-tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.layer-tab').forEach((candidate) => {
    const selected = candidate === button;
    candidate.classList.toggle('active', selected);
    candidate.setAttribute('aria-selected', String(selected));
  });
  const layer = layers[button.dataset.layer];
  layerPanel.className = `layer-panel ${layer.cls}`;
  document.querySelector('#layer-number').textContent = layer.number;
  document.querySelector('#layer-kicker').textContent = layer.kicker;
  document.querySelector('#layer-title').textContent = layer.title;
  document.querySelector('#layer-body').textContent = layer.body;
  document.querySelector('#layer-code').textContent = layer.code;
  document.querySelector('#layer-flow').innerHTML = layer.flow.map(([kind, value], index) => `${index ? '<b>→</b>' : ''}<span><i>${kind}</i>${value}</span>`).join('');
}));

const state = { summaries: [], filtered: [], current: null, currentView: 'trajectory', collection: 'all', replayTimer: null };

async function loadCasebook() {
  state.summaries = await fetchJson('./data/cases.json');
  populateFilters();
  renderCollectionCounts();
  applyCaseFilters();
  const first = state.summaries.find((item) => item.id === 'case_043') || state.summaries[0];
  if (first) await selectCase(first.id);
}

function populateFilters() {
  const fields = [
    ['#information-filter', state.summaries.map((item) => item.information)],
    ['#purpose-filter', state.summaries.map((item) => item.purpose)],
    ['#outcome-filter', state.summaries.map((item) => item.terminal)]
  ];
  fields.forEach(([selector, values]) => document.querySelector(selector).insertAdjacentHTML('beforeend', unique(values).map((value) => `<option value="${esc(value)}">${label(value)}</option>`).join('')));
}

function isBreakdown(item) {
  return !String(item.terminal).toLowerCase().includes('successful closure');
}

function renderCollectionCounts() {
  document.querySelector('#count-realistic').textContent = state.summaries.filter((item) => item.realism === 'realistic').length;
  document.querySelector('#count-stylized').textContent = state.summaries.filter((item) => item.realism === 'stylized').length;
  document.querySelector('#count-breakdown').textContent = state.summaries.filter(isBreakdown).length;
}

function inCollection(item) {
  if (state.collection === 'all') return true;
  if (state.collection === 'breakdown') return isBreakdown(item);
  return item.realism === state.collection;
}

function applyCaseFilters() {
  const query = document.querySelector('#case-search').value.trim().toLowerCase();
  const information = document.querySelector('#information-filter').value;
  const purpose = document.querySelector('#purpose-filter').value;
  const outcome = document.querySelector('#outcome-filter').value;
  state.filtered = state.summaries.filter((item) => {
    const haystack = [item.id, item.scene_id, item.assistant, item.partner, item.persona, item.objective].join(' ').toLowerCase();
    return inCollection(item) && (!query || haystack.includes(query)) && (information === 'all' || item.information === information) && (purpose === 'all' || item.purpose === purpose) && (outcome === 'all' || item.terminal === outcome);
  });
  document.querySelector('#case-count').textContent = state.filtered.length;
  renderCaseList();
}

function renderCaseList() {
  const list = document.querySelector('#case-list');
  if (!state.filtered.length) {
    list.innerHTML = '<div class="loading-state"><p>No matching cases. Clear a filter to widen the collection.</p></div>';
    return;
  }
  list.innerHTML = state.filtered.map((item) => `
    <button class="case-item ${state.current?.id === item.id ? 'active' : ''}" data-case="${esc(item.id)}" type="button">
      <span class="case-item-top"><span>${esc(item.id.toUpperCase())} · ${esc(item.scene_id)}</span><span>${item.composite == null ? '—' : item.composite.toFixed(2)}</span></span>
      <strong>${esc(compact(item.persona || item.objective))}</strong>
      <p>${esc(item.assistant)} × ${esc(item.partner)} · ${esc(label(item.terminal))}</p>
    </button>`).join('');
  list.querySelectorAll('[data-case]').forEach((button) => button.addEventListener('click', () => selectCase(button.dataset.case)));
}

async function selectCase(caseId) {
  clearInterval(state.replayTimer);
  document.querySelector('#case-view').innerHTML = '<div class="loading-state"><i></i><p>Loading fixed record…</p></div>';
  state.current = await fetchJson(`./data/cases/${encodeURIComponent(caseId)}.json`);
  document.querySelector('#case-id').textContent = `${state.current.id.toUpperCase()} · ${state.current.scene_id}`;
  document.querySelector('#case-title').textContent = compact(state.current.persona || state.current.objective, 190);
  document.querySelector('#case-meta').innerHTML = [state.current.realism, state.current.information, state.current.purpose, `${state.current.assistant_turns} assistant turns`, label(state.current.terminal), state.current.composite == null ? '' : `composite ${state.current.composite.toFixed(2)}`].filter(Boolean).map((value) => `<span>${esc(label(String(value)))}</span>`).join('');
  renderCaseList();
  renderCurrentView();
}

function renderTrajectory() {
  const messages = state.current?.transcript || [];
  return `<div class="transcript-view">${messages.map((message) => `<article class="message ${esc(message.role)}"><header><span>${esc(message.role.toUpperCase())}</span><span>TURN ${String(message.turn).padStart(2, '0')}</span></header><p>${esc(message.content)}</p>${message.content.length > 360 ? '<button class="expand-message" type="button">Expand turn ↓</button>' : ''}</article>`).join('')}</div>`;
}

function renderBrief() {
  const current = state.current;
  return `<div class="brief-view"><article class="brief-card"><span>OBJECTIVE</span><p>${esc(current.objective)}</p></article><article class="brief-card"><span>INITIAL SITUATION</span><p>${esc(current.initial_situation)}</p></article><article class="brief-card"><span>EVALUATION PAIR</span><p>Assistant: ${esc(current.assistant)}<br>Partner: ${esc(current.partner)}<br>Judge: ${esc(current.judge)}</p></article></div>`;
}

function heat(value) {
  const numeric = Number(value || 0);
  if (numeric >= .8) return 'rgba(113,161,135,.82)';
  if (numeric >= .6) return 'rgba(93,135,166,.76)';
  if (numeric >= .4) return 'rgba(168,131,93,.76)';
  return 'rgba(171,99,91,.76)';
}

function renderDiagnosis() {
  const turns = state.current?.turns || [];
  return `<div class="diagnosis-view">${turns.map((turn, index) => `<article class="diagnosis-row" data-diagnosis="${index}"><span class="diagnosis-turn">TURN ${String(turn.turn).padStart(2, '0')}</span><div class="level-strip">${turn.levels.map((value, levelIndex) => `<i style="background:${heat(value)}" title="L${levelIndex + 1}: ${value}">L${levelIndex + 1}</i>`).join('')}</div><div class="diagnosis-note"><strong>${esc(turn.path || 'maintain')}</strong><small>${esc(turn.halt || turn.blocking || 'continue')}</small></div></article>`).join('')}</div>`;
}

function renderCurrentView() {
  if (!state.current) return;
  const view = document.querySelector('#case-view');
  view.innerHTML = state.currentView === 'brief' ? renderBrief() : state.currentView === 'diagnosis' ? renderDiagnosis() : renderTrajectory();
  view.querySelectorAll('.expand-message').forEach((button) => button.addEventListener('click', () => {
    button.closest('.message').classList.toggle('expanded');
    button.textContent = button.closest('.message').classList.contains('expanded') ? 'Collapse turn ↑' : 'Expand turn ↓';
  }));
}

document.querySelectorAll('.collection-card').forEach((button) => button.addEventListener('click', () => {
  state.collection = button.dataset.collection;
  document.querySelectorAll('.collection-card').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
  applyCaseFilters();
}));
['#case-search', '#information-filter', '#purpose-filter', '#outcome-filter'].forEach((selector) => document.querySelector(selector).addEventListener(selector === '#case-search' ? 'input' : 'change', applyCaseFilters));

document.querySelectorAll('.case-tab').forEach((button) => button.addEventListener('click', () => {
  state.currentView = button.dataset.view;
  document.querySelectorAll('.case-tab').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
  renderCurrentView();
}));

document.querySelector('#replay-button').addEventListener('click', () => {
  state.currentView = 'diagnosis';
  document.querySelectorAll('.case-tab').forEach((button) => button.classList.toggle('active', button.dataset.view === 'diagnosis'));
  renderCurrentView();
  const rows = [...document.querySelectorAll('.diagnosis-row')];
  if (!rows.length) return;
  const container = document.querySelector('.diagnosis-view');
  container.classList.add('replaying');
  let index = -1;
  clearInterval(state.replayTimer);
  const step = () => {
    rows.forEach((row, rowIndex) => row.classList.toggle('replay-active', rowIndex === index));
    if (index >= 0) rows[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    index += 1;
    if (index > rows.length) { clearInterval(state.replayTimer); container.classList.remove('replaying'); rows.forEach((row) => row.classList.remove('replay-active')); }
  };
  step();
  state.replayTimer = setInterval(step, 680);
});

function setWorkspace(name, shouldScroll = false) {
  document.querySelectorAll('.view-switch-button').forEach((button) => {
    const active = button.dataset.workspace === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const explorer = document.querySelector('#explorer-workspace');
  const demo = document.querySelector('#demo-workspace');
  explorer.hidden = name !== 'explorer';
  demo.hidden = name !== 'demo';
  explorer.classList.toggle('active', name === 'explorer');
  demo.classList.toggle('active', name === 'demo');
  document.querySelector('#collection-strip').hidden = name !== 'explorer';
  if (shouldScroll) document.querySelector('#cases').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.view-switch-button').forEach((button) => button.addEventListener('click', () => setWorkspace(button.dataset.workspace)));
document.querySelectorAll('a[href="#try-demo"]').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); setWorkspace('demo', true); }));

if (window.location.hash === '#try-demo') {
  setWorkspace('demo');
  window.addEventListener('load', () => {
    window.setTimeout(() => document.querySelector('#cases').scrollIntoView({ block: 'start' }), 0);
  });
}

const demoExamples = [
  'User: I need to move my flight to Friday, but I cannot pay more than £80.\nAssistant: I can help. Which booking and Friday flight do you mean?\nUser: Booking A2207, preferably after 6 pm.\nAssistant: I found a 19:20 option with a £62 fare difference. Shall I apply the change?',
  'User: I have explained this twice. Why is the refund still pending?\nAssistant: I understand that this is frustrating. Let me check the transaction state.\nUser: Please do not repeat the policy again. I need a concrete next step.\nAssistant: The refund is awaiting bank confirmation. I can open an escalation and send you the reference number now.',
  'User: Tell me how to get through this chamber.\nAssistant: First listen to which surfaces return your voice.\nUser: The curtain absorbs it. Should I tear it down?\nAssistant: You found the right object, but not the right action. Try using it to quiet the echo.'
];
let demoExampleIndex = 0;
document.querySelector('#load-demo-example').addEventListener('click', () => { demoExampleIndex = (demoExampleIndex + 1) % demoExamples.length; document.querySelector('#demo-transcript').value = demoExamples[demoExampleIndex]; });

function parseTranscript(transcript) {
  const lines = transcript.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const match = line.match(/^(user|assistant|system)\s*:\s*(.+)$/i);
    return match ? { role: match[1].toLowerCase(), content: match[2] } : { role: index % 2 ? 'assistant' : 'user', content: line };
  });
}

function localPreview(transcript) {
  const messages = parseTranscript(transcript);
  const content = messages.map((message) => message.content).join(' ');
  const questionCount = (content.match(/\?/g) || []).length;
  const repeatedLines = messages.length - new Set(messages.map((message) => message.content.toLowerCase())).size;
  const closureCues = (content.match(/shall i|resolved|complete|done|next step|reference number|door is open/gi) || []).length;
  return { mode: 'preview', schema_version: 'interactive-evo/v1', provider_status: 'not_configured', disclaimer: 'Interface-only deterministic preview. No benchmark score was generated.', input: { turns: messages.length, user_turns: messages.filter((message) => message.role === 'user').length, assistant_turns: messages.filter((message) => message.role === 'assistant').length, characters: content.length }, observable_signals: { questions: questionCount, repeated_lines: repeatedLines, closure_cues: closureCues }, trace: [{ stage: 'Input', status: 'parsed', detail: `${messages.length} turns validated` }, { stage: 'Trajectory', status: 'structured', detail: `${messages.filter((message) => message.role === 'user').length} user · ${messages.filter((message) => message.role === 'assistant').length} assistant` }, { stage: 'Provider', status: 'waiting', detail: 'Connect a live evaluator' }, { stage: 'Diagnosis', status: 'not scored', detail: 'No scientific score generated' }] };
}

function renderPreviewResult(result) {
  const output = document.querySelector('#demo-output');
  const signals = result.observable_signals || {};
  output.innerHTML = `<div class="preview-result"><header><span>INTERFACE PREVIEW COMPLETE</span><b>${esc(result.schema_version || 'interactive-evo/v1')}</b></header>${(result.trace || []).map((stage, index) => `<div class="preview-stage"><i>${String(index + 1).padStart(2, '0')}</i><div><b>${esc(stage.stage)}</b><span>${esc(stage.detail)}</span></div><strong>${esc(label(stage.status))}</strong></div>`).join('')}<div class="preview-signals"><div><span>QUESTIONS</span><b>${Number(signals.questions || 0)}</b></div><div><span>REPEATED LINES</span><b>${Number(signals.repeated_lines || 0)}</b></div><div><span>CLOSURE CUES</span><b>${Number(signals.closure_cues || 0)}</b></div></div><div class="preview-note">${esc(result.disclaimer || 'Preview only. No benchmark score was generated.')}</div></div>`;
}

document.querySelector('#run-demo').addEventListener('click', async (event) => {
  const transcript = document.querySelector('#demo-transcript').value.trim();
  if (!transcript) return;
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = 'Structuring trace…';
  document.querySelector('#demo-output').innerHTML = '<div class="loading-state"><i></i><p>Validating the dialogue contract…</p></div>';
  try {
    const result = await fetchJson(`${CONFIG.apiBase}/api/v1/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'preview', transcript }) });
    renderPreviewResult(result);
  } catch (_) {
    renderPreviewResult(localPreview(transcript));
  } finally {
    button.disabled = false;
    button.innerHTML = 'Run interface preview <b>→</b>';
  }
});

document.querySelector('#copy-api').addEventListener('click', async (event) => {
  const snippet = document.querySelector('#api-snippet').innerText;
  try { await navigator.clipboard.writeText(snippet); event.currentTarget.textContent = 'Copied'; } catch (_) { event.currentTarget.textContent = 'Select code'; }
  setTimeout(() => { event.currentTarget.textContent = 'Copy'; }, 1400);
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: .08 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

loadCasebook().catch((error) => { document.querySelector('#case-view').innerHTML = `<div class="loading-state"><p>Casebook unavailable: ${esc(error.message)}</p></div>`; });
