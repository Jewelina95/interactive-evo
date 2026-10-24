const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const median = (values) => { const sorted = values.slice().sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length ? (sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2) : 0; };
const pct = (value) => `${Math.round(value * 100)}%`;
const outcomeOf = (item) => {
  const terminal = String(item.terminal || '').toLowerCase();
  return terminal.includes('successful closure') ? 'success' : 'exhaustion';
};

const state = { cases: [], models: [], selected: '', sortKey: 'mean_composite', sortDirection: -1 };

async function loadReadout() {
  const response = await Promise.all([window.InteractEvalData.cases(), window.InteractEvalData.models()]);
  state.cases = response[0];
  const baseModels = response[1];
  state.models = baseModels.map((base) => summarize(base, state.cases.filter((item) => item.assistant === base.assistant)));
  state.selected = state.models.slice().sort((a, b) => b.mean_composite - a.mean_composite)[0]?.assistant || '';
  renderAll();
}

function summarize(base, cases) {
  const scores = cases.map((item) => Number(item.composite)).filter(Number.isFinite);
  const successes = cases.filter((item) => outcomeOf(item) === 'success');
  const outcomeCounts = {
    success: successes.length,
    exhaustion: cases.filter((item) => outcomeOf(item) === 'exhaustion').length,
    red_lines: cases.filter((item) => item.red_line_turns > 0).length
  };
  const interestChanges = cases.map((item) => item.user_interest_change==null?NaN:Number(item.user_interest_change)).filter(Number.isFinite);
  const levelMeans = Array.from({ length: 6 }, (_, index) => mean(cases.map((item) => Number(item.capability_level_means?.[index])).filter(Number.isFinite)));
  return {
    ...base,
    cases,
    case_count: cases.length,
    mean_composite: mean(scores),
    median_composite: median(scores),
    min_composite: Math.min(...scores),
    max_composite: Math.max(...scores),
    outcome_counts: outcomeCounts,
    successful_closure_rate: cases.length ? outcomeCounts.success / cases.length : 0,
    interest_exhaustion_rate: cases.length ? outcomeCounts.exhaustion / cases.length : 0,
    red_line_case_rate: cases.length ? outcomeCounts.red_lines / cases.length : 0,
    median_assistant_turns: median(cases.map((item) => Number(item.assistant_turns) || 0)),
    median_successful_turns: median(successes.map((item) => Number(item.assistant_turns) || 0)),
    median_user_interest_change: median(interestChanges),
    mean_state_movement_rate: mean(cases.map((item) => Number(item.state_movement_rate)).filter(Number.isFinite)),
    mean_red_line_turn_rate: mean(cases.map((item) => Number(item.red_line_turn_rate)).filter(Number.isFinite)),
    capability_level_means: levelMeans,
    scenario_count: new Set(cases.map((item) => item.scene_id)).size,
    partner_count: new Set(cases.map((item) => item.partner).filter(Boolean)).size,
    realism_counts: countBy(cases, 'realism'),
    information_counts: countBy(cases, 'information'),
    purpose_counts: countBy(cases, 'purpose')
  };
}

function countBy(items, key) {
  return items.reduce((counts, item) => { const value = item[key] || 'unrecorded'; counts[value] = (counts[value] || 0) + 1; return counts; }, {});
}

function renderAll() {
  if (!state.cases.length || !state.models.length) throw new Error('The casebook or model summary is empty.');
  const outcomes = state.cases.reduce((counts, item) => { counts[outcomeOf(item)] += 1; return counts; }, { success: 0, exhaustion: 0 });
  const partners = new Set(state.cases.map((item) => item.partner).filter(Boolean));
  const scenarioPairs = new Set(state.cases.map((item) => `${item.assistant}|${item.scene_id}`));
  $('#hero-total').innerHTML = `${state.cases.length} <small>interactions</small>`;
  $('#hero-success').textContent = outcomes.success;
  $('#hero-exhaustion').textContent = outcomes.exhaustion;
  $('#hero-red-lines').textContent = state.cases.filter((item) => item.red_line_turns > 0).length;
  $('#hero-success-bar').style.width = `${outcomes.success / state.cases.length * 100}%`;
  $('#hero-exhaustion-bar').style.width = `${outcomes.exhaustion / state.cases.length * 100}%`;
  $('#intro-cases').textContent = state.cases.length;
  $('#intro-models').textContent = state.models.length;
  const scenarioCells = new Set(state.cases.map((item) => `${item.realism}|${item.information}|${item.purpose}`)).size;
  $('#intro-scenes').textContent = scenarioCells;
  $('#success-share').textContent = pct(outcomes.success / state.cases.length);
  $('#small-n').textContent = `${Math.min(...state.models.map((model) => model.case_count))} to ${Math.max(...state.models.map((model) => model.case_count))}`;
  $('#coverage-scenes').textContent = scenarioCells;
  $('#coverage-pairs').textContent = scenarioPairs.size;
  $('#coverage-partners').textContent = partners.size;
  const select = $('#research-focus-model');
  select.innerHTML = state.models.slice().sort((a, b) => a.assistant.localeCompare(b.assistant)).map((model) => `<option value="${escapeHtml(model.assistant)}">${escapeHtml(model.assistant)}</option>`).join('');
  select.value = state.selected;
  renderOutcomes();
  renderScoreRanges();
  renderScatter();
  renderModelTable();
  renderCapabilityHeatmap();
  renderInterestChart();
  renderFocus();
  renderCoverage();
}

function renderOutcomes() {
  const ordered = orderedModels();
  $('#outcome-chart').innerHTML = ordered.map((model) => `
    <button class="outcome-row ${model.assistant === state.selected ? 'selected' : ''}" data-model="${escapeHtml(model.assistant)}" type="button" aria-label="${escapeHtml(model.assistant)}: ${model.outcome_counts.success} successful closures, ${model.outcome_counts.exhaustion} interest exhausted, n equals ${model.case_count}">
      <span class="outcome-model"><b>${escapeHtml(model.assistant)}</b><small>n=${model.case_count}</small></span>
      <span class="outcome-track"><i class="success-segment" style="width:${model.successful_closure_rate * 100}%"></i><i class="exhaustion-segment" style="width:${model.interest_exhaustion_rate * 100}%"></i></span>
      <span class="outcome-counts"><b>${model.outcome_counts.success}</b><i>/</i><span>${model.outcome_counts.exhaustion}</span></span>
    </button>`).join('');
  $('#outcome-chart').querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => selectModel(button.dataset.model)));
}

function renderScoreRanges() {
  $('#score-range-chart').innerHTML = orderedModels().map((model, index) => `
    <button class="score-row ${model.assistant === state.selected ? 'selected' : ''}" data-model="${escapeHtml(model.assistant)}" type="button">
      <span class="score-name"><b>${String(index + 1).padStart(2, '0')}</b>${escapeHtml(model.assistant)}</span>
      <span class="score-range"><i class="score-range-line" style="left:${model.min_composite * 100}%;width:${(model.max_composite - model.min_composite) * 100}%"></i><i class="score-range-dot" style="left:${model.mean_composite * 100}%"></i></span>
      <b class="score-mean">${model.mean_composite.toFixed(3)}</b><small>n=${model.case_count}</small>
    </button>`).join('');
  $('#score-range-chart').querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => selectModel(button.dataset.model)));
}

function renderScatter() {
  const width = 760; const height = 318; const left = 55; const right = 22; const top = 23; const bottom = 48;
  const plotWidth = width - left - right; const plotHeight = height - top - bottom;
  const x = (value) => left + Math.max(0, Math.min(1, value)) * plotWidth;
  const y = (value) => top + Math.max(0, Math.min(30, value)) / 30 * plotHeight;
  const horizontal = [0, 10, 20, 30].map((tick) => `<g><line x1="${left}" x2="${width - right}" y1="${y(tick)}" y2="${y(tick)}" class="scatter-grid"/><text x="${left - 12}" y="${y(tick) + 4}" text-anchor="end" class="scatter-tick">${tick}</text></g>`).join('');
  const vertical = [0, .25, .5, .75, 1].map((tick) => `<g><line x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${height - bottom}" class="scatter-grid vertical"/><text x="${x(tick)}" y="${height - bottom + 20}" text-anchor="middle" class="scatter-tick">${Math.round(tick * 100)}%</text></g>`).join('');
  const points = state.models.map((model, index) => {
    const px = x(model.successful_closure_rate); const py = y(model.median_assistant_turns); const selected = model.assistant === state.selected;
    const labelX = px > width - 155 ? -10 : 10;
    const anchor = labelX < 0 ? 'end' : 'start';
    const dy = index % 2 === 0 ? -9 : 16;
    return `<g class="scatter-model ${selected ? 'selected' : ''}" data-model="${escapeHtml(model.assistant)}" tabindex="0" role="button" aria-label="${escapeHtml(model.assistant)}: ${pct(model.successful_closure_rate)} closure, ${model.median_assistant_turns} median turns"><title>${escapeHtml(model.assistant)} · ${pct(model.successful_closure_rate)} closure · ${model.median_assistant_turns} median turns · n=${model.case_count}</title><circle cx="${px}" cy="${py}" r="${selected ? 7 : 5.5}"/><text x="${px + labelX}" y="${py + dy}" text-anchor="${anchor}">${escapeHtml(model.assistant)}</text></g>`;
  }).join('');
  $('#outcome-scatter').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Successful closure rate on horizontal axis and median assistant turns on vertical axis">${horizontal}${vertical}<text x="${width / 2}" y="${height - 7}" text-anchor="middle" class="scatter-axis-title">SUCCESSFUL CLOSURE RATE</text><text x="15" y="${height / 2}" text-anchor="middle" class="scatter-axis-title" transform="rotate(-90 15 ${height / 2})">MEDIAN ASSISTANT TURNS</text>${points}</svg>`;
  $('#outcome-scatter').querySelectorAll('[data-model]').forEach((point) => {
    point.addEventListener('click', () => selectModel(point.dataset.model));
    point.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectModel(point.dataset.model); } });
  });
}

function renderModelTable() {
  const sorted = orderedModels();
  $('#research-model-table').innerHTML = sorted.map((model) => `
    <tr data-model="${escapeHtml(model.assistant)}" class="${model.assistant === state.selected ? 'selected' : ''}"><th scope="row"><button data-model="${escapeHtml(model.assistant)}" class="table-model-button" type="button">${escapeHtml(model.assistant)}</button></th><td>${model.case_count}</td><td>${model.mean_composite.toFixed(3)}</td><td>${model.median_composite.toFixed(3)}</td><td>${model.min_composite.toFixed(2)}–${model.max_composite.toFixed(2)}</td><td>${pct(model.successful_closure_rate)}<small>${model.outcome_counts.success}/${model.case_count}</small></td><td>${pct(model.interest_exhaustion_rate)}<small>${model.outcome_counts.exhaustion}/${model.case_count}</small></td><td>${pct(model.red_line_case_rate)}<small>${model.outcome_counts.red_lines}/${model.case_count}</small></td><td>${formatNumber(model.median_assistant_turns)}</td><td>${model.outcome_counts.success ? formatNumber(model.median_successful_turns) : '—'}</td><td>${model.mean_state_movement_rate.toFixed(3)}</td><td>${signed(model.median_user_interest_change)}</td><td>${model.scenario_count} / ${model.partner_count}</td></tr>`).join('');
  $('#research-model-table').querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => selectModel(button.dataset.model)));
}

function renderCapabilityHeatmap() {
  $('#capability-heatmap-body').innerHTML = orderedModels().map((model) => `<tr data-model="${escapeHtml(model.assistant)}" class="${model.assistant === state.selected ? 'selected' : ''}"><th scope="row"><button data-model="${escapeHtml(model.assistant)}" class="table-model-button" type="button">${escapeHtml(model.assistant)}</button><small>n=${model.case_count}</small></th>${model.capability_level_means.map((value) => `<td><span style="--heat:${Math.min(1, Math.max(0, value))}">${value.toFixed(2)}</span></td>`).join('')}</tr>`).join('');
  $('#capability-heatmap-body').querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => selectModel(button.dataset.model)));
}

function renderInterestChart() {
  const maximum = Math.max(.1, ...state.models.map((model) => Math.abs(model.median_user_interest_change)));
  $('#interest-chart').innerHTML = orderedModels('median_user_interest_change', 1).map((model) => {
    const value = model.median_user_interest_change;
    const width = Math.abs(value) / maximum * 45;
    const left = value < 0 ? 50 - width : 50;
    return `<button class="interest-row ${model.assistant === state.selected ? 'selected' : ''}" data-model="${escapeHtml(model.assistant)}" type="button"><span class="interest-model">${escapeHtml(model.assistant)} <small>n=${model.case_count}</small></span><span class="interest-track"><i style="left:${left}%;width:${width}%" class="${value < 0 ? 'negative' : 'positive'}"></i></span><b>${signed(value)}</b></button>`;
  }).join('');
  $('#interest-chart').querySelectorAll('[data-model]').forEach((button) => button.addEventListener('click', () => selectModel(button.dataset.model)));
}

function renderFocus() {
  const model = state.models.find((item) => item.assistant === state.selected);
  if (!model) return;
  $('#research-focus-model').value = model.assistant;
  $('#model-focus-card').innerHTML = `<div class="focus-card-title"><div><span>MODEL IN FOCUS</span><h3>${escapeHtml(model.assistant)}</h3></div><b>n=${model.case_count}</b></div><div class="focus-card-stats"><div><span>MEAN / MEDIAN SCORE</span><b>${model.mean_composite.toFixed(3)} <i>/</i> ${model.median_composite.toFixed(3)}</b></div><div><span>SUCCESSFUL CLOSURE</span><b>${model.outcome_counts.success} <small>/ ${model.case_count} · ${pct(model.successful_closure_rate)}</small></b></div><div><span>INTEREST EXHAUSTED</span><b>${model.outcome_counts.exhaustion} <small>/ ${model.case_count} · ${pct(model.interest_exhaustion_rate)}</small></b></div><div><span>CASES WITH RED LINES</span><b>${model.outcome_counts.red_lines} <small>/ ${model.case_count} · ${pct(model.red_line_case_rate)}</small></b></div><div><span>MEDIAN TURNS</span><b>${formatNumber(model.median_assistant_turns)} <small>overall</small></b></div><div><span>SUCCESSFUL-RUN TURNS</span><b>${model.outcome_counts.success ? formatNumber(model.median_successful_turns) : '—'} <small>median, closure cases</small></b></div></div><p>Observed across ${model.scenario_count} scenes and ${model.partner_count} distinct user-role partners. The capability matrix and process signals below use the same ${model.case_count}-case sample.</p>`;
  const names = model.capability_level_names || ['Goal preservation', 'Information uptake', 'State progression', 'Contextual expression', 'Proactive agency', 'Long-horizon coherence'];
  $('#capability-detail').innerHTML = `<div class="capability-detail-head"><div><span>SELECTED PROFILE</span><strong>${escapeHtml(model.assistant)}</strong></div><span>case-weighted mean · 0–1</span></div><div class="capability-detail-grid">${model.capability_level_means.map((value, index) => `<div><span><b>L${index + 1}</b>${escapeHtml(names[index] || `Level ${index + 1}`)}</span><i><em style="width:${value * 100}%"></em></i><strong>${value.toFixed(2)}</strong></div>`).join('')}</div>`;
  const delta = model.median_user_interest_change;
  const movement = model.mean_state_movement_rate;
  const redLineRate = model.mean_red_line_turn_rate;
  $('#signal-cards').innerHTML = `<div><span>MEDIAN INTEREST CHANGE</span><strong>${signed(delta)}</strong><small>per case, first to last checkpoint</small></div><div><span>STATE MOVEMENT RATE</span><strong>${movement.toFixed(3)}</strong><small>case-weighted mean of recorded turn rates</small></div><div><span>RED-LINE TURN RATE</span><strong>${redLineRate.toFixed(3)}</strong><small>case-weighted mean of recorded turn rates</small></div>`;
}

function renderCoverage() {
  const model = state.models.find((item) => item.assistant === state.selected);
  if (!model) return;
  const groups = [
    { title: 'Scenario setting', items: [['realistic', 'Real-world'], ['stylized', 'Designed worlds'], ['sci_fi', 'Sci-fi systems']] },
    { title: 'Information sufficiency', items: [['sufficient', 'Sufficient'], ['partial', 'Partial'], ['insufficient', 'Insufficient']] },
    { title: 'Interaction purpose', items: [['functional', 'Functional'], ['mixed', 'Mixed'], ['non_functional', 'Non-functional']] }
  ];
  $('#coverage-figures').innerHTML = groups.map((group) => {
    const counts = model[({ 'Scenario setting': 'realism_counts', 'Information sufficiency': 'information_counts', 'Interaction purpose': 'purpose_counts' })[group.title]];
    const total = group.items.reduce((sum, [key]) => sum + (counts[key] || 0), 0);
    return `<section class="coverage-card"><span>MODEL IN FOCUS</span><h3>${group.title}</h3><div class="coverage-stack">${group.items.map(([key]) => `<i style="width:${total ? (counts[key] || 0) / total * 100 : 0}%" class="coverage-${key}"></i>`).join('')}</div><div class="coverage-legend">${group.items.map(([key, label]) => `<div><i class="coverage-${key}"></i><span>${label}</span><b>${counts[key] || 0}</b></div>`).join('')}</div></section>`;
  }).join('');
}

function selectModel(name) {
  if (!state.models.some((model) => model.assistant === name)) return;
  state.selected = name;
  renderOutcomes(); renderScoreRanges(); renderScatter(); renderModelTable(); renderCapabilityHeatmap(); renderInterestChart(); renderFocus(); renderCoverage();
}

function orderedModels(key = state.sortKey, direction = state.sortDirection) {
  return state.models.slice().sort((a, b) => {
    if (key === 'assistant') return a.assistant.localeCompare(b.assistant) * direction;
    if (key === 'range') return (a.max_composite - a.min_composite - (b.max_composite - b.min_composite)) * direction;
    return ((Number(a[key]) || 0) - (Number(b[key]) || 0)) * direction || a.assistant.localeCompare(b.assistant);
  });
}

function formatNumber(value) { return Number.isInteger(value) ? String(value) : Number(value).toFixed(1); }
function signed(value) { return `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(2)}`; }

$('#research-focus-model').addEventListener('change', (event) => selectModel(event.target.value));
document.querySelectorAll('[data-sort]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  state.sortDirection = state.sortKey === key ? -state.sortDirection : (['assistant', 'case_count', 'mean_composite', 'median_composite', 'successful_closure_rate', 'mean_state_movement_rate', 'scenario_count'].includes(key) ? -1 : 1);
  state.sortKey = key;
  renderModelTable(); renderCapabilityHeatmap();
}));

loadReadout().catch((error) => {
  document.querySelector('.journal-hero').insertAdjacentHTML('beforeend', `<p class="readout-error">The reviewed model readout could not load: ${escapeHtml(error.message)}</p>`);
});
