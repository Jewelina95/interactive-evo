(() => {
  const safe = (value='') => String(value).replace(/[&<>"']/g, (character)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const onDashboard = /(?:\/|index\.html)$/.test(location.pathname);
  const target = (hash) => `${onDashboard?'':'./index.html'}#${hash}`;
  const groups = [
    {id:'models',label:'Models',href:'models',description:'Compare recorded model performance',items:[['All Models','models'],['Evaluations','evaluations'],['Capability Profiles','capabilities'],['Model Comparison','compare']],models:true},
    {id:'agents',label:'Agents',href:'agents',description:'Task-oriented and mixed-purpose interactions',items:[['Agent Evaluations','agents'],['Task-oriented Cases','agents?purpose=functional'],['Mixed-purpose Cases','agents?purpose=mixed'],['Case Records','architecture']]},
    {id:'multimodal',label:'Image, Speech, Video',href:'multimodal',description:'Multimodal results are pending',items:[['Image Generation','multimodal?modality=image','Pending'],['Image Editing','multimodal?modality=image-editing','Pending'],['Video Generation','multimodal?modality=video','Pending'],['Speech to Text','multimodal?modality=speech-to-text','Pending'],['Text to Speech','multimodal?modality=text-to-speech','Pending'],['Speech to Speech','multimodal?modality=speech-to-speech','Pending']]},
    {id:'architecture',label:'Architecture & Cases',href:'architecture',description:'From case design to recorded evidence',items:[['Architecture','architecture'],['Case Records','architecture?section=cases'],['Scenario Design','architecture?section=design'],['Paper','./assets/Qwen_InteractEval.pdf','file'],['Case Data','./data/cases.json','file']]},
    {id:'leaderboards',label:'Leaderboards',href:'leaderboards',description:'Rankings within selected conditions',items:[['Models','leaderboards'],['Successful Closure','leaderboards?category=Outcomes&sort=closure'],['Capability Dimensions','leaderboards?category=Capabilities'],['Conversation Length','leaderboards?category=Duration'],['Movement & Red Lines','leaderboards?category=Process']]},
    {id:'research',label:'Research',href:'./research.html',description:'Research notes, data, and methods',items:[['Research Journal','./research.html','file'],['Methodology','./research.html#method','file'],['Case Coverage','./research.html#coverage','file'],['Paper','./assets/Qwen_InteractEval.pdf','file'],['Changelog','home?section=changelog']]}
  ];
  const asset = (name) => name.startsWith('claude')?'anthropic.svg':name.startsWith('gpt')?'openai.svg':name.startsWith('gemini')?'google.svg':name.startsWith('deepseek')?'deepseek.svg':name.startsWith('qwen')?'alibaba.svg':name.startsWith('kimi')?'kimi.jpg':'zai.svg';
  let names=[],closeTimer;
  const href = (value) => value.startsWith('./')?value:target(value);
  function render(){
    const nav=document.querySelector('.primary-nav');if(!nav)return;
    nav.innerHTML=groups.map((group)=>`<div class="nav-item" data-nav-item="${group.id}"><div class="nav-trigger"><a href="${href(group.href)}" data-route="${group.id}">${group.label}</a><button class="nav-toggle" type="button" aria-label="Open ${group.label} menu" aria-expanded="false" aria-controls="nav-menu-${group.id}"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="m2 3.5 3 3 3-3"/></svg></button></div><div id="nav-menu-${group.id}" class="nav-menu ${group.models?'nav-menu-models':''}" hidden><div class="nav-menu-links"><span class="nav-menu-label">${group.label}</span><p>${group.description}</p>${group.items.map(([label,url,badge])=>`<a href="${href(url)}"><span>${label}</span>${badge&&badge!=='file'?`<small>${badge}</small>`:'<i>↗</i>'}</a>`).join('')}</div>${group.models?`<div class="nav-model-column"><label><span class="sr-only">Search menu models</span><input type="search" class="nav-model-search" placeholder="Search models…"/></label><div class="nav-model-list">${names.map((name)=>`<a href="${target('model/'+encodeURIComponent(name))}" data-menu-model="${safe(name)}"><img src="./assets/providers/${asset(name)}" alt=""/>${safe(name)}<i>↗</i></a>`).join('')}</div></div>`:''}</div></div>`).join('')+`<a class="nav-trends" data-route="trends" href="${target('trends')}">Cognition & Interaction</a>`;
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
  function active(){const route=onDashboard?(location.hash.slice(1).split('?')[0]||'home'):'research';document.querySelectorAll('.primary-nav [data-route]').forEach((link)=>{const selected=link.dataset.route===route||(route.startsWith('model/')&&link.dataset.route==='models');link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});}
  document.addEventListener('pointerdown',(event)=>{if(!event.target.closest('.nav-item'))close();});
  document.addEventListener('click',(event)=>{if(event.target.closest('.nav-menu a'))close();if(event.target.closest('.wordmark')&&onDashboard&&location.hash==='#home')window.scrollTo({top:0,behavior:'instant'});});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'){const focused=document.querySelector('.nav-item.open .nav-toggle');close();if(focused)focused.focus();}});
  document.addEventListener('input',(event)=>{if(!event.target.matches('.nav-model-search'))return;const query=event.target.value.toLowerCase();event.target.closest('.nav-model-column').querySelectorAll('[data-menu-model]').forEach((item)=>item.hidden=!item.dataset.menuModel.includes(query));});
  window.addEventListener('hashchange',()=>{close();active();});
  fetch('./data/cases.json?v=mario-v3-3722b5f9').then((response)=>response.json()).then((records)=>{names=[...new Set(records.map((record)=>record.assistant))].sort();render();}).catch(()=>render());
  render();
})();
