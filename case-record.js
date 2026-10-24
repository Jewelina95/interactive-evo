function caseRecordFromV3(raw){
  if(raw.schema_version!=='interacteval-main_v3/2026-10')throw new Error('This record is not in the current casebook format.');
  const scene=raw.scene,admin=raw.administration,result=raw.outcome;
  let assistantTurn=0;
  return {
    id:raw.case_id,scene_id:scene.scene_id,
    realism:scene.facets.realism==='science-fictional'?'sci_fi':scene.facets.realism,
    information:scene.facets.information,purpose:scene.facets.purpose==='nonfunctional'?'non_functional':scene.facets.purpose,
    assistant:admin.assistant_system,partner:admin.user_system,terminal:result.ending,
    assistant_turns:result.evaluated_turns,composite:result.composite,
    persona:scene.persona,objective:scene.objective,initial_situation:scene.initial_situation,
    turns:raw.evaluation_record.map((item)=>({
      turn:item.assistant_turn,levels:Array.from({length:6},(_,index)=>item.capability_judgment.levels.find((level)=>level.level===`L${index+1}`)?.capped_score),
      user_interest:item.engagement.user_interest,tolerance:item.engagement.tolerance,
      moved:item.event_chain.present.present_moved,red_lines:item.red_lines.length,
      score:item.turn_score,
    })),
    transcript:raw.transcript.map((message)=>({turn:message.role==='assistant'?++assistantTurn:assistantTurn+1,role:message.role,content:message.text,index:message.index})),
  };
}

function caseEvidenceFromV3(raw){
  const text=(value)=>esc(copy(value||''));
  const stages=[['passive_execution','Passive execution'],['responsive_adaptation','Responsive adaptation'],['active_adaptation','Active adaptation']];
  return `<h3>Current scoring record</h3><p class="detail-copy">${text(raw.schema_version)} · ${raw.outcome.evaluated_turns} evaluated turns · ${raw.outcome.red_line_turns} turns with recorded red lines. Scores use the current capped levels and published outcome summary.</p><div class="detail-facts">${stages.map(([key,label])=>`<div><span>${label}</span><b>${percent(raw.outcome.stage_means[key])}</b></div>`).join('')}</div><details><summary>World mechanism and interaction boundaries</summary>${[['World mechanism',raw.scene.world_mechanism],['Hidden constraints',raw.scene.hidden_constraints],['Interaction boundary',raw.scene.interaction_boundary]].map(([label,value])=>`<h4>${label}</h4><p class="detail-copy">${text(value)}</p>`).join('')}</details><details class="case-evidence"><summary>Capability judgments and evidence by turn</summary>${raw.evaluation_record.map((item)=>`<details><summary>Turn ${item.assistant_turn} · score ${decimal(item.turn_score)} · ${item.red_lines.length} red lines</summary>${item.capability_judgment.levels.map((level)=>`<section><h4>${text(level.level)} · ${text(level.name)} · ${text(level.grade)} · ${percent(level.capped_score)}</h4><p class="subtle-note">Raw score ${decimal(level.raw_score)} · capped score ${decimal(level.capped_score)}</p>${(level.evidence||[]).slice(0,2).map((evidence)=>`<blockquote>${text(evidence.quote)}<small>Turn ${evidence.turn}${evidence.verified?' · verified quote':''}</small></blockquote>`).join('')}</section>`).join('')}${item.red_lines.length?`<h4>Recorded red lines</h4><pre>${text(JSON.stringify(item.red_lines,null,2))}</pre>`:''}</details>`).join('')}</details><p class="detail-copy"><a class="text-button" href="./data/cases/${encodeURIComponent(raw.case_id)}.json?v=mario-v3-3722b5f9" target="_blank" rel="noreferrer">Open complete source JSON ↗</a></p>`;
}
