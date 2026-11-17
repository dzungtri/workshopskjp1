#!/usr/bin/env python3
"""Build single-file deck: src/* -> index.html  (run: python3 build.py)"""
import pathlib, re, sys
R = pathlib.Path(__file__).parent
S = R / 'src'
parts = sorted((S / 'parts').glob('*.html'))
anims = sorted((S / 'anim').glob('*.js')) if (S / 'anim').exists() else []
html = (S / 'shell.html').read_text(encoding='utf-8')
html = html.replace('/*@@STYLE@@*/', (S / 'style.css').read_text(encoding='utf-8'))
html = html.replace('<!--@@SYMBOLS@@-->', (S / 'symbols.html').read_text(encoding='utf-8'))
# --- collect sections by id, order them by src/order.txt; unlisted -> appendix (予備) ---
allhtml = '\n'.join(p.read_text(encoding='utf-8') for p in parts)
secs = {}
for m in re.finditer(r'<section\b[^>]*\bid="([^"]+)"[^>]*>.*?</section>', allhtml, flags=re.S):
    secs[m.group(1)] = m.group(0)
order_f = S / 'order.txt'
if order_f.exists():
    rows = [l.split('#')[0].split() for l in order_f.read_text(encoding='utf-8').splitlines()]
    rows = [r for r in rows if r]
    order = [r[0] for r in rows]
    dur = {r[0]: float(r[1]) for r in rows if len(r) > 1}
    # rewrite timing cue: "⏱ start–end (n分)" computed from durations
    t = 0.0
    fmt = lambda m: f'{int(m)}:{int(round((m - int(m)) * 60)):02d}'
    for k in order:
        if k not in secs or k not in dur:
            continue
        a, t = t, t + dur[k]
        stamp = f'⏱ {fmt(a)}–{fmt(t)} ({dur[k]:g}分)'
        def fix(m):
            body = re.sub(r'^⏱[^·\n<]*(·\s*)?', '', m.group(2))
            return m.group(1) + stamp + (' · ' + body if body.strip() else '')
        secs[k] = re.sub(r'(<div class="nt-cue">)(.*?)(?=</div>)', fix, secs[k], count=1, flags=re.S)
    print(f'timeline: {fmt(t)} total')
    missing = [o for o in order if o not in secs]
    if missing:
        sys.exit(f'order.txt: unknown slide ids {missing}')
    rest = [k for k in secs if k not in order]
    appendix = ('<section class="slide divider" id="s-appendix" data-title="予備スライド" data-part="Z. 予備 (Appendix)">'
                '<div class="big" style="color:var(--mute)">予備</div><h1 class="ja">Appendix</h1>'
                '<div class="q ja">質問が出たときに使うスライド</div></section>')
    def tag_app(h):
        h = re.sub(r'(<div class="nt-cue">)⏱[^·<\n]*(·\s*)?', r'\1予備 (質問が出たら) · ', h, count=1)
        return re.sub(r'data-part="[^"]*"', 'data-part="Z. 予備 (Appendix)"', h, count=1)
    slides = '\n'.join(secs[o] for o in order) + ('\n' + appendix + '\n' + '\n'.join(tag_app(secs[k]) for k in rest) if rest else '')
else:
    slides = allhtml
try:
    sys.path.insert(0, str(R))
    from furigana import annotate_html
    slides = annotate_html(slides)
    furi = 'furigana ON'
except ImportError:
    furi = 'furigana SKIPPED (run ./build.sh to enable)'
html = html.replace('<!--@@SLIDES@@-->', slides)
html = html.replace('/*@@ANIM@@*/', 'window.DECK_ANIM={};\n' + '\n'.join(a.read_text(encoding='utf-8') for a in anims))
html = html.replace('/*@@SCRIPT@@*/', (S / 'script.js').read_text(encoding='utf-8'))
(R / 'index.html').write_text(html, encoding='utf-8')
n = len(re.findall(r'<section class="slide', html))
print(f'built index.html: {n} slides from {len(parts)} parts, {len(anims)} anim files, {len(html)//1024} KB, {furi}')
