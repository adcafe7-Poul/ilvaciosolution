/* Paw Piano Museum Bridge 1.0 — additive integration; original engine remains unchanged. */
(() => {
  'use strict';
  const launch = document.getElementById('museum-launch');
  if (!launch || window.PawMuseumBridge) return;
  const themes = {forest:'FR',ocean:'OC',jungle:'AZ',dino:'DN',snow:'PL',crystal:'CS',robot:'RB',halloween:'HW',idol:'ID'};
  const names = {forest:'포근숲',ocean:'산호빛 바다',jungle:'아마존 새',dino:'아기공룡',snow:'눈나라',crystal:'크리스탈 숲',robot:'달빛 로봇',halloween:'할로윈',idol:'별빛 아이돌'};
  const dialog = document.createElement('dialog');
  dialog.id = 'paw-museum-dialog';
  dialog.setAttribute('aria-label','악기박물관과 친구 카드');
  dialog.innerHTML = `<div class="paw-museum-top"><button type="button" id="paw-museum-back">‹ 피아노로</button><div class="paw-museum-heading"><b>악기박물관</b><small id="paw-museum-context"></small></div><div class="paw-museum-view"><button type="button" id="paw-museum-world" aria-pressed="true">전체 악기</button><button type="button" id="paw-museum-friends" aria-pressed="false">지금 친구</button></div><button type="button" id="paw-museum-stop" title="피아노 인사 선율 멈춤">■ 소리 멈춤</button></div><div class="paw-museum-loading" id="paw-museum-loading" role="status">박물관을 열고 있어요…</div><iframe id="paw-museum-frame" title="쏙쏙 세계악기박물관 · 친구들의 악기" allow="autoplay; fullscreen"></iframe>`;
  document.body.append(dialog);
  const $ = id => document.getElementById(id), frame = $('paw-museum-frame');
  let ready = false, loaded = false, request = null, snapshot = null, opener = null;
  function theme() {
    const b = document.querySelector('#p-themes [data-theme][aria-pressed="true"]') || document.querySelector('#themes [data-theme][aria-pressed="true"]');
    return b && themes[b.dataset.theme] ? b.dataset.theme : 'forest';
  }
  function post(type, payload = {}) {
    if (ready && frame.contentWindow) frame.contentWindow.postMessage({channel:'paw-museum',version:1,type,...payload},location.origin);
  }
  function quietPiano() {
    const p = window.PawPiano;
    const state = {context:p?.ctx || null,wasRunning:p?.ctx?.state === 'running'};
    if (!p) return state;
    if (p.listen?.player?.playing) $('l-play')?.click();
    if (p.play?.demo) $('p-demo')?.click();
    if (Array.isArray(p.play?.timers)) { for (const t of p.play.timers) clearTimeout(t); p.play.timers.length = 0; }
    p.sampler?.allOff();
    p.play?.presses?.clear();
    if (p.ctx?.state === 'running') p.ctx.suspend().catch(() => {});
    return state;
  }
  function setView(view) {
    const t = theme();
    request = {view,themeCode:themes[t],themeName:names[t]};
    $('paw-museum-world').setAttribute('aria-pressed',String(view === 'world'));
    $('paw-museum-friends').setAttribute('aria-pressed',String(view === 'characters'));
    $('paw-museum-context').textContent = names[t] + ' 친구들과 함께';
    post('navigate',request);
  }
  function open(view = 'world') {
    if (document.documentElement.hasAttribute('data-locked')) return false;
    if (!dialog.open) { opener=document.activeElement; snapshot=quietPiano(); dialog.showModal(); }
    setView(view === 'characters' ? 'characters' : 'world');
    if (!loaded) {
      loaded = true;
      const url = new URL('./museum/index.html', document.baseURI);
      url.searchParams.set('embedded','1'); url.searchParams.set('tab',request.view); url.searchParams.set('theme',request.themeCode);
      frame.src = url.href;
    }
    return true;
  }
  function stop() { post('stop-audio'); window.PawPiano?.sampler?.allOff(); }
  function finishClose() {
    stop();
    const state = snapshot; snapshot = null;
    // All original voices were stopped. Resume a silent clock; listen/practice stays paused.
    if (state?.wasRunning && state.context?.state === 'suspended') state.context.resume().catch(() => {});
    if (opener?.isConnected) opener.focus();
  }
  function close() { if (dialog.open) dialog.close(); }
  dialog.addEventListener('close',finishClose);
  dialog.addEventListener('cancel',e => { e.preventDefault(); close(); });
  dialog.addEventListener('keydown',e => { if(e.key === 'Escape') e.stopPropagation(); });
  launch.addEventListener('click',() => open('world'));
  $('paw-museum-back').addEventListener('click',close);
  $('paw-museum-world').addEventListener('click',() => setView('world'));
  $('paw-museum-friends').addEventListener('click',() => setView('characters'));
  $('paw-museum-stop').addEventListener('click',stop);
  window.addEventListener('message',e => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const m = e.data;
    if (!m || m.channel !== 'paw-museum' || m.version !== 1) return;
    if (m.type === 'ready') { ready=true; $('paw-museum-loading').hidden=true; if(request)post('navigate',request); }
    else if (m.type === 'close') close();
  });
  window.addEventListener('pagehide',stop);
  window.PawMuseumBridge = Object.freeze({open,close,stop,version:'1.0.0'});
})();
