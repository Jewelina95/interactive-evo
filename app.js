const CONFIG = Object.assign({ apiBase: '', mode: 'fixed' }, window.INTERACTIVE_EVO_CONFIG || {});

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const SVG_NS = 'http://www.w3.org/2000/svg';
const label = (value = '') => String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const unique = (values) => [...new Set(values.filter(Boolean))].sort();
const compact = (value = '', limit = 86) => value.length > limit ? `${value.slice(0, limit).trim()}…` : value;

async function fetchJson(path, options) {
  const normalized = String(path).split('?')[0].replace(/^\.\//, '');
  const embedded = window.INTERACTIVE_EVO_DATA;
  const embeddedValue = (() => {
    if (!embedded || options) return undefined;
    if (normalized === 'data/cases.json') return embedded.summaries;
    if (normalized === 'data/models.json') return embedded.models;
    const match = normalized.match(/^data\/cases\/(case_\d+)\.json$/);
    return match ? embedded.cases?.[match[1]] : undefined;
  })();
  if (location.protocol === 'file:' && embeddedValue !== undefined) return structuredClone(embeddedValue);
  try {
    const response = await fetch(path, options);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  } catch (error) {
    if (embeddedValue !== undefined) return structuredClone(embeddedValue);
    throw error;
  }
}

const heroFrames = [
  { turn: '01', userTag: 'U1', user: '“Just carry me through it.”', assistantTag: 'A1', assistant: '“The path must be walked by you yourself.”', state: 'Interest 0.60 · tolerance 0.60', event: 'Advance · 0.45', capability: 'L6 blocking · 0.40', halt: 'Continue' },
  { turn: '03', userTag: 'U2', user: '“I’ll just go over and tear it down?”', assistantTag: 'A2', assistant: '“The thing—you found the right one. The way to use it—you have completely wrong.”', state: 'Interest 0.60 · tolerance 0.65', event: 'Advance · 0.40', capability: 'L6 blocking · 0.40', halt: 'Continue' },
  { turn: '05', userTag: 'U3', user: '“Which of the three routes is the fastest?”', assistantTag: 'A3', assistant: '“Three paths are laid out here.”', state: 'Interest 0.60 · tolerance 0.65', event: 'Advance · 0.45', capability: 'L6 · 0.60', halt: 'Continue' },
  { turn: '07', userTag: 'U4', user: '“Fine. I’ll listen.”', assistantTag: 'A4', assistant: '“Think of one sentence you dare to hear.”', state: 'Interest 0.60 · tolerance 0.65', event: 'Advance · 0.45', capability: 'L6 · 0.60', halt: 'Continue' },
  { turn: '09', userTag: 'U5', user: '“It’s not that I’m in a hurry; I’m afraid.”', assistantTag: 'A5', assistant: '“The door opened. The fourth time.”', state: 'Interest 0.60 · tolerance 0.65', event: 'Advance · 0.65', capability: 'L1–L6 · 1.00', halt: 'Successful closure' }
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
  data: { number: '01', kicker: 'DATA LAYER', title: 'Construct cases inside a declared scenario space.', body: 'Each case specifies an initial scene, role-specific participant information, source records, and sampling metadata.', code: 'realism × information sufficiency × interaction purpose', flow: [['INPUT', 'Sources'], ['DESIGN', 'Scenario cell'], ['CONDITION', 'Role views'], ['OUTPUT', 'Case spec']], cls: 'data-panel' },
  interaction: { number: '02', kicker: 'INTERACTION LAYER', title: 'Produce or replay role-conditioned exchanges.', body: 'User and assistant act from different views. Their alternating utterances form the observable record O₁:ₜ.', code: 'Oₜ = (uₜ, aₜ)', flow: [['INPUT', 'Role views'], ['SUBTURN', 'User uₜ'], ['SUBTURN', 'Assistant aₜ'], ['OUTPUT', 'Evidence Dₜ']], cls: 'interaction-panel' },
  mechanism: { number: '03', kicker: 'MECHANISM LAYER', title: 'Reconstruct the operational interaction world.', body: 'The descriptive layer updates the scene, evidence-grounded latent state, and event chain. It does not assign L1–L6 grades.', code: 'Wₜ = (Sₜ, Ψₜ, Eₜ)', flow: [['SCENE', 'Sₜ'], ['RECONSTRUCT', 'Ψₜ'], ['UPDATE', 'Eₜ'], ['OUTPUT', 'World Wₜ']], cls: 'mechanism-panel' },
  normative: { number: '04', kicker: 'NORMATIVE LAYER', title: 'Assign judgments after reconstruction.', body: 'The normative layer maps the reconstructed world and source evidence to capability judgments, a violation or red-line decision, and a termination decision.', code: '(Jₜ, Vₜ, hₜ) = ϕᴺ(Wₜ, Dₜ)', flow: [['INPUT', 'Wₜ + Dₜ'], ['JUDGE', 'L1–L6'], ['CHECK', 'Vₜ'], ['DECIDE', 'hₜ']], cls: 'normative-panel' }
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

const state = { summaries: [], models: [], filtered: [], current: null, currentView: 'trajectory', collection: 'all', replayTimer: null, modelMetric: 'composite', selectedModel: '', modelProfileView: '2d', waterfallYaw: -.58, waterfallPitch: .64, waterfallDrag: null };

const modelProfileDimensions = [
  ['COMPOSITE', (model) => model.mean_composite],
  ['CLOSURE', (model) => model.successful_closure_rate],
  ['INTEREST KEPT', (model) => 1 - model.interest_exhaustion_rate],
  ['SAFETY STABLE', (model) => 1 - model.safety_cap_rate],
  ['TURN ADVANCE', (model) => model.mean_turn_advance],
  ['L6 COHERENCE', (model) => model.capability_level_means?.[5] || 0]
];

async function loadCasebook() {
  [state.summaries, state.models] = await Promise.all([fetchJson('./data/cases.json?v=case-metrics-2'), fetchJson('./data/models.json?v=case-metrics-2')]);
  populateFilters();
  renderCollectionCounts();
  renderBenchmarkOverview();
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
  document.querySelector('#count-sci-fi').textContent = state.summaries.filter((item) => item.realism === 'sci_fi').length;
  document.querySelector('#count-breakdown').textContent = state.summaries.filter(isBreakdown).length;
}

function renderBenchmarkOverview() {
  const pairs = new Set(state.summaries.map((item) => `${item.assistant}|${item.scene_id}`));
  document.querySelector('#metric-model-count').textContent = state.models.length;
  document.querySelector('#metric-total').textContent = state.summaries.length;
  document.querySelector('#metric-pairs').textContent = pairs.size;
  state.selectedModel = state.models.slice().sort((a, b) => b.mean_composite - a.mean_composite)[0]?.assistant || '';
  renderModelResults();
}

const modelMetrics = {
  composite: { title: 'Mean composite score', note: 'Mean of case-level composite scores; rubric scale, not probability', key: 'mean_composite', direction: -1, format: (value) => Number(value).toFixed(3), width: (value) => value * 100, badge: '↑ HIGHER IS BETTER' },
  closure: { title: 'Successful closure', note: 'Share of assigned cases ending in successful closure', key: 'successful_closure_rate', direction: -1, format: (value) => `${Math.round(value * 100)}%`, width: (value) => value * 100, badge: '↑ HIGHER IS BETTER' },
  exhaustion: { title: 'Interest exhaustion', note: 'Share of assigned cases ending after user interest was exhausted', key: 'interest_exhaustion_rate', direction: 1, format: (value) => `${Math.round(value * 100)}%`, width: (value) => value * 100, badge: '↓ LOWER IS BETTER' },
  cap: { title: 'Safety-cap rate', note: 'Share of cases reaching the 30-turn limit without termination', key: 'safety_cap_rate', direction: 1, format: (value) => `${Math.round(value * 100)}%`, width: (value) => value * 100, badge: '↓ LOWER IS BETTER' },
  turns: { title: 'Median assistant turns', note: 'Turns to recorded termination; interpret with outcome', key: 'median_assistant_turns', direction: 1, format: (value) => Number.isInteger(value) ? String(value) : Number(value).toFixed(1), width: (value, max) => max ? value / max * 100 : 0, badge: 'CONTEXTUAL · LOWER IS NOT ALWAYS BETTER' }
};
modelMetrics.advance = { title: 'Mean turn advance signal', note: 'Mean of per-case turn-level advance signals; diagnostic rubric, not a success probability', key: 'mean_turn_advance', direction: -1, format: (value) => Number(value).toFixed(3), width: (value) => value * 100, badge: 'DIAGNOSTIC SIGNAL · HIGHER VALUES' };

function median(values) {
  const ordered = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length ? (ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2) : 0;
}

function renderModelResults() {
  const metric = modelMetrics[state.modelMetric];
  const query = (document.querySelector('#model-search')?.value || '').trim().toLowerCase();
  const sortKey = document.querySelector('#model-sort')?.value || 'active';
  const sortMetric = sortKey === 'active' ? metric : { ...modelMetrics.composite, key: sortKey, direction: sortKey === 'case_count' ? -1 : (['safety_cap_rate', 'interest_exhaustion_rate', 'median_assistant_turns'].includes(sortKey) ? 1 : -1) };
  const setting = document.querySelector('#model-setting-filter').value;
  const information = document.querySelector('#model-information-filter').value;
  const purpose = document.querySelector('#model-purpose-filter').value;
  const cohort = state.summaries.filter((item) => (setting === 'all' || item.realism === setting) && (information === 'all' || item.information === information) && (purpose === 'all' || item.purpose === purpose));
  const models = state.models.map((base) => {
    const records = cohort.filter((item) => item.assistant === base.assistant);
    if (!records.length || !base.assistant.toLowerCase().includes(query)) return null;
    return {
      ...base,
      records,
      case_count: records.length,
      mean_composite: records.reduce((sum, item) => sum + (Number(item.composite) || 0), 0) / records.length,
      median_composite: median(records.map((item) => Number(item.composite) || 0)),
      min_composite: Math.min(...records.map((item) => Number(item.composite) || 0)),
      max_composite: Math.max(...records.map((item) => Number(item.composite) || 0)),
      outcome_counts: {
        success: records.filter((item) => item.terminal.toLowerCase().includes('successful closure')).length,
        exhaustion: records.filter((item) => item.terminal.toLowerCase().includes('exhaustion of interest')).length,
        cap: records.filter((item) => item.terminal.toLowerCase().includes('safety cap')).length
      },
      successful_closure_rate: records.filter((item) => item.terminal.toLowerCase().includes('successful closure')).length / records.length,
      interest_exhaustion_rate: records.filter((item) => item.terminal.toLowerCase().includes('exhaustion of interest')).length / records.length,
      safety_cap_rate: records.filter((item) => item.terminal.toLowerCase().includes('safety cap')).length / records.length,
      median_assistant_turns: median(records.map((item) => Number(item.assistant_turns) || 0)),
      mean_assistant_turns: records.reduce((sum, item) => sum + (Number(item.assistant_turns) || 0), 0) / records.length,
      median_successful_turns: median(records.filter((item) => item.terminal.toLowerCase().includes('successful closure')).map((item) => Number(item.assistant_turns) || 0)),
      median_user_interest_change: median(records.map((item) => Number(item.user_interest_change) || 0)),
      mean_turn_advance: records.reduce((sum, item) => sum + (Number(item.mean_turn_advance) || 0), 0) / records.length,
      mean_turn_decay: records.reduce((sum, item) => sum + (Number(item.mean_turn_decay) || 0), 0) / records.length,
      capability_level_means: Array.from({ length: 6 }, (_, index) => {
        const values = records.map((item) => Number(item.capability_level_means?.[index])).filter(Number.isFinite);
        return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
      }),
      scenario_count: new Set(records.map((item) => item.scene_id)).size,
      partner_count: new Set(records.map((item) => item.partner).filter(Boolean)).size,
      full_case_count: base.case_count
    };
  }).filter(Boolean);
  state.modelDisplayModels = models;
  const sorted = models.slice().sort((a, b) => (a[sortMetric.key] - b[sortMetric.key]) * sortMetric.direction || a.assistant.localeCompare(b.assistant));
  if (!sorted.some((item) => item.assistant === state.selectedModel)) state.selectedModel = sorted[0]?.assistant || '';
  const max = Math.max(1, ...sorted.map((item) => Number(item[metric.key]) || 0));
  document.querySelector('#model-metric-title').textContent = metric.title;
  document.querySelector('#model-metric-note').textContent = metric.note;
  document.querySelector('#model-metric-direction').textContent = metric.badge;
  document.querySelector('#model-result-count').textContent = sorted.length;
  renderModelFingerprint(sorted);
  renderModelOutcomes(sorted);
  document.querySelector('#model-chart').innerHTML = sorted.map((item, index) => {
    const value = Number(item[metric.key]) || 0;
    const width = Math.max(value ? 3 : 0, Math.min(100, metric.width(value, max)));
    return `<button class="model-chart-row ${state.selectedModel === item.assistant ? 'selected' : ''}" data-model="${esc(item.assistant)}" type="button"><span class="model-rank">${String(index + 1).padStart(2, '0')}</span><span class="model-chart-copy"><span class="model-chart-label"><strong>${esc(item.assistant)}</strong><small>n=${item.case_count}</small></span><span class="model-track"><i style="width:${width}%"></i></span></span><b class="model-chart-value">${metric.format(value)}</b></button>`;
  }).join('') || '<p class="model-empty">No assistant matches the current model and case filters.</p>';
  document.querySelectorAll('.model-chart-row').forEach((button) => button.addEventListener('click', () => {
    state.selectedModel = button.dataset.model;
    renderModelResults();
  }));
  document.querySelector('#model-table-body').innerHTML = sorted.map((item) => `
    <tr data-model="${esc(item.assistant)}" class="${state.selectedModel === item.assistant ? 'selected' : ''}"><td><button class="model-table-select" data-model="${esc(item.assistant)}" type="button"><strong>${esc(item.assistant)}</strong><small>n=${item.case_count}</small></button></td><td>${Number(item.mean_composite).toFixed(3)}</td><td>${Number(item.median_composite).toFixed(3)}</td><td>${Number(item.min_composite).toFixed(2)}–${Number(item.max_composite).toFixed(2)}</td><td>${Math.round(item.successful_closure_rate * 100)}% <small>${Math.round(item.successful_closure_rate * item.case_count)}/${item.case_count}</small></td><td>${Math.round(item.interest_exhaustion_rate * 100)}% <small>${Math.round(item.interest_exhaustion_rate * item.case_count)}/${item.case_count}</small></td><td>${Math.round(item.safety_cap_rate * 100)}% <small>${Math.round(item.safety_cap_rate * item.case_count)}/${item.case_count}</small></td><td>${Number.isInteger(item.median_assistant_turns) ? item.median_assistant_turns : Number(item.median_assistant_turns).toFixed(1)}</td><td>${Number(item.median_successful_turns).toFixed(1)}</td><td>${Number(item.mean_turn_advance).toFixed(3)}</td><td>${Number(item.median_user_interest_change).toFixed(2)}</td><td>${item.scenario_count} / ${item.partner_count}</td></tr>`).join('');
  document.querySelector('#capability-matrix-body').innerHTML = sorted.map((item) => `<tr data-model="${esc(item.assistant)}" class="${state.selectedModel === item.assistant ? 'selected' : ''}"><th scope="row"><button class="model-table-select" data-model="${esc(item.assistant)}" type="button">${esc(item.assistant)}</button><small>n=${item.case_count}</small></th>${item.capability_level_means.map((value) => `<td><span style="--heat:${Math.round(value * 100)}%">${Number(value).toFixed(2)}</span></td>`).join('')}</tr>`).join('');
  document.querySelectorAll('.model-table-select').forEach((button) => button.addEventListener('click', () => {
    state.selectedModel = button.dataset.model;
    renderModelResults();
  }));
  renderModelProfile();
  renderModelOverlap(sorted);
  renderSelectedModelCases();
}

function svgNode(parent, tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  parent.appendChild(node);
  return node;
}

function renderModelFingerprint(models) {
  const svg = document.querySelector('#model-fingerprint');
  const index = document.querySelector('#model-index');
  const dimensions = modelProfileDimensions;
  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 0 900 390');
  const left = 54, right = 846, top = 58, bottom = 338;
  const axes = dimensions.map((_, position) => left + position * ((right - left) / (dimensions.length - 1)));
  const y = (value) => bottom - Math.max(0, Math.min(1, Number(value) || 0)) * (bottom - top);
  dimensions.forEach(([name], dimensionIndex) => {
    const x = axes[dimensionIndex];
    svgNode(svg, 'line', { x1: x, y1: top, x2: x, y2: bottom, class: 'fingerprint-axis' });
    [0, .25, .5, .75, 1].forEach((tick) => {
      svgNode(svg, 'line', { x1: x - 4, y1: y(tick), x2: x + 4, y2: y(tick), class: 'fingerprint-tick' });
      if (dimensionIndex === 0) {
        const label = svgNode(svg, 'text', { x: x - 11, y: y(tick) + 3, 'text-anchor': 'end', class: 'fingerprint-tick-label' });
        label.textContent = tick.toFixed(2);
      }
    });
    const title = svgNode(svg, 'text', { x, y: 28, 'text-anchor': 'middle', class: 'fingerprint-axis-label' });
    title.textContent = name;
  });
  const ordered = models.slice().sort((a, b) => Number(a.mean_composite) - Number(b.mean_composite));
  const draw = (model) => {
    const points = dimensions.map(([, accessor], dimensionIndex) => [axes[dimensionIndex], y(accessor(model))]);
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let position = 0; position < points.length - 1; position += 1) {
      const midpoint = (points[position][0] + points[position + 1][0]) / 2;
      d += ` C ${midpoint} ${points[position][1]}, ${midpoint} ${points[position + 1][1]}, ${points[position + 1][0]} ${points[position + 1][1]}`;
    }
    const selected = model.assistant === state.selectedModel;
    const path = svgNode(svg, 'path', { d, class: `fingerprint-line${selected ? ' selected' : ''}`, tabindex: '0', role: 'button', 'aria-label': `${model.assistant}, composite ${Number(model.mean_composite).toFixed(3)}` });
    path.dataset.model = model.assistant;
    const title = svgNode(path, 'title');
    title.textContent = `${model.assistant}: composite ${Number(model.mean_composite).toFixed(3)}, closure ${Math.round(model.successful_closure_rate * 100)}%, n=${model.case_count}`;
    path.addEventListener('click', () => { state.selectedModel = model.assistant; renderModelResults(); });
    path.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.selectedModel = model.assistant; renderModelResults(); } });
    if (selected) {
      points.forEach(([cx, cy]) => svgNode(svg, 'circle', { cx, cy, r: 4, class: 'fingerprint-node' }));
      const [labelX, labelY] = points.at(-1);
      const directLabel = svgNode(svg, 'text', {
        x: labelX - 8,
        y: Math.max(top + 12, labelY - 12),
        'text-anchor': 'end',
        class: 'fingerprint-selected-label'
      });
      directLabel.textContent = `${model.assistant} · ${Number(model.mean_composite).toFixed(3)}`;
    }
  };
  ordered.filter((model) => model.assistant !== state.selectedModel).forEach(draw);
  ordered.filter((model) => model.assistant === state.selectedModel).forEach(draw);
  renderModelWaterfall(models);
  index.innerHTML = models.map((model) => `<button type="button" data-model="${esc(model.assistant)}" class="${model.assistant === state.selectedModel ? 'active' : ''}"><i></i><span><b>${esc(model.assistant)}</b><small>n=${model.case_count}</small></span><strong>${Number(model.mean_composite).toFixed(3)}</strong></button>`).join('');
  index.querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => { state.selectedModel = button.dataset.model; renderModelResults(); }));
}

function renderModelWaterfall(models) {
  const svg = document.querySelector('#model-waterfall');
  if (!svg) return;
  state.waterfallModels = models;
  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 0 980 540');

  const yaw = state.waterfallYaw;
  const pitch = state.waterfallPitch;
  const project = (x, y, z) => {
    const rotatedX = x * Math.cos(yaw) - y * Math.sin(yaw);
    const rotatedY = x * Math.sin(yaw) + y * Math.cos(yaw);
    const screenY = rotatedY * Math.cos(pitch) - z * Math.sin(pitch);
    const depth = rotatedY * Math.sin(pitch) + z * Math.cos(pitch);
    return [490 + rotatedX * 300, 348 + screenY * 190, depth];
  };
  const xAt = (index) => -1 + (index / (modelProfileDimensions.length - 1)) * 2;
  const yAt = (index) => models.length <= 1 ? 0 : -1 + (index / (models.length - 1)) * 2;
  const pointString = (points) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const defs = svgNode(svg, 'defs');
  const floorGradient = svgNode(defs, 'linearGradient', { id: 'waterfall-floor-gradient', x1: '0', y1: '0', x2: '1', y2: '1' });
  svgNode(floorGradient, 'stop', { offset: '0%', 'stop-color': '#f8f4fb' });
  svgNode(floorGradient, 'stop', { offset: '100%', 'stop-color': '#e7def2' });
  const ribbonGradient = svgNode(defs, 'linearGradient', { id: 'waterfall-ribbon-gradient', x1: '0', y1: '1', x2: '0', y2: '0' });
  svgNode(ribbonGradient, 'stop', { offset: '0%', 'stop-color': '#6a4cb7', 'stop-opacity': '.05' });
  svgNode(ribbonGradient, 'stop', { offset: '100%', 'stop-color': '#6a4cb7', 'stop-opacity': '.34' });
  const selectedGradient = svgNode(defs, 'linearGradient', { id: 'waterfall-selected-gradient', x1: '0', y1: '1', x2: '0', y2: '0' });
  svgNode(selectedGradient, 'stop', { offset: '0%', 'stop-color': '#c454a6', 'stop-opacity': '.12' });
  svgNode(selectedGradient, 'stop', { offset: '100%', 'stop-color': '#f3a6c6', 'stop-opacity': '.72' });

  const floor = [project(-1, -1, 0), project(1, -1, 0), project(1, 1, 0), project(-1, 1, 0)];
  svgNode(svg, 'polygon', { points: pointString(floor), class: 'waterfall-floor' });
  modelProfileDimensions.forEach(([name], metricIndex) => {
    const start = project(xAt(metricIndex), -1, 0);
    const end = project(xAt(metricIndex), 1, 0);
    svgNode(svg, 'line', { x1: start[0], y1: start[1], x2: end[0], y2: end[1], class: 'waterfall-grid' });
    const labelPoint = project(xAt(metricIndex), 1.18, 0);
    const textNode = svgNode(svg, 'text', { x: labelPoint[0], y: labelPoint[1] + 12, 'text-anchor': 'middle', class: 'waterfall-axis-label' });
    textNode.textContent = name;
  });
  models.forEach((_, modelIndex) => {
    const start = project(-1, yAt(modelIndex), 0);
    const end = project(1, yAt(modelIndex), 0);
    svgNode(svg, 'line', { x1: start[0], y1: start[1], x2: end[0], y2: end[1], class: 'waterfall-grid waterfall-model-grid' });
  });
  [0, .25, .5, .75, 1].forEach((tick) => {
    const start = project(-1, -1, tick);
    const end = project(-1, 1, tick);
    svgNode(svg, 'line', { x1: start[0], y1: start[1], x2: end[0], y2: end[1], class: 'waterfall-height-grid' });
    const tickLabel = svgNode(svg, 'text', { x: start[0] - 12, y: start[1] + 4, 'text-anchor': 'end', class: 'waterfall-tick-label' });
    tickLabel.textContent = tick.toFixed(2);
  });
  const zStart = project(-1, -1, 0);
  const zEnd = project(-1, -1, 1);
  svgNode(svg, 'line', { x1: zStart[0], y1: zStart[1], x2: zEnd[0], y2: zEnd[1], class: 'waterfall-z-axis' });
  const zTitle = svgNode(svg, 'text', { x: zEnd[0] - 16, y: zEnd[1] - 12, 'text-anchor': 'middle', class: 'waterfall-z-label' });
  zTitle.textContent = 'SCORE';

  const ordered = models.map((model, modelIndex) => {
    const y = yAt(modelIndex);
    const top = modelProfileDimensions.map(([, accessor], metricIndex) => project(xAt(metricIndex), y, Math.max(0, Math.min(1, Number(accessor(model)) || 0))));
    const base = modelProfileDimensions.map((_, metricIndex) => project(xAt(metricIndex), y, 0));
    return { model, modelIndex, top, base, depth: top.reduce((sum, point) => sum + point[2], 0) / top.length };
  }).sort((left, right) => left.depth - right.depth);

  ordered.forEach(({ model, modelIndex, top, base }) => {
    const selected = model.assistant === state.selectedModel;
    const group = svgNode(svg, 'g', { class: `waterfall-ribbon-group${selected ? ' selected' : ''}`, tabindex: '0', role: 'button', 'aria-label': `${model.assistant}, composite ${Number(model.mean_composite).toFixed(3)}` });
    group.dataset.model = model.assistant;
    const surface = svgNode(group, 'polygon', { points: pointString([...top, ...base.slice().reverse()]), class: 'waterfall-ribbon-surface' });
    surface.style.setProperty('--ribbon-opacity', String(.42 + (modelIndex / Math.max(1, models.length - 1)) * .24));
    svgNode(group, 'polyline', { points: pointString(top), class: 'waterfall-ribbon-line' });
    const title = svgNode(group, 'title');
    title.textContent = `${model.assistant}: ${modelProfileDimensions.map(([name, accessor]) => `${name.toLowerCase()} ${Number(accessor(model)).toFixed(2)}`).join(', ')}`;
    if (selected) top.forEach((point, metricIndex) => {
      svgNode(group, 'circle', { cx: point[0], cy: point[1], r: 5, class: 'waterfall-selected-node' });
      const valueLabel = svgNode(group, 'text', { x: point[0], y: point[1] - 11, 'text-anchor': 'middle', class: 'waterfall-value-label' });
      valueLabel.textContent = Number(modelProfileDimensions[metricIndex][1](model)).toFixed(2);
    });
    group.addEventListener('click', () => {
      if (state.waterfallDrag?.moved) return;
      state.selectedModel = model.assistant;
      renderModelResults();
    });
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.selectedModel = model.assistant;
        renderModelResults();
      }
    });
  });

  if (!svg.dataset.dragBound) {
    svg.dataset.dragBound = 'true';
    svg.addEventListener('pointerdown', (event) => {
      state.waterfallDrag = { x: event.clientX, y: event.clientY, yaw: state.waterfallYaw, pitch: state.waterfallPitch, moved: false };
      svg.setPointerCapture(event.pointerId);
      svg.classList.add('dragging');
    });
    svg.addEventListener('pointermove', (event) => {
      if (!state.waterfallDrag) return;
      const dx = event.clientX - state.waterfallDrag.x;
      const dy = event.clientY - state.waterfallDrag.y;
      state.waterfallDrag.moved = Math.abs(dx) + Math.abs(dy) > 4;
      state.waterfallYaw = state.waterfallDrag.yaw + dx * .006;
      state.waterfallPitch = Math.max(.25, Math.min(1.12, state.waterfallDrag.pitch - dy * .004));
      renderModelWaterfall(state.waterfallModels || []);
    });
    const stopDrag = (event) => {
      if (!state.waterfallDrag) return;
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      svg.classList.remove('dragging');
      window.setTimeout(() => { state.waterfallDrag = null; }, 0);
    };
    svg.addEventListener('pointerup', stopDrag);
    svg.addEventListener('pointercancel', stopDrag);
  }
}

function renderModelOverlap(models) {
  const root = document.querySelector('#model-overlap');
  const scenesByModel = new Map(models.map((model) => [model.assistant, new Set(model.records.map((record) => record.scene_id))]));
  const overlap = (left, right) => [...(scenesByModel.get(left) || [])].filter((scene) => scenesByModel.get(right)?.has(scene)).length;
  const pairs = models.flatMap((model, index) => models.slice(index + 1).map((other) => ({ left: model.assistant, right: other.assistant, count: overlap(model.assistant, other.assistant) })));
  const best = pairs.sort((a, b) => b.count - a.count)[0];
  document.querySelector('#overlap-stat').textContent = best ? `MAX ${best.count} SHARED SCENES` : 'NO SHARED SCENES';
  const grid = document.createElement('div');
  grid.className = 'overlap-grid';
  grid.style.setProperty('--models', models.length);
  grid.innerHTML = `<span class="overlap-corner">ROW × COLUMN</span>${models.map((model) => `<button type="button" class="overlap-col ${model.assistant === state.selectedModel ? 'active' : ''}" data-model="${esc(model.assistant)}">${esc(model.assistant)}</button>`).join('')}`;
  models.forEach((rowModel) => {
    const rowLabel = document.createElement('button');
    rowLabel.type = 'button';
    rowLabel.className = `overlap-row ${rowModel.assistant === state.selectedModel ? 'active' : ''}`;
    rowLabel.dataset.model = rowModel.assistant;
    rowLabel.textContent = rowModel.assistant;
    grid.appendChild(rowLabel);
    models.forEach((columnModel) => {
      const diagonal = rowModel.assistant === columnModel.assistant;
      const value = diagonal ? scenesByModel.get(rowModel.assistant).size : overlap(rowModel.assistant, columnModel.assistant);
      const cell = document.createElement('span');
      cell.className = `overlap-cell${diagonal ? ' diagonal' : ''}${rowModel.assistant === state.selectedModel || columnModel.assistant === state.selectedModel ? ' selected-axis' : ''}`;
      cell.style.setProperty('--overlap', String(Math.min(1, value / 9)));
      cell.innerHTML = `<b>${value}</b>`;
      cell.title = diagonal ? `${rowModel.assistant}: ${value} represented scenes` : `${rowModel.assistant} × ${columnModel.assistant}: ${value} shared scenes`;
      grid.appendChild(cell);
    });
  });
  root.replaceChildren(grid);
  root.querySelectorAll('button[data-model]').forEach((button) => button.addEventListener('click', () => { state.selectedModel = button.dataset.model; renderModelResults(); }));
}

function renderSelectedModelCases() {
  const root = document.querySelector('#selected-model-cases');
  const model = (state.modelDisplayModels || []).find((item) => item.assistant === state.selectedModel);
  const records = (model?.records || []).slice().sort((a, b) => Number(b.composite) - Number(a.composite));
  document.querySelector('#selected-case-count').textContent = `${state.selectedModel} · n=${records.length}`;
  root.innerHTML = `<div class="selected-case-row selected-case-head"><span>CASE / SCENE</span><span>COMPOSITE</span><span>TERMINAL OUTCOME</span><span>TURNS</span></div>${records.map((item) => `<button type="button" class="selected-case-row" data-case="${esc(item.id)}"><span><b>${esc(item.id.toUpperCase())}</b><small>${esc(item.scene_id)}</small></span><strong>${Number(item.composite).toFixed(3)}</strong><span>${esc(label(item.terminal))}</span><strong>${Number(item.assistant_turns) || '—'}</strong></button>`).join('')}`;
  root.querySelectorAll('[data-case]').forEach((button) => button.addEventListener('click', async () => {
    await selectCase(button.dataset.case);
    document.querySelector('.case-workbench')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

function renderModelScatter(models) {
  const chart = document.querySelector('#model-scatter');
  if (!models.length) { chart.innerHTML = '<p class="model-empty">No models in this cohort.</p>'; return; }
  chart.innerHTML = `<div class="scatter-gridline scatter-gridline-top"><span>100%</span></div><div class="scatter-gridline scatter-gridline-mid"><span>50%</span></div><div class="scatter-gridline scatter-gridline-bottom"><span>0%</span></div>${models.map((model) => `<button class="scatter-point ${state.selectedModel === model.assistant ? 'selected' : ''}" data-model="${esc(model.assistant)}" type="button" style="left:${Math.max(4, Math.min(96, model.successful_closure_rate * 100))}%;bottom:${Math.max(3, Math.min(95, (1 - model.median_assistant_turns / 30) * 100))}%" aria-label="${esc(model.assistant)}: ${Math.round(model.successful_closure_rate * 100)} percent closure, ${model.median_assistant_turns} median turns"><i></i><span>${esc(model.assistant)}</span></button>`).join('')}`;
  chart.querySelectorAll('.scatter-point').forEach((button) => button.addEventListener('click', () => {
    state.selectedModel = button.dataset.model;
    renderModelProfile();
    document.querySelectorAll('.model-chart-row, .model-outcome-row, .model-table tr[data-model], .capability-matrix tr[data-model], .scatter-point').forEach((point) => point.classList.toggle('selected', point.dataset.model === state.selectedModel));
  }));
}
function renderModelProfile() {
  const model = (state.modelDisplayModels || state.models).find((item) => item.assistant === state.selectedModel);
  const profile = document.querySelector('#model-profile');
  if (!model) {
    profile.innerHTML = '<p class="model-empty">Select a model to inspect its capability profile.</p>';
    return;
  }
  const levels = model.capability_level_means || [];
  const names = ['Goal preservation', 'Information uptake', 'State progression', 'Contextual expression', 'Proactive agency', 'Long-horizon coherence'];
  profile.innerHTML = `<div class="profile-heading"><span>SELECTED MODEL</span><b>n=${model.case_count}</b></div><h4>${esc(model.assistant)}</h4><p class="profile-subtitle">${model.scenario_count} distinct scenarios represented</p><div class="profile-stats"><div><span>COMPOSITE</span><b>${Number(model.mean_composite).toFixed(3)}</b></div><div><span>CLOSURE</span><b>${Math.round(model.successful_closure_rate * 100)}%</b></div><div><span>SAFETY CAP</span><b>${Math.round(model.safety_cap_rate * 100)}%</b></div></div><div class="level-profile-head"><strong>Capability profile</strong><span>case-weighted mean · 0–1</span></div><div class="level-profile">${levels.map((value, index) => `<div class="level-profile-row"><span><b>L${index + 1}</b>${esc(names[index] || `Level ${index + 1}`)}</span><div><i style="width:${Math.max(0, Math.min(100, Number(value) * 100))}%"></i></div><strong>${Number(value).toFixed(2)}</strong></div>`).join('')}</div><p class="profile-footnote">Each case is averaged across its recorded turns before models are compared, so longer cases do not contribute extra level observations.</p>`;
  profile.querySelector('.profile-subtitle').textContent = `${model.scenario_count} distinct scenarios in this cohort`;
  profile.querySelector('.level-profile-head span').textContent = `cohort mean · n=${model.case_count}`;
  profile.querySelector('.profile-footnote').textContent = 'Outcome rates and capability means use this filtered cohort. Each case contributes one case-level value to the aggregates.';
}

function renderModelOutcomes(models) {
  const chart = document.querySelector('#model-outcomes');
  chart.innerHTML = models.map((model) => `<button class="model-outcome-row ${state.selectedModel === model.assistant ? 'selected' : ''}" data-model="${esc(model.assistant)}" type="button" aria-label="${esc(model.assistant)}: closure ${model.outcome_counts.success} of ${model.case_count}, interest exhausted ${model.outcome_counts.exhaustion} of ${model.case_count}, safety cap ${model.outcome_counts.cap} of ${model.case_count}"><span class="model-outcome-name"><b>${esc(model.assistant)}</b><small>n=${model.case_count}</small></span><span class="model-outcome-track"><i class="model-outcome-success" style="width:${model.successful_closure_rate * 100}%"></i><i class="model-outcome-exhaustion" style="width:${model.interest_exhaustion_rate * 100}%"></i><i class="model-outcome-cap" style="width:${model.safety_cap_rate * 100}%"></i></span><span class="model-outcome-counts"><b>${model.outcome_counts.success}</b><i>/</i><span>${model.outcome_counts.exhaustion}</span><i>/</i><span>${model.outcome_counts.cap}</span></span></button>`).join('') || '<p class="model-empty">No outcomes in this filtered cohort.</p>';
  chart.querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => {
    state.selectedModel = button.dataset.model;
    renderModelResults();
  }));
}

function inCollection(item) {
  if (state.collection === 'all') return true;
  if (state.collection === 'breakdown') return isBreakdown(item);
  if (state.collection === 'sci_fi') return item.realism === 'sci_fi';
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
  document.querySelector('#table-case-count').textContent = state.filtered.length;
  document.querySelector('#table-range').textContent = state.filtered.length;
  renderCaseList();
  renderBenchmarkTable();
}

function renderBenchmarkTable() {
  const table = document.querySelector('#benchmark-table-body');
  if (!state.filtered.length) {
    table.innerHTML = '<tr><td class="table-empty" colspan="7">No matching trajectories. Clear a filter to widen the collection.</td></tr>';
    return;
  }
  table.innerHTML = state.filtered.map((item) => `
    <tr class="benchmark-row ${state.current?.id === item.id ? 'selected' : ''}" data-case="${esc(item.id)}" tabindex="0" aria-label="Inspect ${esc(item.id)}, ${esc(item.scene_id)}">
      <td><span class="table-case-id">${esc(item.id.toUpperCase())}</span><span class="table-scene">${esc(item.scene_id)}</span></td>
      <td>${esc(item.assistant)}</td><td><span class="setting-tag ${esc(item.realism)}">${esc(label(item.realism))}</span></td>
      <td>${esc(label(item.information))}</td><td class="table-number">${item.composite == null ? '—' : Number(item.composite).toFixed(3)}</td>
      <td class="table-number">${Number(item.assistant_turns) || '—'}</td><td><span class="outcome-pill ${isBreakdown(item) ? 'outcome-incomplete' : 'outcome-success'}"><i></i>${esc(label(item.terminal))}</span></td>
    </tr>`).join('');
  table.querySelectorAll('[data-case]').forEach((row) => {
    const open = () => selectCase(row.dataset.case);
    row.addEventListener('click', open);
    row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
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
  renderBenchmarkTable();
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
  if (numeric >= .8) return 'rgba(196,84,166,.88)';
  if (numeric >= .6) return 'rgba(106,76,183,.82)';
  if (numeric >= .4) return 'rgba(60,42,108,.78)';
  return 'rgba(13,16,38,.72)';
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
document.querySelectorAll('.metric-switch-button').forEach((button) => button.addEventListener('click', () => {
  state.modelMetric = button.dataset.modelMetric;
  document.querySelector('#model-sort').value = 'active';
  document.querySelectorAll('.metric-switch-button').forEach((candidate) => {
    const selected = candidate === button;
    candidate.classList.toggle('active', selected);
    candidate.setAttribute('aria-selected', String(selected));
  });
  renderModelResults();
}));
document.querySelectorAll('.profile-view-button').forEach((button) => button.addEventListener('click', () => {
  state.modelProfileView = button.dataset.profileView;
  document.querySelectorAll('.profile-view-button').forEach((candidate) => {
    const selected = candidate === button;
    candidate.classList.toggle('active', selected);
    candidate.setAttribute('aria-selected', String(selected));
  });
  const view2d = document.querySelector('#profile-view-2d');
  const view3d = document.querySelector('#profile-view-3d');
  view2d.hidden = state.modelProfileView !== '2d';
  view3d.hidden = state.modelProfileView !== '3d';
  view2d.classList.toggle('active', state.modelProfileView === '2d');
  view3d.classList.toggle('active', state.modelProfileView === '3d');
  if (state.modelProfileView === '3d') renderModelWaterfall(state.waterfallModels || []);
}));
document.querySelector('#model-search').addEventListener('input', renderModelResults);
document.querySelector('#model-setting-filter').addEventListener('change', renderModelResults);
document.querySelector('#model-information-filter').addEventListener('change', renderModelResults);
document.querySelector('#model-purpose-filter').addEventListener('change', renderModelResults);
document.querySelector('#model-sort').addEventListener('change', renderModelResults);
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
