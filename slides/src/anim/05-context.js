// Context window fill + micro-compact + auto-compact
(() => {
  const COL = { u: 'var(--c-user)', a: 'var(--c-model)', t: 'var(--c-ok)', s: 'var(--c-tool)' };
  const LBL = { u: 'user', a: 'assistant', t: 'tool_result', s: 'summary' };
  const H = 540; // usable px for 100%
  const seq = n => Array.from({ length: n }, (_, i) => ['u', 'a', 't', 't', 'a', 't'][i % 6]);
  const size = (k, i) => (k === 't' ? 7 + (i % 3) : k === 'a' ? 2 : 1.5); // % of window
  const mk = (types, squash) => types.map((k, i) => ({ k, h: squash && k === 't' ? 0.5 : size(k, i), sq: squash && k === 't' }));
  const STATES = [
    { b: mk(seq(4)), ph: 'start', tx: '作業開始。まだ余裕がある。' },
    { b: mk(seq(8)), ph: 'working', tx: 'ファイルを読む · テストを回す…<br><b>緑 = tool result</b> がどんどん増える' },
    { b: mk(seq(13)), ph: 'working', tx: 'さらに作業…' },
    { b: mk(seq(17)), ph: '⚠ 80% 超え', tx: '<b style="color:var(--c-bad)">精度が落ち始める</b><br>(context rot)' },
    { b: mk(seq(17), true), ph: 'micro-compact', tx: '<b>古い tool result を消す</b><br>ファイルは必要なら<b>読み直せる</b> → 安全' },
    { b: mk(seq(17), true).concat(mk(seq(14))), ph: 'working', tx: 'また埋まってくる…' },
    { b: [{ k: 's', h: 9, sq: false }].concat(mk(seq(3))), ph: 'auto-compact', tx: '<b>会話全体を要約</b>して入れ替え<br><span style="color:var(--c-bad)">⚠ 数字 · 決定が消えることがある</span><br>→ 「残す物」を指示 · 先にファイルへ' },
  ];
  DECK_ANIM['s-compact'] = (step, el) => {
    const st = STATES[Math.min(step, STATES.length - 1)];
    const win = el.querySelector('#cw-win');
    const total = st.b.reduce((a, b) => a + b.h, 0);
    win.innerHTML = st.b.map(b => `<div class="blk${b.sq ? ' squash' : ''}" style="height:${(b.h / 100) * H}px;background:${COL[b.k]}">${b.h >= 4 ? LBL[b.k] : ''}</div>`).join('')
      + `<div class="lim" style="bottom:${0.8 * H + 6}px"></div>`;
    const pct = Math.round(total);
    const tok = el.querySelector('#cw-tok');
    tok.textContent = `${pct}%`;
    tok.style.color = pct >= 80 ? 'var(--c-bad)' : '#fff';
    el.querySelector('#cw-phase').textContent = st.ph;
    el.querySelector('#cw-text').innerHTML = st.tx;
  };

  // Subagent isolation
  const blocks = (n, kinds) => Array.from({ length: n }, (_, i) => kinds[i % kinds.length]);
  DECK_ANIM['s-subagent'] = (step, el) => {
    const main = el.querySelector('#sa-main'), sub = el.querySelector('#sa-sub');
    const mainB = blocks(5, ['u', 'a', 't', 'a', 't']);
    const render = (arr, extra = '') => arr.map(k => `<div class="blk" style="height:${k === 't' ? 34 : 18}px;background:${COL[k]}">${k === 't' ? 'tool_result' : ''}</div>`).join('') + extra;
    const summ = `<div class="blk" style="height:30px;background:${COL.s}">summary 1.5k</div>`;
    main.innerHTML = render(mainB, step >= 3 ? summ : '');
    el.querySelector('#sa-main-n').textContent = step >= 3 ? '9.5k tokens' : '8k tokens';
    const subN = step >= 2 ? 16 : step >= 1 ? 2 : 0;
    sub.innerHTML = render(blocks(subN, ['a', 't', 't']));
    sub.classList.toggle('gone', step >= 4);
    el.querySelector('#sa-sub-n').textContent = step >= 2 ? (step >= 4 ? '30k → 破棄' : '30k tokens') : step >= 1 ? '…' : '';
  };
})();
