// Long-running harness: feature_list.json passes flip false -> true per session
DECK_ANIM['s-longrun'] = (step, el) => {
  const feats = [
    ['F1', '商品をカートに入れられる'],
    ['F2', '1商品10個を超えたら拒否'],
    ['F3', '決済失敗で在庫を戻す'],
    ['F4', '8日以内なら返品できる'],
    ['F5', 'クーポン注文の按分返金'],
    ['F6', '二重返金しない'],
  ];
  const done = Math.min(step, 5) === 5 ? 4 : Math.min(step, 4); // step1..4 -> 1..4 done ; step5 stays 4 (summary)
  const lines = feats.map(([id, d], i) => {
    const ok = i < done;
    const row = `  { <span class="k">"id"</span>: <span class="s">"${id}"</span>, <span class="k">"desc"</span>: <span class="s ja" style="font-family:var(--jp)">"${d}"</span>, <span class="k">"passes"</span>: ${ok ? '<span class="t">true</span> ' : '<span class="f">false</span>'} }`;
    return i === done - 1 && step <= 4 ? `<span class="flash">${row}</span>` : row;
  });
  el.querySelector('#lr-json').innerHTML = '[\n' + lines.join(',\n') + '\n]';
  el.querySelector('#lr-sess').textContent = step === 0 ? '— initializer 直後' : step <= 4 ? `— session #${step}` : '— session #4 終了';
  el.querySelector('#lr-count').innerHTML = step >= 5
    ? `passes: <b style="color:var(--c-ok)">${done}</b> / 6 → <span style="color:var(--c-bad)">「全部終わりました」とは言えない</span>`
    : `passes: <b style="color:var(--c-ok)">${done}</b> / 6`;
};
