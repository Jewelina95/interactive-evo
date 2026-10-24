(() => {
  const safe = (value='') => String(value).replace(/[&<>"']/g, (character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const onDashboard = /(?:\/|index\.html)$/.test(location.pathname);
  const target = (hash) => `${onDashboard?'':'./index.html'}#${hash}`;
  const groups = [
    {id:'overview',route:'home',label:'Overview',href:'home',description:'What InteractEval measures and why response-level scoring is incomplete',items:[['Project overview','home?section=intro'],['Recorded case demo','home?section=demo'],['Study at a glance','home?section=results']]},
    {id:'framework',route:'home',label:'Framework',href:'home?section=theory',description:'Three theoretical principles and the stateful measurement instrument',items:[['Three principles','home?section=theory'],['Four-layer architecture','home?section=architecture'],['Six-level capability rubric','home?section=levels'],['Full architecture','architecture?section=architecture']]},
    {id:'casebook',route:'architecture',label:'Casebook',href:'architecture?section=cases',description:'Scenario design, role-visible information, and auditable case records',items:[['Case records','architecture?section=cases'],['Scenario design','architecture?section=design'],['Case data','./data/cases.json','file']]},
    {id:'results',route:'models',label:'Results',href:'models',description:'Compare model outcomes, capability profiles, and case-level evidence',items:[['Model results','models'],['Model comparison','compare'],['Capability profiles','capabilities'],['Terminal outcomes','outcomes'],['Leaderboards','leaderboards']],models:true},
    {id:'paper',route:'research',label:'Paper',href:'./assets/Qwen_InteractEval.pdf',description:'Paper, methods, coverage, and reproducible definitions',items:[['Research summary','./research.html','file'],['Methods and definitions','./research.html#method','file'],['Case coverage','./research.html#coverage','file'],['Download paper','./assets/Qwen_InteractEval.pdf','file']]}
  ];
  const asset = (name) => name.startsWith('claude')?'anthropic.svg':name.startsWith('gpt')?'openai.svg':name.startsWith('gemini')?'google.svg':name.startsWith('deepseek')?'deepseek.svg':name.startsWith('qwen')?'alibaba.svg':name.startsWith('kimi')?'kimi.jpg':'zai.svg';
  let names=[],closeTimer;
  const href = (value) => value.startsWith('./')?value:target(value);
  function render(){
    const nav=document.querySelector('.primary-nav');if(!nav)return;
    nav.innerHTML=groups.map((group)=>`<div class="nav-item" data-nav-item="${group.id}"><div class="nav-trigger"><a href="${href(group.href)}" data-route="${group.route}" data-nav-key="${group.id}"><span>${group.label}</span></a><button class="nav-toggle" type="button" aria-label="Open ${group.label} menu" aria-expanded="false" aria-controls="nav-menu-${group.id}"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="m2 3.5 3 3 3-3"/></svg></button></div><div id="nav-menu-${group.id}" class="nav-menu ${group.models?'nav-menu-models':''}" hidden><div class="nav-menu-links"><span class="nav-menu-label">${group.label}</span><p>${group.description}</p>${group.items.map(([label,url,badge])=>`<a href="${href(url)}"><span>${label}</span>${badge&&badge!=='file'?`<small>${badge}</small>`:'<i>↗</i>'}</a>`).join('')}</div>${group.models?`<div class="nav-model-column"><label><span class="sr-only">Search menu models</span><input type="search" class="nav-model-search" placeholder="Search models…"/></label><div class="nav-model-list">${names.map((name)=>`<a href="${target('model/'+encodeURIComponent(name))}" data-menu-model="${safe(name)}"><img src="./assets/providers/${asset(name)}" alt=""/>${safe(name)}<i>↗</i></a>`).join('')}</div></div>`:''}</div></div>`).join('')+`<a class="nav-utility" data-route="multimodal" href="${target('multimodal')}"><span>Multimodal</span><small>Pending</small></a>`;
    const brand=document.querySelector('.wordmark');if(brand)brand.href=target('home');
    nav.querySelectorAll('.nav-item').forEach((item)=>{
      item.addEventListener('pointerenter',()=>{if(matchMedia('(hover: hover)').matches)open(item);});
      item.addEventListener('pointerleave',()=>{closeTimer=setTimeout(close,180);});
      item.querySelector('.nav-toggle').addEventListener('click',()=>item.classList.contains('open')&&item.dataset.openReason==='click'?close():open(item,'click'));
      item.querySelector('.nav-trigger>a').addEventListener('keydown',(event)=>{if(event.key==='ArrowDown'){event.preventDefault();open(item);item.querySelector('.nav-menu a').focus();}});
    });
    active();
  }
  function close(){clearTimeout(closeTimer);document.querySelectorAll('.nav-item.open').forEach((item)=>{item.classList.remove('open');item.querySelector('.nav-menu').hidden=true;item.querySelector('.nav-toggle').setAttribute('aria-expanded','false');});}
  function open(item,reason='hover'){close();clearTimeout(closeTimer);item.classList.add('open');item.dataset.openReason=reason;item.querySelector('.nav-menu').hidden=false;item.querySelector('.nav-toggle').setAttribute('aria-expanded','true');}
  function active(){
    const raw=onDashboard?(location.hash.slice(1)||'home'):'research';const [route,query='']=raw.split('?');const section=new URLSearchParams(query).get('section');
    document.querySelectorAll('.primary-nav [data-route]').forEach((link)=>{let selected=link.dataset.route===route||(route.startsWith('model/')&&link.dataset.route==='models');if(route==='home'){selected=link.dataset.navKey===(['theory','architecture','levels'].includes(section)?'framework':'overview');}link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  }
  document.addEventListener('pointerdown',(event)=>{if(!event.target.closest('.nav-item'))close();});
  document.addEventListener('click',(event)=>{if(event.target.closest('.nav-menu a'))close();if(event.target.closest('.wordmark')&&onDashboard&&location.hash==='#home')window.scrollTo({top:0,behavior:'instant'});});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){const focused=document.querySelector('.nav-item.open .nav-toggle');close();if(focused)focused.focus();}});
  document.addEventListener('input',(event)=>{if(!event.target.matches('.nav-model-search'))return;const query=event.target.value.toLowerCase();event.target.closest('.nav-model-column').querySelectorAll('[data-menu-model]').forEach((item)=>item.hidden=!item.dataset.menuModel.includes(query));});
  window.addEventListener('hashchange',()=>{close();active();});
  window.InteractEvalData.cases().then((records)=>{names=[...new Set(records.map((record)=>record.assistant))].sort();render();}).catch(()=>render());
  render();
})();
