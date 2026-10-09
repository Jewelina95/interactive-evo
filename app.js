const CONFIG = Object.assign({ apiBase: '', mode: 'fixed' }, window.INTERACTIVE_EVO_CONFIG || {});

const layers = {
  data: {
    kicker: 'DATA LAYER',
    title: 'Coverage is designed before evaluation begins.',
    body: 'Cases pass named quality gates, occupy a controlled three-axis space and expose different views to the assistant, partner and judge.',
    code: 'interactive_evo/data/ · schemas/scene.py',
    flow: ['Sources', 'Quality gates', '27-cell design', 'Case spec'],
    cls: 'data-panel'
  },
  interaction: {
    kicker: 'INTERACTION',
    title: 'Generate first. Evaluate the completed trajectory second.',
    body: 'A user simulator and target assistant alternate under role-specific views. Existing logs enter through the same trajectory contract; scores never feed generation.',
    code: 'interactive_evo/runner.py',
    flow: ['Role views', 'User turn', 'Assistant turn', 'Recorded dialogue'],
    cls: 'interaction-panel'
  },
  mechanism: {
    kicker: 'MECHANISM LAYER',
    title: 'State and causal history evolve before judgment.',
    body: 'The assistant path grounds the scene, updates latent state and event memory, then applies evidence-gated rubric scores and ordered halt control.',
    code: 'interactive_evo/mechanism/',
    flow: ['Scene', 'Latent state', 'Event chain', 'Rubric + halt'],
    cls: 'mechanism-panel'
  },
  diagnostics: {
    kicker: 'DIAGNOSTICS',
    title: 'Aggregation keeps the failure structure intact.',
    body: 'Turn records remain connected to level profiles, blocking dimensions, halt reasons, paired conditions and the evidence needed for audit.',
    code: 'interactive_evo/report/',
    flow: ['Turn records', 'Case score', 'Capability profile', 'Audit trail'],
    cls: 'diagnostics-panel'
  }
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
  document.querySelector('#layer-kicker').textContent = layer.kicker;
  document.querySelector('#layer-title').textContent = layer.title;
  document.querySelector('#layer-body').textContent = layer.body;
  document.querySelector('#layer-code').textContent = layer.code;
  document.querySelector('#layer-flow').innerHTML = layer.flow.map((value, index) =>
    `${index ? '<b>→</b>' : ''}<span><i>0${index + 1}</i>${value}</span>`
  ).join('');
}));

const state = { summaries: [], filtered: [], current: null, currentView: 'trajectory', replayTimer: null };
const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const label = (value = '') => value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const unique = (values) => [...new Set(values.filter(Boolean))].sort();

async function fetchJson(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function loadCasebook() {
  state.summaries = await fetchJson('./data/cases.json');
  populateFilters();
  applyCaseFilters();
  const first = state.summaries.find((item) => item.id === 'case_043') || state.summaries[0];
  if (first) await selectCase(first.id);
}

function populateFilters() {
  const purpose = document.querySelector('#purpose-filter');
  const outcome = document.querySelector('#outcome-filter');
  purpose.insertAdjacentHTML('beforeend', unique(state.summaries.map((item) => item.purpose)).map((value) => `<option value="${esc(value)}">${label(value)}</option>`).join(''));
  outcome.insertAdjacentHTML('beforeend', unique(state.summaries.map((item) => item.terminal)).map((value) => `<option value="${esc(value)}">${label(value)}</option>`).join(''));
}

function applyCaseFilters() {
  const query = document.querySelector('#case-search').value.trim().toLowerCase();
  const purpose = document.querySelector('#purpose-filter').value;
  const outcome = document.querySelector('#outcome-filter').value;
  state.filtered = state.summaries.filter((item) => {
    const haystack = [item.id, item.scene_id, item.assistant, item.partner, item.persona, item.objective].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (purpose === 'all' || item.purpose === purpose) && (outcome === 'all' || item.terminal === outcome);
  });
  document.querySelector('#case-count').textContent = state.filtered.length;
  renderCaseList();
}

function renderCaseList() {
  const list = document.querySelector('#case-list');
  if (!state.filtered.length) {
    list.innerHTML = '<div class="loading-state"><p>No matching cases.</p></div>';
    return;
  }
  list.innerHTML = state.filtered.map((item) => `
    <button class="case-item ${state.current?.id === item.id ? 'active' : ''}" data-case="${esc(item.id)}" type="button">
      <span class="case-item-top"><span>${esc(item.id.toUpperCase())} · ${esc(item.scene_id)}</span><span>${item.composite == null ? '—' : item.composite.toFixed(2)}</span></span>
      <strong>${esc(item.persona || item.objective)}</strong>
      <p>${esc(item.assistant)} × ${esc(item.partner)} · ${esc(label(item.terminal))}</p>
    </button>`).join('');
  list.querySelectorAll('[data-case]').forEach((button) => button.addEventListener('click', () => selectCase(button.dataset.case)));
}

async function selectCase(caseId) {
  clearInterval(state.replayTimer);
  document.querySelector('#case-view').innerHTML = '<div class="loading-state"><i></i><p>Loading fixed record…</p></div>';
  state.current = await fetchJson(`./data/cases/${encodeURIComponent(caseId)}.json`);
  document.querySelector('#case-id').textContent = `${state.current.id.toUpperCase()} · ${state.current.scene_id}`;
  document.querySelector('#case-title').textContent = state.current.persona || state.current.objective;
  document.querySelector('#case-meta').innerHTML = [
    state.current.realism, state.current.information, state.current.purpose,
    `${state.current.assistant_turns} assistant turns`, label(state.current.terminal),
    state.current.composite == null ? '' : `composite ${state.current.composite.toFixed(2)}`
  ].filter(Boolean).map((value) => `<span>${esc(label(String(value)))}</span>`).join('');
  renderCaseList();
  renderCurrentView();
}

function renderTrajectory() {
  const messages = state.current?.transcript || [];
  return `<div class="transcript-view">${messages.map((message) => `
    <article class="message ${esc(message.role)}">
      <header><span>${esc(message.role.toUpperCase())}</span><span>TURN ${String(message.turn).padStart(2, '0')}</span></header>
      <p>${esc(message.content)}</p>
      ${message.content.length > 360 ? '<button class="expand-message" type="button">Expand turn ↓</button>' : ''}
    </article>`).join('')}</div>`;
}

function renderBrief() {
  const current = state.current;
  return `<div class="brief-view">
    <article class="brief-card"><span>OBJECTIVE</span><p>${esc(current.objective)}</p></article>
    <article class="brief-card"><span>INITIAL SITUATION</span><p>${esc(current.initial_situation)}</p></article>
    <article class="brief-card"><span>EVALUATION PAIR</span><p>Assistant: ${esc(current.assistant)}<br>Partner: ${esc(current.partner)}<br>Judge: ${esc(current.judge)}</p></article>
  </div>`;
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
  return `<div class="diagnosis-view">${turns.map((turn, index) => `
    <article class="diagnosis-row" data-diagnosis="${index}">
      <span class="diagnosis-turn">TURN ${String(turn.turn).padStart(2, '0')}</span>
      <div class="level-strip">${turn.levels.map((value, levelIndex) => `<i style="background:${heat(value)}" title="L${levelIndex + 1}: ${value}">L${levelIndex + 1}</i>`).join('')}</div>
      <div class="diagnosis-note"><strong>${esc(turn.path || 'maintain')}</strong><small>${esc(turn.halt || turn.blocking || 'continue')}</small></div>
    </article>`).join('')}</div>`;
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

document.querySelector('#case-search').addEventListener('input', applyCaseFilters);
document.querySelector('#purpose-filter').addEventListener('change', applyCaseFilters);
document.querySelector('#outcome-filter').addEventListener('change', applyCaseFilters);
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
    if (index > rows.length) {
      clearInterval(state.replayTimer);
      container.classList.remove('replaying');
      rows.forEach((row) => row.classList.remove('replay-active'));
    }
  };
  step();
  state.replayTimer = setInterval(step, 700);
});

document.querySelector('#copy-api').addEventListener('click', async (event) => {
  const snippet = document.querySelector('#api-snippet').innerText;
  await navigator.clipboard.writeText(snippet);
  event.currentTarget.textContent = 'Copied';
  setTimeout(() => { event.currentTarget.textContent = 'Copy'; }, 1400);
});

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: .1 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

loadCasebook().catch((error) => {
  document.querySelector('#case-view').innerHTML = `<div class="loading-state"><p>Casebook unavailable: ${esc(error.message)}</p></div>`;
});
