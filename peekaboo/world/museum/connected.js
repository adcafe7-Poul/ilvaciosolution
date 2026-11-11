/* Same-origin navigation contract between the original piano and the museum. */
(() => {
  'use strict';
  const query=new URLSearchParams(location.search),embedded=query.get('embedded')==='1',data=window.PawMuseumData;
  if(embedded)document.documentElement.setAttribute('data-paw-embedded','true');
  const themeSelect=document.getElementById('character-theme');
  const labels={FR:'포근숲',OC:'산호빛 바다',AZ:'아마존 새',DN:'아기공룡',PL:'눈나라',CS:'크리스탈 숲',RB:'달빛 로봇',HW:'할로윈',ID:'별빛 아이돌'};
  for(const[code,name]of Object.entries(labels)){const o=document.createElement('option');o.value=code;o.textContent=name;themeSelect.append(o)}
  const extraStop=document.createElement('button');extraStop.id='dialog-audio-stop';extraStop.type='button';extraStop.textContent='■ 소리 멈춤';extraStop.hidden=true;
  document.getElementById('detail').querySelector('.dhead').insertBefore(extraStop,document.getElementById('close'));
  const stop=()=>window.PawMuseumAudio.stop(true);
  extraStop.addEventListener('click',stop);document.getElementById('signature-stop').addEventListener('click',stop);
  let activeCode=null;
  window.PawMuseumAudio.onState(state=>{
    const bar=document.getElementById('audio-controls'),label=document.getElementById('audio-status');
    bar.hidden=!(state.playing||state.loading||state.error);extraStop.hidden=!(state.playing||state.loading);
    label.classList.toggle('signature-error',Boolean(state.error));
    label.textContent=!(state.playing||state.loading||state.error)?'':state.error?state.error:state.loading?`${state.label}의 피아노 인사를 준비해요…`:`${state.label} · ${state.chord} · ${state.meter} — 피아노 인사 선율`;
    for(const b of document.querySelectorAll('[data-audition]'))b.classList.toggle('audio-active',state.playing&&b.dataset.audition===activeCode);
  });
  window.audition=async code=>{
    const c=data.characters.find(c=>c.characterCode===code);if(!c)return;activeCode=code;
    try{await window.PawMuseumAudio.play(c.musicIdentity,c.nameKo)}catch(e){console.error('Piano greeting:',e)}
  };
  function send(type){if(embedded&&parent!==window)parent.postMessage({channel:'paw-museum',version:1,type},location.origin)}
  function navigate({view='world',themeCode=null,characterCode=null,instrumentId=null}={}){
    if(document.getElementById('detail').open)document.getElementById('detail').close();
    if(!['world','characters','korea','discovery','curator'].includes(view))view='world';
    const tabButton=document.querySelector(`[data-tab="${view}"]`);if(tabButton)tabButton.click();
    if(view==='characters'&&Object.hasOwn(labels,themeCode)){themeSelect.value=themeCode;themeSelect.dispatchEvent(new Event('change',{bubbles:true}))}
    if(characterCode&&data.characters.some(c=>c.characterCode===characterCode))showChar(characterCode);
    else if(instrumentId&&data.instruments.some(i=>i.id===instrumentId))showInst(instrumentId);
  }
  window.addEventListener('message',e=>{
    if(e.source!==parent||e.origin!==location.origin)return;
    const m=e.data;if(!m||m.channel!=='paw-museum'||m.version!==1)return;
    if(m.type==='navigate')navigate(m);else if(m.type==='stop-audio')stop();
  });
  if(query.has('tab')||query.has('character')||query.has('instrument'))navigate({view:query.get('tab')||'world',themeCode:query.get('theme'),characterCode:query.get('character'),instrumentId:query.get('instrument')});
  window.PawMuseum=Object.freeze({navigate,stop,version:'1.0.0'});send('ready');
})();
