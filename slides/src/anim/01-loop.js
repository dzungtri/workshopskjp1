// Agent loop counters (loop #, context tokens) per step
DECK_ANIM['s-loop'] = (step, el) => {
  const loops = [0, 0, 1, 1, 2, 3, 5, 5][step] ?? 5;
  const toks = [0, 2, 3, 9, 11, 14, 19, 20][step] ?? 20;
  el.querySelector('#lp-n').textContent = loops;
  el.querySelector('#lp-t').textContent = toks + 'k';
};
