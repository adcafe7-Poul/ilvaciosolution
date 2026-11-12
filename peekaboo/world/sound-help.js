// 쏙쏙 피아노 월드 공용 «소리가 안 나요?» 안내 — [data-sound-help] 를 누르면 안내 창 · 아이패드 · 아이폰이면 처음에 무음 모드 알림 띠
(function () {
  var me = document.currentScript;
  var tipOff = me && me.dataset.tip === 'off';
  var tipTop = me && me.dataset.tip === 'top'; // 피아노 — 아래는 친구들이 나오는 구멍 자리
  var KEY = 'paw-sound-tip-closed';
  var ua = navigator.userAgent;
  var apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  var css =
    '#paw-sound-help{max-width:min(520px,calc(100vw - 32px));max-height:calc(100dvh - 32px);padding:0;border:0;border-radius:20px;background:#fffdf6;color:#213b3d;box-shadow:0 18px 50px #12302c55;font:15px/1.65 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}' +
    '#paw-sound-help::backdrop{background:#173d39a6}' +
    '#paw-sound-help .psh-in{padding:22px 22px 18px;overflow:auto;max-height:calc(100dvh - 32px);box-sizing:border-box}' +
    '#paw-sound-help h2{margin:0 0 4px;font-size:21px;line-height:1.35}' +
    '#paw-sound-help .psh-lead{margin:0 0 14px;color:#56706a;font-size:14px}' +
    '#paw-sound-help h3{margin:14px 0 4px;font-size:15px;color:#2f6157}' +
    '#paw-sound-help ul{margin:0;padding-left:20px}#paw-sound-help li{margin:3px 0}' +
    '#paw-sound-help b{color:#9a5a12}' +
    '#paw-sound-help .psh-close{display:block;margin:18px 0 0 auto;padding:9px 18px;border:1px solid #c9d6c6;border-radius:999px;background:#eef4ea;color:#2f5a4f;font:700 14px system-ui,sans-serif;cursor:pointer;min-height:40px}' +
    '#paw-sound-tip{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:8px;width:max-content;max-width:calc(100vw - 32px);box-sizing:border-box;padding:9px 9px 9px 14px;border-radius:16px;background:#213b3d;color:#fffdf2;box-shadow:0 8px 26px #0005;font:14px/1.45 system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif}' +
    '#paw-sound-tip.psh-top{top:max(46px,env(safe-area-inset-top));bottom:auto}' +
    '#paw-sound-tip span{flex:1;min-width:0}' +
    '#paw-sound-tip button{flex:none;min-height:36px;padding:6px 12px;border:0;border-radius:12px;background:#f3d58f;color:#3a2d0b;font:700 13px system-ui,sans-serif;cursor:pointer}' +
    '#paw-sound-tip button.psh-x{min-width:36px;padding:6px;background:transparent;color:#fffdf2;font-size:18px}';

  var BODY =
    '<div class="psh-in"><h2 id="psh-title">🔈 소리가 안 나요?</h2>' +
    '<p class="psh-lead">아래를 차례로 확인해 보세요. 대부분 첫째 · 둘째에서 풀려요.</p>' +
    '<h3>1. 화면을 한 번 눌러 주세요</h3><ul><li>브라우저는 처음 한 번 누르기 전에는 소리를 내지 않아요. 건반이나 «인사 듣기»를 한 번 더 눌러 보세요.</li></ul>' +
    '<h3>2. 아이패드 · 아이폰은 무음 모드를 꺼 주세요</h3><ul>' +
    '<li><b>무음 모드에서는 웹의 피아노 소리가 나지 않아요.</b> 앱이 아니라 웹이라서 그래요.</li>' +
    '<li>아이패드 — 화면 오른쪽 위에서 아래로 쓸어 제어 센터를 열고, <b>종 모양(무음) 단추</b>를 꺼요.</li>' +
    '<li>아이폰 — 옆면의 무음 스위치를 올리거나(주황색이 보이면 무음), 동작 버튼이 있는 기종은 제어 센터의 종 모양 단추를 꺼요.</li>' +
    '<li>옆면의 음량 단추로 소리를 키워요.</li></ul>' +
    '<h3>3. 안드로이드 · 컴퓨터</h3><ul>' +
    '<li>안드로이드 — 음량 단추를 누른 뒤 <b>미디어 음량</b>을 키워요.</li>' +
    '<li>컴퓨터 — 스피커 음량과, 브라우저 탭이 음소거되지 않았는지(탭의 스피커 그림) 확인해요.</li></ul>' +
    '<h3>4. 그래도 안 나면</h3><ul>' +
    '<li>블루투스 이어폰 · 스피커가 이어져 있으면 소리가 그쪽으로 가요.</li>' +
    '<li>동영상 · 통화 같은 다른 앱이 소리를 쓰고 있으면 끄고, 이 페이지를 새로 고쳐요.</li></ul>' +
    '<button type="button" class="psh-close">알겠어요</button></div>';

  function addStyle() {
    if (document.getElementById('paw-sound-help-style')) return;
    var st = document.createElement('style');
    st.id = 'paw-sound-help-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  var dialog = null;
  function open() {
    if (!dialog) {
      addStyle();
      dialog = document.createElement('dialog');
      dialog.id = 'paw-sound-help';
      dialog.setAttribute('aria-labelledby', 'psh-title');
      dialog.innerHTML = BODY;
      dialog.querySelector('.psh-close').addEventListener('click', function () {
        dialog.close();
      });
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) dialog.close();
      });
      document.body.appendChild(dialog);
    }
    if (!dialog.open) dialog.showModal();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sound-help]');
    if (!t) return;
    e.preventDefault();
    open();
  });

  function tip() {
    var closed = false;
    try {
      closed = localStorage.getItem(KEY) === '1';
    } catch (err) {}
    if (closed) return;
    addStyle();
    var bar = document.createElement('div');
    bar.id = 'paw-sound-tip';
    if (tipTop) bar.className = 'psh-top';
    bar.setAttribute('role', 'note');
    bar.innerHTML =
      '<span>🔇 무음 모드에서는 소리가 나지 않아요. 제어 센터에서 무음(종 모양)을 꺼 주세요.</span>' +
      '<button type="button" data-sound-help>방법 보기</button>' +
      '<button type="button" class="psh-x" aria-label="알림 닫기">×</button>';
    bar.querySelector('.psh-x').addEventListener('click', function () {
      bar.remove();
      try {
        localStorage.setItem(KEY, '1');
      } catch (err) {}
    });
    document.body.appendChild(bar);
  }

  if (apple && !tipOff) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tip);
    else tip();
  }
})();
