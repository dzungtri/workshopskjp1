(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const stage = document.getElementById('stage');
  const bar = document.getElementById('bar'), pg = document.getElementById('pg');
  const notesOv = document.getElementById('notes-ov');
  const qs = new URLSearchParams(location.search);
  const isPresenter = qs.has('presenter');
  const ch = 'BroadcastChannel' in window ? new BroadcastChannel('spark-ws') : null;
  const ANIM = window.DECK_ANIM || {};
  let cur = 0, frag = 0;

  const fit = () => {
    const s = Math.min(innerWidth / 1600, innerHeight / 900);
    stage.style.left = '50%'; stage.style.top = '50%';
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  };

  // ---- steps: union of .frag[data-f] keys and 1..data-steps ----
  const frags = i => [...slides[i].querySelectorAll('.frag')];
  const keyOf = (el, k) => (el.dataset.f !== undefined ? +el.dataset.f : 1000 + k);
  const stepKeys = i => {
    const ks = new Set(frags(i).map(keyOf));
    const n = +(slides[i].dataset.steps || 0);
    for (let k = 1; k <= n; k++) ks.add(k);
    return [...ks].sort((a, b) => a - b);
  };
  // data-at="2" (>=2) | "2-4" | "-3" | "=2" ; multiple rules: "glow@2-3 on@4-"
  const inRange = (r, s) => {
    if (r.startsWith('=')) return s === +r.slice(1);
    const m = r.match(/^(\d*)-(\d*)$/);
    if (m) return (m[1] === '' || s >= +m[1]) && (m[2] === '' || s <= +m[2]);
    return s >= +r;
  };
  function applyState(slide, step) {
    slide.dataset.step = step;
    slide.querySelectorAll('[data-at]').forEach(el => {
      const rules = el.dataset.at.trim().split(/\s+/).map(t => t.includes('@') ? t.split('@') : ['on', t]);
      const classes = [...new Set(rules.map(r => r[0]))];
      classes.forEach(c => el.classList.toggle(c, rules.some(([cc, r]) => cc === c && inRange(r, step))));
    });
    slide.querySelectorAll('.stepbar').forEach(sb => {
      const n = stepKeys(slides.indexOf(slide)).length;
      if (sb.children.length !== n) sb.innerHTML = '<i></i>'.repeat(n);
      [...sb.children].forEach((d, k) => d.classList.toggle('on', k < step));
    });
    const fn = ANIM[slide.id];
    if (fn) try { fn(step, slide); } catch (e) { console.error(e); }
  }

  const noteHTML = i => (slides[i].querySelector('aside.notes')?.innerHTML || '').trim();

  function show(i, f = 0, broadcast = true) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.classList.toggle('active', k === cur));
    const fs = frags(cur), keys = stepKeys(cur);
    frag = f < 0 ? keys.length : Math.min(f, keys.length);
    const stepVal = frag === 0 ? 0 : keys[frag - 1];
    fs.forEach((el, k) => el.classList.toggle('on', keys.indexOf(keyOf(el, k)) < frag));
    applyState(slides[cur], stepVal);
    bar.style.width = ((cur + 1) / slides.length * 100) + '%';
    pg.textContent = `${cur + 1} / ${slides.length}`;
    notesOv.innerHTML = noteHTML(cur);
    if (!isPresenter) history.replaceState(null, '', location.search + '#' + (cur + 1));
    if (broadcast && ch) ch.postMessage({ cur, frag });
    if (isPresenter) renderPresenter();
  }
  const next = () => { if (frag < stepKeys(cur).length) show(cur, frag + 1); else show(cur + 1, 0); };
  const prev = () => { if (frag > 0) show(cur, frag - 1); else show(cur - 1, -1); };

  const toggleOverview = () => document.body.classList.toggle('overview');
  slides.forEach((s, k) => s.addEventListener('click', () => {
    if (document.body.classList.contains('overview')) { document.body.classList.remove('overview'); show(k, 0); }
  }));

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'ArrowDown') { e.preventDefault(); show(cur + 1, 0); }
    else if (k === 'ArrowUp') { e.preventDefault(); show(cur - 1, 0); }
    else if (k === 'Home') show(0); else if (k === 'End') show(slides.length - 1);
    else if (k === 'o' || k === 'O' || k === 'Escape') toggleOverview();
    else if (k === 'n' || k === 'N') notesOv.style.display = notesOv.style.display === 'block' ? 'none' : 'block';
    else if (k === 'p' || k === 'P') window.open(location.pathname + '?presenter#' + (cur + 1), 'presenter', 'width=1300,height=800');
    else if (k === 'f' || k === 'F') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    else if (k === 'r' || k === 'R') show(cur, 0);
    else if (k === 'h' || k === 'H') setFuri(!document.body.classList.contains('furi'));
    else if (k === '?') { const h = document.getElementById('help'); h.style.display = h.style.display === 'none' ? '' : 'none'; }
  });
  let tx = null;
  addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  addEventListener('touchend', e => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) d < 0 ? next() : prev(); tx = null; });

  if (ch) ch.onmessage = ({ data }) => { if (typeof data.cur === 'number') show(data.cur, data.frag, false); };

  // ---- presenter view ----
  let t0 = Date.now();
  function renderPresenter() {
    const s = slides[cur], n = stepKeys(cur).length;
    document.getElementById('pv-cur').textContent = `▶ ${cur + 1}/${slides.length} · ${s.dataset.part || ''} · ${s.dataset.title || ''}` + (n ? `   [step ${frag}/${n}]` : '');
    const nx = slides[cur + 1];
    document.getElementById('pv-nxt').textContent = (frag < n ? `次: step ${frag + 1}/${n}` : '') + (nx ? `   ⇢ 次スライド: ${nx.dataset.title}` : '   ⇢ 終わり');
    document.getElementById('pv-nt').innerHTML = noteHTML(cur);
    const parts = {}; slides.forEach((x, k) => { const p = x.dataset.part || '-'; (parts[p] = parts[p] || []).push(k + 1); });
    document.getElementById('pv-plan').innerHTML = Object.entries(parts).map(([p, ks]) =>
      (ks.includes(cur + 1) ? `<b>▸ ${p}</b>` : p) + ` <span style="opacity:.55">(${ks[0]}–${ks[ks.length - 1]})</span>`).join('<br>');
  }
  if (isPresenter) {
    document.body.classList.add('presenter');
    document.getElementById('pv-prev').onclick = prev;
    document.getElementById('pv-next').onclick = next;
    document.getElementById('pv-reset').onclick = () => t0 = Date.now();
    setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      document.getElementById('pv-timer').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      document.getElementById('pv-clock').textContent = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }, 1000);
  }

  // furigana toggle (H). main screen default OFF, presenter default ON; remembered per mode
  const FK = isPresenter ? 'ws-furi-pv' : 'ws-furi';
  function setFuri(on) { document.body.classList.toggle('furi', on); try { localStorage.setItem(FK, on ? '1' : '0'); } catch (e) {} }
  let furiInit = isPresenter; try { const v = localStorage.getItem(FK); if (v !== null) furiInit = v === '1'; } catch (e) {}
  if (qs.has('furi')) furiInit = true;
  setFuri(furiInit);

  addEventListener('resize', fit); fit();
  const startAll = /[?&]all/.test(location.search);
  if (startAll) slides.forEach((s, k) => applyState(s, stepKeys(k).slice(-1)[0] || 0));
  const [hs, hf] = location.hash.slice(1).split('.');
  show((parseInt(hs) || 1) - 1, startAll ? -1 : (parseInt(hf) || 0), false);
})();
